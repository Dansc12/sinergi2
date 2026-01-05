import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { format, isToday, subDays } from "date-fns";

interface UserProfile {
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean | null;
}

interface TaskCompletion {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  workout: boolean;
  water: boolean;
}

export const useUserData = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [streakCount, setStreakCount] = useState(0);
  const [todaysTasks, setTodaysTasks] = useState<TaskCompletion>({
    breakfast: false,
    lunch: false,
    dinner: false,
    workout: false,
    water: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setStreakCount(0);
      setTodaysTasks({
        breakfast: false,
        lunch: false,
        dinner: false,
        workout: false,
        water: false,
      });
      setIsLoading(false);
      return;
    }

    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name, last_name, display_name, avatar_url, onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();

      setProfile(profileData);

      // Fetch today's tasks completion
      const today = format(new Date(), "yyyy-MM-dd");
      
      // Check meal logs for today
      const { data: mealLogs } = await supabase
        .from("meal_logs")
        .select("meal_type")
        .eq("user_id", user.id)
        .eq("log_date", today);

      const mealTypes = new Set(mealLogs?.map(log => log.meal_type) || []);
      
      // Check workout logs for today
      const { data: workoutLogs } = await supabase
        .from("workout_logs")
        .select("id")
        .eq("user_id", user.id)
        .eq("log_date", today);

      // Check water logs for today
      const { data: waterLog } = await supabase
        .from("water_logs")
        .select("glasses, target_glasses")
        .eq("user_id", user.id)
        .eq("log_date", today)
        .maybeSingle();

      const waterGoalReached = waterLog ? waterLog.glasses >= waterLog.target_glasses : false;

      setTodaysTasks({
        breakfast: mealTypes.has("breakfast"),
        lunch: mealTypes.has("lunch"),
        dinner: mealTypes.has("dinner"),
        workout: (workoutLogs?.length || 0) > 0,
        water: waterGoalReached,
      });

      // Calculate streak
      const streak = await calculateStreak(user.id);
      setStreakCount(streak);

    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStreak = async (userId: string): Promise<number> => {
    let streak = 0;
    let currentDate = new Date();

    // Check if today has any logs - if so, include today in streak
    const todayHasLogs = await checkDayHasLogs(userId, currentDate);
    
    if (!todayHasLogs) {
      // Check yesterday first
      currentDate = subDays(currentDate, 1);
    }

    // Count consecutive days with logs
    while (true) {
      const hasLogs = await checkDayHasLogs(userId, currentDate);
      if (hasLogs) {
        streak++;
        currentDate = subDays(currentDate, 1);
      } else {
        break;
      }
      // Safety limit to prevent infinite loops
      if (streak > 365) break;
    }

    return streak;
  };

  const checkDayHasLogs = async (userId: string, date: Date): Promise<boolean> => {
    const dateStr = format(date, "yyyy-MM-dd");

    // Check for meal logs
    const { data: mealLogs } = await supabase
      .from("meal_logs")
      .select("id")
      .eq("user_id", userId)
      .eq("log_date", dateStr)
      .limit(1);

    if (mealLogs && mealLogs.length > 0) return true;

    // Check for workout logs
    const { data: workoutLogs } = await supabase
      .from("workout_logs")
      .select("id")
      .eq("user_id", userId)
      .eq("log_date", dateStr)
      .limit(1);

    if (workoutLogs && workoutLogs.length > 0) return true;

    return false;
  };

  const refreshData = () => {
    fetchUserData();
  };

  return {
    profile,
    streakCount,
    todaysTasks,
    isLoading,
    refreshData,
  };
};
