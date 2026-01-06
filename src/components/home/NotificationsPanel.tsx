import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Bell, Heart, MessageCircle, UserPlus, Check, Trash2, CheckCheck, UserCheck, Users } from 'lucide-react';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { acceptGroupInviteRequest } from '@/hooks/useGroupJoin';

const reactionOrder = ["🙌", "💯", "❤️", "💪", "🎉"];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'reaction':
      return <Heart size={16} className="text-pink-500" />;
    case 'comment':
      return <MessageCircle size={16} className="text-blue-500" />;
    case 'friend_request':
    case 'friend_accepted':
      return <UserPlus size={16} className="text-green-500" />;
    case 'group_invite_request':
    case 'group_invite_accepted':
    case 'group_member_joined':
      return <Users size={16} className="text-amber-500" />;
    default:
      return <Bell size={16} className="text-muted-foreground" />;
  }
};

// Parse emoji and count from notification message (e.g., "John reacted 🎉 to your post")
const parseReactionEmoji = (message: string): string | null => {
  const emojiMatch = message.match(/reacted\s+(🙌|💯|❤️|💪|🎉)\s+to/);
  return emojiMatch ? emojiMatch[1] : null;
};

// Aggregate reaction notifications from the same user on the same post
interface AggregatedNotification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
  related_user_id: string | null;
  related_content_id: string | null;
  // For aggregated reactions
  reactionCounts?: Record<string, number>;
  aggregatedIds?: string[];
}

