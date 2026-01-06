import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingProgress } from './OnboardingProgress';
import { motion } from 'framer-motion';
import { ChevronLeft, Turtle, Gauge, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface PaceOption {
  id: 'gentle' | 'standard' | 'aggressive';
  label: string;
  icon: typeof Turtle;
  loseDescription: string;
  gainDescription: string;
  loseDetail: string;
  gainDetail: string;
  recommended?: boolean;
}

const paceOptions: PaceOption[] = [
  { 
    id: 'gentle', 
    label: 'Gentle', 
    icon: Turtle,
    loseDescription: 'Slower but more sustainable',
    gainDescription: 'Gradual and sustainable',
    loseDetail: '~0.5 lb/week (~0.2 kg)',
    gainDetail: '+0.25 lb/week (~0.1 kg)'
  },
  { 
    id: 'standard', 
    label: 'Standard', 
    icon: Gauge,
    loseDescription: 'Balanced approach',
    gainDescription: 'Balanced approach',
    loseDetail: '~0.8 lb/week (~0.35 kg)',
    gainDetail: '+0.4 lb/week (~0.2 kg)',
    recommended: true
  },
  { 
    id: 'aggressive', 
    label: 'Aggressive', 
    icon: Rocket,
    loseDescription: 'Faster results, more discipline',
    gainDescription: 'Faster gains, higher surplus',
    loseDetail: '~1.1 lb/week (~0.5 kg)',
    gainDetail: '+0.55 lb/week (~0.25 kg)'
  },
];

export function PaceScreen() {
  const { data, updateData, goBack, setCurrentStep, isEditingFromTargets, setIsEditingFromTargets } = useOnboarding();

  // Determine if user is gaining weight (goal > current)
  const isGaining = data.goalWeight > data.currentWeight;

  const handleContinue = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ pace: data.pace || 'standard' })
        .eq('user_id', user.id);
    }
    
    if (isEditingFromTargets) {
      setIsEditingFromTargets(false);
    }
    setCurrentStep('calculate_targets');
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

        <h1 className="text-2xl font-bold mb-2">What pace works for you?</h1>
        <p className="text-muted-foreground mb-8">
          {isGaining 
            ? 'This affects your calorie surplus for gaining weight'
            : 'This affects your calorie deficit for losing weight'
          }
        </p>

        <div className="space-y-3">
          {paceOptions.map((pace, index) => {
            const Icon = pace.icon;
            const isSelected = data.pace === pace.id;
            const description = isGaining ? pace.gainDescription : pace.loseDescription;
            const detail = isGaining ? pace.gainDetail : pace.loseDetail;
            
            return (
              <motion.button
                key={pace.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => updateData({ pace: pace.id })}
                className={cn(
                  "w-full p-4 rounded-2xl border-2 text-left transition-all",
                  isSelected 
                    ? "border-primary bg-primary/10" 
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    isSelected ? "bg-primary/20" : "bg-muted"
                  )}>
                    <Icon size={24} className={isSelected ? "text-primary" : "text-muted-foreground"} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{pace.label}</p>
                      {pace.recommended && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{detail}</span>
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
          onClick={handleContinue}
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
}
