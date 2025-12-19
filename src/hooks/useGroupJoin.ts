import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { sendJoinNotification } from './useGroupChats';

interface GroupJoinState {
  isMember: boolean;
  hasRequestedInvite: boolean;
  isLoading: boolean;
}

export function useGroupJoin(groupId: string | undefined) {
  const [state, setState] = useState<GroupJoinState>({
    isMember: false,
    hasRequestedInvite: false,
    isLoading: true,
  });

  const checkMembershipStatus = useCallback(async () => {
    if (!groupId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Check if user is already a member
      const { data: membership } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (membership) {
        setState({ isMember: true, hasRequestedInvite: false, isLoading: false });
        return;
      }

      // Check if user has a pending invite request
      const { data: request } = await supabase
        .from('group_join_requests')
        .select('id, status')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      setState({
        isMember: false,
        hasRequestedInvite: !!request,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error checking membership status:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [groupId]);

  useEffect(() => {
    checkMembershipStatus();
  }, [checkMembershipStatus]);

  const joinPublicGroup = async () => {
    if (!groupId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to join groups');
        return;
      }

      // Get user's name for join notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, username')
        .eq('user_id', user.id)
        .single();

      const userName = profile?.first_name || profile?.username || 'A new member';

      // Add user to group
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member',
        });

      if (error) throw error;

      // Send join notification to group chat
      await sendJoinNotification(groupId, userName);

      setState({ isMember: true, hasRequestedInvite: false, isLoading: false });
      toast.success('You joined the group!');
    } catch (error: unknown) {
      console.error('Error joining group:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to join group';
      toast.error(errorMessage);
    }
  };

  const requestInvite = async (groupCreatorId: string, groupName: string) => {
    if (!groupId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to request an invite');
        return;
      }

      // Create join request
      const { error: requestError } = await supabase
        .from('group_join_requests')
        .insert({
          group_id: groupId,
          user_id: user.id,
          status: 'pending',
        });

      if (requestError) throw requestError;

      // Get requester's name for notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, username')
        .eq('user_id', user.id)
        .single();

      const requesterName = profile?.first_name || profile?.username || 'Someone';

      // Send notification to group creator
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: groupCreatorId,
          type: 'group_invite_request',
          title: 'Group Join Request',
          message: `${requesterName} wants to join ${groupName}`,
          related_user_id: user.id,
          related_content_type: 'group',
          related_content_id: groupId,
        });

      if (notificationError) throw notificationError;

      setState(prev => ({ ...prev, hasRequestedInvite: true }));
      toast.success('Invite request sent!');
    } catch (error: unknown) {
      console.error('Error requesting invite:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send request';
      toast.error(errorMessage);
    }
  };

  return {
    ...state,
    joinPublicGroup,
    requestInvite,
    refreshStatus: checkMembershipStatus,
  };
}

export async function acceptGroupInviteRequest(
  requestUserId: string,
  groupId: string
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Verify current user is the group creator
    const { data: group } = await supabase
      .from('groups')
      .select('creator_id, name')
      .eq('id', groupId)
      .single();

    if (!group || group.creator_id !== user.id) {
      toast.error('You are not authorized to accept this request');
      return false;
    }

    // Update request status
    const { error: updateError } = await supabase
      .from('group_join_requests')
      .update({ status: 'accepted' })
      .eq('group_id', groupId)
      .eq('user_id', requestUserId);

    if (updateError) throw updateError;

    // Add user to group
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: requestUserId,
        role: 'member',
      });

    if (memberError) throw memberError;

    // Get requester's name for join notification
    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('first_name, username')
      .eq('user_id', requestUserId)
      .single();

    const requesterName = requesterProfile?.first_name || requesterProfile?.username || 'A new member';

    // Send join notification to group chat
    await sendJoinNotification(groupId, requesterName);

    // Notify the requester that they were accepted
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('user_id', user.id)
      .single();

    const ownerName = ownerProfile?.first_name || 'The group owner';

    await supabase
      .from('notifications')
      .insert({
        user_id: requestUserId,
        type: 'group_invite_accepted',
        title: 'Request Accepted!',
        message: `${ownerName} accepted your request to join ${group.name}`,
        related_user_id: user.id,
        related_content_type: 'group',
        related_content_id: groupId,
      });

    toast.success('Member added to group!');
    return true;
  } catch (error) {
    console.error('Error accepting invite request:', error);
    toast.error('Failed to accept request');
    return false;
  }
}