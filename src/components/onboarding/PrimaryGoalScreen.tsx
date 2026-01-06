import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingProgress } from './OnboardingProgress';
import { motion } from 'framer-motion';
import { ChevronLeft, TrendingDown, Dumbbell, Zap, Heart, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const goals = [
  { id: 'fat_loss', label: 'Fat loss', icon: TrendingDown, description: 'Lose body fat while preserving muscle' },
  { id: 'build_muscle', label: 'Build muscle', icon: Dumbbell, description: 'Gain lean muscle mass' },
  { id: 'get_stronger', label: 'Get stronger', icon: Zap, description: 'Increase strength and power' },
  { id: 'improve_health', label: 'Improve health', icon: Heart, description: 'Feel better and have more energy' },
  { id: 'maintain', label: 'Maintain', icon: Scale, description: 'Keep my current physique' },
] as const;

export function PrimaryGoalScreen() {
  const { data, updateData, goBack, setCurrentStep, isEditingFromTargets, setIsEditingFromTargets } = useOnboarding();

  const handleSelect = (goalId: typeof goals[number]['id']) => {
    updateData({ goalType: goalId });
  };

  const handleContinue = async () => {
    if (data.goalType) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ primary_goal: data.goalType })
          .eq('user_id', user.id);
      }
      
      if (isEditingFromTargets) {
        setIsEditingFromTargets(false);
        setCurrentStep('calculate_targets');
      } else {
        setCurrentStep('sex_height');
      }
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
        {!isEditingFromTargets && (
          <button 
            onClick={goBack}
            className="flex items-center gap-1 text-muted-foreground mb-6 hover:text-foreground transition-colors"
          >
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>
        )}

        <h1 className="text-2xl font-bold mb-2">What's your main goal?</h1>
        <p className="text-muted-foreground mb-8">
          This helps us calculate the right calorie targets
        </p>

        <div className="space-y-3">
          {goals.map((goal, index) => {
            const Icon = goal.icon;
            const isSelected = data.goalType === goal.id;
            
            return (
              <motion.button
                key={goal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSelect(goal.id)}
                className={cn(
                  "w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4",
                  isSelected 
                    ? "border-primary bg-primary/10" 
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  isSelected ? "bg-primary/20" : "bg-muted"
                )}>
                  <Icon size={24} className={isSelected ? "text-primary" : "text-muted-foreground"} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{goal.label}</p>
                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="px-6 pb-8">
        <Button 
          size="xl" 
          className="w-full"
          disabled={!data.goalType}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
}
