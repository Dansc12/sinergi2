import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface WorkoutExercise {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
  notes: string;
  isCardio: boolean;
  supersetGroupId?: string;
  sets: {
    id: string;
    weight: string;
    reps: string;
    distance: string;
    time: string;
    completed: boolean;
    repRangeHint?: string;
    setType?: string;
  }[];
}

interface RoutineExercise {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
  notes: string;
  sets: { id: string; minReps: string; maxReps: string }[];
}

export interface RecentWorkout {
  id: string;
  title: string;
  type: "workout" | "routine";
  exercises: WorkoutExercise[];
  exerciseCount: number;
  totalSets: number;
  logDate: string;
  createdAt: string;
  isSavedWorkout: boolean; // True if this was from a saved template (has a saved title)
  tags?: string[];
}

export interface RecentRoutine {
  id: string;
  title: string;
  type: "routine";
  exercises: RoutineExercise[];
  exerciseCount: number;
  dayOfWeek: string;
  createdAt: string;
}

export type RecentItem = RecentWorkout | RecentRoutine;

export const useRecentWorkouts = (limit: number = 10) => {
  const { user } = useAuth();
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecentItems = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch recent workout logs
      const { data: workouts, error: workoutError } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("log_date", { ascending: false })
        .limit(limit);

      if (workoutError) throw workoutError;

      // Fetch user's scheduled routines
      const { data: routines, error: routineError } = await supabase
        .from("scheduled_routines")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (routineError) throw routineError;

      // Map workouts
      const workoutItems: RecentWorkout[] = (workouts || []).map((w) => {
        const rawData = w.exercises as unknown;
        let exercises: WorkoutExercise[] = [];
        let savedTitle = "";
        let savedTags: string[] = [];

        if (Array.isArray(rawData)) {
          exercises = rawData as WorkoutExercise[];
        } else if (rawData && typeof rawData === "object" && "exercises" in rawData) {
          const wrappedData = rawData as { title?: string; exercises: WorkoutExercise[]; tags?: string[] };
          exercises = wrappedData.exercises || [];
          savedTitle = wrappedData.title || "";
          savedTags = wrappedData.tags || [];
        }

        // Determine if this is a "saved" workout (has a user-defined title saved in the data)
        const isSavedWorkout = Boolean(savedTitle);

        let title = savedTitle;
        if (!title) {
          const createdDate = new Date(w.created_at);
          const hour = createdDate.getHours();
          if (hour < 12) {
            title = "Morning Workout";
          } else if (hour < 17) {
            title = "Afternoon Workout";
          } else {
            title = "Evening Workout";
          }
        }

        const totalSets = exercises.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0);

        return {
          id: w.id,
          title,
          type: "workout" as const,
          exercises,
          exerciseCount: exercises.length,
          totalSets,
          logDate: w.log_date,
          createdAt: w.created_at,
          isSavedWorkout,
          tags: savedTags,
        };
      });

      // Map routines - deduplicate by name
      const uniqueRoutines = new Map<string, RecentRoutine>();
      (routines || []).forEach((r) => {
        if (!uniqueRoutines.has(r.routine_name)) {
          const routineData = r.routine_data as { exercises?: RoutineExercise[] };
          const exercises = routineData?.exercises || [];
          
          uniqueRoutines.set(r.routine_name, {
            id: r.id,
            title: r.routine_name,
            type: "routine" as const,
            exercises,
            exerciseCount: exercises.length,
            dayOfWeek: r.day_of_week,
            createdAt: r.created_at,
          });
        }
      });

      const routineItems = Array.from(uniqueRoutines.values());

      // Combine and sort by most recent
      const combined: RecentItem[] = [...workoutItems, ...routineItems];
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Limit results
      setRecentItems(combined.slice(0, limit));
    } catch (err) {
      console.error("Error fetching recent workouts:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user, limit]);

  useEffect(() => {
    fetchRecentItems();
  }, [fetchRecentItems]);

  return { recentItems, isLoading, refetch: fetchRecentItems };
};
