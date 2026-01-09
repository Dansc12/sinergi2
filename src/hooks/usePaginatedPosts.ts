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
  first_image_url: string | null;
  image_count: number;
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
  imagesOnly?: boolean;
}

const PAGE_SIZE = 15;
const FETCH_TIMEOUT_MS = 10000; // 10 second timeout
const RETRY_DELAY_MS = 2000; // 2 second retry delay
const MAX_RETRIES = 1;

// Simple in-memory cache to prevent empty flicker on navigation
const feedCache = new Map<string, { posts: FeedPost[]; cursor: Cursor | null; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute cache TTL

const getCacheKey = (filters?: PostFilters): string => {
  return JSON.stringify({
    types: filters?.types || [],
    visibility: filters?.visibility || "all",
    imagesOnly: filters?.imagesOnly ?? false,
  });
};

// Helper to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch full images for a post when needed (for detail modal)
export const fetchPostImages = async (postId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from("posts")
    .select("images")
    .eq("id", postId)
    .maybeSingle();
  
  if (error || !data) return [];
  return data.images || [];
};

export const usePaginatedPosts = (filters?: PostFilters) => {
  const { user, isLoading: authLoading } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  const cursorRef = useRef<Cursor | null>(null);
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);

  // Initialize from cache on mount
  useEffect(() => {
    mountedRef.current = true;
    const cacheKey = getCacheKey(filters);
    const cached = feedCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setPosts(cached.posts);
      cursorRef.current = cached.cursor;
      setHasFetchedOnce(true);
      setIsLoading(false);
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchPostsWithRetry = useCallback(async (cursor?: Cursor, retryCount = 0): Promise<void> => {
    try {
      // Create abort controller for timeout
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), FETCH_TIMEOUT_MS);
      
      const { data: postsData, error: postsError } = await supabase.rpc(
        "get_paginated_posts",
        {
          p_user_id: user!.id,
          p_visibility: filters?.visibility || "all",
          p_types: filters?.types && filters.types.length > 0 ? filters.types : null,
          p_cursor_created_at: cursor?.created_at || null,
          p_cursor_id: cursor?.id || null,
          p_limit: PAGE_SIZE,
          p_images_only: filters?.imagesOnly ?? false,
        }
      ).abortSignal(abortController.signal);
      
      clearTimeout(timeoutId);

      if (postsError) throw postsError;

      if (!mountedRef.current) return;

      if (!postsData || postsData.length === 0) {
        setHasMore(false);
        if (!cursor) {
          setPosts([]);
        }
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

      // Transform the RPC response to FeedPost format with optimized image data
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
      }) => {
        const images = post.images || [];
        return {
          id: post.id,
          user_id: post.user_id,
          content_type: post.content_type,
          content_data: post.content_data,
          description: post.description,
          // Keep images for backward compatibility but optimize
          images: images.length > 0 ? [images[0]] : null,
          first_image_url: images[0] || null,
          image_count: images.length,
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
        };
      });

      if (cursor) {
        // Append to existing posts, avoiding duplicates
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPosts = postsWithProfiles.filter(p => !existingIds.has(p.id));
          const updatedPosts = [...prev, ...newPosts];
          
          // Update cache
          const cacheKey = getCacheKey(filters);
          feedCache.set(cacheKey, {
            posts: updatedPosts,
            cursor: cursorRef.current,
            timestamp: Date.now(),
          });
          
          return updatedPosts;
        });
      } else {
        setPosts(postsWithProfiles);
        
        // Update cache
        const cacheKey = getCacheKey(filters);
        feedCache.set(cacheKey, {
          posts: postsWithProfiles,
          cursor: cursorRef.current,
          timestamp: Date.now(),
        });
      }
      
      setHasFetchedOnce(true);
      setError(null);
    } catch (err) {
      console.error(`Error fetching posts (attempt ${retryCount + 1}):`, err);
      
      // Retry logic
      if (retryCount < MAX_RETRIES && mountedRef.current) {
        console.log(`Retrying in ${RETRY_DELAY_MS}ms...`);
        await delay(RETRY_DELAY_MS);
        if (mountedRef.current) {
          return fetchPostsWithRetry(cursor, retryCount + 1);
        }
      }
      
      // All retries failed
      if (mountedRef.current) {
        const errorMessage = err instanceof Error && err.message.includes('timeout')
          ? "Feed took too long to load. Please try again."
          : "Failed to load posts. Please try again.";
        setError(new Error(errorMessage));
      }
    }
  }, [user, filters?.types, filters?.visibility, filters?.imagesOnly]);

  const fetchPosts = useCallback(async (cursor?: Cursor) => {
    if (authLoading || !user) {
      if (!authLoading && !user) {
        if (mountedRef.current) {
          setPosts([]);
          setIsLoading(false);
          setHasFetchedOnce(true);
        }
      }
      return;
    }

    // Prevent multiple simultaneous fetches
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setError(null);

    try {
      await fetchPostsWithRetry(cursor);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
      fetchingRef.current = false;
    }
  }, [user, authLoading, fetchPostsWithRetry]);

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

  // Initial fetch - re-fetch when filters change (but don't clear cache)
  useEffect(() => {
    const cacheKey = getCacheKey(filters);
    const cached = feedCache.get(cacheKey);
    
    // If we have a fresh cache, use it and skip fetch
    if (cached && Date.now() - cached.timestamp < CACHE_TTL && cached.posts.length > 0) {
      setPosts(cached.posts);
      cursorRef.current = cached.cursor;
      setHasFetchedOnce(true);
      setIsLoading(false);
      return;
    }
    
    // Only clear posts if we don't have cached data
    if (!cached || cached.posts.length === 0) {
      cursorRef.current = null;
      setHasMore(true);
      setPosts([]);
      setIsLoading(true);
    }
    
    fetchPosts();
  }, [fetchPosts, filters?.types?.join(","), filters?.visibility, filters?.imagesOnly]);

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

          const images = newPost.images || [];
          const postWithProfile: FeedPost = {
            ...newPost,
            first_image_url: images[0] || null,
            image_count: images.length,
            images: images.length > 0 ? [images[0]] : null,
            like_count: 0,
            comment_count: 0,
            viewer_has_liked: false,
            profile: profileData || null,
          };

          setPosts(prev => {
            const updated = [postWithProfile, ...prev];
            
            // Update cache
            const cacheKey = getCacheKey(filters);
            feedCache.set(cacheKey, {
              posts: updated,
              cursor: cursorRef.current,
              timestamp: Date.now(),
            });
            
            return updated;
          });
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
          setPosts(prev => {
            const updated = prev.filter(p => p.id !== deletedId);
            
            // Update cache
            const cacheKey = getCacheKey(filters);
            feedCache.set(cacheKey, {
              posts: updated,
              cursor: cursorRef.current,
              timestamp: Date.now(),
            });
            
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, filters]);

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
    // Clear cache for this filter
    const cacheKey = getCacheKey(filters);
    feedCache.delete(cacheKey);
    
    cursorRef.current = null;
    setHasMore(true);
    setPosts([]);
    setIsLoading(true);
    setHasFetchedOnce(false);
    setError(null);
    fetchPosts();
  }, [fetchPosts, filters]);

  // Retry failed load more
  const retryLoadMore = useCallback(() => {
    setError(null);
    setIsLoadingMore(true);
    fetchPosts(cursorRef.current || undefined);
  }, [fetchPosts]);

  return {
    posts: filteredPosts,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
    retryLoadMore,
    updatePostCounts,
    error,
    hasFetchedOnce,
  };
};
