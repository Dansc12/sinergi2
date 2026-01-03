import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, format } from "date-fns";

interface WeightLog {
  id: string;
  weight: number;
  log_date: string;
  notes: string | null;
  created_at: string;
}

export const useWeightLogs = () => {
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [goalWeight, setGoalWeight] = useState<number | null>(null);
  const [accountCreatedAt, setAccountCreatedAt] = useState<Date | null>(null);
  const [daysSinceLastWeighIn, setDaysSinceLastWeighIn] = useState<number>(0);
  const [needsWeighIn, setNeedsWeighIn] = useState(false);
  const [onboardingWeight, setOnboardingWeight] = useState<number | null>(null);
  const [onboardingDate, setOnboardingDate] = useState<string | null>(null);

  const createWeighInReminder = async (userId: string) => {
    try {
      // Check if we already sent a reminder today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingReminder } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", userId)
        .eq("type", "weighin_reminder")
        .gte("created_at", today)
        .maybeSingle();

      if (existingReminder) return; // Already sent today

      // Create the reminder notification
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "weighin_reminder",
        title: "Time to weigh in!",
        message: "It's been 7 days since your last weigh-in. Track your progress by logging your weight.",
        related_content_type: "weight"
      });
    } catch (error) {
      console.error("Error creating weigh-in reminder:", error);
    }
  };

  const fetchWeightLogs = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch weight logs
      const { data: logs, error } = await supabase
        .from("weight_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("log_date", { ascending: true });

      if (error) throw error;

      // Fetch profile for goal weight, account creation date, and initial weight
      const { data: profile } = await supabase
        .from("profiles")
        .select("goal_weight, created_at, current_weight")
        .eq("user_id", user.id)
        .single();

      let initialWeight: number | null = null;
      let profileCreatedAt: string | null = null;

      if (profile) {
        setGoalWeight(profile.goal_weight ? Number(profile.goal_weight) : null);
        setAccountCreatedAt(profile.created_at ? new Date(profile.created_at) : null);
        initialWeight = profile.current_weight ? Number(profile.current_weight) : null;
        profileCreatedAt = profile.created_at;
      }

      const typedLogs: WeightLog[] = (logs || []).map(log => ({
        id: log.id,
        weight: Number(log.weight),
        log_date: log.log_date,
        notes: log.notes,
        created_at: log.created_at
      }));

      setWeightLogs(typedLogs);
      setOnboardingWeight(initialWeight);
      setOnboardingDate(profileCreatedAt);

      // Calculate days since last weigh-in
      let shouldRemind = false;
      if (typedLogs.length > 0) {
        const lastLog = typedLogs[typedLogs.length - 1];
        const daysSince = differenceInDays(new Date(), new Date(lastLog.log_date));
        setDaysSinceLastWeighIn(daysSince);
        shouldRemind = daysSince >= 7;
        setNeedsWeighIn(shouldRemind);
      } else if (profileCreatedAt) {
        const daysSinceAccount = differenceInDays(new Date(), new Date(profileCreatedAt));
        setDaysSinceLastWeighIn(daysSinceAccount);
        shouldRemind = daysSinceAccount >= 7;
        setNeedsWeighIn(shouldRemind);
      }

      // Create weigh-in reminder notification if needed
      if (shouldRemind && user) {
        await createWeighInReminder(user.id);
      }
    } catch (error) {
      console.error("Error fetching weight logs:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logWeight = async (weight: number, notes?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const today = new Date().toISOString().split('T')[0];

      // Check if already logged today
      const { data: existing } = await supabase
        .from("weight_logs")
        .select("id")
        .eq("user_id", user.id)
        .eq("log_date", today)
        .single();

      if (existing) {
        // Update existing log
        const { error } = await supabase
          .from("weight_logs")
          .update({ weight, notes })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        // Insert new log
        const { error } = await supabase
          .from("weight_logs")
          .insert({ user_id: user.id, weight, notes, log_date: today });
        if (error) throw error;
      }

      // Update current_weight in profile
      await supabase
        .from("profiles")
        .update({ current_weight: weight })
        .eq("user_id", user.id);

      await fetchWeightLogs();
      return true;
    } catch (error) {
      console.error("Error logging weight:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchWeightLogs();
  }, [fetchWeightLogs]);

  // Calculate chart data - include onboarding weight as first data point if available
  const chartData = (() => {
    const logsData = weightLogs.map(log => ({
      date: log.log_date,
      value: log.weight
    }));

    // Add onboarding weight as starting point if we have it and it's not already in logs
    if (onboardingWeight && onboardingDate) {
      // Convert to local date to avoid timezone issues
      const onboardingDateStr = format(new Date(onboardingDate), 'yyyy-MM-dd');
      const hasOnboardingDateInLogs = weightLogs.some(log => log.log_date === onboardingDateStr);
      
      if (!hasOnboardingDateInLogs) {
        return [
          { date: onboardingDateStr, value: onboardingWeight },
          ...logsData
        ];
      }
    }
    
    return logsData;
  })();

  // Get latest weight
  const latestWeight = weightLogs.length > 0 
    ? weightLogs[weightLogs.length - 1].weight 
    : onboardingWeight;

  // Calculate weight change (from first logged to last logged)
  const weightChange = weightLogs.length >= 2
    ? weightLogs[weightLogs.length - 1].weight - weightLogs[0].weight
    : 0;

  // Total weight entries from actual logs
  const totalWeightEntries = weightLogs.length;

  // Calculate days until next weigh-in (whole days)
  const daysUntilNextWeighIn = Math.max(0, 7 - daysSinceLastWeighIn);

  return {
    weightLogs,
    chartData,
    latestWeight,
    weightChange,
    goalWeight,
    accountCreatedAt,
    daysSinceLastWeighIn,
    daysUntilNextWeighIn,
    needsWeighIn,
    isLoading,
    logWeight,
    refetch: fetchWeightLogs,
    totalWeightEntries
  };
};
