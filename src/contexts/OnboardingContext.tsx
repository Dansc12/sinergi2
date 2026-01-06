import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OnboardingData {
  // Step 1: What brings you here
  bringYouHere: string[];
  
  // Step 2: Name + Username
  displayName: string;
  username: string;
  
  // Step 3: Profile Photo + Bio
  avatarUrl: string;
  bio: string;
  
  // Step 4: Units + Age
  unitsSystem: 'imperial' | 'metric';
  birthMonth: number;
  birthYear: number;
  
  // Step 5: Interests (optional)
  interests: string[];
  
  // Step 6: Joined Groups (deferred until completion)
  joinedGroupIds: string[];
  
  // Step 7: Followed Users (deferred until completion)
  followedUserIds: string[];
  
  // Step 8: Setup path choice
  setupPath: 'targets' | 'just_log' | '';
  
  // Targets flow (Steps 9-13)
  goalType: 'fat_loss' | 'build_muscle' | 'get_stronger' | 'improve_health' | 'maintain' | '';
  sexAtBirth: 'male' | 'female' | '';
  heightValue: number;
  currentWeight: number;
  hasGoalWeight: boolean;
  goalWeight: number;
  pace: 'gentle' | 'standard' | 'aggressive' | '';
  
  // Calculated targets
  calorieTarget: number;
  macroTargets: { protein: number; carbs: number; fat: number } | null;
  
  // First win (deprecated)
  firstWinType: 'meal' | 'workout' | 'post' | '';
}

export type OnboardingStep = 
  | 'what_brings_you_here'
  | 'name_username'
  | 'profile_photo_bio'
  | 'units_age'
  | 'hobbies'
  | 'join_groups'
  | 'follow_people'
  | 'choose_setup_path'
  | 'primary_goal'
  | 'sex_height'
  | 'current_weight'
  | 'goal_weight'
  | 'pace'
  | 'calculate_targets'
  | 'edit_answers';

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  currentStep: OnboardingStep;
  setCurrentStep: (step: OnboardingStep) => void;
  stepNumber: number;
  totalSteps: number;
  goBack: () => void;
  goNext: () => void;
  completeOnboarding: () => Promise<void>;
  isEditingFromTargets: boolean;
  setIsEditingFromTargets: (value: boolean) => void;
}

