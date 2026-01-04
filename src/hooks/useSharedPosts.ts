import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SharedPost {
  id: string;
  post_id: string;
  sender_id: string;
  recipient_user_id: string | null;
  recipient_group_id: string | null;
  message: string | null;
  created_at: string;
  sender_profile?: {
    first_name: string | null;
    avatar_url: string | null;
  };
  post_data?: {
    content_type: string;
    content_data: unknown;
    images: string[] | null;
    description: string | null;
  };
}

export function useSharedPostsForDM(otherUserId: string | null) {
  const [sharedPosts, setSharedPosts] = useState<SharedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSharedPosts = useCallback(async () => {
    if (!otherUserId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch shared posts between these two users
      const { data: shares } = await supabase
        .from('shared_posts')
        .select('*')
        .is('recipient_group_id', null)
        .or(`and(sender_id.eq.${user.id},recipient_user_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_user_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (!shares || shares.length === 0) {
        setSharedPosts([]);
        setIsLoading(false);
        return;
      }

      // Fetch post data and sender profiles for each share
      const postsWithData = await Promise.all(
        shares.map(async (share) => {
          const [postResult, profileResult] = await Promise.all([
            supabase
              .from('posts')
              .select('content_type, content_data, images, description')
              .eq('id', share.post_id)
              .single(),
            supabase
              .from('profiles')
              .select('first_name, avatar_url')
              .eq('user_id', share.sender_id)
              .single()
          ]);

          return {
            ...share,
            post_data: postResult.data || undefined,
            sender_profile: profileResult.data || undefined
          };
        })
      );

      setSharedPosts(postsWithData);
    } catch (error) {
      console.error('Error fetching shared posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [otherUserId]);

  useEffect(() => {
    if (otherUserId) {
      setIsLoading(true);
      fetchSharedPosts();
    }
  }, [otherUserId, fetchSharedPosts]);

  useEffect(() => {
    if (!otherUserId) return;

    const channel = supabase
      .channel(`shared-posts-dm-${otherUserId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shared_posts' }, () => {
        fetchSharedPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [otherUserId, fetchSharedPosts]);

  return { sharedPosts, isLoading, refreshSharedPosts: fetchSharedPosts };
}

export function useSharedPostsForGroup(groupId: string | null) {
  const [sharedPosts, setSharedPosts] = useState<SharedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSharedPosts = useCallback(async () => {
    if (!groupId) return;

    try {
      // Fetch shared posts for this group
      const { data: shares } = await supabase
        .from('shared_posts')
        .select('*')
        .eq('recipient_group_id', groupId)
        .order('created_at', { ascending: true });

      if (!shares || shares.length === 0) {
        setSharedPosts([]);
        setIsLoading(false);
        return;
      }

      // Fetch post data and sender profiles for each share
      const postsWithData = await Promise.all(
        shares.map(async (share) => {
          const [postResult, profileResult] = await Promise.all([
            supabase
              .from('posts')
              .select('content_type, content_data, images, description')
              .eq('id', share.post_id)
              .single(),
            supabase
              .from('profiles')
              .select('first_name, avatar_url')
              .eq('user_id', share.sender_id)
              .single()
          ]);

          return {
            ...share,
            post_data: postResult.data || undefined,
            sender_profile: profileResult.data || undefined
          };
        })
      );

      setSharedPosts(postsWithData);
    } catch (error) {
      console.error('Error fetching shared posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (groupId) {
      setIsLoading(true);
      fetchSharedPosts();
    }
  }, [groupId, fetchSharedPosts]);

  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`shared-posts-group-${groupId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shared_posts' }, () => {
        fetchSharedPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, fetchSharedPosts]);

  return { sharedPosts, isLoading, refreshSharedPosts: fetchSharedPosts };
}
