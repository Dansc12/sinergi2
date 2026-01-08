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

interface Creator {
  id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
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
  isSavedWorkout: boolean;
  tags?: string[];
  creator?: Creator;
  sourcePostId?: string | null; // If this workout originated from a saved post
}

export interface RecentRoutine {
  id: string;
  title: string;
  type: "routine";
  exercises: RoutineExercise[];
  exerciseCount: number;
  dayOfWeek: string;
  createdAt: string;
  creator?: Creator;
}

export type RecentItem = RecentWorkout | RecentRoutine;

export const useRecentWorkouts = (limit: number = 10) => {
  const { user } = useAuth();
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<{ name: string; avatar_url: string | null } | null>(null);

  const fetchRecentItems = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch user's profile for avatar
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, avatar_url, display_name")
        .eq("user_id", user.id)
        .single();

      const currentUserCreator: Creator = profile ? {
        id: user.id,
        name: profile.display_name || [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "You",
        username: null,
        avatar_url: profile.avatar_url,
      } : {
        id: user.id,
        name: "You",
        username: null,
        avatar_url: null,
      };

      if (profile) {
        setUserProfile({
          name: currentUserCreator.name,
          avatar_url: profile.avatar_url,
        });
      }

      // Fetch recent workout logs
      const { data: workouts, error: workoutError } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("log_date", { ascending: false })
        .limit(limit);

      if (workoutError) throw workoutError;

      // Fetch saved_workouts to check which workout logs have saved info (with post_id for other users' workouts)
      const { data: savedWorkoutsData } = await supabase
        .from("saved_workouts")
        .select("id, workout_log_id, post_id, title, tags")
        .eq("user_id", user.id);

      // Build a map of workout_log_id -> saved workout info
      const savedByLogId = new Map<string, { title: string; tags: string[]; post_id: string | null }>();
      const postIdsToFetch: string[] = [];
      
      (savedWorkoutsData || []).forEach(sw => {
        if (sw.workout_log_id) {
          savedByLogId.set(sw.workout_log_id, {
            title: sw.title,
            tags: sw.tags || [],
            post_id: sw.post_id,
          });
        }
        if (sw.post_id) {
          postIdsToFetch.push(sw.post_id);
        }
      });

      // Also extract sourcePostId from workout logs' exercises data
      (workouts || []).forEach(w => {
        const rawData = w.exercises as unknown;
        if (rawData && typeof rawData === "object" && "sourcePostId" in rawData) {
          const sourcePostId = (rawData as { sourcePostId?: string }).sourcePostId;
          if (sourcePostId && !postIdsToFetch.includes(sourcePostId)) {
            postIdsToFetch.push(sourcePostId);
          }
        }
      });

      // Fetch post creators for saved-from-connect workouts
      let postCreatorMap = new Map<string, Creator>();
      if (postIdsToFetch.length > 0) {
        const { data: postsData } = await supabase
          .from("posts")
          .select("id, user_id")
          .in("id", postIdsToFetch);

        if (postsData && postsData.length > 0) {
          const creatorUserIds = [...new Set(postsData.map(p => p.user_id))];
          
          const { data: creatorsData } = await supabase
            .from("profiles")
            .select("user_id, first_name, last_name, username, avatar_url, display_name")
            .in("user_id", creatorUserIds);

          const profileMap = new Map(creatorsData?.map(p => [p.user_id, p]));

          postsData.forEach(post => {
            const creatorProfile = profileMap.get(post.user_id);
            if (creatorProfile) {
              postCreatorMap.set(post.id, {
                id: creatorProfile.user_id,
                name: creatorProfile.display_name || [creatorProfile.first_name, creatorProfile.last_name].filter(Boolean).join(" ") || "User",
                username: creatorProfile.username,
                avatar_url: creatorProfile.avatar_url,
              });
            }
          });
        }
      }

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
        let sourcePostId: string | null = null;

        if (Array.isArray(rawData)) {
          exercises = rawData as WorkoutExercise[];
        } else if (rawData && typeof rawData === "object" && "exercises" in rawData) {
          const wrappedData = rawData as { title?: string; exercises: WorkoutExercise[]; tags?: string[]; sourcePostId?: string };
          exercises = wrappedData.exercises || [];
          savedTitle = wrappedData.title || "";
          savedTags = wrappedData.tags || [];
          sourcePostId = wrappedData.sourcePostId || null;
        }

        // Check if this workout log has a saved workout entry
        const savedInfo = savedByLogId.get(w.id);
        if (savedInfo) {
          savedTitle = savedInfo.title || savedTitle;
          savedTags = savedInfo.tags.length > 0 ? savedInfo.tags : savedTags;
          // Use the saved workout's post_id as sourcePostId if not already set
          if (!sourcePostId && savedInfo.post_id) {
            sourcePostId = savedInfo.post_id;
          }
        }

        const isSavedWorkout = Boolean(savedTitle) || Boolean(savedInfo);

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

        // Determine creator - if has sourcePostId, use post creator
        let creator = currentUserCreator;
        if (sourcePostId) {
          const postCreator = postCreatorMap.get(sourcePostId);
          if (postCreator) {
            creator = postCreator;
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
          creator,
          sourcePostId,
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
            creator: currentUserCreator,
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

  return { recentItems, isLoading, refetch: fetchRecentItems, userProfile };
};
