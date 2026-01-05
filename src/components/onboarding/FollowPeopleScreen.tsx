import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingProgress } from './OnboardingProgress';
import { motion } from 'framer-motion';
import { ChevronLeft, User, UserPlus, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SuggestedUser {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export function FollowPeopleScreen() {
  const { goBack, setCurrentStep } = useOnboarding();
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [followingUser, setFollowingUser] = useState<string | null>(null);

  useEffect(() => {
    fetchSuggestedUsers();
  }, []);

  const fetchSuggestedUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch other users (excluding current user)
      const { data: usersData, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, bio')
        .neq('user_id', user.id)
        .eq('onboarding_completed', true)
        .limit(10);

      if (error) throw error;
      setUsers(usersData || []);

      // Check existing friend requests/friendships
      const { data: existingRequests } = await supabase
        .from('friendships')
        .select('addressee_id')
        .eq('requester_id', user.id);

      if (existingRequests) {
        setFollowedUsers(new Set(existingRequests.map(r => r.addressee_id)));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async (addresseeId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setFollowingUser(addresseeId);

    try {
      if (followedUsers.has(addresseeId)) {
        // Unfollow
        await supabase
          .from('friendships')
          .delete()
          .eq('requester_id', user.id)
          .eq('addressee_id', addresseeId);

        setFollowedUsers(prev => {
          const updated = new Set(prev);
          updated.delete(addresseeId);
          return updated;
        });
      } else {
        // Follow
        await supabase
          .from('friendships')
          .insert({ requester_id: user.id, addressee_id: addresseeId });

        // Send notification
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', user.id)
          .single();

        await supabase.from('notifications').insert({
          user_id: addresseeId,
          type: 'friend_request',
          title: 'New friend request',
          message: `${senderProfile?.display_name || 'Someone'} sent you a friend request`,
          related_user_id: user.id,
          related_content_type: 'friend_request'
        });

        setFollowedUsers(prev => new Set([...prev, addresseeId]));
        toast.success('Friend request sent!');
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      if (error.code === '23505') {
        toast.error('Request already sent');
      } else {
        toast.error('Failed to update');
      }
    } finally {
      setFollowingUser(null);
    }
  };

  const handleContinue = () => {
    setCurrentStep('choose_setup_path');
  };

  const handleSkip = () => {
    setCurrentStep('choose_setup_path');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col min-h-screen"
    >
      <OnboardingProgress />
      
      <div className="flex-1 px-6 py-8">
        <button 
          onClick={goBack}
          className="flex items-center gap-1 text-muted-foreground mb-6 hover:text-foreground transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>

        <h1 className="text-2xl font-bold mb-2">Add some friends</h1>
        <p className="text-muted-foreground mb-6">
          Following people makes the app more motivating — you'll see their check-ins and they'll see yours
        </p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <User size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No users to suggest yet. Be one of the first!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user, index) => {
              const isFollowed = followedUsers.has(user.user_id);
              const isFollowing = followingUser === user.user_id;
              const displayName = user.display_name || user.username || 'User';
              
              return (
                <motion.div
                  key={user.user_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 rounded-xl bg-card border border-border flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-full bg-muted overflow-hidden shrink-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User size={24} className="text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{displayName}</p>
                    {user.username && (
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    )}
                  </div>
                  
                  <Button
                    size="sm"
                    variant={isFollowed ? "secondary" : "default"}
                    disabled={isFollowed || isFollowing}
                    onClick={() => toggleFollow(user.user_id)}
                    className={cn(
                      "shrink-0",
                      isFollowed && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isFollowing ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : isFollowed ? (
                      <>
                        <Check size={16} className="mr-1" />
                        Sent
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} className="mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-6 pb-8 space-y-3">
        <Button 
          size="xl" 
          className="w-full"
          onClick={handleContinue}
        >
          Continue
        </Button>
        <Button 
          variant="ghost" 
          size="lg" 
          className="w-full"
          onClick={handleSkip}
        >
          Skip for now
        </Button>
      </div>
    </motion.div>
  );
}
