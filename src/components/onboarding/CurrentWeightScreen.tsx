import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingProgress } from './OnboardingProgress';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function CurrentWeightScreen() {
  const { data, updateData, goBack, setCurrentStep } = useOnboarding();

  const handleContinue = async () => {
    if (data.currentWeight > 0) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ current_weight: data.currentWeight })
          .eq('user_id', user.id);
      }
      setCurrentStep('goal_weight');
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
          onClick={goBack}
          className="flex items-center gap-1 text-muted-foreground mb-6 hover:text-foreground transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>

        <h1 className="text-2xl font-bold mb-2">What's your current weight?</h1>
        <p className="text-muted-foreground mb-8">
          Don't worry, this is private and only used for calculations
        </p>

        <div className="space-y-3">
          <Label>Current weight</Label>
          <div className="relative">
            <Input
              type="number"
              placeholder={data.unitsSystem === 'imperial' ? "150" : "68"}
              value={data.currentWeight || ''}
              onChange={(e) => updateData({ currentWeight: parseFloat(e.target.value) || 0 })}
              className="h-14 text-2xl font-semibold pr-14 text-center"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
              {data.unitsSystem === 'imperial' ? 'lbs' : 'kg'}
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 pb-8">
        <Button 
          size="xl" 
          className="w-full"
          disabled={data.currentWeight <= 0}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
}
