import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type FollowStatus = 'none' | 'following';

export function useFollow(otherUserId: string | null) {
  const [status, setStatus] = useState<FollowStatus>('none');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const checkFollow = useCallback(async () => {
    if (!otherUserId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      if (user.id === otherUserId) {
        // treat self as following for view purposes
        setStatus('following');
        setIsLoading(false);
        return;
      }

      const { data: follow } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('followee_id', otherUserId)
        .single();

      setStatus(follow ? 'following' : 'none');
    } catch (error) {
      console.error('Error checking follow:', error);
      setStatus('none');
    } finally {
      setIsLoading(false);
    }
  }, [otherUserId]);

  const follow = async () => {
    if (!otherUserId || !currentUserId) return;
    try {
      const { error } = await supabase.from('follows').insert({
        follower_id: currentUserId,
        followee_id: otherUserId
      });

      if (error) throw error;

      // notify the followed user
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('first_name, display_name')
        .eq('user_id', currentUserId)
        .single();

      const senderName = senderProfile?.display_name || senderProfile?.first_name || 'Someone';

      await supabase.from('notifications').insert({
        user_id: otherUserId,
        type: 'follow',
        title: 'New follower',
        message: `${senderName} started following you`,
        related_user_id: currentUserId,
        related_content_type: 'follow'
      });

      setStatus('following');
      toast.success('Now following');
    } catch (err) {
      console.error('Error creating follow:', err);
      toast.error('Failed to follow');
    }
  };

  const unfollow = async () => {
    if (!otherUserId || !currentUserId) return;
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .match({ follower_id: currentUserId, followee_id: otherUserId });

      if (error) throw error;

      setStatus('none');
      toast.success('Unfollowed');
    } catch (err) {
      console.error('Error unfollowing:', err);
      toast.error('Failed to unfollow');
    }
  };

  useEffect(() => {
    setIsLoading(true);
    checkFollow();
  }, [checkFollow]);

  return {
    status,
    isLoading,
    isFollowing: status === 'following',
    follow,
    unfollow,
    currentUserId
  };
}