function aggregateReactionNotifications(notifications: Notification[]): AggregatedNotification[] {
  const result: AggregatedNotification[] = [];
  const reactionGroups = new Map<string, {
    notifications: Notification[];
    reactionCounts: Record<string, number>;
  }>();

  for (const notification of notifications) {
    if (notification.type === 'reaction' && notification.related_user_id && notification.related_content_id) {
      // Group by user + post
      const key = `${notification.related_user_id}-${notification.related_content_id}`;
      
      if (!reactionGroups.has(key)) {
        reactionGroups.set(key, { notifications: [], reactionCounts: {} });
      }
      
      const group = reactionGroups.get(key)!;
      group.notifications.push(notification);
      
      const emoji = parseReactionEmoji(notification.message || '');
      if (emoji) {
        group.reactionCounts[emoji] = (group.reactionCounts[emoji] || 0) + 1;
      }
    } else {
      // Non-reaction notifications pass through
      result.push(notification);
    }
  }

  // Convert reaction groups to aggregated notifications
  for (const [, group] of reactionGroups) {
    const latest = group.notifications.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
    
    // Extract name from message (e.g., "John reacted...")
    const nameMatch = latest.message?.match(/^(\w+)\s+reacted/);
    const name = nameMatch ? nameMatch[1] : 'Someone';
    
    // Build reaction summary string in correct order
    const reactionSummary = reactionOrder
      .filter(emoji => group.reactionCounts[emoji] > 0)
      .map(emoji => `${emoji} ${group.reactionCounts[emoji]}`)
      .join('  ');

    result.push({
      id: latest.id,
      type: 'reaction',
      title: `${name} shared some love`,
      message: reactionSummary || null,
      is_read: group.notifications.every(n => n.is_read),
      created_at: latest.created_at,
      related_user_id: latest.related_user_id,
      related_content_id: latest.related_content_id,
      reactionCounts: group.reactionCounts,
      aggregatedIds: group.notifications.map(n => n.id),
    });
  }

  // Sort by created_at descending
  return result.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete,
  onAcceptFriendRequest,
  onAcceptGroupInvite,
  onNavigateToProfile,
  onClose
}: { 
  notification: AggregatedNotification; 
  onMarkAsRead: () => void;
  onDelete: () => void;
  onAcceptFriendRequest?: () => void;
  onAcceptGroupInvite?: () => void;
  onNavigateToProfile?: () => void;
  onClose?: () => void;
}) {
  const isFriendRequest = notification.type === 'friend_request';
  const isGroupInviteRequest = notification.type === 'group_invite_request';
  const isGroupMemberJoined = notification.type === 'group_member_joined';
  
  // Extract name from message for friend requests
  const extractName = () => {
    if (!notification.message) return null;
    const match = notification.message.match(/^(\w+)\s+sent you/);
    return match ? match[1] : null;
  };

  // Extract name from group invite request message
  const extractGroupInviteName = () => {
    if (!notification.message) return null;
    const match = notification.message.match(/^(\w+)\s+wants to join/);
    return match ? match[1] : null;
  };

  // Extract name from group member joined message
  const extractGroupMemberJoinedName = () => {
    if (!notification.message) return null;
    const match = notification.message.match(/^(.+?)\s+joined\s+/);
    return match ? match[1] : null;
  };
  
  const senderName = isFriendRequest 
    ? extractName() 
    : isGroupInviteRequest 
      ? extractGroupInviteName() 
      : isGroupMemberJoined 
        ? extractGroupMemberJoinedName() 
        : null;

  const handleNameClick = () => {
    if (notification.related_user_id && onNavigateToProfile) {
      onClose?.();
      onNavigateToProfile();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={cn(
        "p-4 border-b border-border last:border-b-0 transition-colors",
        !notification.is_read && "bg-primary/5"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 p-2 rounded-full bg-muted">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm",
            !notification.is_read && "font-semibold"
          )}>
            {notification.title}
          </p>
          {notification.message && (
            <p className={cn(
              "text-sm mt-0.5",
              notification.type === 'reaction' ? "text-foreground" : "text-muted-foreground"
            )}>
              {isFriendRequest && senderName ? (
                <>
                  <button
                    onClick={handleNameClick}
                    className="font-semibold text-primary hover:underline"
                  >
                    {senderName}
                  </button>
                  {' sent you a friend request'}
                </>
              ) : isGroupInviteRequest && senderName ? (
                <>
                  <button
                    onClick={handleNameClick}
                    className="font-semibold text-primary hover:underline"
                  >
                    {senderName}
                  </button>
                  {notification.message.replace(senderName, '').trim()}
                </>
              ) : isGroupMemberJoined && senderName ? (
                <>
                  <button
                    onClick={handleNameClick}
                    className="font-semibold text-primary hover:underline"
                  >
                    {senderName}
                  </button>
                  {notification.message.replace(senderName, '').trim()}
                </>
              ) : (
                <span className="truncate">{notification.message}</span>
              )}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
          
          {/* Accept button for friend requests */}
          {isFriendRequest && onAcceptFriendRequest && (
            <Button
              size="sm"
              className="mt-2"
              onClick={(e) => {
                e.stopPropagation();
                onAcceptFriendRequest();
              }}
            >
              <UserCheck size={14} className="mr-1" />
              Accept
            </Button>
          )}

          {/* Accept button for group invite requests */}
          {isGroupInviteRequest && onAcceptGroupInvite && (
            <Button
              size="sm"
              className="mt-2"
              onClick={(e) => {
                e.stopPropagation();
                onAcceptGroupInvite();
              }}
            >
              <UserCheck size={14} className="mr-1" />
              Accept
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead();
              }}
            >
              <Check size={14} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function NotificationsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    refreshNotifications
  } = useNotifications();

  const aggregatedNotifications = useMemo(
    () => aggregateReactionNotifications(notifications),
    [notifications]
  );

  const handleMarkAsRead = (notification: AggregatedNotification) => {
    if (notification.aggregatedIds) {
      notification.aggregatedIds.forEach(id => markAsRead(id));
    } else {
      markAsRead(notification.id);
    }
  };

  const handleDelete = (notification: AggregatedNotification) => {
    if (notification.aggregatedIds) {
      notification.aggregatedIds.forEach(id => deleteNotification(id));
    } else {
      deleteNotification(notification.id);
    }
  };

  const handleAcceptFriendRequest = async (notification: AggregatedNotification) => {
    if (!notification.related_user_id) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update the friendship status to accepted
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('requester_id', notification.related_user_id)
        .eq('addressee_id', user.id);

      if (error) throw error;

      // Mark notification as read and delete it
      handleMarkAsRead(notification);
      handleDelete(notification);
      
      toast.success('Friend request accepted!');
      refreshNotifications();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error('Failed to accept friend request');
    }
  };

  const handleAcceptGroupInvite = async (notification: AggregatedNotification) => {
    if (!notification.related_user_id || !notification.related_content_id) return;

    const success = await acceptGroupInviteRequest(
      notification.related_user_id,
      notification.related_content_id
    );

    if (success) {
      handleMarkAsRead(notification);
      handleDelete(notification);
      refreshNotifications();
    }
  };

  const handleNavigateToProfile = (userId: string) => {
    setIsOpen(false);
    navigate(`/user/${userId}`);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="icon" size="icon" className="relative">
          <Bell size={22} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                  {unreadCount}
                </span>
              )}
            </SheetTitle>
            
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                onClick={markAllAsRead}
              >
                <CheckCheck size={14} className="mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="overflow-y-auto max-h-[calc(100vh-80px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : aggregatedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="p-4 rounded-full bg-muted mb-4">
                <Bell size={24} className="text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No notifications yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                When you get reactions, comments, or friend requests, they'll show up here.
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {aggregatedNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={() => handleMarkAsRead(notification)}
                  onDelete={() => handleDelete(notification)}
                  onAcceptFriendRequest={
                    notification.type === 'friend_request' 
                      ? () => handleAcceptFriendRequest(notification) 
                      : undefined
                  }
                  onAcceptGroupInvite={
                    notification.type === 'group_invite_request'
                      ? () => handleAcceptGroupInvite(notification)
                      : undefined
                  }
                  onNavigateToProfile={
                    notification.related_user_id 
                      ? () => handleNavigateToProfile(notification.related_user_id!) 
                      : undefined
                  }
                  onClose={() => setIsOpen(false)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
