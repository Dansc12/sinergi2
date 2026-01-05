import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingProgress } from './OnboardingProgress';
import { motion } from 'framer-motion';
import { Check, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const options = [
  { id: 'meal_ideas', label: 'Get meal ideas', emoji: '🍽️' },
  { id: 'workout_inspiration', label: 'Get workout inspiration', emoji: '💪' },
  { id: 'stay_consistent', label: 'Stay consistent', emoji: '📅' },
  { id: 'track_progress', label: 'Track progress', emoji: '📊' },
  { id: 'share_motivate', label: 'Share & motivate others', emoji: '🎉' },
  { id: 'find_community', label: 'Meet people / find community', emoji: '👥' },
];

export function WhatBringsYouHereScreen() {
  const { data, updateData, setCurrentStep } = useOnboarding();
  const navigate = useNavigate();

  const toggleOption = (id: string) => {
    const current = data.bringYouHere;
    if (current.includes(id)) {
      updateData({ bringYouHere: current.filter(o => o !== id) });
    } else if (current.length < 2) {
      updateData({ bringYouHere: [...current, id] });
    }
  };

  const handleContinue = () => {
    if (data.bringYouHere.length > 0) {
      setCurrentStep('name_username');
    }
  };

  const handleBack = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
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
          onClick={handleBack}
          className="flex items-center gap-1 text-muted-foreground mb-6 hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <h1 className="text-2xl font-bold mb-2">What brings you here?</h1>
        <p className="text-muted-foreground mb-8">
          Pick up to 2 reasons
          <span className="text-primary font-medium"> ({data.bringYouHere.length}/2)</span>
        </p>

        <div className="space-y-3">
          {options.map((option, index) => {
            const isSelected = data.bringYouHere.includes(option.id);
            const isDisabled = !isSelected && data.bringYouHere.length >= 2;
            
            return (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => !isDisabled && toggleOption(option.id)}
                disabled={isDisabled}
                className={cn(
                  "w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-3",
                  isSelected 
                    ? "border-primary bg-primary/10" 
                    : isDisabled
                    ? "border-border bg-muted/50 opacity-50 cursor-not-allowed"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <span className="text-2xl">{option.emoji}</span>
                <span className="flex-1 font-medium">{option.label}</span>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check size={14} className="text-primary-foreground" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="px-6 pb-8">
        <Button 
          size="xl" 
          className="w-full"
          disabled={data.bringYouHere.length === 0}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
}
