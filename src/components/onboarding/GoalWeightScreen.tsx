import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingProgress } from './OnboardingProgress';
import { motion } from 'framer-motion';
import { ChevronLeft, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

export function GoalWeightScreen() {
  const { data, updateData, goBack, setCurrentStep, isEditingFromTargets, setIsEditingFromTargets } = useOnboarding();

  // Calculate healthy BMI weight range
  const getHealthyWeightRange = () => {
    if (!data.heightValue) return null;
    
    let heightM: number;
    if (data.unitsSystem === 'imperial') {
      // heightValue is in total inches
      heightM = data.heightValue * 0.0254;
    } else {
      heightM = data.heightValue / 100;
    }
    
    // BMI range 18.5 - 24.9
    const minWeightKg = 18.5 * heightM * heightM;
    const maxWeightKg = 24.9 * heightM * heightM;
    
    if (data.unitsSystem === 'imperial') {
      return {
        min: Math.round(minWeightKg / 0.453592),
        max: Math.round(maxWeightKg / 0.453592),
        unit: 'lbs'
      };
    } else {
      return {
        min: Math.round(minWeightKg),
        max: Math.round(maxWeightKg),
        unit: 'kg'
      };
    }
  };

  const healthyRange = getHealthyWeightRange();

  const handleContinue = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && data.hasGoalWeight) {
      await supabase
        .from('profiles')
        .update({ goal_weight: data.goalWeight })
        .eq('user_id', user.id);
    }
    
    // If editing from targets screen, go back there
    if (isEditingFromTargets) {
      setIsEditingFromTargets(false);
      setCurrentStep('calculate_targets');
      return;
    }
    
    // Skip pace screen if no goal weight
    if (!data.hasGoalWeight) {
      setCurrentStep('calculate_targets');
    } else {
      setCurrentStep('pace');
    }
  };

  const handleBack = () => {
    if (isEditingFromTargets) {
      setIsEditingFromTargets(false);
      setCurrentStep('calculate_targets');
    } else {
      goBack();
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
        {!isEditingFromTargets && (
          <button 
            onClick={handleBack}
            className="flex items-center gap-1 text-muted-foreground mb-6 hover:text-foreground transition-colors"
          >
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>
        )}

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
              className="space-y-4"
            >
              <div className="space-y-3">
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
              </div>

              {/* BMI-based suggestion */}
              {healthyRange && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <Lightbulb size={20} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Healthy BMI range</p>
                    <p className="text-sm text-muted-foreground">
                      Based on your height, a healthy weight is between {healthyRange.min}–{healthyRange.max} {healthyRange.unit}
                    </p>
                  </div>
                </div>
              )}
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
