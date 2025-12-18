import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Json } from "@/integrations/supabase/types";
import { format, addWeeks, addMonths, addDays, isBefore, startOfDay } from "date-fns";

export interface Post {
  id: string;
  user_id: string;
  content_type: string;
  content_data: Json;
  description: string | null;
  images: string[] | null;
  visibility: string;
  created_at: string;
  updated_at: string;
  // Joined profile data
  profile?: {
    first_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export const usePosts = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    if (authLoading) {
      return; // Wait for auth to resolve
    }
    
    if (!user) {
      setPosts([]);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .neq("visibility", "private")
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;

      // Fetch profiles separately for all post authors
      const userIds = [...new Set(postsData?.map(p => p.user_id) || [])];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, first_name, username, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profilesData?.map(p => [p.user_id, p]));
      
      const postsWithProfiles: Post[] = postsData?.map(post => ({
        ...post,
        profile: profileMap.get(post.user_id) || null
      })) || [];

      setPosts(postsWithProfiles);
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Real-time subscription for new posts
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("posts-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
        },
        async (payload) => {
          const newPost = payload.new as Post;
          
          // Only add if not private (RLS should handle this, but double check)
          if (newPost.visibility === "private" && newPost.user_id !== user.id) {
            return;
          }

          // Fetch the profile for the new post
          const { data: profileData } = await supabase
            .from("profiles")
            .select("first_name, username, avatar_url")
            .eq("user_id", newPost.user_id)
            .single();

          const postWithProfile: Post = {
            ...newPost,
            profile: profileData || null,
          };

          setPosts((prev) => [postWithProfile, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "posts",
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          setPosts((prev) => prev.filter((p) => p.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const createPost = async (postData: {
    content_type: string;
    content_data: Record<string, unknown>;
    description?: string;
    images?: string[];
    visibility: string;
  }) => {
    if (!user) throw new Error("Not authenticated");

    // If this is a meal, also save to meal_logs table
    if (postData.content_type === "meal") {
      const mealData = postData.content_data;
      const foods = (mealData.foods as Array<{
        id: string;
        name: string;
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
        servings?: number;
        servingSize?: string;
      }>) || [];

      // Transform foods to match meal_logs schema (fats -> fat)
      const transformedFoods = foods.map(f => ({
        name: f.name,
        servings: f.servings || 1,
        servingSize: f.servingSize || "serving",
        calories: f.calories,
        protein: f.protein,
        carbs: f.carbs,
        fat: f.fats, // Note: CreateMealPage uses 'fats', meal_logs uses 'fat'
      }));

      await supabase
        .from("meal_logs")
        .insert({
          user_id: user.id,
          meal_type: mealData.mealType as string,
          foods: transformedFoods,
          total_calories: mealData.totalCalories as number,
          total_protein: mealData.totalProtein as number,
          total_carbs: mealData.totalCarbs as number,
          total_fat: mealData.totalFats as number,
        });
    }

    // If this is a workout, also save to workout_logs table
    if (postData.content_type === "workout") {
      const workoutData = postData.content_data;
      await supabase
        .from("workout_logs")
        .insert({
          user_id: user.id,
          exercises: workoutData.exercises as Json,
          notes: (workoutData.notes as string) || null,
          photos: postData.images || [],
        });
    }

    // Create post first to get the ID
    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        content_type: postData.content_type,
        content_data: postData.content_data as Json,
        description: postData.description || null,
        images: postData.images || [],
        visibility: postData.visibility,
      })
      .select()
      .single();

    if (error) throw error;

    // If this is a routine with scheduled days, create scheduled routines
    if (postData.content_type === "routine" && data) {
      const routineData = postData.content_data;
      const selectedDays = routineData.selectedDays as Record<string, { selected: boolean; time: string }>;
      const recurring = (routineData.recurring as string) || "none";
      const routineName = (routineData.name as string) || "Workout Routine";
      
      // Check if any days are selected
      const hasSelectedDays = selectedDays && Object.values(selectedDays).some(d => d.selected);
      
      if (hasSelectedDays) {
        await createScheduledRoutineEntries(
          user.id,
          data.id,
          routineName,
          {
            exercises: routineData.exercises as Array<{
              id: string;
              name: string;
              category: string;
              muscleGroup: string;
              notes: string;
              sets: { id: string; minReps: string; maxReps: string }[];
            }>,
            description: routineData.description as string,
          },
          selectedDays,
          recurring
        );
      }
    }

    return data;
  };

  // Helper function to create scheduled routine entries
  const createScheduledRoutineEntries = async (
    userId: string,
    postId: string,
    routineName: string,
    routineData: {
      exercises: Array<{
        id: string;
        name: string;
        category: string;
        muscleGroup: string;
        notes: string;
        sets: { id: string; minReps: string; maxReps: string }[];
      }>;
      description?: string;
    },
    selectedDays: Record<string, { selected: boolean; time: string }>,
    recurring: string
  ) => {
    try {
      // Calculate end date based on recurring option
      const startDate = new Date();
      let endDate: Date | null = null;

      switch (recurring) {
        case "2-weeks":
          endDate = addWeeks(startDate, 2);
          break;
        case "1-month":
          endDate = addMonths(startDate, 1);
          break;
        case "2-months":
          endDate = addMonths(startDate, 2);
          break;
        case "3-months":
          endDate = addMonths(startDate, 3);
          break;
        case "6-months":
          endDate = addMonths(startDate, 6);
          break;
        case "indefinitely":
        case "none":
        default:
          endDate = null;
          break;
      }

      const scheduledRoutineIds: string[] = [];

      // Create a scheduled routine entry for each selected day
      for (const [dayName, dayInfo] of Object.entries(selectedDays)) {
        if (!dayInfo.selected) continue;

        const { data: routineEntry, error: routineError } = await supabase
          .from("scheduled_routines")
          .insert({
            user_id: userId,
            post_id: postId,
            routine_name: routineName,
            routine_data: routineData as unknown as Json,
            day_of_week: dayName,
            scheduled_time: dayInfo.time || null,
            recurring,
            start_date: format(startDate, "yyyy-MM-dd"),
            end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
            is_active: true,
          })
          .select()
          .single();

        if (routineError) throw routineError;
        if (routineEntry) scheduledRoutineIds.push(routineEntry.id);
      }

      // Generate instances for the next 3 months
      await generateRoutineInstances(userId, scheduledRoutineIds);
    } catch (err) {
      console.error("Error creating scheduled routines:", err);
    }
  };

  // Helper function to generate routine instances
  const generateRoutineInstances = async (userId: string, routineIds: string[]) => {
    try {
      const { data: routines, error: routinesError } = await supabase
        .from("scheduled_routines")
        .select("*")
        .in("id", routineIds);

      if (routinesError) throw routinesError;

      const dayMapping: Record<string, number> = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
      };

      const today = startOfDay(new Date());
      const endPeriod = addMonths(today, 3);

      for (const routine of routines || []) {
        const routineEndDate = routine.end_date ? new Date(routine.end_date) : endPeriod;
        const targetDayIndex = dayMapping[routine.day_of_week];
        
        if (targetDayIndex === undefined) continue;

        let currentDate = today;
        
        while (currentDate.getDay() !== targetDayIndex) {
          currentDate = addDays(currentDate, 1);
        }

        while (isBefore(currentDate, routineEndDate) && isBefore(currentDate, endPeriod)) {
          const dateStr = format(currentDate, "yyyy-MM-dd");
          
          const { data: existing } = await supabase
            .from("routine_instances")
            .select("id")
            .eq("scheduled_routine_id", routine.id)
            .eq("scheduled_date", dateStr)
            .single();

          if (!existing) {
            await supabase.from("routine_instances").insert({
              scheduled_routine_id: routine.id,
              user_id: userId,
              scheduled_date: dateStr,
              scheduled_time: routine.scheduled_time,
              status: "pending",
            });
          }

          currentDate = addDays(currentDate, 7);
        }
      }
    } catch (err) {
      console.error("Error generating routine instances:", err);
    }
  };

  return { posts, isLoading, fetchPosts, createPost };
};
