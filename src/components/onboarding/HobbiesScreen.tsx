import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingProgress } from './OnboardingProgress';
import { motion } from 'framer-motion';
import { ChevronLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const hobbies = [
  'Running', 'Weightlifting', 'Yoga', 'HIIT', 'Swimming', 
  'Cycling', 'Hiking', 'Walking', 'Pilates', 'Crossfit',
  'Dance', 'Martial Arts', 'Basketball', 'Soccer', 'Tennis',
  'Rock Climbing', 'Cooking', 'Meditation', 'Travel', 'Photography'
];

export function HobbiesScreen() {
  const { data, updateData, setCurrentStep } = useOnboarding();

  const toggleHobby = (hobby: string) => {
    const current = data.hobbies;
    const updated = current.includes(hobby)
      ? current.filter(h => h !== hobby)
      : [...current, hobby];
    updateData({ hobbies: updated });
  };

  const handleContinue = () => {
    if (data.hobbies.length >= 3) {
      // After hobbies, go to Account Creation (unauth) or GroupJoin (auth)
      // For weight_loss unauth: step 8 -> 9 (Account)
      // For other unauth: step 7 -> 8 (Account)
      // For weight_loss auth: step 8 -> 9 (GroupJoin)
      // For other auth: step 7 -> 8 (GroupJoin)
      const nextStep = data.primaryGoal === 'weight_loss' ? 9 : 8;
      setCurrentStep(nextStep);
    }
  };

  const getPreviousStep = () => {
    // For weight_loss: previous is WeightLossRateScreen (step 7)
    // For non-weight_loss: previous is BodyStatsScreen (step 6)
    return data.primaryGoal === 'weight_loss' ? 7 : 6;
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
          onClick={() => setCurrentStep(getPreviousStep())}
          className="flex items-center gap-1 text-muted-foreground mb-6 hover:text-foreground transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>

        <h1 className="text-2xl font-bold mb-2">What are your interests?</h1>
        <p className="text-muted-foreground mb-8">
          Select at least 3 hobbies. 
          <span className="text-primary font-medium"> {data.hobbies.length}/3 selected</span>
        </p>

        <div className="flex flex-wrap gap-2">
          {hobbies.map((hobby, index) => {
            const isSelected = data.hobbies.includes(hobby);
            
            return (
              <motion.button
                key={hobby}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => toggleHobby(hobby)}
                className={cn(
                  "px-4 py-2.5 rounded-full border-2 font-medium transition-all flex items-center gap-1.5",
                  isSelected 
                    ? "border-primary bg-primary/10 text-foreground" 
                    : "border-border bg-card hover:border-primary/50 text-muted-foreground"
                )}
              >
                {isSelected && <Check size={16} className="text-primary" />}
                {hobby}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="px-6 pb-8">
        <Button 
          size="xl" 
          className="w-full"
          disabled={data.hobbies.length < 3}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
}
