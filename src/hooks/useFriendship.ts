import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted';

export function useFriendship(otherUserId: string | null) {
  const [status, setStatus] = useState<FriendshipStatus>('none');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const checkFriendship = useCallback(async () => {
    if (!otherUserId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      if (user.id === otherUserId) {
        setStatus('accepted'); // Treat self as "friend" for viewing
        setIsLoading(false);
        return;
      }

      const { data: friendship } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${user.id})`)
        .single();

      if (!friendship) {
        setStatus('none');
      } else if (friendship.status === 'accepted') {
        setStatus('accepted');
      } else if (friendship.requester_id === user.id) {
        setStatus('pending_sent');
      } else {
        setStatus('pending_received');
      }
    } catch {
      setStatus('none');
    } finally {
      setIsLoading(false);
    }
  }, [otherUserId]);

  const sendFriendRequest = async () => {
    if (!otherUserId || !currentUserId) return;

    try {
      const { error } = await supabase.from('friendships').insert({
        requester_id: currentUserId,
        addressee_id: otherUserId,
        status: 'pending'
      });

      if (error) throw error;

      // Get sender's name for the notification
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('user_id', currentUserId)
        .single();

      const senderName = senderProfile?.first_name || 'Someone';

      // Create notification for the receiver
      await supabase.from('notifications').insert({
        user_id: otherUserId,
        type: 'friend_request',
        title: 'New friend request',
        message: `${senderName} sent you a friend request`,
        related_user_id: currentUserId,
        related_content_type: 'friend_request'
      });

      setStatus('pending_sent');
      toast.success('Friend request sent!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Failed to send friend request');
    }
  };

  const acceptFriendRequest = async () => {
    if (!otherUserId || !currentUserId) return;

    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('requester_id', otherUserId)
        .eq('addressee_id', currentUserId);

      if (error) throw error;
      setStatus('accepted');
      toast.success('Friend request accepted!');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error('Failed to accept friend request');
    }
  };

  useEffect(() => {
    checkFriendship();
  }, [checkFriendship]);

  return {
    status,
    isLoading,
    isFriend: status === 'accepted',
    sendFriendRequest,
    acceptFriendRequest,
    currentUserId
  };
}
