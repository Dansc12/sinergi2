import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingProgress } from './OnboardingProgress';
import { motion } from 'framer-motion';
import { ChevronLeft, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

export function ChooseSetupPathScreen() {
  const { data, updateData, goBack, setCurrentStep } = useOnboarding();

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
      setCurrentStep('first_win');
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

        <div className="space-y-4">
          {/* Set up targets */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => handleSelectPath('targets')}
            className={cn(
              "w-full p-6 rounded-2xl border-2 text-left transition-all",
              data.setupPath === 'targets'
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/50"
            )}
          >
            <div className="flex gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Target className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">Set up calorie & macro targets</h3>
                <p className="text-sm text-muted-foreground">
                  Takes about 30 seconds. We'll calculate personalized daily targets for you.
                </p>
                <div className="mt-3 inline-flex items-center gap-1 text-xs text-primary font-medium">
                  <span>⭐ Recommended for best results</span>
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
            className={cn(
              "w-full p-6 rounded-2xl border-2 text-left transition-all",
              data.setupPath === 'just_log'
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/50"
            )}
          >
            <div className="flex gap-4">
              <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <Zap className="w-7 h-7 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">Just start logging</h3>
                <p className="text-sm text-muted-foreground">
                  Skip the setup and jump right in. You can set targets anytime from your profile.
                </p>
              </div>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
