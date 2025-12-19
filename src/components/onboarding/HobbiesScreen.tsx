import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingProgress } from './OnboardingProgress';
import { motion } from 'framer-motion';
import { ChevronLeft, Check, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const hobbies = [
  'Running', 'Weightlifting', 'Yoga', 'HIIT', 'Swimming', 
  'Cycling', 'Hiking', 'Walking', 'Pilates', 'Crossfit',
  'Dance', 'Martial Arts', 'Basketball', 'Soccer', 'Tennis',
  'Rock Climbing', 'Cooking', 'Meditation', 'Travel', 'Photography'
];

export function HobbiesScreen() {
  const { data, updateData, setCurrentStep } = useOnboarding();
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customHobby, setCustomHobby] = useState('');

  const toggleHobby = (hobby: string) => {
    const current = data.hobbies;
    const updated = current.includes(hobby)
      ? current.filter(h => h !== hobby)
      : [...current, hobby];
    updateData({ hobbies: updated });
  };

  const addCustomHobby = () => {
    const trimmed = customHobby.trim();
    if (trimmed && !data.hobbies.includes(trimmed)) {
      updateData({ hobbies: [...data.hobbies, trimmed] });
      setCustomHobby('');
      setShowCustomInput(false);
    }
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

  // Check if a hobby is a custom one (not in the default list)
  const isCustomHobby = (hobby: string) => !hobbies.includes(hobby);

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

          {/* Custom hobbies that user added */}
          {data.hobbies.filter(isCustomHobby).map((hobby) => (
            <motion.button
              key={hobby}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => toggleHobby(hobby)}
              className="px-4 py-2.5 rounded-full border-2 font-medium transition-all flex items-center gap-1.5 border-primary bg-primary/10 text-foreground"
            >
              <Check size={16} className="text-primary" />
              {hobby}
            </motion.button>
          ))}

          {/* Other button / Custom input */}
          {showCustomInput ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2"
            >
              <Input
                type="text"
                placeholder="Type your interest..."
                value={customHobby}
                onChange={(e) => setCustomHobby(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomHobby()}
                className="w-40 h-10 rounded-full px-4"
                maxLength={30}
                autoFocus
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 rounded-full"
                onClick={addCustomHobby}
                disabled={!customHobby.trim()}
              >
                <Check size={18} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 rounded-full"
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomHobby('');
                }}
              >
                <X size={18} />
              </Button>
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: hobbies.length * 0.02 }}
              onClick={() => setShowCustomInput(true)}
              className="px-4 py-2.5 rounded-full border-2 border-dashed border-border bg-card hover:border-primary/50 text-muted-foreground font-medium transition-all flex items-center gap-1.5"
            >
              <Plus size={16} />
              Other
            </motion.button>
          )}
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
