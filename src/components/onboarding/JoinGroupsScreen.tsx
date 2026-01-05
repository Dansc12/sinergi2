import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingProgress } from './OnboardingProgress';
import { motion } from 'framer-motion';
import { ChevronLeft, Users, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SystemGroup {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
}

export function JoinGroupsScreen() {
  const { data, updateData, goBack, setCurrentStep } = useOnboarding();
  const [groups, setGroups] = useState<SystemGroup[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<Set<string>>(new Set(data.joinedGroupIds));
  const [loading, setLoading] = useState(true);
  const [joiningGroup, setJoiningGroup] = useState<string | null>(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      // Fetch the 3 default system groups
      const { data: groupsData, error } = await supabase
        .from('groups')
        .select('id, name, description, avatar_url')
        .eq('is_system', true)
        .eq('visibility', 'public')
        .limit(3);

      if (error) throw error;
      setGroups(groupsData || []);

      // Check which groups user has already joined
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: memberships } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id);

        if (memberships) {
          setJoinedGroups(new Set(memberships.map(m => m.group_id)));
        }
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = async (groupId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setJoiningGroup(groupId);

    try {
      if (joinedGroups.has(groupId)) {
        // Leave group
        await supabase
          .from('group_members')
          .delete()
          .eq('group_id', groupId)
          .eq('user_id', user.id);

        setJoinedGroups(prev => {
          const updated = new Set(prev);
          updated.delete(groupId);
          return updated;
        });
      } else {
        // Join group
        await supabase
          .from('group_members')
          .insert({ group_id: groupId, user_id: user.id });

        setJoinedGroups(prev => new Set([...prev, groupId]));
      }

      updateData({ joinedGroupIds: Array.from(joinedGroups) });
    } catch (error: any) {
      console.error('Error toggling group:', error);
      toast.error('Failed to update group membership');
    } finally {
      setJoiningGroup(null);
    }
  };

  const handleContinue = () => {
    updateData({ joinedGroupIds: Array.from(joinedGroups) });
    setCurrentStep('follow_people');
  };

  const handleSkip = () => {
    setCurrentStep('follow_people');
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

        <h1 className="text-2xl font-bold mb-2">Join a community</h1>
        <p className="text-muted-foreground mb-6">
          Get inspiration and accountability from people on similar journeys
        </p>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group, index) => {
              const isJoined = joinedGroups.has(group.id);
              const isJoining = joiningGroup === group.id;
              
              return (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all",
                    isJoined ? "border-primary bg-primary/5" : "border-border bg-card"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                      {group.avatar_url ? (
                        <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Users size={24} className="text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1">{group.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {group.description}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={isJoined ? "secondary" : "default"}
                      disabled={isJoining}
                      onClick={() => toggleGroup(group.id)}
                      className="flex-shrink-0"
                    >
                      {isJoining ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : isJoined ? (
                        <>
                          <Check size={16} className="mr-1" />
                          Joined
                        </>
                      ) : (
                        'Join'
                      )}
                    </Button>
                  </div>
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
