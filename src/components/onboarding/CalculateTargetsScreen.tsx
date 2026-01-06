import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { motion } from 'framer-motion';
import { ChevronLeft, Loader2, Sparkles, Edit2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// TDEE calculation with activity multiplier and exercise bump
function calculateTargets(data: {
  sexAtBirth: string;
  heightValue: number;
  currentWeight: number;
  birthYear: number;
  birthMonth: number;
  goalType: string;
  pace: string;
  unitsSystem: string;
  goalWeight: number;
  hasGoalWeight: boolean;
  activityMultiplier: number;
  exerciseBump: number;
}) {
  // Convert to metric if needed
  let weightKg = data.currentWeight;
  let heightCm = data.heightValue;
  
  if (data.unitsSystem === 'imperial') {
    weightKg = data.currentWeight * 0.453592;
    heightCm = data.heightValue * 2.54; // heightValue is in total inches
  }

  // Calculate age from birth month/year
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  let age = currentYear - data.birthYear;
  if (data.birthMonth > currentMonth) {
    age--; // Birthday hasn't occurred yet this year
  }

  // Mifflin-St Jeor Equation for BMR
  let bmr: number;
  if (data.sexAtBirth === 'male') {
    bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
  } else {
    bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
  }

  // Calculate final multiplier: activity_multiplier + exercise_bump, clamped at 1.70
  const activityMult = data.activityMultiplier || 1.375; // Default to "On your feet a lot"
  const exerciseBump = data.exerciseBump || 0;
  const finalMultiplier = Math.min(activityMult + exerciseBump, 1.70);

  // Calculate TDEE
  const tdee = Math.round(bmr * finalMultiplier);

  // Determine if gaining or losing based on goal weight
  const isGaining = data.hasGoalWeight && data.goalWeight > data.currentWeight;

  // Pace deficits/surpluses
  // gentle: 250 kcal/day, standard: 400 kcal/day, aggressive: 550 kcal/day
  const paceValues = {
    gentle: 250,
    standard: 400,
    aggressive: 550,
  };
  const paceAdjustment = paceValues[data.pace as keyof typeof paceValues] || paceValues.standard;

  let calorieTarget = tdee;

  if (data.hasGoalWeight) {
    // Use goal weight to determine surplus/deficit
    if (isGaining) {
      // Gaining weight - apply surplus (smaller for muscle gain)
      const gainAdjustment = Math.round(paceAdjustment * 0.5); // Half for gains
      calorieTarget = tdee + gainAdjustment;
    } else {
      // Losing weight - apply deficit
      calorieTarget = tdee - paceAdjustment;
    }
  }
  // If no goal weight, stay at TDEE (maintenance) - goalType only affects macros, not calories

  // Apply minimum floors
  const minCalories = data.sexAtBirth === 'male' ? 1500 : 1200;
  calorieTarget = Math.max(calorieTarget, minCalories);

  // Calculate macros based on primary goal
  const weightLb = data.unitsSystem === 'imperial' 
    ? data.currentWeight 
    : data.currentWeight * 2.20462;

  // A) PROTEIN - goal-dependent multipliers (g per lb)
  const proteinMultipliers: Record<string, number> = {
    'fat_loss': 0.85,
    'build_muscle': 0.80,
    'get_stronger': 0.75,
    'improve_health': 0.70,
    'maintain': 0.70,
  };
  const proteinMult = proteinMultipliers[data.goalType] || 0.70;
  const proteinG = Math.round(weightLb * proteinMult);

  // B) FAT - goal-dependent percent of calories
  const fatPercentages: Record<string, number> = {
    'fat_loss': 0.25,
    'build_muscle': 0.27,
    'get_stronger': 0.27,
    'improve_health': 0.30,
    'maintain': 0.30,
  };
  const fatPercent = fatPercentages[data.goalType] || 0.30;
  let fatG = Math.round((calorieTarget * fatPercent) / 9);

  // Fat minimum floor (prevents ultra-low fats)
  const fatGMin = Math.max(Math.round(0.25 * weightLb), 35);
  fatG = Math.max(fatG, fatGMin);

  // C) CARBS - remainder
  const remainingCalories = calorieTarget - (proteinG * 4) - (fatG * 9);
  let carbsG = Math.round(Math.max(remainingCalories, 0) / 4);

  // D) Handle negative carbs edge case - reduce fat to minimum and clamp carbs
  if (remainingCalories < 0) {
    // Recalculate with minimum fat
    fatG = fatGMin;
    const recalcRemaining = calorieTarget - (proteinG * 4) - (fatG * 9);
    carbsG = Math.round(Math.max(recalcRemaining, 0) / 4);
  }

  // Calculate macro percentages
  const totalMacroCals = (Math.max(proteinG, 50) * 4) + (carbsG * 4) + (fatG * 9);
  const proteinPercent = Math.round((Math.max(proteinG, 50) * 4 / totalMacroCals) * 100);
  const carbsPercent = Math.round((carbsG * 4 / totalMacroCals) * 100);
  const fatPercent_display = Math.round((fatG * 9 / totalMacroCals) * 100);

  return {
    calories: calorieTarget,
    macros: {
      protein: Math.max(proteinG, 50),
      carbs: carbsG,
      fat: fatG,
    },
    macroPercents: {
      protein: proteinPercent,
      carbs: carbsPercent,
      fat: fatPercent_display,
    }
  };
}

export function CalculateTargetsScreen() {
  const { data, updateData, goBack, setCurrentStep, completeOnboarding } = useOnboarding();
  const navigate = useNavigate();
  const [isCalculating, setIsCalculating] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [targets, setTargets] = useState<{ calories: number; macros: { protein: number; carbs: number; fat: number }; macroPercents: { protein: number; carbs: number; fat: number } } | null>(null);

  useEffect(() => {
    const calculate = async () => {
      // Simulate calculation delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const calculated = calculateTargets({
        sexAtBirth: data.sexAtBirth,
        heightValue: data.heightValue,
        currentWeight: data.currentWeight,
        birthYear: data.birthYear,
        birthMonth: data.birthMonth,
        goalType: data.goalType,
        pace: data.pace || 'standard',
        unitsSystem: data.unitsSystem,
        goalWeight: data.goalWeight,
        hasGoalWeight: data.hasGoalWeight,
        activityMultiplier: data.activityMultiplier,
        exerciseBump: data.exerciseBump,
      });

      setTargets(calculated);
      updateData({
        calorieTarget: calculated.calories,
        macroTargets: calculated.macros,
      });
      setIsCalculating(false);
    };

    calculate();
  }, []);

  const handleConfirm = async () => {
    if (!targets) return;

    setIsConfirming(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase
        .from('profiles')
        .update({
          daily_calorie_target: targets.calories,
          macro_targets: targets.macros,
          goals_setup_completed: true,
          tdee_targets_enabled: true,
        })
        .eq('user_id', user.id);

      // Complete onboarding (join groups, send friend requests, mark complete)
      await completeOnboarding();
      navigate('/');
    } catch (error) {
      console.error('Error saving targets:', error);
      toast.error('Failed to save targets');
      setIsConfirming(false);
    }
  };

  const handleEdit = () => {
    // Go to the edit answers list view
    setCurrentStep('edit_answers');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-screen"
    >
      <div className="flex-1 px-6 py-8 flex flex-col items-center justify-center">
        {isCalculating ? (
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mb-8 mx-auto"
            >
              <Loader2 className="w-10 h-10 text-primary-foreground" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">Calculating your targets...</h1>
            <p className="text-muted-foreground">Based on your goals and body stats</p>
          </div>
        ) : targets ? (
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4"
              >
                <Sparkles className="w-8 h-8 text-primary" />
              </motion.div>
              <h1 className="text-2xl font-bold">Your Daily Targets</h1>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-2xl p-6 mb-6"
            >
              {/* Primary Goal + Activity Info */}
              <div className="text-center mb-4 pb-4 border-b border-border">
                <p className="text-lg font-semibold capitalize">
                  {data.goalType?.replace('_', ' ') || 'Improve health'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.activityLevelLabel || 'Moderate activity'} • {data.exerciseFrequency || '2-3 days'}/week
                </p>
              </div>

              {/* Calories */}
              <div className="text-center mb-6 pb-6 border-b border-border">
                <p className="text-sm text-muted-foreground mb-1">Calories</p>
                <p className="text-4xl font-bold text-primary">{targets.calories.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">per day</p>
              </div>

              {/* Macros */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{targets.macros.protein}g</p>
                  <p className="text-xs text-muted-foreground mb-0.5">Protein</p>
                  <p className="text-xs text-primary">{targets.macroPercents.protein}%</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{targets.macros.carbs}g</p>
                  <p className="text-xs text-muted-foreground mb-0.5">Carbs</p>
                  <p className="text-xs text-primary">{targets.macroPercents.carbs}%</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{targets.macros.fat}g</p>
                  <p className="text-xs text-muted-foreground mb-0.5">Fat</p>
                  <p className="text-xs text-primary">{targets.macroPercents.fat}%</p>
                </div>
              </div>

              {/* Estimated Goal Date */}
              {data.hasGoalWeight && data.goalWeight && data.goalWeight !== data.currentWeight && (() => {
                const weightDiff = Math.abs(data.goalWeight - data.currentWeight);
                const paceValues = { gentle: 0.5, standard: 0.8, aggressive: 1.1 };
                const weeklyLoss = paceValues[data.pace as keyof typeof paceValues] || 0.8;
                const weeksToGoal = Math.ceil(weightDiff / weeklyLoss);
                const goalDate = new Date();
                goalDate.setDate(goalDate.getDate() + (weeksToGoal * 7));
                const formattedDate = goalDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                return (
                  <div className="mt-6 pt-4 border-t border-border text-center">
                    <p className="text-xs text-muted-foreground mb-1">Estimated goal date</p>
                    <p className="text-sm font-semibold text-primary">{formattedDate}</p>
                  </div>
                );
              })()}
            </motion.div>

            <div className="space-y-3">
              <Button 
                size="xl" 
                className="w-full"
                onClick={handleConfirm}
                disabled={isConfirming}
              >
                {isConfirming ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Looks good!"
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="lg" 
                className="w-full"
                onClick={handleEdit}
                disabled={isConfirming}
              >
                <Edit2 size={16} className="mr-2" />
                Edit my answers
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}