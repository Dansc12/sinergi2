import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/hooks/useAuth';
import { ensureProfile } from '@/lib/ensureProfile';
import { WhatBringsYouHereScreen } from '@/components/onboarding/WhatBringsYouHereScreen';
import { NameUsernameScreen } from '@/components/onboarding/NameUsernameScreen';
import { ProfilePhotoBioScreen } from '@/components/onboarding/ProfilePhotoBioScreen';
import { UnitsAgeScreen } from '@/components/onboarding/UnitsAgeScreen';
import { HobbiesScreen } from '@/components/onboarding/HobbiesScreen';
import { JoinGroupsScreen } from '@/components/onboarding/JoinGroupsScreen';
import { FollowPeopleScreen } from '@/components/onboarding/FollowPeopleScreen';
import { ChooseSetupPathScreen } from '@/components/onboarding/ChooseSetupPathScreen';
import { PrimaryGoalScreen } from '@/components/onboarding/PrimaryGoalScreen';
import { SexHeightScreen } from '@/components/onboarding/SexHeightScreen';
import { CurrentWeightScreen } from '@/components/onboarding/CurrentWeightScreen';
import { DailyActivityScreen } from '@/components/onboarding/DailyActivityScreen';
import { ExerciseFrequencyScreen } from '@/components/onboarding/ExerciseFrequencyScreen';
import { GoalWeightScreen } from '@/components/onboarding/GoalWeightScreen';
import { PaceScreen } from '@/components/onboarding/PaceScreen';
import { CalculateTargetsScreen } from '@/components/onboarding/CalculateTargetsScreen';
import { EditAnswersScreen } from '@/components/onboarding/EditAnswersScreen';
import { AnimatePresence } from 'framer-motion';

function OnboardingFlow() {
  const navigate = useNavigate();
  const { currentStep } = useOnboarding();
  const { user, isLoading } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      if (isLoading) return;

      if (!user) {
        navigate('/auth', { replace: true });
        return;
      }

      const profile = await ensureProfile(user);
      if (cancelled) return;

      if (profile.onboarding_completed) {
        navigate('/', { replace: true });
        return;
      }

      setIsCheckingAuth(false);
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [navigate, user, isLoading]);

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
      case 'hobbies':
        return <HobbiesScreen />;
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
      case 'daily_activity':
        return <DailyActivityScreen />;
      case 'exercise_frequency':
        return <ExerciseFrequencyScreen />;
      case 'goal_weight':
        return <GoalWeightScreen />;
      case 'pace':
        return <PaceScreen />;
      case 'calculate_targets':
        return <CalculateTargetsScreen />;
      case 'edit_answers':
        return <EditAnswersScreen />;
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
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [navigate, user, isLoading]);

  if (isLoading || !user) {
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
