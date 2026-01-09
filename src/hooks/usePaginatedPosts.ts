import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Json } from "@/integrations/supabase/types";

export interface FeedPost {
  id: string;
  user_id: string;
  content_type: string;
  content_data: Json;
  description: string | null;
  images: string[] | null;
  visibility: string;
  created_at: string;
  like_count: number;
  comment_count: number;
  viewer_has_liked: boolean;
  profile?: {
    first_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

interface Cursor {
  created_at: string;
  id: string;
}

export interface PostFilters {
  types: string[];
  visibility: "all" | "friends";
  searchQuery?: string;
}

const PAGE_SIZE = 15;

export const usePaginatedPosts = (filters?: PostFilters) => {
  const { user, isLoading: authLoading } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef<Cursor | null>(null);
  const fetchingRef = useRef(false);

  const fetchPosts = useCallback(async (cursor?: Cursor) => {
    if (authLoading || !user) {
      if (!authLoading && !user) {
        setPosts([]);
        setIsLoading(false);
      }
      return;
    }

    // Prevent multiple simultaneous fetches
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      // Use the RPC function to get posts with counts in a single query
      const { data: postsData, error: postsError } = await supabase.rpc(
        "get_paginated_posts",
        {
          p_user_id: user.id,
          p_visibility: filters?.visibility || "all",
          p_types: filters?.types && filters.types.length > 0 ? filters.types : null,
          p_cursor_created_at: cursor?.created_at || null,
          p_cursor_id: cursor?.id || null,
          p_limit: PAGE_SIZE,
        }
      );

      if (postsError) throw postsError;

      if (!postsData || postsData.length === 0) {
        setHasMore(false);
        if (!cursor) {
          setPosts([]);
          setIsLoading(false);
        }
        setIsLoadingMore(false);
        fetchingRef.current = false;
        return;
      }

      // Update cursor for next fetch
      const lastPost = postsData[postsData.length - 1];
      cursorRef.current = {
        created_at: lastPost.created_at,
        id: lastPost.id,
      };

      // Check if we have more posts
      setHasMore(postsData.length === PAGE_SIZE);

      // Transform the RPC response to FeedPost format
      const postsWithProfiles: FeedPost[] = postsData.map((post: {
        id: string;
        user_id: string;
        content_type: string;
        content_data: Json;
        description: string | null;
        images: string[] | null;
        visibility: string;
        created_at: string;
        like_count: number;
        comment_count: number;
        viewer_has_liked: boolean;
        author_first_name: string | null;
        author_username: string | null;
        author_avatar_url: string | null;
      }) => ({
        id: post.id,
        user_id: post.user_id,
        content_type: post.content_type,
        content_data: post.content_data,
        description: post.description,
        images: post.images,
        visibility: post.visibility,
        created_at: post.created_at,
        like_count: Number(post.like_count) || 0,
        comment_count: Number(post.comment_count) || 0,
        viewer_has_liked: post.viewer_has_liked || false,
        profile: {
          first_name: post.author_first_name,
          username: post.author_username,
          avatar_url: post.author_avatar_url,
        },
      }));

      if (cursor) {
        // Append to existing posts, avoiding duplicates
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPosts = postsWithProfiles.filter(p => !existingIds.has(p.id));
          return [...prev, ...newPosts];
        });
      } else {
        setPosts(postsWithProfiles);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      fetchingRef.current = false;
    }
  }, [user, authLoading, filters?.types, filters?.visibility]);

  // Filter posts locally based on search query
  const filteredPosts = posts.filter(post => {
    if (!filters?.searchQuery || !filters.searchQuery.trim()) return true;
    
    const query = filters.searchQuery.toLowerCase().trim();
    const contentData = post.content_data as Record<string, unknown> | null;
    
    // Check if searching by username with @ prefix
    if (query.startsWith('@')) {
      const usernameQuery = query.slice(1); // Remove @ prefix
      if (!usernameQuery) return true; // Just "@" shows all
      return post.profile?.username?.toLowerCase().includes(usernameQuery);
    }
    
    // Check if searching by tag with # prefix
    if (query.startsWith('#')) {
      const tagQuery = query.slice(1); // Remove # prefix
      if (!tagQuery) return true; // Just "#" shows all
      if (contentData) {
        const tags = contentData.tags as string[] | undefined;
        return tags?.some(tag => tag.toLowerCase().includes(tagQuery));
      }
      return false;
    }
    
    // Search by content type
    if (post.content_type.toLowerCase().includes(query)) return true;
    
    // Search by user name or username
    if (post.profile?.first_name?.toLowerCase().includes(query)) return true;
    if (post.profile?.username?.toLowerCase().includes(query)) return true;
    
    // Search by description
    if (post.description?.toLowerCase().includes(query)) return true;
    
    // Search by content name/title
    if (contentData) {
      const title = (contentData.title as string) || 
                    (contentData.name as string) || 
                    (contentData.routineName as string) ||
                    (contentData.mealType as string);
      if (title?.toLowerCase().includes(query)) return true;
      
      // Search by tags
      const tags = contentData.tags as string[] | undefined;
      if (tags?.some(tag => tag.toLowerCase().includes(query))) return true;
    }
    
    return false;
  });

  // Initial fetch - re-fetch when filters change
  useEffect(() => {
    cursorRef.current = null;
    setHasMore(true);
    setPosts([]);
    setIsLoading(true);
    fetchPosts();
  }, [fetchPosts, filters?.types?.join(","), filters?.visibility]);

  // Real-time subscription for new posts (prepend to top)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("posts-realtime-paginated")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
        },
        async (payload) => {
          const newPost = payload.new as { id: string; user_id: string; visibility: string; content_type: string; content_data: Json; description: string | null; images: string[] | null; created_at: string };
          
          if (newPost.visibility === "private" && newPost.user_id !== user.id) {
            return;
          }

          const { data: profileData } = await supabase
            .from("profiles")
            .select("first_name, username, avatar_url")
            .eq("user_id", newPost.user_id)
            .single();

          const postWithProfile: FeedPost = {
            ...newPost,
            like_count: 0,
            comment_count: 0,
            viewer_has_liked: false,
            profile: profileData || null,
          };

          setPosts(prev => [postWithProfile, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "posts",
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          setPosts(prev => prev.filter(p => p.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Update post counts when reactions/comments change (optimistic updates from PostCard)
  const updatePostCounts = useCallback((postId: string, updates: { like_count?: number; comment_count?: number; viewer_has_liked?: boolean }) => {
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, ...updates } : p
    ));
  }, []);

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore || fetchingRef.current) return;
    
    setIsLoadingMore(true);
    fetchPosts(cursorRef.current || undefined);
  }, [isLoadingMore, hasMore, fetchPosts]);

  const refresh = useCallback(() => {
    cursorRef.current = null;
    setHasMore(true);
    setPosts([]);
    setIsLoading(true);
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts: filteredPosts,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
    updatePostCounts,
  };
};
