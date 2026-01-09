import { useState, useCallback } from "react";
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

interface UsePostCommentsOptions {
  initialCommentCount?: number;
  onCountChange?: (commentCount: number) => void;
}

export const usePostComments = (
  postId: string,
  options?: UsePostCommentsOptions
) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [commentCount, setCommentCount] = useState(options?.initialCommentCount ?? 0);

  // Lazy fetch comments - only called when user expands comments
  const fetchComments = useCallback(async () => {
    if (hasFetched) return; // Don't re-fetch if already loaded
    
    setIsLoading(true);
    
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
    
    if (userIds.length > 0) {
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
      setCommentCount(commentsWithProfiles.length);
    } else {
      setComments([]);
    }
    
    setHasFetched(true);
    setIsLoading(false);
  }, [postId, hasFetched]);

  const addComment = useCallback(async (content: string) => {
    if (!user || !content.trim()) return null;

    // Optimistic update for count
    const newCount = commentCount + 1;
    setCommentCount(newCount);
    options?.onCountChange?.(newCount);

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
      // Revert count on error
      setCommentCount(commentCount);
      options?.onCountChange?.(commentCount);
      return null;
    }

    // Add comment to local state with profile
    const newComment: Comment = {
      ...data,
      profile: null, // Will be fetched or we can get current user's profile
    };

    // Fetch current user's profile for the new comment
    const { data: profileData } = await supabase
      .from("profiles")
      .select("first_name, username, avatar_url")
      .eq("user_id", user.id)
      .single();

    if (profileData) {
      newComment.profile = profileData;
    }

    setComments(prev => [...prev, newComment]);

    return data;
  }, [user, postId, commentCount, options]);

  const deleteComment = useCallback(async (commentId: string) => {
    const { error } = await supabase
      .from("post_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("Error deleting comment:", error);
      return false;
    }

    // Update local state
    setComments(prev => prev.filter(c => c.id !== commentId));
    const newCount = Math.max(0, commentCount - 1);
    setCommentCount(newCount);
    options?.onCountChange?.(newCount);

    return true;
  }, [commentCount, options]);

  // Reset state when needed (e.g., for modal close)
  const reset = useCallback(() => {
    setComments([]);
    setHasFetched(false);
  }, []);

  return {
    comments,
    commentCount,
    isLoading,
    hasFetched,
    addComment,
    deleteComment,
    fetchComments,
    reset,
  };
};
