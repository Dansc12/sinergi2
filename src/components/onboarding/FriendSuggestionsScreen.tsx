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
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface FriendSuggestionsScreenProps {
  isAuthenticated?: boolean;
}

export function FriendSuggestionsScreen({ isAuthenticated = false }: FriendSuggestionsScreenProps) {
  const { data, setCurrentStep } = useOnboarding();
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [requestedUsers, setRequestedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);

  // Determine correct step navigation based on auth status and goal
  const getBackStep = () => {
    if (isAuthenticated) {
      return data.primaryGoal === 'weight_loss' ? 10 : 9;
    }
    return data.primaryGoal === 'weight_loss' ? 10 : 9;
  };

  const getNextStep = () => {
    if (isAuthenticated) {
      return data.primaryGoal === 'weight_loss' ? 12 : 11;
    }
    return data.primaryGoal === 'weight_loss' ? 12 : 11;
  };

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
        .select('user_id, first_name, last_name, username, avatar_url')
        .neq('user_id', user.id)
        .eq('onboarding_completed', true)
        .limit(10);

      if (error) throw error;
      setUsers(usersData || []);

      // Check existing friend requests
      const { data: existingRequests } = await supabase
        .from('friendships')
        .select('addressee_id')
        .eq('requester_id', user.id);

      if (existingRequests) {
        setRequestedUsers(new Set(existingRequests.map(r => r.addressee_id)));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (addresseeId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    setSendingRequest(addresseeId);

    try {
      const { error } = await supabase
        .from('friendships')
        .insert({ requester_id: user.id, addressee_id: addresseeId });

      if (error) throw error;

      setRequestedUsers(prev => new Set([...prev, addresseeId]));
      toast.success('Friend request sent!');
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      if (error.code === '23505') {
        toast.error('Request already sent');
      } else {
        toast.error('Failed to send request');
      }
    } finally {
      setSendingRequest(null);
    }
  };

  const handleFinish = () => {
    setCurrentStep(getNextStep());
  };

  const handleSkip = () => {
    setCurrentStep(getNextStep());
  };

  const requestedCount = requestedUsers.size;
  const targetCount = 3;

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
          onClick={() => setCurrentStep(getBackStep())}
          className="flex items-center gap-1 text-muted-foreground mb-6 hover:text-foreground transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>

        <h1 className="text-2xl font-bold mb-2">Add a few people</h1>
        <p className="text-muted-foreground mb-4">
          Following a few people makes the app more motivating — you'll see their check-ins and they'll see yours.
        </p>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((requestedCount / targetCount) * 100, 100)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {requestedCount}/{targetCount}
          </span>
        </div>

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
              const isRequested = requestedUsers.has(user.user_id);
              const isSending = sendingRequest === user.user_id;
              const displayName = user.first_name && user.last_name 
                ? `${user.first_name} ${user.last_name}`
                : user.username || 'User';
              
              return (
                <motion.div
                  key={user.user_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
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
                    <p className="font-medium text-foreground truncate">{displayName}</p>
                    {user.username && (
                      <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={isRequested ? "secondary" : "default"}
                    disabled={isRequested || isSending}
                    onClick={() => sendFriendRequest(user.user_id)}
                    className={cn(
                      "shrink-0",
                      isRequested && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isSending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : isRequested ? (
                      <>
                        <Check size={16} className="mr-1" />
                        Requested
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} className="mr-1" />
                        Friend
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
          onClick={handleFinish}
        >
          Finish
        </Button>
        <Button 
          variant="ghost" 
          size="lg" 
          className="w-full"
          onClick={handleSkip}
        >
          Skip
        </Button>
      </div>
    </motion.div>
  );
}
