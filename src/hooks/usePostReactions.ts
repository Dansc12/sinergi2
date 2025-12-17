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

  const addReaction = async (emoji: string) => {
    if (!user) return;

    const { error } = await supabase.from("post_reactions").insert({
      post_id: postId,
      user_id: user.id,
      emoji,
    });

    if (error) {
      console.error("Error adding reaction:", error);
    }
  };

  // Count only the current user's reactions per emoji (private counts)
  const userReactionCounts = reactions
    .filter((r) => r.user_id === user?.id)
    .reduce((acc, r) => {
      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  // Check if user has reacted with each emoji
  const userReactions = new Set(
    reactions.filter((r) => r.user_id === user?.id).map((r) => r.emoji)
  );

  return {
    reactions,
    userReactionCounts,
    userReactions,
    isLoading,
    addReaction,
  };
};