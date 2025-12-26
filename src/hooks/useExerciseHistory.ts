import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface HistoricalSet {
  weight?: string;
  reps?: string;
  distance?: string;
  time?: string;
}

interface HistoricalExercise {
  name: string;
  isCardio?: boolean;
  sets: HistoricalSet[];
}

export const useExerciseHistory = () => {
  /**
   * Fetches the last logged sets for a specific exercise from the user's workout history.
   * Returns an array of sets with weight/reps (or distance/time for cardio) pre-filled.
   */
  const getLastExerciseData = useCallback(async (exerciseName: string): Promise<HistoricalSet[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Fetch the most recent workout logs for this user
      const { data: workouts, error } = await supabase
        .from("workout_logs")
        .select("exercises")
        .eq("user_id", user.id)
        .order("log_date", { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!workouts || workouts.length === 0) return [];

      // Search through workouts to find the most recent occurrence of this exercise
      for (const workout of workouts) {
        const exercises = workout.exercises as unknown as HistoricalExercise[];
        if (!exercises) continue;

        const matchingExercise = exercises.find(
          (ex) => ex.name.toLowerCase() === exerciseName.toLowerCase()
        );

        if (matchingExercise && matchingExercise.sets.length > 0) {
          // Return the sets from this exercise
          return matchingExercise.sets.map((set) => ({
            weight: set.weight || "",
            reps: set.reps || "",
            distance: set.distance || "",
            time: set.time || "",
          }));
        }
      }

      return [];
    } catch (error) {
      console.error("Error fetching exercise history:", error);
      return [];
    }
  }, []);

  return { getLastExerciseData };
};
