import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingProgress } from './OnboardingProgress';
import { motion } from 'framer-motion';
import { ChevronLeft, Users, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface SystemGroup {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
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

export function JoinGroupsScreen() {
  const { data, updateData, goBack, setCurrentStep } = useOnboarding();
  const [groups, setGroups] = useState<SystemGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set(data.joinedGroupIds));
  const [loading, setLoading] = useState(true);

  // Randomize groups order once on mount
  const shuffledGroups = useMemo(() => shuffleArray(groups), [groups]);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      // Fetch ALL public system groups (no limit)
      const { data: groupsData, error } = await supabase
        .from('groups')
        .select('id, name, description, avatar_url')
        .eq('is_system', true)
        .eq('visibility', 'public');

      if (error) throw error;
      setGroups(groupsData || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(prev => {
      const updated = new Set(prev);
      if (updated.has(groupId)) {
        updated.delete(groupId);
      } else {
        updated.add(groupId);
      }
      return updated;
    });
  };

  const handleContinue = () => {
    // Store selections in onboarding data - actual joining happens at onboarding completion
    updateData({ joinedGroupIds: Array.from(selectedGroups) });
    setCurrentStep('follow_people');
  };

  const handleSkip = () => {
    updateData({ joinedGroupIds: [] });
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
            {shuffledGroups.map((group, index) => {
              const isSelected = selectedGroups.has(group.id);
              
              return (
                <motion.button
                  key={group.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    "w-full p-4 rounded-2xl border-2 transition-all text-left",
                    isSelected ? "border-primary bg-primary/5" : "border-border bg-card"
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
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                    )}>
                      {isSelected && <Check size={14} className="text-primary-foreground" />}
                    </div>
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