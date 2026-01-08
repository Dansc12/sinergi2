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
  description?: string;
  tags?: string[];
  creator?: {
    id: string;
    name: string;
    username: string | null;
    avatar_url: string | null;
  };
}

interface Creator {
  id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
}

export interface PastWorkout {
  id: string;
  title: string;
  exercises: WorkoutExercise[];
  log_date: string;
  created_at: string;
  exerciseCount: number;
  totalSets: number;
  description?: string;
  tags?: string[];
  creator?: Creator;
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
      // Fetch user's own scheduled routines
      const { data, error } = await supabase
        .from("scheduled_routines")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch routines saved from other users via saved_posts
      const { data: savedPostsData, error: savedError } = await supabase
        .from("saved_posts")
        .select("post_id, created_at")
        .eq("user_id", user.id)
        .eq("content_type", "routine");

      if (savedError) throw savedError;

      // Fetch the actual posts for saved routines
      const savedPostIds = (savedPostsData || []).map(sp => sp.post_id);
      let savedRoutinePosts: { id: string; content_data: unknown; created_at: string; user_id: string }[] = [];
      
      if (savedPostIds.length > 0) {
        const { data: savedPosts, error: fetchError } = await supabase
          .from("posts")
          .select("id, content_data, created_at, user_id")
          .in("id", savedPostIds);
        
        if (!fetchError && savedPosts) {
          savedRoutinePosts = savedPosts;
        }
      }

      // Fetch profiles for creators of saved routine posts
      const savedRoutineUserIds = [...new Set(savedRoutinePosts.map(p => p.user_id))];
      let routineCreatorMap = new Map<string, { id: string; name: string; username: string | null; avatar_url: string | null }>();
      
