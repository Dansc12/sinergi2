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
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const fetchReactions = useCallback(async () => {
    const { data, error } = await supabase
      .from("post_reactions")
      .select("*")
      .eq("post_id", postId);

    if (!error && data) {
      setReactions(data);
      if (user) {
        const userEmojis = new Set(
          data.filter((r) => r.user_id === user.id).map((r) => r.emoji)
        );
        setUserReactions(userEmojis);
      }
    }
    setIsLoading(false);
  }, [postId, user]);

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

    // Optimistic update
    setUserReactions((prev) => new Set(prev).add(emoji));

    const { error } = await supabase.from("post_reactions").insert({
      post_id: postId,
      user_id: user.id,
      emoji,
    });

    if (error) {
      // Rollback on error
      setUserReactions((prev) => {
        const next = new Set(prev);
        next.delete(emoji);
        return next;
      });
    }
  };

  const removeReaction = async (emoji: string) => {
    if (!user) return;

    // Optimistic update
    setUserReactions((prev) => {
      const next = new Set(prev);
      next.delete(emoji);
      return next;
    });

    const { error } = await supabase
      .from("post_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .eq("emoji", emoji);

    if (error) {
      // Rollback on error
      setUserReactions((prev) => new Set(prev).add(emoji));
    }
  };

  const toggleReaction = async (emoji: string) => {
    if (userReactions.has(emoji)) {
      await removeReaction(emoji);
    } else {
      await addReaction(emoji);
    }
  };

  // Count reactions by emoji
  const reactionCounts = reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    reactions,
    reactionCounts,
    userReactions,
    isLoading,
    addReaction,
    removeReaction,
    toggleReaction,
  };
};