const defaultData: OnboardingData = {
  bringYouHere: [],
  displayName: '',
  username: '',
  avatarUrl: '',
  bio: '',
  unitsSystem: 'imperial',
  birthMonth: 0,
  birthYear: 0,
  interests: [],
  joinedGroupIds: [],
  followedUserIds: [],
  setupPath: '',
  goalType: '',
  sexAtBirth: '',
  heightValue: 0,
  currentWeight: 0,
  hasGoalWeight: false,
  goalWeight: 0,
  pace: '',
  calorieTarget: 0,
  macroTargets: null,
  firstWinType: '',
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Step flow definition
const CORE_STEPS: OnboardingStep[] = [
  'what_brings_you_here',
  'name_username',
  'profile_photo_bio',
  'units_age',
  'hobbies',
  'join_groups',
  'follow_people',
  'choose_setup_path',
];

const TARGETS_STEPS: OnboardingStep[] = [
  'primary_goal',
  'sex_height',
  'current_weight',
  'goal_weight',
  'pace',
  'calculate_targets',
];

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(defaultData);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('what_brings_you_here');
  const [isEditingFromTargets, setIsEditingFromTargets] = useState(false);

  // Load saved progress on mount
  useEffect(() => {
    const loadSavedProgress = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        // Restore data from profile
        const restoredData: Partial<OnboardingData> = {};
        
        if (profile.bring_you_here) restoredData.bringYouHere = profile.bring_you_here;
        if (profile.display_name) restoredData.displayName = profile.display_name;
        if (profile.username) restoredData.username = profile.username;
        if (profile.avatar_url) restoredData.avatarUrl = profile.avatar_url;
        if (profile.bio) restoredData.bio = profile.bio;
        if (profile.units_system) restoredData.unitsSystem = profile.units_system as 'imperial' | 'metric';
        if (profile.birth_month) restoredData.birthMonth = profile.birth_month;
        if (profile.birth_year) restoredData.birthYear = profile.birth_year;
        if (profile.hobbies) restoredData.interests = profile.hobbies;
        if (profile.primary_goal) restoredData.goalType = profile.primary_goal as OnboardingData['goalType'];
        if (profile.biological_sex) restoredData.sexAtBirth = profile.biological_sex as OnboardingData['sexAtBirth'];
        if (profile.height_value) restoredData.heightValue = Number(profile.height_value);
        if (profile.current_weight) restoredData.currentWeight = Number(profile.current_weight);
        if (profile.goal_weight) {
          restoredData.goalWeight = Number(profile.goal_weight);
          restoredData.hasGoalWeight = true;
        }
        if (profile.pace) restoredData.pace = profile.pace as OnboardingData['pace'];
        if (profile.daily_calorie_target) restoredData.calorieTarget = profile.daily_calorie_target;
        if (profile.macro_targets) restoredData.macroTargets = profile.macro_targets as OnboardingData['macroTargets'];
        if (profile.tdee_targets_enabled !== null) {
          restoredData.setupPath = profile.tdee_targets_enabled ? 'targets' : 'just_log';
        }

        if (Object.keys(restoredData).length > 0) {
          setData(prev => ({ ...prev, ...restoredData }));
        }

        // Determine which step to resume from
        if (!profile.bring_you_here || profile.bring_you_here.length === 0) {
          setCurrentStep('what_brings_you_here');
        } else if (!profile.display_name || !profile.username) {
          setCurrentStep('name_username');
        } else if (!profile.birth_month || !profile.birth_year) {
          setCurrentStep('units_age');
        } else if (profile.tdee_targets_enabled === null && profile.goals_setup_completed === false) {
          setCurrentStep('choose_setup_path');
        } else if (profile.tdee_targets_enabled && !profile.goals_setup_completed) {
          // In targets flow but not completed
          if (!profile.primary_goal) setCurrentStep('primary_goal');
          else if (!profile.biological_sex || !profile.height_value) setCurrentStep('sex_height');
          else if (!profile.current_weight) setCurrentStep('current_weight');
          else setCurrentStep('calculate_targets');
        } else {
          setCurrentStep('choose_setup_path');
        }
      }
    };

    loadSavedProgress();
  }, []);

  const getStepFlow = (): OnboardingStep[] => {
    const flow = [...CORE_STEPS];
    if (data.setupPath === 'targets') {
      flow.push(...TARGETS_STEPS);
    }
    return flow;
  };

  const stepNumber = getStepFlow().indexOf(currentStep) + 1;
  const totalSteps = getStepFlow().length;

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const goBack = () => {
    const flow = getStepFlow();
    const currentIndex = flow.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(flow[currentIndex - 1]);
    }
  };

  const goNext = () => {
    const flow = getStepFlow();
    const currentIndex = flow.indexOf(currentStep);
    if (currentIndex < flow.length - 1) {
      setCurrentStep(flow[currentIndex + 1]);
    }
  };

  // Complete onboarding: join groups, send friend requests, mark complete
  const completeOnboarding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Join selected groups
      if (data.joinedGroupIds.length > 0) {
        const groupInserts = data.joinedGroupIds.map(groupId => ({
          group_id: groupId,
          user_id: user.id,
        }));
        await supabase.from('group_members').insert(groupInserts);
      }

      // Send friend requests to selected users
      if (data.followedUserIds.length > 0) {
        // Get sender profile for notification
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', user.id)
          .single();

        const friendshipInserts = data.followedUserIds.map(addresseeId => ({
          requester_id: user.id,
          addressee_id: addresseeId,
        }));
        await supabase.from('friendships').insert(friendshipInserts);

        // Send notifications
        const notificationInserts = data.followedUserIds.map(addresseeId => ({
          user_id: addresseeId,
          type: 'friend_request',
          title: 'New friend request',
          message: `${senderProfile?.display_name || 'Someone'} sent you a friend request`,
          related_user_id: user.id,
          related_content_type: 'friend_request',
        }));
        await supabase.from('notifications').insert(notificationInserts);
      }

      // Mark onboarding as complete
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('user_id', user.id);

      toast.success('Welcome to Sinergi!');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Something went wrong');
      throw error;
    }
  };

  return (
    <OnboardingContext.Provider value={{ 
      data, 
      updateData, 
      currentStep, 
      setCurrentStep,
      stepNumber,
      totalSteps,
      goBack,
      goNext,
      completeOnboarding,
      isEditingFromTargets,
      setIsEditingFromTargets,
    }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}