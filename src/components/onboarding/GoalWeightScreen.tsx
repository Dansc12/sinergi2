import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingProgress } from './OnboardingProgress';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

export function GoalWeightScreen() {
  const { data, updateData, goBack, setCurrentStep } = useOnboarding();

  const handleContinue = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && data.hasGoalWeight) {
      await supabase
        .from('profiles')
        .update({ goal_weight: data.goalWeight })
        .eq('user_id', user.id);
    }
    // Skip pace screen if no goal weight
    if (!data.hasGoalWeight) {
      setCurrentStep('calculate_targets');
    } else {
      setCurrentStep('pace');
    }
  };

  // Goal weight cannot equal current weight
  const isGoalWeightValid = !data.hasGoalWeight || (data.goalWeight > 0 && data.goalWeight !== data.currentWeight);

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

        <h1 className="text-2xl font-bold mb-2">Do you have a goal weight?</h1>
        <p className="text-muted-foreground mb-8">
          This is optional — many people focus on how they feel rather than a number
        </p>

        <div className="space-y-6">
          {/* Yes/No selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => updateData({ hasGoalWeight: true })}
              className={cn(
                "p-4 rounded-xl border-2 transition-all",
                data.hasGoalWeight
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <p className="font-semibold">Yes, I have one</p>
            </button>
            <button
              onClick={() => updateData({ hasGoalWeight: false, goalWeight: 0 })}
              className={cn(
                "p-4 rounded-xl border-2 transition-all",
                !data.hasGoalWeight
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <p className="font-semibold">Not right now</p>
            </button>
          </div>

          {/* Goal weight input */}
          {data.hasGoalWeight && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3"
            >
              <Label>Goal weight</Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder={data.unitsSystem === 'imperial' ? "140" : "63"}
                  value={data.goalWeight || ''}
                  onChange={(e) => updateData({ goalWeight: parseFloat(e.target.value) || 0 })}
                  className="h-14 text-2xl font-semibold pr-14 text-center"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
                  {data.unitsSystem === 'imperial' ? 'lbs' : 'kg'}
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="px-6 pb-8">
        {data.hasGoalWeight && data.goalWeight === data.currentWeight && data.goalWeight > 0 && (
          <p className="text-destructive text-sm text-center mb-3">
            Goal weight cannot be the same as current weight
          </p>
        )}
        <Button 
          size="xl" 
          className="w-full"
          disabled={!isGoalWeightValid}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
}
