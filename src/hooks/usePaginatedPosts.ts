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

const PAGE_SIZE = 15;

export const usePaginatedPosts = () => {
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
      let query = supabase
        .from("posts")
        .select("id, user_id, content_type, content_data, description, images, visibility, created_at")
        .neq("visibility", "private")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(PAGE_SIZE);

      // Cursor-based pagination
      if (cursor) {
        query = query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
      }

      const { data: postsData, error: postsError } = await query;

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

      // Fetch profiles for post authors
      const userIds = [...new Set(postsData.map(p => p.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, first_name, username, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profilesData?.map(p => [p.user_id, p]));

      const postsWithProfiles: FeedPost[] = postsData.map(post => ({
        ...post,
        profile: profileMap.get(post.user_id) || null,
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
  }, [user, authLoading]);

  // Initial fetch
  useEffect(() => {
    cursorRef.current = null;
    setHasMore(true);
    setPosts([]);
    setIsLoading(true);
    fetchPosts();
  }, [fetchPosts]);

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
          const newPost = payload.new as FeedPost;
          
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
    posts,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
  };
};
