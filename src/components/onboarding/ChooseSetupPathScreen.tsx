import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingProgress } from './OnboardingProgress';
import { motion } from 'framer-motion';
import { ChevronLeft, Target, Zap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function ChooseSetupPathScreen() {
  const { data, updateData, goBack, setCurrentStep, completeOnboarding } = useOnboarding();
  const [isCompleting, setIsCompleting] = useState(false);
  const navigate = useNavigate();

  const handleSelectPath = async (path: 'targets' | 'just_log') => {
    updateData({ setupPath: path });

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ tdee_targets_enabled: path === 'targets' })
        .eq('user_id', user.id);
    }

    if (path === 'targets') {
      setCurrentStep('primary_goal');
    } else {
      // Complete onboarding directly
      setIsCompleting(true);
      try {
        await supabase
          .from('profiles')
          .update({ goals_setup_completed: true })
          .eq('user_id', user!.id);
        await completeOnboarding();
        navigate('/');
      } catch (error) {
        setIsCompleting(false);
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
        <button 
          onClick={goBack}
          className="flex items-center gap-1 text-muted-foreground mb-6 hover:text-foreground transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>

        <h1 className="text-2xl font-bold mb-2">How do you want to start?</h1>
        <p className="text-muted-foreground mb-8">
          You can always change this later in settings
        </p>

        <div className="grid grid-cols-2 gap-3">
          {/* Set up targets */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => handleSelectPath('targets')}
            disabled={isCompleting}
            className={cn(
              "p-4 rounded-2xl border-2 text-left transition-all h-full",
              "border-border bg-card hover:border-primary/50",
              isCompleting && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1">Set up targets</h3>
                <p className="text-xs text-muted-foreground">
                  30 seconds to personalized goals
                </p>
                <div className="mt-2 inline-flex items-center gap-1 text-xs text-primary font-medium">
                  <span>⭐ Recommended</span>
                </div>
              </div>
            </div>
          </motion.button>

          {/* Just start logging */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => handleSelectPath('just_log')}
            disabled={isCompleting}
            className={cn(
              "p-4 rounded-2xl border-2 text-left transition-all h-full",
              "border-border bg-card hover:border-primary/50",
              isCompleting && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                {isCompleting ? (
                  <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                ) : (
                  <Zap className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1">Just start logging</h3>
                <p className="text-xs text-muted-foreground">
                  Set targets later in settings
                </p>
              </div>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}