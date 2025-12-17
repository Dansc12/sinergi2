import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender_profile?: {
    first_name: string | null;
    avatar_url: string | null;
  };
}

interface DMConversation {
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export function useDirectMessages() {
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all DMs for the user
      const { data: messages } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (!messages || messages.length === 0) {
        setConversations([]);
        setIsLoading(false);
        return;
      }

      // Group by conversation partner
      const conversationMap = new Map<string, DirectMessage[]>();
      messages.forEach(msg => {
        const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!conversationMap.has(otherId)) {
          conversationMap.set(otherId, []);
        }
        conversationMap.get(otherId)!.push(msg);
      });

      // Get profiles for all conversation partners
      const otherUserIds = Array.from(conversationMap.keys());
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, avatar_url')
        .in('user_id', otherUserIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Build conversation list
      const convos: DMConversation[] = otherUserIds.map(otherId => {
        const msgs = conversationMap.get(otherId)!;
        const lastMsg = msgs[0];
        const profile = profileMap.get(otherId);
        const unreadCount = msgs.filter(m => m.receiver_id === user.id && !m.is_read).length;

        return {
          otherUserId: otherId,
          otherUserName: profile?.first_name || 'User',
          otherUserAvatar: profile?.avatar_url || null,
          lastMessage: lastMsg.content,
          lastMessageTime: lastMsg.created_at,
          unreadCount
        };
      });

      // Sort by most recent
      convos.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
      setConversations(convos);
    } catch (error) {
      console.error('Error fetching DM conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();

    const channel = supabase
      .channel('dm-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConversations]);

  return { conversations, isLoading, refreshConversations: fetchConversations };
}

export function useDMChat(otherUserId: string | null) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [otherUser, setOtherUser] = useState<{ first_name: string | null; avatar_url: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!otherUserId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // Fetch other user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, avatar_url')
        .eq('user_id', otherUserId)
        .single();
      
      setOtherUser(profile);

      // Fetch messages
      const { data: msgs } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      // Add sender profiles
      const messagesWithProfiles = await Promise.all(
        (msgs || []).map(async (msg) => {
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('first_name, avatar_url')
            .eq('user_id', msg.sender_id)
            .single();
          return { ...msg, sender_profile: senderProfile };
        })
      );

      setMessages(messagesWithProfiles);

      // Mark received messages as read
      await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', otherUserId);

    } catch (error) {
      console.error('Error fetching DM messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [otherUserId]);

  const sendMessage = async (content: string) => {
    if (!otherUserId || !content.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('direct_messages').insert({
        sender_id: user.id,
        receiver_id: otherUserId,
        content: content.trim()
      });
    } catch (error) {
      console.error('Error sending DM:', error);
    }
  };

  useEffect(() => {
    if (otherUserId) {
      setIsLoading(true);
      fetchMessages();
    }
  }, [otherUserId, fetchMessages]);

  useEffect(() => {
    if (!otherUserId) return;

    const channel = supabase
      .channel(`dm-chat-${otherUserId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [otherUserId, fetchMessages]);

  return { messages, otherUser, currentUserId, isLoading, sendMessage };
}

export async function getOrCreateDMConversation(otherUserId: string): Promise<boolean> {
  // DMs don't need a separate conversation record - just check if there are any messages
  // Returns true if conversation can proceed
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}
