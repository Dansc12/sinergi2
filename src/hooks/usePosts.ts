import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Json } from "@/integrations/supabase/types";

export interface Post {
  id: string;
  user_id: string;
  content_type: string;
  content_data: Json;
  description: string | null;
  images: string[] | null;
  visibility: string;
  created_at: string;
  updated_at: string;
  // Joined profile data
  profile?: {
    first_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export const usePosts = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    if (!user) {
      setPosts([]);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .neq("visibility", "private")
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;

      // Fetch profiles separately for all post authors
      const userIds = [...new Set(postsData?.map(p => p.user_id) || [])];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, first_name, username, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profilesData?.map(p => [p.user_id, p]));
      
      const postsWithProfiles: Post[] = postsData?.map(post => ({
        ...post,
        profile: profileMap.get(post.user_id) || null
      })) || [];

      setPosts(postsWithProfiles);
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Real-time subscription for new posts
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("posts-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
        },
        async (payload) => {
          const newPost = payload.new as Post;
          
          // Only add if not private (RLS should handle this, but double check)
          if (newPost.visibility === "private" && newPost.user_id !== user.id) {
            return;
          }

          // Fetch the profile for the new post
          const { data: profileData } = await supabase
            .from("profiles")
            .select("first_name, username, avatar_url")
            .eq("user_id", newPost.user_id)
            .single();

          const postWithProfile: Post = {
            ...newPost,
            profile: profileData || null,
          };

          setPosts((prev) => [postWithProfile, ...prev]);
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
          setPosts((prev) => prev.filter((p) => p.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const createPost = async (postData: {
    content_type: string;
    content_data: Record<string, unknown>;
    description?: string;
    images?: string[];
    visibility: string;
  }) => {
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        content_type: postData.content_type,
        content_data: postData.content_data as Json,
        description: postData.description || null,
        images: postData.images || [],
        visibility: postData.visibility,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  return { posts, isLoading, fetchPosts, createPost };
};
