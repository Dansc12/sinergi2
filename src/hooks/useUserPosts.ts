import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Json } from "@/integrations/supabase/types";

export interface UserPost {
  id: string;
  user_id: string;
  content_type: string;
  content_data: Json;
  description: string | null;
  images: string[] | null;
  visibility: string;
  created_at: string;
  updated_at: string;
}

type ContentType = "posts" | "workouts" | "meals" | "recipes" | "routines";

const contentTypeMap: Record<ContentType, string> = {
  posts: "post",
  workouts: "workout",
  meals: "meal",
  recipes: "recipe",
  routines: "routine",
};

export const useUserPosts = (
  contentType?: ContentType,
  targetUserId?: string,
  visibilityFilter?: 'public' | 'friends'
) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserPosts = useCallback(async () => {
    // If targetUserId is provided, use that; otherwise use current user
    const userId = targetUserId || user?.id;
    
    if (!userId) {
      setPosts([]);
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (contentType && contentTypeMap[contentType]) {
        query = query.eq("content_type", contentTypeMap[contentType]);
      }

      // Filter by visibility when viewing other users' profiles
      if (visibilityFilter === 'public') {
        query = query.eq("visibility", "public");
      } else if (visibilityFilter === 'friends') {
        query = query.in("visibility", ["public", "friends"]);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error("Error fetching user posts:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user, contentType, targetUserId, visibilityFilter]);

  useEffect(() => {
    fetchUserPosts();
  }, [fetchUserPosts]);

  return { posts, isLoading, refetch: fetchUserPosts };
};
