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

interface RoutineExercise {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
  notes: string;
  sets: { id: string; minReps: string; maxReps: string }[];
}

interface RoutineData {
  exercises: RoutineExercise[];
  description?: string;
}

export interface SavedRoutine {
  id: string;
  routine_name: string;
  routine_data: RoutineData;
  day_of_week: string;
  created_at: string;
  updated_at: string;
  exerciseCount: number;
}

export interface PastWorkout {
  id: string;
  title: string;
  exercises: WorkoutExercise[];
  log_date: string;
  created_at: string;
  exerciseCount: number;
  totalSets: number;
}

export interface CommunityRoutine {
  id: string;
  title: string;
  description: string | null;
  exercises: RoutineExercise[];
  creator: {
    id: string;
    name: string;
    username: string | null;
    avatar_url: string | null;
  };
  created_at: string;
  exerciseCount: number;
}

export interface CommunityWorkout {
  id: string;
  title: string;
  description: string | null;
  exercises: WorkoutExercise[];
  creator: {
    id: string;
    name: string;
    username: string | null;
    avatar_url: string | null;
  };
  created_at: string;
  exerciseCount: number;
}

export const useSavedWorkouts = () => {
  const { user } = useAuth();
  const [savedRoutines, setSavedRoutines] = useState<SavedRoutine[]>([]);
  const [pastWorkouts, setPastWorkouts] = useState<PastWorkout[]>([]);
  const [communityRoutines, setCommunityRoutines] = useState<CommunityRoutine[]>([]);
  const [communityWorkouts, setCommunityWorkouts] = useState<CommunityWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSavedRoutines = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("scheduled_routines")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Deduplicate by routine_name (get unique routines)
      const uniqueRoutines = new Map<string, SavedRoutine>();
      (data || []).forEach((r) => {
        if (!uniqueRoutines.has(r.routine_name)) {
          const routineData = r.routine_data as unknown as RoutineData;
          uniqueRoutines.set(r.routine_name, {
            id: r.id,
            routine_name: r.routine_name,
            routine_data: routineData,
            day_of_week: r.day_of_week,
            created_at: r.created_at,
            updated_at: r.updated_at,
            exerciseCount: routineData?.exercises?.length || 0,
          });
        }
      });

      setSavedRoutines(Array.from(uniqueRoutines.values()));
    } catch (err) {
      console.error("Error fetching saved routines:", err);
    }
  }, [user]);

  const fetchPastWorkouts = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("log_date", { ascending: false })
        .limit(50);

      if (error) throw error;

      const workouts: PastWorkout[] = (data || []).map((w) => {
        const exercises = (w.exercises as unknown as WorkoutExercise[]) || [];
        const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
        
        // Extract title from first exercise or use date
        const title = exercises.length > 0 
          ? `${exercises[0].name}${exercises.length > 1 ? ` + ${exercises.length - 1} more` : ''}`
          : `Workout on ${new Date(w.log_date).toLocaleDateString()}`;

        return {
          id: w.id,
          title,
          exercises,
          log_date: w.log_date,
          created_at: w.created_at,
          exerciseCount: exercises.length,
          totalSets,
        };
      });

      setPastWorkouts(workouts);
    } catch (err) {
      console.error("Error fetching past workouts:", err);
    }
  }, [user]);

  const fetchCommunityContent = useCallback(async () => {
    try {
      // Fetch public workout posts
      const { data: workoutPosts, error: workoutError } = await supabase
        .from("posts")
        .select("id, description, content_data, created_at, user_id, visibility")
        .eq("content_type", "workout")
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(50);

      if (workoutError) throw workoutError;

      // Fetch public routine posts (if any - routines might be stored differently)
      const { data: routinePosts, error: routineError } = await supabase
        .from("posts")
        .select("id, description, content_data, created_at, user_id, visibility")
        .eq("content_type", "routine")
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(50);

      // Get unique user IDs
      const userIds = [
        ...new Set([
          ...(workoutPosts || []).map((p) => p.user_id),
          ...(routinePosts || []).map((p) => p.user_id),
        ]),
      ];

      // Fetch profiles for these users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, username, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [
          p.user_id,
          {
            id: p.user_id,
            name: [p.first_name, p.last_name].filter(Boolean).join(" ") || "Anonymous",
            username: p.username,
            avatar_url: p.avatar_url,
          },
        ])
      );

      // Map workout posts to community workouts
      const communityWkts: CommunityWorkout[] = (workoutPosts || [])
        .filter((p) => p.user_id !== user?.id)
        .map((p) => {
          const contentData = p.content_data as Record<string, unknown>;
          const exercises = (contentData?.exercises as WorkoutExercise[]) || [];
          return {
            id: p.id,
            title: (contentData?.title as string) || "Workout",
            description: p.description,
            exercises,
            creator: profileMap.get(p.user_id) || {
              id: p.user_id,
              name: "Anonymous",
              username: null,
              avatar_url: null,
            },
            created_at: p.created_at,
            exerciseCount: exercises.length,
          };
        });

      setCommunityWorkouts(communityWkts);

      // Map routine posts to community routines
      const communityRtns: CommunityRoutine[] = (routinePosts || [])
        .filter((p) => p.user_id !== user?.id)
        .map((p) => {
          const contentData = p.content_data as Record<string, unknown>;
          const exercises = (contentData?.exercises as RoutineExercise[]) || [];
          return {
            id: p.id,
            title: (contentData?.name as string) || "Routine",
            description: p.description,
            exercises,
            creator: profileMap.get(p.user_id) || {
              id: p.user_id,
              name: "Anonymous",
              username: null,
              avatar_url: null,
            },
            created_at: p.created_at,
            exerciseCount: exercises.length,
          };
        });

      setCommunityRoutines(communityRtns);
    } catch (err) {
      console.error("Error fetching community content:", err);
    }
  }, [user]);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchSavedRoutines(), fetchPastWorkouts(), fetchCommunityContent()]);
    setIsLoading(false);
  }, [fetchSavedRoutines, fetchPastWorkouts, fetchCommunityContent]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    savedRoutines,
    pastWorkouts,
    communityRoutines,
    communityWorkouts,
    isLoading,
    refetch: fetchAll,
  };
};
