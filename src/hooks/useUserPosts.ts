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

export const useUserPosts = (contentType?: ContentType) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserPosts = useCallback(async () => {
    if (!user) {
      setPosts([]);
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase
        .from("posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (contentType && contentTypeMap[contentType]) {
        query = query.eq("content_type", contentTypeMap[contentType]);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error("Error fetching user posts:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user, contentType]);

  useEffect(() => {
    fetchUserPosts();
  }, [fetchUserPosts]);

  return { posts, isLoading, refetch: fetchUserPosts };
};
