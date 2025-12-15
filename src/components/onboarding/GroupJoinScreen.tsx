import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingProgress } from './OnboardingProgress';
import { motion } from 'framer-motion';
import { ChevronLeft, Check, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SystemGroup {
  id: string;
  slug: string;
  name: string;
  description: string;
}

interface GroupJoinScreenProps {
  isAuthenticated?: boolean;
}

export function GroupJoinScreen({ isAuthenticated = false }: GroupJoinScreenProps) {
  const { data, setCurrentStep } = useOnboarding();
  const [groups, setGroups] = useState<SystemGroup[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Determine correct step navigation based on auth status and goal
  const getBackStep = () => {
    if (isAuthenticated) {
      return data.primaryGoal === 'weight_loss' ? 8 : 7;
    }
    return data.primaryGoal === 'weight_loss' ? 8 : 7;
  };

  const getNextStep = () => {
    if (isAuthenticated) {
      return data.primaryGoal === 'weight_loss' ? 10 : 9;
    }
    return data.primaryGoal === 'weight_loss' ? 10 : 9;
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data: groupsData, error } = await supabase
        .from('groups')
        .select('id, slug, name, description')
        .eq('is_system', true)
        .eq('visibility', 'public');

      if (error) throw error;
      setGroups(groupsData || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = async (groupId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    const isJoined = joinedGroups.has(groupId);

    if (isJoined) {
      // Leave group
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error leaving group:', error);
        toast.error('Failed to leave group');
        return;
      }

      setJoinedGroups(prev => {
        const next = new Set(prev);
        next.delete(groupId);
        return next;
      });
    } else {
      // Join group
      const { error } = await supabase
        .from('group_members')
        .insert({ group_id: groupId, user_id: user.id });

      if (error) {
        console.error('Error joining group:', error);
        toast.error('Failed to join group');
        return;
      }

      setJoinedGroups(prev => new Set([...prev, groupId]));
    }
  };

  const handleContinue = () => {
    if (joinedGroups.size >= 1) {
      setCurrentStep(getNextStep());
    }
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
          onClick={() => setCurrentStep(getBackStep())}
          className="flex items-center gap-1 text-muted-foreground mb-6 hover:text-foreground transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>

        <h1 className="text-2xl font-bold mb-2">Join your first group</h1>
        <p className="text-muted-foreground mb-8">
          Pick at least one group so you can get encouragement (and give it) as you track. Imperfect check-ins welcome.
        </p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group, index) => {
              const isJoined = joinedGroups.has(group.id);
              
              return (
                <motion.button
                  key={group.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all",
                    isJoined 
                      ? "border-primary bg-primary/10" 
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                      isJoined ? "bg-primary/20" : "bg-muted"
                    )}>
                      <Users size={24} className={isJoined ? "text-primary" : "text-muted-foreground"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">{group.name}</h3>
                        {isJoined && (
                          <Check size={20} className="text-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        <p className="text-sm text-muted-foreground mt-6 text-center">
          <span className="text-primary font-medium">{joinedGroups.size}</span> group{joinedGroups.size !== 1 ? 's' : ''} selected
        </p>
      </div>

      <div className="px-6 pb-8">
        <Button 
          size="xl" 
          className="w-full"
          disabled={joinedGroups.size < 1}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
}
