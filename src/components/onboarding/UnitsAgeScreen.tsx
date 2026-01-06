import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingProgress } from './OnboardingProgress';
import { motion } from 'framer-motion';
import { ChevronLeft, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const MINIMUM_AGE = 13;

export function UnitsAgeScreen() {
  const { data, updateData, goBack, setCurrentStep } = useOnboarding();
  const [showAgeError, setShowAgeError] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const calculateAge = (): number | null => {
    if (!data.birthMonth || !data.birthYear) return null;
    
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    
    let age = currentYear - data.birthYear;
    if (currentMonth < data.birthMonth) {
      age--;
    }
    return age;
  };

  const handleContinue = async () => {
    const age = calculateAge();
    if (age !== null && age < MINIMUM_AGE) {
      setShowAgeError(true);
      return;
    }

    // Save progress
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({
          units_system: data.unitsSystem,
          birth_month: data.birthMonth,
          birth_year: data.birthYear,
        })
        .eq('user_id', user.id);
    }
    setCurrentStep('hobbies');
  };

  const isValid = data.birthMonth > 0 && data.birthYear > 0;

  if (showAgeError) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col min-h-screen items-center justify-center px-6 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-3">Age Requirement</h1>
        <p className="text-muted-foreground mb-8 max-w-sm">
          We're sorry, but you must be at least {MINIMUM_AGE} years old to use Sinergi. 
          Please come back when you're old enough!
        </p>
        <Button 
          variant="secondary"
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = '/auth';
          }}
        >
          Go Back
        </Button>
      </motion.div>
    );
  }

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

        <h1 className="text-2xl font-bold mb-2">Units & Birth Date</h1>
        <p className="text-muted-foreground mb-8">We'll use this to personalize your experience</p>

        <div className="space-y-8">
          {/* Units System */}
          <div className="space-y-3">
            <Label>Preferred Units</Label>
            <div className="grid grid-cols-2 gap-3">
              {(['imperial', 'metric'] as const).map((unit) => (
                <button
                  key={unit}
                  onClick={() => updateData({ unitsSystem: unit })}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-center",
                    data.unitsSystem === unit
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <p className="font-semibold capitalize">{unit}</p>
                  <p className="text-sm text-muted-foreground">
                    {unit === 'imperial' ? 'lbs, ft/in' : 'kg, cm'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Birth Month & Year */}
          <div className="space-y-3">
            <Label>Birth Date</Label>
            <div className="grid grid-cols-2 gap-3">
              <Select
                value={data.birthMonth ? String(data.birthMonth) : ''}
                onValueChange={(value) => updateData({ birthMonth: parseInt(value) })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={String(month.value)}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={data.birthYear ? String(data.birthYear) : ''}
                onValueChange={(value) => updateData({ birthYear: parseInt(value) })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
