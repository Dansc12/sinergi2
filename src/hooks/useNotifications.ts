import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  is_read: boolean;
  related_user_id: string | null;
  related_content_id: string | null;
  related_content_type: string | null;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    userIdRef.current = user.id;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setNotifications(data as Notification[]);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          // Only add if it's for the current user
          if (newNotification.user_id === userIdRef.current) {
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          if (updatedNotification.user_id === userIdRef.current) {
            setNotifications(prev =>
              prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
            );
            // Recalculate unread count
            setNotifications(prev => {
              setUnreadCount(prev.filter(n => !n.is_read).length);
              return prev;
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const deletedNotification = payload.old as Notification;
          setNotifications(prev => {
            const filtered = prev.filter(n => n.id !== deletedNotification.id);
            setUnreadCount(filtered.filter(n => !n.is_read).length);
            return filtered;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (!error) {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: fetchNotifications,
  };
}
