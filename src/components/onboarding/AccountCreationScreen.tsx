import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingProgress } from './OnboardingProgress';
import { motion } from 'framer-motion';
import { ChevronLeft, Eye, EyeOff, Check, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const accountSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(20).regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export function AccountCreationScreen() {
  const { data, updateData, setCurrentStep } = useOnboarding();
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Debounced username check
  useEffect(() => {
    if (!data.username || data.username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        const { data: existingUser, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', data.username.toLowerCase())
          .maybeSingle();

        if (error) throw error;
        setUsernameAvailable(!existingUser);
      } catch (error) {
        console.error('Error checking username:', error);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [data.username]);

  const validateForm = () => {
    try {
      accountSchema.parse({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        username: data.username,
        password: data.password,
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleContinue = async () => {
    if (!validateForm()) return;
    if (!usernameAvailable) {
      toast.error('Please choose a different username');
      return;
    }

    setIsCreating(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // Update the profile with all onboarding data
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            first_name: data.firstName,
            last_name: data.lastName,
            username: data.username.toLowerCase(),
            biological_sex: data.biologicalSex,
            birthdate: data.birthdate?.toISOString().split('T')[0],
            zip_code: data.zipCode || null,
            height_feet: data.heightFeet,
            height_inches: data.heightInches,
            current_weight: data.currentWeight,
            goal_weight: data.goalWeight,
            primary_goal: data.primaryGoal,
            activity_level: data.activityLevel,
            exercise_frequency: data.exerciseFrequency,
            weight_loss_rate: data.primaryGoal === 'weight_loss' ? data.weightLossRate : null,
            hobbies: data.hobbies,
          })
          .eq('user_id', authData.user.id);

        if (updateError) throw updateError;
        
        // Navigate to GroupJoin step (step 10 for weight_loss, step 9 for others)
        const nextStep = data.primaryGoal === 'weight_loss' ? 10 : 9;
        setCurrentStep(nextStep);
      }
    } catch (error: any) {
      console.error('Error creating account:', error);
      if (error.message?.includes('already registered')) {
        toast.error('This email is already registered. Please sign in instead.');
      } else {
        toast.error(error.message || 'Failed to create account');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const isValid = data.firstName && data.lastName && data.email && data.username && data.password && usernameAvailable;

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
          onClick={() => setCurrentStep(data.primaryGoal === 'weight_loss' ? 8 : 7)}
          className="flex items-center gap-1 text-muted-foreground mb-6 hover:text-foreground transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>

        <h1 className="text-2xl font-bold mb-2">Create your account</h1>
        <p className="text-muted-foreground mb-8">Almost there! Let's set up your login.</p>

        <div className="space-y-5">
          {/* Name fields */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Label className="text-sm font-medium mb-2 block">First Name</Label>
              <Input
                value={data.firstName}
                onChange={(e) => updateData({ firstName: e.target.value })}
                placeholder="First name"
                className="h-12 rounded-xl"
              />
              {errors.firstName && <p className="text-destructive text-sm mt-1">{errors.firstName}</p>}
            </div>
            <div className="flex-1">
              <Label className="text-sm font-medium mb-2 block">Last Name</Label>
              <Input
                value={data.lastName}
                onChange={(e) => updateData({ lastName: e.target.value })}
                placeholder="Last name"
                className="h-12 rounded-xl"
              />
              {errors.lastName && <p className="text-destructive text-sm mt-1">{errors.lastName}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Email</Label>
            <Input
              type="email"
              value={data.email}
              onChange={(e) => updateData({ email: e.target.value })}
              placeholder="you@example.com"
              className="h-12 rounded-xl"
            />
            {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Username */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Username</Label>
            <div className="relative">
              <Input
                value={data.username}
                onChange={(e) => updateData({ username: e.target.value })}
                placeholder="Choose a username"
                className="h-12 rounded-xl pr-10"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isCheckingUsername && <Loader2 size={18} className="animate-spin text-muted-foreground" />}
                {!isCheckingUsername && usernameAvailable === true && <Check size={18} className="text-green-500" />}
                {!isCheckingUsername && usernameAvailable === false && <X size={18} className="text-destructive" />}
              </div>
            </div>
            {usernameAvailable === false && (
              <p className="text-destructive text-sm mt-1">Username taken</p>
            )}
            {errors.username && <p className="text-destructive text-sm mt-1">{errors.username}</p>}
          </div>

          {/* Password */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={data.password}
                onChange={(e) => updateData({ password: e.target.value })}
                placeholder="Create a password"
                className="h-12 rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-destructive text-sm mt-1">{errors.password}</p>}
          </div>
        </div>
      </div>

      <div className="px-6 pb-8">
        <Button 
          size="xl" 
          className="w-full"
          disabled={!isValid || isCreating}
          onClick={handleContinue}
        >
          {isCreating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Creating Account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>
      </div>
    </motion.div>
  );
}