      if (savedRoutineUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, username, avatar_url")
          .in("user_id", savedRoutineUserIds);
        
        routineCreatorMap = new Map(
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
      }

      // Deduplicate by routine_name (get unique routines from scheduled_routines)
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

      // Add saved routine posts from other users
      savedRoutinePosts.forEach((post) => {
        const contentData = post.content_data as Record<string, unknown>;
        const routineName = (contentData?.name as string) || (contentData?.routineName as string) || "Saved Routine";
        const exercises = (contentData?.exercises as RoutineExercise[]) || [];
        const description = contentData?.description as string;
        const tags = (contentData?.tags as string[]) || [];
        
        // Use post.id as unique key to avoid conflicts with scheduled_routines
        if (!uniqueRoutines.has(`saved_${post.id}`)) {
          uniqueRoutines.set(`saved_${post.id}`, {
            id: post.id,
            routine_name: routineName,
            routine_data: { exercises, description },
            day_of_week: "",
            created_at: post.created_at,
            updated_at: post.created_at,
            exerciseCount: exercises.length,
            description,
            tags,
            creator: routineCreatorMap.get(post.user_id),
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
      // Fetch user's own workout logs
      const { data, error } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("log_date", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch workouts saved from other users via saved_posts
      const { data: savedPostsData, error: savedError } = await supabase
        .from("saved_posts")
        .select("post_id, created_at")
        .eq("user_id", user.id)
        .eq("content_type", "workout");

      if (savedError) throw savedError;

      // Fetch the actual posts for saved workouts
      const savedPostIds = (savedPostsData || []).map(sp => sp.post_id);
      let savedWorkoutPosts: { id: string; content_data: unknown; created_at: string; user_id: string }[] = [];
      
      if (savedPostIds.length > 0) {
        const { data: savedPosts, error: fetchError } = await supabase
          .from("posts")
          .select("id, content_data, created_at, user_id")
          .in("id", savedPostIds);
        
        if (!fetchError && savedPosts) {
          savedWorkoutPosts = savedPosts;
        }
      }

      // Fetch profiles for creators of saved workout posts
      const savedWorkoutUserIds = [...new Set(savedWorkoutPosts.map(p => p.user_id))];
      let workoutCreatorMap = new Map<string, { id: string; name: string; username: string | null; avatar_url: string | null }>();
      
      if (savedWorkoutUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, username, avatar_url")
          .in("user_id", savedWorkoutUserIds);
        
        workoutCreatorMap = new Map(
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
      }

      const workouts: PastWorkout[] = (data || []).map((w) => {
        const rawData = w.exercises as unknown;
        
        // Handle both old format (array of exercises) and new format (object with title and exercises)
        let exercises: WorkoutExercise[] = [];
        let savedTitle = "";
        
        if (Array.isArray(rawData)) {
          // Old format: exercises is directly an array
          exercises = rawData as WorkoutExercise[];
        } else if (rawData && typeof rawData === "object" && "exercises" in rawData) {
          // New format: exercises is wrapped with title
          const wrappedData = rawData as { title?: string; exercises: WorkoutExercise[] };
          exercises = wrappedData.exercises || [];
          savedTitle = wrappedData.title || "";
        }
        
        const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
        
        // Use saved title if available, otherwise generate time-of-day based name
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

      // Add saved workout posts from other users
      savedWorkoutPosts.forEach((post) => {
        const contentData = post.content_data as Record<string, unknown>;
        const exercises = (contentData?.exercises as WorkoutExercise[]) || [];
        const totalSets = exercises.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0);
        const description = contentData?.description as string;
        const tags = (contentData?.tags as string[]) || [];
        
        let title = (contentData?.title as string) || (contentData?.name as string);
        if (!title) {
          const createdDate = new Date(post.created_at);
          const hour = createdDate.getHours();
          if (hour < 12) {
            title = "Morning Workout";
          } else if (hour < 17) {
            title = "Afternoon Workout";
          } else {
            title = "Evening Workout";
          }
        }

        workouts.push({
          id: post.id,
          title,
          exercises,
          log_date: post.created_at.split('T')[0],
          created_at: post.created_at,
          exerciseCount: exercises.length,
          totalSets,
          description,
          tags,
          creator: workoutCreatorMap.get(post.user_id),
        });
      });

      // Sort by date descending
      workouts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setPastWorkouts(workouts);
    } catch (err) {
      console.error("Error fetching past workouts:", err);
    }
  }, [user]);

  const fetchCommunityContent = useCallback(async () => {
    try {
      // Fetch all visible workout posts (RLS handles visibility - public + friends posts user can see)
      const { data: workoutPosts, error: workoutError } = await supabase
        .from("posts")
        .select("id, description, content_data, created_at, user_id, visibility")
        .eq("content_type", "workout")
        .order("created_at", { ascending: false })
        .limit(100);

      if (workoutError) throw workoutError;

      // Fetch all visible routine posts (RLS handles visibility)
      const { data: routinePosts, error: routineError } = await supabase
        .from("posts")
        .select("id, description, content_data, created_at, user_id, visibility")
        .eq("content_type", "routine")
        .order("created_at", { ascending: false })
        .limit(100);

      if (routineError) throw routineError;

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
        .in("user_id", userIds.length > 0 ? userIds : ['no-users']);

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

      // Map workout posts to community workouts (exclude current user's posts)
      const communityWkts: CommunityWorkout[] = (workoutPosts || [])
        .filter((p) => p.user_id !== user?.id)
        .map((p) => {
          const contentData = p.content_data as Record<string, unknown>;
          const exercises = (contentData?.exercises as WorkoutExercise[]) || [];
          
          // Generate time-of-day based title if no title provided
          let title = (contentData?.title as string) || (contentData?.name as string);
          if (!title) {
            const createdDate = new Date(p.created_at);
            const hour = createdDate.getHours();
            if (hour < 12) {
              title = "Morning Workout";
            } else if (hour < 17) {
              title = "Afternoon Workout";
            } else {
              title = "Evening Workout";
            }
          }
          
          return {
            id: p.id,
            title,
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

      // Map routine posts to community routines (exclude current user's posts)
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
