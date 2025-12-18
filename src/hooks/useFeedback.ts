import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface FeedbackMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  upvote_count: number;
  has_upvoted: boolean;
  profile?: {
    first_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export const useFeedback = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!user) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch feedback messages
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("feedback_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (feedbackError) throw feedbackError;

      // Fetch upvotes for all messages
      const { data: upvotesData } = await supabase
        .from("feedback_upvotes")
        .select("feedback_id, user_id");

      // Fetch profiles for all message authors
      const userIds = [...new Set(feedbackData?.map(m => m.user_id) || [])];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, first_name, username, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profilesData?.map(p => [p.user_id, p]));

      // Calculate upvote counts and user's upvote status
      const upvoteMap = new Map<string, { count: number; hasUpvoted: boolean }>();
      upvotesData?.forEach(upvote => {
        const existing = upvoteMap.get(upvote.feedback_id) || { count: 0, hasUpvoted: false };
        existing.count++;
        if (upvote.user_id === user.id) {
          existing.hasUpvoted = true;
        }
        upvoteMap.set(upvote.feedback_id, existing);
      });

      const messagesWithData: FeedbackMessage[] = feedbackData?.map(msg => ({
        id: msg.id,
        user_id: msg.user_id,
        content: msg.content,
        created_at: msg.created_at,
        upvote_count: upvoteMap.get(msg.id)?.count || 0,
        has_upvoted: upvoteMap.get(msg.id)?.hasUpvoted || false,
        profile: profileMap.get(msg.user_id) || null,
      })) || [];

      // Sort by upvote count (highest first), then by date
      messagesWithData.sort((a, b) => {
        if (b.upvote_count !== a.upvote_count) {
          return b.upvote_count - a.upvote_count;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setMessages(messagesWithData);
    } catch (err) {
      console.error("Error fetching feedback:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const addMessage = async (content: string) => {
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("feedback_messages")
      .insert({
        user_id: user.id,
        content,
      });

    if (error) throw error;
    await fetchMessages();
  };

  const toggleUpvote = async (feedbackId: string) => {
    if (!user) throw new Error("Not authenticated");

    const message = messages.find(m => m.id === feedbackId);
    if (!message) return;

    if (message.has_upvoted) {
      // Remove upvote
      const { error } = await supabase
        .from("feedback_upvotes")
        .delete()
        .eq("feedback_id", feedbackId)
        .eq("user_id", user.id);

      if (error) throw error;
    } else {
      // Add upvote
      const { error } = await supabase
        .from("feedback_upvotes")
        .insert({
          feedback_id: feedbackId,
          user_id: user.id,
        });

      if (error) throw error;
    }

    await fetchMessages();
  };

  const deleteMessage = async (feedbackId: string) => {
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("feedback_messages")
      .delete()
      .eq("id", feedbackId)
      .eq("user_id", user.id);

    if (error) throw error;
    await fetchMessages();
  };

  return { messages, isLoading, addMessage, toggleUpvote, deleteMessage, refetch: fetchMessages };
};
