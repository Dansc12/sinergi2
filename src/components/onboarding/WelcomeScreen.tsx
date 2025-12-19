import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export function WelcomeScreen() {
  const { setCurrentStep } = useOnboarding();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center mb-8 glow-primary"
      >
        <Sparkles className="w-12 h-12 text-primary-foreground" />
      </motion.div>
      
      <motion.h1 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-4xl font-bold mb-4"
      >
        Welcome to Sinergi
      </motion.h1>
      
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-lg text-muted-foreground mb-12 max-w-sm"
      >
        Track your fitness and nutrition with a supportive community.
      </motion.p>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-xs"
      >
        <Button 
          size="xl" 
          className="w-full"
          onClick={() => setCurrentStep(2)}
        >
          Get Started
        </Button>
      </motion.div>
    </motion.div>
  );
}
