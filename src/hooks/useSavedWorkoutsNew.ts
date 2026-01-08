import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Json } from "@/integrations/supabase/types";

interface WorkoutExercise {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
  notes: string;
  isCardio: boolean;
  sets: {
    id: string;
    weight: string;
    reps: string;
    distance: string;
    time: string;
    completed: boolean;
    repRangeHint?: string;
  }[];
}

interface Creator {
  id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
}

export interface SavedWorkout {
  id: string;
  title: string;
  exercises: WorkoutExercise[];
  tags: string[];
  description: string | null;
  created_at: string;
  workout_log_id: string | null;
  post_id: string | null;
  creator?: Creator;
}

export const useSavedWorkoutsNew = () => {
  const { user } = useAuth();
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSavedWorkouts = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("saved_workouts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user's profile for creator info
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, username, avatar_url")
        .eq("user_id", user.id)
        .single();

      const creator: Creator = profile ? {
        id: profile.user_id,
        name: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "You",
        username: profile.username,
        avatar_url: profile.avatar_url,
      } : {
        id: user.id,
        name: "You",
        username: null,
        avatar_url: null,
      };

      const workouts: SavedWorkout[] = (data || []).map((w) => ({
        id: w.id,
        title: w.title,
        exercises: (w.exercises as unknown as WorkoutExercise[]) || [],
        tags: w.tags || [],
        description: w.description,
        created_at: w.created_at,
        workout_log_id: w.workout_log_id,
        post_id: w.post_id,
        creator,
      }));

      setSavedWorkouts(workouts);
    } catch (err) {
      console.error("Error fetching saved workouts:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const saveWorkout = useCallback(async (workout: {
    title: string;
    exercises: WorkoutExercise[];
    tags?: string[];
    description?: string;
    workout_log_id?: string;
  }) => {
    if (!user?.id) return null;

    try {
      const insertData = {
        user_id: user.id,
        title: workout.title,
        exercises: JSON.parse(JSON.stringify(workout.exercises)) as Json,
        tags: workout.tags || [],
        description: workout.description || null,
        workout_log_id: workout.workout_log_id || null,
      };
      
      const { data, error } = await supabase
        .from("saved_workouts")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      await fetchSavedWorkouts();
      return data;
    } catch (err) {
      console.error("Error saving workout:", err);
      return null;
    }
  }, [user, fetchSavedWorkouts]);

  const unsaveWorkout = useCallback(async (workoutId: string) => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from("saved_workouts")
        .delete()
        .eq("id", workoutId)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchSavedWorkouts();
      return true;
    } catch (err) {
      console.error("Error unsaving workout:", err);
      return false;
    }
  }, [user, fetchSavedWorkouts]);

  const isWorkoutSaved = useCallback((title: string, exercises: WorkoutExercise[]) => {
    // Check if a workout with the same title and exercise count exists
    return savedWorkouts.some(w => 
      w.title === title && w.exercises.length === exercises.length
    );
  }, [savedWorkouts]);

  useEffect(() => {
    fetchSavedWorkouts();
  }, [fetchSavedWorkouts]);

  return {
    savedWorkouts,
    isLoading,
    saveWorkout,
    unsaveWorkout,
    isWorkoutSaved,
    refetch: fetchSavedWorkouts,
  };
};
