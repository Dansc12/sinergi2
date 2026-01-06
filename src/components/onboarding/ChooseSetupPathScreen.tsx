import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingProgress } from './OnboardingProgress';
import { motion } from 'framer-motion';
import { ChevronLeft, Target, Zap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';

export function ChooseSetupPathScreen() {
  const { data, updateData, goBack, setCurrentStep, completeOnboarding } = useOnboarding();
  const [isCompleting, setIsCompleting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi>();
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

  const onSelect = useCallback(() => {
    if (!api) return;
    setCurrentIndex(api.selectedScrollSnap());
  }, [api]);

  // Set up carousel event listener
  useState(() => {
    if (!api) return;
    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  });

  const handleConfirm = () => {
    const path = currentIndex === 0 ? 'targets' : 'just_log';
    handleSelectPath(path);
  };

  const options = [
    {
      id: 'targets',
      icon: Target,
      iconBg: 'bg-primary/20',
      iconColor: 'text-primary',
      title: 'Set up targets',
      description: 'Answer a few quick questions and we\'ll calculate personalized calorie and macro targets based on your goals.',
      badge: '⭐ Recommended',
    },
    {
      id: 'just_log',
      icon: Zap,
      iconBg: 'bg-muted',
      iconColor: 'text-muted-foreground',
      title: 'Just start logging',
      description: 'Skip the setup and start tracking your food and workouts right away. You can set up targets later in settings.',
      badge: null,
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col min-h-screen"
    >
      <OnboardingProgress />
      
      <div className="flex-1 flex flex-col px-6 py-8">
        <button 
          onClick={goBack}
          className="flex items-center gap-1 text-muted-foreground mb-6 hover:text-foreground transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>

        <h1 className="text-2xl font-bold mb-2">How do you want to start?</h1>
        <p className="text-muted-foreground mb-6">
          You can always change this later in settings
        </p>

        <div className="flex-1 flex flex-col">
          <Carousel
            setApi={setApi}
            opts={{
              align: 'center',
              loop: false,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2">
              {options.map((option, index) => {
                const Icon = option.icon;
                return (
                  <CarouselItem key={option.id} className="pl-2 basis-[85%]">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className={cn(
                        "p-6 rounded-2xl border-2 transition-all h-full min-h-[280px]",
                        currentIndex === index
                          ? "border-primary bg-card"
                          : "border-border bg-card/50 opacity-60"
                      )}
                    >
                      <div className="flex flex-col items-center text-center gap-4 h-full">
                        <div className={cn(
                          "w-16 h-16 rounded-2xl flex items-center justify-center",
                          option.iconBg
                        )}>
                          <Icon className={cn("w-8 h-8", option.iconColor)} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2">{option.title}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {option.description}
                          </p>
                          {option.badge && (
                            <div className="mt-4 inline-flex items-center gap-1 text-sm text-primary font-medium">
                              <span>{option.badge}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>

          {/* Dot indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {options.map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  currentIndex === index
                    ? "bg-primary w-6"
                    : "bg-muted-foreground/30"
                )}
              />
            ))}
          </div>
        </div>

        {/* Bottom button */}
        <div className="pt-6">
          <Button
            onClick={handleConfirm}
            disabled={isCompleting}
            className="w-full"
            size="lg"
          >
            {isCompleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Setting up...
              </>
            ) : (
              currentIndex === 0 ? 'Set up my targets' : 'Start logging'
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}