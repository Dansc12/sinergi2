import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingProgress } from './OnboardingProgress';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

export function SexHeightScreen() {
  const { data, updateData, goBack, setCurrentStep } = useOnboarding();

  const handleContinue = async () => {
    if (isValid) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ 
            biological_sex: data.sexAtBirth,
            height_value: data.heightValue,
          })
          .eq('user_id', user.id);
      }
      setCurrentStep('current_weight');
    }
  };

  const isValid = data.sexAtBirth !== '' && data.heightValue > 0;

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

        <h1 className="text-2xl font-bold mb-2">A bit more about you</h1>
        <p className="text-muted-foreground mb-8">
          This helps us calculate accurate calorie needs
        </p>

        <div className="space-y-8">
          {/* Sex at birth */}
          <div className="space-y-3">
            <Label>Sex at birth</Label>
            <p className="text-sm text-muted-foreground -mt-1">Used for metabolic calculations</p>
            <div className="grid grid-cols-2 gap-3">
              {(['male', 'female'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => updateData({ sexAtBirth: option })}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-center",
                    data.sexAtBirth === option
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <p className="font-medium text-sm">
                    {option === 'male' ? 'Male' : 'Female'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Height */}
          <div className="space-y-3">
            <Label>Height</Label>
            {data.unitsSystem === 'imperial' ? (
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="5"
                      value={Math.floor(data.heightValue / 12) || ''}
                      onChange={(e) => {
                        const feet = parseInt(e.target.value) || 0;
                        const inches = data.heightValue % 12;
                        updateData({ heightValue: (feet * 12) + inches });
                      }}
                      className="h-12 pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">ft</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="10"
                      value={data.heightValue % 12 || ''}
                      onChange={(e) => {
                        const feet = Math.floor(data.heightValue / 12);
                        const inches = parseInt(e.target.value) || 0;
                        updateData({ heightValue: (feet * 12) + Math.min(inches, 11) });
                      }}
                      className="h-12 pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">in</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <Input
                  type="number"
                  placeholder="175"
                  value={data.heightValue || ''}
                  onChange={(e) => updateData({ heightValue: parseInt(e.target.value) || 0 })}
                  className="h-12 pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">cm</span>
              </div>
            )}
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
