import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    first_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export const usePostComments = (postId: string) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    const { data: commentsData, error } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      setIsLoading(false);
      return;
    }

    // Fetch profiles for commenters
    const userIds = [...new Set(commentsData?.map((c) => c.user_id) || [])];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, first_name, username, avatar_url")
      .in("user_id", userIds);

    const profileMap = new Map(profilesData?.map((p) => [p.user_id, p]));

    const commentsWithProfiles: Comment[] =
      commentsData?.map((comment) => ({
        ...comment,
        profile: profileMap.get(comment.user_id) || null,
      })) || [];

    setComments(commentsWithProfiles);
    setIsLoading(false);
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "post_comments",
          filter: `post_id=eq.${postId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, fetchComments]);

  const addComment = async (content: string) => {
    if (!user || !content.trim()) return null;

    const { data, error } = await supabase
      .from("post_comments")
      .insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding comment:", error);
      return null;
    }

    return data;
  };

  const deleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from("post_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("Error deleting comment:", error);
      return false;
    }

    return true;
  };

  return {
    comments,
    commentCount: comments.length,
    isLoading,
    addComment,
    deleteComment,
    refreshComments: fetchComments,
  };
};
