import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingProgress } from './OnboardingProgress';
import { motion } from 'framer-motion';
import { ChevronLeft, Minus, Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function BodyStatsScreen() {
  const { data, updateData, setCurrentStep } = useOnboarding();

  const handleContinue = () => {
    if (data.heightFeet && data.currentWeight && data.goalWeight) {
      // Skip weight loss rate screen if not weight loss goal
      const nextStep = data.primaryGoal === 'weight_loss' ? 7 : 8;
      setCurrentStep(nextStep);
    }
  };

  const adjustValue = (field: 'heightFeet' | 'heightInches' | 'currentWeight' | 'goalWeight', delta: number) => {
    const currentValue = data[field];
    let newValue = currentValue + delta;
    
    // Apply constraints
    if (field === 'heightFeet') {
      newValue = Math.max(3, Math.min(8, newValue));
    } else if (field === 'heightInches') {
      newValue = Math.max(0, Math.min(11, newValue));
    } else {
      newValue = Math.max(50, Math.min(500, newValue));
    }
    
    updateData({ [field]: newValue });
  };

  const isValid = data.heightFeet > 0 && data.currentWeight > 0 && data.goalWeight > 0;

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
          onClick={() => setCurrentStep(5)}
          className="flex items-center gap-1 text-muted-foreground mb-6 hover:text-foreground transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>

        <h1 className="text-2xl font-bold mb-2">Your body stats</h1>
        <p className="text-muted-foreground mb-6">We'll use this to calculate your personalized targets.</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>Your weight information is private and only visible to you.</span>
        </div>

        <div className="space-y-8">
          {/* Height */}
          <div>
            <Label className="text-base font-medium mb-4 block">Height</Label>
            <div className="flex gap-4">
              {/* Feet */}
              <div className="flex-1">
                <div className="flex items-center justify-between bg-card border border-border rounded-xl p-2">
                  <button
                    onClick={() => adjustValue('heightFeet', -1)}
                    className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                  >
                    <Minus size={20} />
                  </button>
                  <div className="text-center">
                    <span className="text-2xl font-bold">{data.heightFeet}</span>
                    <span className="text-muted-foreground ml-1">ft</span>
                  </div>
                  <button
                    onClick={() => adjustValue('heightFeet', 1)}
                    className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
              
              {/* Inches */}
              <div className="flex-1">
                <div className="flex items-center justify-between bg-card border border-border rounded-xl p-2">
                  <button
                    onClick={() => adjustValue('heightInches', -1)}
                    className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                  >
                    <Minus size={20} />
                  </button>
                  <div className="text-center">
                    <span className="text-2xl font-bold">{data.heightInches}</span>
                    <span className="text-muted-foreground ml-1">in</span>
                  </div>
                  <button
                    onClick={() => adjustValue('heightInches', 1)}
                    className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Current Weight */}
          <div>
            <Label className="text-base font-medium mb-4 block">Current Weight</Label>
            <div className="flex items-center justify-between bg-card border border-border rounded-xl p-2">
              <button
                onClick={() => adjustValue('currentWeight', -1)}
                className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <Minus size={20} />
              </button>
              <div className="text-center">
                <Input
                  type="number"
                  value={data.currentWeight}
                  onChange={(e) => updateData({ currentWeight: Number(e.target.value) })}
                  className="w-24 text-center text-2xl font-bold bg-transparent border-none"
                />
                <span className="text-muted-foreground">lbs</span>
              </div>
              <button
                onClick={() => adjustValue('currentWeight', 1)}
                className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Goal Weight */}
          <div>
            <Label className="text-base font-medium mb-4 block">Goal Weight</Label>
            <div className="flex items-center justify-between bg-card border border-border rounded-xl p-2">
              <button
                onClick={() => adjustValue('goalWeight', -1)}
                className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <Minus size={20} />
              </button>
              <div className="text-center">
                <Input
                  type="number"
                  value={data.goalWeight}
                  onChange={(e) => updateData({ goalWeight: Number(e.target.value) })}
                  className="w-24 text-center text-2xl font-bold bg-transparent border-none"
                />
                <span className="text-muted-foreground">lbs</span>
              </div>
              <button
                onClick={() => adjustValue('goalWeight', 1)}
                className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-8">
        <Button 
          size="xl" 
          className="w-full"
          disabled={!isValid}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
}
