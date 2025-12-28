import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Reaction {
  id: string;
  post_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export const usePostReactions = (postId: string) => {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReactions = useCallback(async () => {
    const { data, error } = await supabase
      .from("post_reactions")
      .select("*")
      .eq("post_id", postId);

    if (!error && data) {
      setReactions(data);
    }
    setIsLoading(false);
  }, [postId]);

  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`reactions-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "post_reactions",
          filter: `post_id=eq.${postId}`,
        },
        () => {
          fetchReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, fetchReactions]);

  // Toggle like - add if not liked, remove if already liked
  const toggleLike = async () => {
    if (!user) return;

    const existingLike = reactions.find(
      (r) => r.user_id === user.id && r.emoji === "❤️"
    );

    if (existingLike) {
      // Remove like
      const { error } = await supabase
        .from("post_reactions")
        .delete()
        .eq("id", existingLike.id);

      if (error) {
        console.error("Error removing like:", error);
      }
    } else {
      // Add like
      const { error } = await supabase.from("post_reactions").insert({
        post_id: postId,
        user_id: user.id,
        emoji: "❤️",
      });

      if (error) {
        console.error("Error adding like:", error);
      }
    }
  };

  // Check if current user has liked
  const isLiked = reactions.some(
    (r) => r.user_id === user?.id && r.emoji === "❤️"
  );

  // Total like count
  const likeCount = reactions.filter((r) => r.emoji === "❤️").length;

  return {
    reactions,
    isLiked,
    likeCount,
    isLoading,
    toggleLike,
  };
};