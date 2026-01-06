import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Target, User, Ruler, Scale, TrendingUp } from 'lucide-react';

const goalLabels: Record<string, string> = {
  fat_loss: 'Fat loss',
  build_muscle: 'Build muscle',
  get_stronger: 'Get stronger',
  improve_health: 'Improve health',
  maintain: 'Maintain weight',
};

const paceLabels: Record<string, string> = {
  gentle: 'Gentle',
  standard: 'Standard',
  aggressive: 'Aggressive',
};

const sexLabels: Record<string, string> = {
  male: 'Male',
  female: 'Female',
  prefer_not: 'Prefer not to say',
};

export function EditAnswersScreen() {
  const { data, setCurrentStep, setIsEditingFromTargets } = useOnboarding();

  const formatHeight = () => {
    if (!data.heightValue) return 'Not set';
    if (data.unitsSystem === 'imperial') {
      const feet = Math.floor(data.heightValue / 12);
      const inches = data.heightValue % 12;
      return `${feet}'${inches}"`;
    }
    return `${data.heightValue} cm`;
  };

  const formatWeight = (weight: number) => {
    if (!weight) return 'Not set';
    return data.unitsSystem === 'imperial' ? `${weight} lbs` : `${weight} kg`;
  };

  const answers = [
    {
      label: 'Goal',
      value: data.goalType ? goalLabels[data.goalType] : 'Not set',
      icon: Target,
      step: 'primary_goal' as const,
    },
    {
      label: 'Sex at birth',
      value: data.sexAtBirth ? sexLabels[data.sexAtBirth] : 'Not set',
      icon: User,
      step: 'sex_height' as const,
    },
    {
      label: 'Height',
      value: formatHeight(),
      icon: Ruler,
      step: 'sex_height' as const,
    },
    {
      label: 'Current weight',
      value: formatWeight(data.currentWeight),
      icon: Scale,
      step: 'current_weight' as const,
    },
    {
      label: 'Goal weight',
      value: data.hasGoalWeight ? formatWeight(data.goalWeight) : 'No goal weight',
      icon: Scale,
      step: 'goal_weight' as const,
    },
    {
      label: 'Pace',
      value: data.pace ? paceLabels[data.pace] : 'Standard',
      icon: TrendingUp,
      step: 'pace' as const,
    },
  ];

  const handleEdit = (step: typeof answers[number]['step']) => {
    setIsEditingFromTargets(true);
    setCurrentStep(step);
  };

  const handleDone = () => {
    setCurrentStep('calculate_targets');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col min-h-screen"
    >
      <div className="flex-1 px-6 py-8">
        <button 
          onClick={handleDone}
          className="flex items-center gap-1 text-muted-foreground mb-6 hover:text-foreground transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>

        <h1 className="text-2xl font-bold mb-2">Edit Your Answers</h1>
        <p className="text-muted-foreground mb-8">Tap any field to update it</p>

        <div className="space-y-3">
          {answers.map((answer, index) => (
            <motion.button
              key={answer.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleEdit(answer.step)}
              className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <answer.icon size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{answer.label}</p>
                  <p className="font-medium">{answer.value}</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-muted-foreground" />
            </motion.button>
          ))}
        </div>
      </div>

      <div className="px-6 pb-8">
        <Button 
          size="xl" 
          className="w-full"
          onClick={handleDone}
        >
          Done
        </Button>
      </div>
    </motion.div>
  );
}
