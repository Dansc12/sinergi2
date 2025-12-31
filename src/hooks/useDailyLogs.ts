import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { format } from "date-fns";

interface LoggedFood {
  name: string;
  servings: number;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealLog {
  id: string;
  meal_type: string;
  foods: LoggedFood[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
}

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
  }[];
}

interface WorkoutLog {
  id: string;
  exercises: WorkoutExercise[];
  notes: string | null;
  photos: string[] | null;
  created_at: string;
  duration_seconds: number | null;
}

interface WaterLog {
  glasses: number;
  target_glasses: number;
}

export const useDailyLogs = (selectedDate: Date) => {
  const { user } = useAuth();
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [waterLog, setWaterLog] = useState<WaterLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setMealLogs([]);
      setWorkoutLogs([]);
      setWaterLog(null);
      setIsLoading(false);
      return;
    }

    fetchLogs();
  }, [user, selectedDate]);

  const fetchLogs = async () => {
    if (!user) return;
    setIsLoading(true);

    const dateStr = format(selectedDate, "yyyy-MM-dd");

    try {
      // Fetch meal logs
      const { data: meals } = await supabase
        .from("meal_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("log_date", dateStr);

      if (meals) {
        const parsedMeals = meals.map((meal) => ({
          id: meal.id,
          meal_type: meal.meal_type,
          foods: (meal.foods as unknown as LoggedFood[]) || [],
          total_calories: meal.total_calories || 0,
          total_protein: Number(meal.total_protein) || 0,
          total_carbs: Number(meal.total_carbs) || 0,
          total_fat: Number(meal.total_fat) || 0,
        }));
        setMealLogs(parsedMeals);
      }

      // Fetch workout logs
      const { data: workouts } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("log_date", dateStr);

      if (workouts) {
        const parsedWorkouts = workouts.map((workout) => {
          // Handle both formats: direct array or {title, exercises} object
          const exercisesData = workout.exercises as unknown;
          let exercises: WorkoutExercise[] = [];
          
          if (Array.isArray(exercisesData)) {
            exercises = exercisesData as WorkoutExercise[];
          } else if (exercisesData && typeof exercisesData === 'object' && 'exercises' in exercisesData) {
            exercises = (exercisesData as { exercises: WorkoutExercise[] }).exercises || [];
          }
          
          return {
            id: workout.id,
            exercises,
            notes: workout.notes,
            photos: workout.photos,
            created_at: workout.created_at,
            duration_seconds: (workout as any).duration_seconds || null,
          };
        });
        setWorkoutLogs(parsedWorkouts);
      }

      // Fetch water log
      const { data: water } = await supabase
        .from("water_logs")
        .select("glasses, target_glasses")
        .eq("user_id", user.id)
        .eq("log_date", dateStr)
        .maybeSingle();

      setWaterLog(water);
    } catch (error) {
      console.error("Error fetching daily logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals from meal logs
  const totals = mealLogs.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.total_calories || 0),
      protein: acc.protein + (meal.total_protein || 0),
      carbs: acc.carbs + (meal.total_carbs || 0),
      fat: acc.fat + (meal.total_fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Group meals by type
  const mealsByType = {
    breakfast: mealLogs.filter((m) => m.meal_type === "breakfast"),
    lunch: mealLogs.filter((m) => m.meal_type === "lunch"),
    dinner: mealLogs.filter((m) => m.meal_type === "dinner"),
    snack: mealLogs.filter((m) => m.meal_type === "snack"),
  };

  return {
    mealLogs,
    mealsByType,
    workoutLogs,
    waterLog,
    totals,
    isLoading,
    refetch: fetchLogs,
  };
};
