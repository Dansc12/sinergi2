import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingProgress } from './OnboardingProgress';
import { motion } from 'framer-motion';
import { ChevronLeft, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export function NameUsernameScreen() {
  const { data, updateData, goBack, setCurrentStep } = useOnboarding();
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Debounced username check
  useEffect(() => {
    if (!data.username || data.username.length < 3) {
      setIsUsernameAvailable(null);
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: existing } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', data.username.toLowerCase())
          .neq('user_id', user?.id || '')
          .maybeSingle();

        if (existing) {
          setIsUsernameAvailable(false);
          // Generate suggestions
          const baseName = data.username.toLowerCase();
          const randomSuggestions = [
            `${baseName}${Math.floor(Math.random() * 999)}`,
            `${baseName}_${Math.floor(Math.random() * 99)}`,
            `the_${baseName}`,
          ];
          setSuggestions(randomSuggestions);
        } else {
          setIsUsernameAvailable(true);
          setSuggestions([]);
        }
      } catch (error) {
        console.error('Error checking username:', error);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [data.username]);

  const handleContinue = async () => {
    if (isValid) {
      // Save progress
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({
            display_name: data.displayName,
            username: data.username.toLowerCase(),
          })
          .eq('user_id', user.id);
      }
      setCurrentStep('profile_photo_bio');
    }
  };

  const selectSuggestion = (suggestion: string) => {
    updateData({ username: suggestion });
  };

  const isValid = data.displayName.trim().length > 0 && 
                  data.username.length >= 3 && 
                  isUsernameAvailable === true;

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

        <h1 className="text-2xl font-bold mb-2">Let's get to know you</h1>
        <p className="text-muted-foreground mb-8">What should we call you?</p>

        <div className="space-y-6">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Your name"
              value={data.displayName}
              onChange={(e) => updateData({ displayName: e.target.value })}
              className="h-12"
              maxLength={50}
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
              <Input
                id="username"
                type="text"
                placeholder="username"
                value={data.username}
                onChange={(e) => updateData({ username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                className={cn(
                  "h-12 pl-8 pr-10",
                  isUsernameAvailable === true && "border-green-500",
                  isUsernameAvailable === false && "border-destructive"
                )}
                maxLength={30}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isCheckingUsername && <Loader2 size={18} className="animate-spin text-muted-foreground" />}
                {!isCheckingUsername && isUsernameAvailable === true && (
                  <Check size={18} className="text-green-500" />
                )}
                {!isCheckingUsername && isUsernameAvailable === false && (
                  <X size={18} className="text-destructive" />
                )}
              </div>
            </div>
            
            {isUsernameAvailable === false && (
              <div className="space-y-2">
                <p className="text-sm text-destructive">Username is taken. Try one of these:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => selectSuggestion(suggestion)}
                      className="px-3 py-1.5 text-sm rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      @{suggestion}
                    </button>
                  ))}
                </div>
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
