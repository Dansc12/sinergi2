import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface DailyStrength {
  date: string;
  value: number;
}

interface WorkoutExercise {
  name: string;
  notes?: string;
  isCardio?: boolean;
  sets: Array<{
    weight?: number;
    reps?: number;
    distance?: number;
    time?: string;
  }>;
}

export const useStrengthData = () => {
  const [strengthData, setStrengthData] = useState<DailyStrength[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalLifted, setTotalLifted] = useState(0);

  const fetchStrengthData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: workouts, error } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("log_date", { ascending: true });

      if (error) throw error;

      // Group workouts by date and calculate total volume per day
      const dailyVolumes: Record<string, number> = {};
      let overallTotal = 0;

      (workouts || []).forEach(workout => {
        const date = workout.log_date;
        const exercises = workout.exercises as unknown as WorkoutExercise[];
        
        let dayVolume = 0;
        exercises.forEach(exercise => {
          if (!exercise.isCardio) {
            exercise.sets.forEach(set => {
              if (set.weight && set.reps) {
                dayVolume += set.weight * set.reps;
              }
            });
          }
        });

        if (dailyVolumes[date]) {
          dailyVolumes[date] += dayVolume;
        } else {
          dailyVolumes[date] = dayVolume;
        }
        overallTotal += dayVolume;
      });

      // Convert to array format for chart
      const chartData = Object.entries(dailyVolumes)
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .map(([date, volume]) => ({
          date,
          value: volume
        }));

      setStrengthData(chartData);
      setTotalLifted(overallTotal);
    } catch (error) {
      console.error("Error fetching strength data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStrengthData();
  }, [fetchStrengthData]);

  // Get latest value
  const latestValue = strengthData.length > 0 
    ? strengthData[strengthData.length - 1].value 
    : 0;

  // Calculate trend (compare last value to average of previous values)
  const trend = strengthData.length >= 2
    ? strengthData[strengthData.length - 1].value - strengthData[strengthData.length - 2].value
    : 0;

  return {
    strengthData,
    chartData: strengthData,
    latestValue,
    totalLifted,
    trend,
    isLoading,
    refetch: fetchStrengthData
  };
};
