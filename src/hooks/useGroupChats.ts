import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GroupChat {
  id: string;
  name: string;
  avatar_url: string | null;
  description: string | null;
  lastMessage?: {
    content: string;
    sender_name: string;
    created_at: string;
    message_type: string;
  };
  unreadCount: number;
}

interface ChatMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
  sender?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

interface GroupMember {
  user_id: string;
  role: string;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

export function useGroupChats() {
  const [groupChats, setGroupChats] = useState<GroupChat[]>([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGroupChats = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get groups user is a member of
      const { data: memberships, error: membershipError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (membershipError) throw membershipError;
      if (!memberships || memberships.length === 0) {
        setGroupChats([]);
        setTotalUnreadCount(0);
        setIsLoading(false);
        return;
      }

      const groupIds = memberships.map(m => m.group_id);

      // Get group details
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('id, name, avatar_url, description')
        .in('id', groupIds);

      if (groupsError) throw groupsError;

      // Get last message and read status for each group
      const chatsWithMessages: GroupChat[] = await Promise.all(
        (groups || []).map(async (group) => {
          // Get last message
          const { data: messages } = await supabase
            .from('chat_messages')
            .select('content, sender_id, created_at, message_type')
            .eq('group_id', group.id)
            .order('created_at', { ascending: false })
            .limit(1);

          let lastMessage;
          if (messages && messages.length > 0) {
            const msg = messages[0];
            let senderName = 'Someone';
            
            if (msg.message_type === 'system') {
              senderName = '';
            } else if (msg.sender_id) {
              const { data: senderProfile } = await supabase
                .from('profiles')
                .select('first_name')
                .eq('user_id', msg.sender_id)
                .single();
              senderName = senderProfile?.first_name || 'Someone';
            }

            lastMessage = {
              content: msg.content,
              sender_name: senderName,
              created_at: msg.created_at,
              message_type: msg.message_type
            };
          }

          // Get read status
          const { data: readStatus } = await supabase
            .from('chat_read_status')
            .select('last_read_at')
            .eq('user_id', user.id)
            .eq('group_id', group.id)
            .single();

          // Count unread messages
          let unreadCount = 0;
          if (lastMessage) {
            const lastReadAt = readStatus?.last_read_at || new Date(0).toISOString();
            const { count } = await supabase
              .from('chat_messages')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', group.id)
              .gt('created_at', lastReadAt)
              .neq('sender_id', user.id);
            
            unreadCount = count || 0;
          }

          return {
            ...group,
            lastMessage,
            unreadCount
          };
        })
      );

      // Sort by last message time
      chatsWithMessages.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
      });

      setGroupChats(chatsWithMessages);
      setTotalUnreadCount(chatsWithMessages.reduce((sum, chat) => sum + chat.unreadCount, 0));
    } catch (error) {
      console.error('Error fetching group chats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroupChats();

    // Subscribe to new messages
    const channel = supabase
      .channel('chat-messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        () => {
          fetchGroupChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchGroupChats]);

  return {
    groupChats,
    totalUnreadCount,
    isLoading,
    refreshChats: fetchGroupChats
  };
}

export function useGroupChatMessages(groupId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [groupInfo, setGroupInfo] = useState<{ name: string; description: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!groupId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch group info
      const { data: group } = await supabase
        .from('groups')
        .select('name, description')
        .eq('id', groupId)
        .single();

      setGroupInfo(group);

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Fetch sender profiles
      const messagesWithProfiles = await Promise.all(
        (messagesData || []).map(async (msg) => {
          if (msg.sender_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name, avatar_url')
              .eq('user_id', msg.sender_id)
              .single();
            return { ...msg, sender: profile };
          }
          return msg;
        })
      );

      setMessages(messagesWithProfiles);

      // Fetch members
      const { data: membersData } = await supabase
        .from('group_members')
        .select('user_id, role')
        .eq('group_id', groupId);

      const membersWithProfiles = await Promise.all(
        (membersData || []).map(async (member) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url')
            .eq('user_id', member.user_id)
            .single();
          return { ...member, profile };
        })
      );

      setMembers(membersWithProfiles);

      // Mark as read
      await supabase
        .from('chat_read_status')
        .upsert({
          user_id: user.id,
          group_id: groupId,
          last_read_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,group_id'
        });

    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  const sendMessage = async (content: string) => {
    if (!groupId || !content.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('chat_messages')
        .insert({
          group_id: groupId,
          sender_id: user.id,
          content: content.trim(),
          message_type: 'message'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  useEffect(() => {
    if (groupId) {
      setIsLoading(true);
      fetchMessages();
    }
  }, [groupId, fetchMessages]);

  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`chat-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `group_id=eq.${groupId}`
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, fetchMessages]);

  return {
    messages,
    members,
    groupInfo,
    isLoading,
    sendMessage,
    refreshMessages: fetchMessages
  };
}

export async function sendJoinNotification(groupId: string, userName: string, userId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Use the *current authenticated user* as the sender so RLS policies like
    // "sender_id = auth.uid()" pass even when a group owner accepts someone else's request.
    // The joiner's profile link is carried in the [USER_ID:...] tag.
    await supabase
      .from('chat_messages')
      .insert({
        group_id: groupId,
        sender_id: user.id,
        content: `[USER_ID:${userId}]${userName} joined the group! Say hi! 👋`,
        message_type: 'system'
      });
  } catch (error) {
    console.error('Error sending join notification:', error);
  }
}
