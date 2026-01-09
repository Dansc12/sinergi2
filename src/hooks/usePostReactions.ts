import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Reaction {
  id: string;
  post_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

interface UsePostReactionsOptions {
  initialLikeCount?: number;
  initialIsLiked?: boolean;
  onCountChange?: (likeCount: number, isLiked: boolean) => void;
}

export const usePostReactions = (
  postId: string,
  options?: UsePostReactionsOptions
) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(options?.initialIsLiked ?? false);
  const [likeCount, setLikeCount] = useState(options?.initialLikeCount ?? 0);
  const [isToggling, setIsToggling] = useState(false);

  // Toggle like with optimistic update
  const toggleLike = useCallback(async () => {
    if (!user || isToggling) return;

    setIsToggling(true);
    const wasLiked = isLiked;
    const prevCount = likeCount;

    // Optimistic update
    const newIsLiked = !wasLiked;
    const newCount = wasLiked ? Math.max(0, likeCount - 1) : likeCount + 1;
    setIsLiked(newIsLiked);
    setLikeCount(newCount);
    options?.onCountChange?.(newCount, newIsLiked);

    try {
      if (wasLiked) {
        // Remove like - find and delete
        const { error } = await supabase
          .from("post_reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id)
          .eq("emoji", "❤️");

        if (error) throw error;
      } else {
        // Add like
        const { error } = await supabase.from("post_reactions").insert({
          post_id: postId,
          user_id: user.id,
          emoji: "❤️",
        });

        if (error) throw error;
      }
    } catch (error) {
      // Revert on error
      console.error("Error toggling like:", error);
      setIsLiked(wasLiked);
      setLikeCount(prevCount);
      options?.onCountChange?.(prevCount, wasLiked);
    } finally {
      setIsToggling(false);
    }
  }, [user, postId, isLiked, likeCount, isToggling, options]);

  return {
    isLiked,
    likeCount,
    isLoading: false, // No longer loading on mount
    toggleLike,
    isToggling,
  };
};
