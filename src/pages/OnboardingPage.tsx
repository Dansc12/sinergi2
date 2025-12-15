import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';
import { WelcomeScreen } from '@/components/onboarding/WelcomeScreen';
import { GoalSelectionScreen } from '@/components/onboarding/GoalSelectionScreen';
import { ActivityLevelScreen } from '@/components/onboarding/ActivityLevelScreen';
import { ExerciseFrequencyScreen } from '@/components/onboarding/ExerciseFrequencyScreen';
import { PersonalDetailsScreen } from '@/components/onboarding/PersonalDetailsScreen';
import { BodyStatsScreen } from '@/components/onboarding/BodyStatsScreen';
import { WeightLossRateScreen } from '@/components/onboarding/WeightLossRateScreen';
import { HobbiesScreen } from '@/components/onboarding/HobbiesScreen';
import { AccountCreationScreen } from '@/components/onboarding/AccountCreationScreen';
import { GroupJoinScreen } from '@/components/onboarding/GroupJoinScreen';
import { FriendSuggestionsScreen } from '@/components/onboarding/FriendSuggestionsScreen';
import { ProfilePhotoScreen } from '@/components/onboarding/ProfilePhotoScreen';
import { CompletionScreen } from '@/components/onboarding/CompletionScreen';
import { AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

function OnboardingFlow() {
  const navigate = useNavigate();
  const { currentStep, data, setCurrentStep } = useOnboarding();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session?.user);
      
      if (session?.user) {
        // Check if onboarding is already complete
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (profile?.onboarding_completed) {
          navigate("/", { replace: true });
          return;
        }
      }
      
      setIsCheckingAuth(false);
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Authenticated users skip account creation step
  // Flow for authenticated (weight_loss): 1-Welcome, 2-Goal, 3-Activity, 4-Exercise, 5-Personal, 6-Body, 7-WeightLoss, 8-Hobbies, 9-GroupJoin, 10-FriendSuggestions, 11-Photo, 12-Completion
  // Flow for authenticated (other): 1-Welcome, 2-Goal, 3-Activity, 4-Exercise, 5-Personal, 6-Body, 7-Hobbies, 8-GroupJoin, 9-FriendSuggestions, 10-Photo, 11-Completion
  // Flow for unauthenticated (weight_loss): 1-Welcome, 2-Goal, 3-Activity, 4-Exercise, 5-Personal, 6-Body, 7-WeightLoss, 8-Hobbies, 9-Account, 10-GroupJoin, 11-FriendSuggestions, 12-Photo, 13-Completion
  // Flow for unauthenticated (other): 1-Welcome, 2-Goal, 3-Activity, 4-Exercise, 5-Personal, 6-Body, 7-Hobbies, 8-Account, 9-GroupJoin, 10-FriendSuggestions, 11-Photo, 12-Completion
  
  const renderStep = () => {
    if (isAuthenticated) {
      // Skip account creation for already authenticated users
      if (data.primaryGoal === 'weight_loss') {
        switch (currentStep) {
          case 1: return <WelcomeScreen />;
          case 2: return <GoalSelectionScreen />;
          case 3: return <ActivityLevelScreen />;
          case 4: return <ExerciseFrequencyScreen />;
          case 5: return <PersonalDetailsScreen />;
          case 6: return <BodyStatsScreen />;
          case 7: return <WeightLossRateScreen />;
          case 8: return <HobbiesScreen />;
          case 9: return <GroupJoinScreen isAuthenticated />;
          case 10: return <FriendSuggestionsScreen isAuthenticated />;
          case 11: return <ProfilePhotoScreen isAuthenticated />;
          case 12: return <CompletionScreen />;
          default: return <WelcomeScreen />;
        }
      } else {
        switch (currentStep) {
          case 1: return <WelcomeScreen />;
          case 2: return <GoalSelectionScreen />;
          case 3: return <ActivityLevelScreen />;
          case 4: return <ExerciseFrequencyScreen />;
          case 5: return <PersonalDetailsScreen />;
          case 6: return <BodyStatsScreen />;
          case 7: return <HobbiesScreen />;
          case 8: return <GroupJoinScreen isAuthenticated />;
          case 9: return <FriendSuggestionsScreen isAuthenticated />;
          case 10: return <ProfilePhotoScreen isAuthenticated />;
          case 11: return <CompletionScreen />;
          default: return <WelcomeScreen />;
        }
      }
    } else {
      // Full flow with account creation for new users
      if (data.primaryGoal === 'weight_loss') {
        switch (currentStep) {
          case 1: return <WelcomeScreen />;
          case 2: return <GoalSelectionScreen />;
          case 3: return <ActivityLevelScreen />;
          case 4: return <ExerciseFrequencyScreen />;
          case 5: return <PersonalDetailsScreen />;
          case 6: return <BodyStatsScreen />;
          case 7: return <WeightLossRateScreen />;
          case 8: return <HobbiesScreen />;
          case 9: return <AccountCreationScreen />;
          case 10: return <GroupJoinScreen />;
          case 11: return <FriendSuggestionsScreen />;
          case 12: return <ProfilePhotoScreen />;
          case 13: return <CompletionScreen />;
          default: return <WelcomeScreen />;
        }
      } else {
        switch (currentStep) {
          case 1: return <WelcomeScreen />;
          case 2: return <GoalSelectionScreen />;
          case 3: return <ActivityLevelScreen />;
          case 4: return <ExerciseFrequencyScreen />;
          case 5: return <PersonalDetailsScreen />;
          case 6: return <BodyStatsScreen />;
          case 7: return <HobbiesScreen />;
          case 8: return <AccountCreationScreen />;
          case 9: return <GroupJoinScreen />;
          case 10: return <FriendSuggestionsScreen />;
          case 11: return <ProfilePhotoScreen />;
          case 12: return <CompletionScreen />;
          default: return <WelcomeScreen />;
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {renderStep()}
      </AnimatePresence>
    </div>
  );
}

export default function OnboardingPage() {
  const [isAuth, setIsAuth] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuth(!!session?.user);
      setIsChecking(false);
    };
    checkAuth();
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <OnboardingProvider isAuthenticated={isAuth}>
      <OnboardingFlow />
    </OnboardingProvider>
  );
}
