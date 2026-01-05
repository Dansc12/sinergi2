import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingProgress } from './OnboardingProgress';
import { motion } from 'framer-motion';
import { ChevronLeft, Turtle, Gauge, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const paces: Array<{
  id: 'gentle' | 'standard' | 'aggressive';
  label: string;
  icon: typeof Turtle;
  description: string;
  detail: string;
  recommended?: boolean;
}> = [
  { 
    id: 'gentle', 
    label: 'Gentle', 
    icon: Turtle,
    description: 'Slower but more sustainable',
    detail: '~0.5 lb/week'
  },
  { 
    id: 'standard', 
    label: 'Standard', 
    icon: Gauge,
    description: 'Balanced approach',
    detail: '~1 lb/week',
    recommended: true
  },
  { 
    id: 'aggressive', 
    label: 'Aggressive', 
    icon: Rocket,
    description: 'Faster results, more discipline',
    detail: '~1.5 lb/week'
  },
];

export function PaceScreen() {
  const { data, updateData, goBack, setCurrentStep } = useOnboarding();

  const handleContinue = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ pace: data.pace || 'standard' })
        .eq('user_id', user.id);
    }
    setCurrentStep('calculate_targets');
  };

  const handleSkip = () => {
    updateData({ pace: 'standard' });
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
        <button 
          onClick={goBack}
          className="flex items-center gap-1 text-muted-foreground mb-6 hover:text-foreground transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>

        <h1 className="text-2xl font-bold mb-2">What pace works for you?</h1>
        <p className="text-muted-foreground mb-8">
          This affects your calorie deficit or surplus
        </p>

        <div className="space-y-3">
          {paces.map((pace, index) => {
            const Icon = pace.icon;
            const isSelected = data.pace === pace.id;
            
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
                    <p className="text-sm text-muted-foreground">{pace.description}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{pace.detail}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
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
          Skip (use standard)
        </Button>
      </div>
    </motion.div>
  );
}
