import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingProgress } from './OnboardingProgress';
import { motion } from 'framer-motion';
import { ChevronLeft, User, UserPlus, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface SuggestedUser {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
}

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function FollowPeopleScreen() {
  const { data, updateData, goBack, setCurrentStep } = useOnboarding();
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set(data.followedUserIds));
  const [loading, setLoading] = useState(true);

  // Randomize users order once on mount
  const shuffledUsers = useMemo(() => shuffleArray(users), [users]);

  useEffect(() => {
    fetchSuggestedUsers();
  }, []);

  const fetchSuggestedUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch ALL other users (no limit)
      const { data: usersData, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, bio')
        .neq('user_id', user.id)
        .eq('onboarding_completed', true);

      if (error) throw error;
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => {
      const updated = new Set(prev);
      if (updated.has(userId)) {
        updated.delete(userId);
      } else {
        updated.add(userId);
      }
      return updated;
    });
  };

  const handleContinue = () => {
    // Store selections in onboarding data - actual friend requests happen at onboarding completion
    updateData({ followedUserIds: Array.from(selectedUsers) });
    setCurrentStep('choose_setup_path');
  };

  const handleSkip = () => {
    updateData({ followedUserIds: [] });
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
        ) : shuffledUsers.length === 0 ? (
          <div className="text-center py-12">
            <User size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No users to suggest yet. Be one of the first!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shuffledUsers.map((user, index) => {
              const isSelected = selectedUsers.has(user.user_id);
              const displayName = user.display_name || user.username || 'User';
              
              return (
                <motion.button
                  key={user.user_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => toggleUser(user.user_id)}
                  className={cn(
                    "w-full p-3 rounded-xl border transition-all text-left flex items-center gap-3",
                    isSelected ? "border-primary bg-primary/5" : "border-border bg-card"
                  )}
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
                  
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0",
                    isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                  )}>
                    {isSelected && <Check size={14} className="text-primary-foreground" />}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Static buttons at bottom */}
      <div className="px-6 pb-8 pt-4 space-y-3">
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