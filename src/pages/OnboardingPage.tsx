import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';
import { WhatBringsYouHereScreen } from '@/components/onboarding/WhatBringsYouHereScreen';
import { NameUsernameScreen } from '@/components/onboarding/NameUsernameScreen';
import { ProfilePhotoBioScreen } from '@/components/onboarding/ProfilePhotoBioScreen';
import { UnitsAgeScreen } from '@/components/onboarding/UnitsAgeScreen';
import { JoinGroupsScreen } from '@/components/onboarding/JoinGroupsScreen';
import { FollowPeopleScreen } from '@/components/onboarding/FollowPeopleScreen';
import { ChooseSetupPathScreen } from '@/components/onboarding/ChooseSetupPathScreen';
import { PrimaryGoalScreen } from '@/components/onboarding/PrimaryGoalScreen';
import { SexHeightScreen } from '@/components/onboarding/SexHeightScreen';
import { CurrentWeightScreen } from '@/components/onboarding/CurrentWeightScreen';
import { GoalWeightScreen } from '@/components/onboarding/GoalWeightScreen';
import { PaceScreen } from '@/components/onboarding/PaceScreen';
import { CalculateTargetsScreen } from '@/components/onboarding/CalculateTargetsScreen';
import { FirstWinScreen } from '@/components/onboarding/FirstWinScreen';
import { AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

function OnboardingFlow() {
  const navigate = useNavigate();
  const { currentStep } = useOnboarding();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        // Not authenticated - redirect to auth
        navigate('/auth', { replace: true });
        return;
      }

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
      
      setIsCheckingAuth(false);
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        navigate('/auth', { replace: true });
      }
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

  const renderStep = () => {
    switch (currentStep) {
      case 'what_brings_you_here':
        return <WhatBringsYouHereScreen />;
      case 'name_username':
        return <NameUsernameScreen />;
      case 'profile_photo_bio':
        return <ProfilePhotoBioScreen />;
      case 'units_age':
        return <UnitsAgeScreen />;
      case 'join_groups':
        return <JoinGroupsScreen />;
      case 'follow_people':
        return <FollowPeopleScreen />;
      case 'choose_setup_path':
        return <ChooseSetupPathScreen />;
      case 'primary_goal':
        return <PrimaryGoalScreen />;
      case 'sex_height':
        return <SexHeightScreen />;
      case 'current_weight':
        return <CurrentWeightScreen />;
      case 'goal_weight':
        return <GoalWeightScreen />;
      case 'pace':
        return <PaceScreen />;
      case 'calculate_targets':
        return <CalculateTargetsScreen />;
      case 'first_win':
        return <FirstWinScreen />;
      default:
        return <WhatBringsYouHereScreen />;
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
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/auth', { replace: true });
        return;
      }
      setIsChecking(false);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        navigate('/auth', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <OnboardingProvider>
      <OnboardingFlow />
    </OnboardingProvider>
  );
}
