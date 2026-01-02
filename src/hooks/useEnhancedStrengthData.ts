import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, format, subWeeks } from "date-fns";

export type PrimaryGroup = "Push" | "Pull" | "Legs" | "Core";
export type MetricType = "volume" | "strength";

interface WorkoutExercise {
  name: string;
  notes?: string;
  isCardio?: boolean;
  muscleGroup?: string;
  primaryGroup?: PrimaryGroup;
  sets: Array<{
    weight?: number;
    reps?: number;
    distance?: number;
    time?: string;
  }>;
}

interface WeeklyData {
  week: string;
  weekLabel: string;
  value: number;
}

interface ExerciseFrequency {
  name: string;
  count: number;
  primaryGroup?: PrimaryGroup;
  muscleGroup?: string;
}

const PRIMARY_GROUP_SUBGROUPS: Record<PrimaryGroup, string[]> = {
  Push: ["Chest", "Shoulders", "Triceps"],
  Pull: ["Lats", "Upper Back", "Rear Delts", "Biceps"],
  Legs: ["Quads", "Hamstrings", "Glutes", "Calves"],
  Core: ["Abs", "Obliques", "Lower Back"]
};

// Map muscleGroup to primaryGroup (for exercises that don't have primaryGroup stored)
const MUSCLE_TO_PRIMARY: Record<string, PrimaryGroup> = {
  // Push
  "Chest": "Push",
  "Shoulders": "Push",
  "Triceps": "Push",
  // Pull
  "Lats": "Pull",
  "Upper Back": "Pull",
  "Back": "Pull", // Legacy mapping
  "Rear Delts": "Pull",
  "Biceps": "Pull",
  // Legs
  "Quads": "Legs",
  "Hamstrings": "Legs",
  "Glutes": "Legs",
  "Calves": "Legs",
  "Legs": "Legs", // Legacy mapping
  // Core
  "Abs": "Core",
  "Obliques": "Core",
  "Lower Back": "Core",
  "Core": "Core", // Legacy mapping
};

// Get primary group from exercise (check stored primaryGroup first, then derive from muscleGroup)
const getPrimaryGroup = (exercise: WorkoutExercise): PrimaryGroup | undefined => {
  if (exercise.primaryGroup) return exercise.primaryGroup;
  if (exercise.muscleGroup) return MUSCLE_TO_PRIMARY[exercise.muscleGroup];
  return undefined;
};

// Check if an exercise is time-based (Core exercises that use time instead of weight)
const isTimeBasedExercise = (exerciseName: string): boolean => {
  const timeBasedExercises = [
    "plank", "side plank", "hollow body hold", "dead bug", "bird dog", "superman"
  ];
  return timeBasedExercises.some(ex => exerciseName.toLowerCase().includes(ex));
};

// Calculate e1RM using Epley formula
const calculateE1RM = (weight: number, reps: number): number => {
  if (reps === 0 || weight === 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
};

export const useEnhancedStrengthData = () => {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPrimaryGroup, setSelectedPrimaryGroup] = useState<PrimaryGroup | null>(null);
  const [selectedSubGroup, setSelectedSubGroup] = useState<string | null>(null);
  const [metricType, setMetricType] = useState<MetricType>("volume");
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const fetchWorkouts = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("log_date", { ascending: true });

      if (error) throw error;
      setWorkouts(data || []);
    } catch (error) {
      console.error("Error fetching workouts:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  // Parse exercises from workout data
  const parseExercises = useCallback((workout: any): WorkoutExercise[] => {
    const exercisesData = workout.exercises as unknown;
    if (Array.isArray(exercisesData)) {
      return exercisesData as WorkoutExercise[];
    } else if (exercisesData && typeof exercisesData === 'object' && 'exercises' in exercisesData) {
      return (exercisesData as { exercises: WorkoutExercise[] }).exercises || [];
    }
    return [];
  }, []);

  // Get available subgroups for the selected primary group
  const availableSubGroups = useMemo(() => {
    if (!selectedPrimaryGroup) return [];
    return PRIMARY_GROUP_SUBGROUPS[selectedPrimaryGroup] || [];
  }, [selectedPrimaryGroup]);

  // Check if Core is mostly time-based exercises
  const isCoreTimeBasedOnly = useMemo(() => {
    if (selectedPrimaryGroup !== "Core") return false;
    
    let timeBasedCount = 0;
    let weightBasedCount = 0;
    
    workouts.forEach(workout => {
      const exercises = parseExercises(workout);
      exercises.forEach(exercise => {
        const exercisePrimaryGroup = getPrimaryGroup(exercise);
        if (exercisePrimaryGroup === "Core") {
          if (isTimeBasedExercise(exercise.name)) {
            timeBasedCount++;
          } else {
            // Check if any set has weight > 0
            const hasWeight = exercise.sets?.some(s => s.weight && s.weight > 0);
            if (hasWeight) {
              weightBasedCount++;
            } else {
              timeBasedCount++;
            }
          }
        }
      });
    });
    
    return timeBasedCount > weightBasedCount;
  }, [workouts, selectedPrimaryGroup, parseExercises]);

  const exerciseFrequency = useMemo(() => {
    const eightWeeksAgo = subWeeks(new Date(), 8);
    const frequencyMap: Record<string, ExerciseFrequency> = {};

    workouts.forEach(workout => {
      const logDate = new Date(workout.log_date);
      if (logDate < eightWeeksAgo) return;

      const exercises = parseExercises(workout);
      exercises.forEach(exercise => {
        if (exercise.isCardio) return;
        if (isTimeBasedExercise(exercise.name)) return;
        
        // Get the primary group (derived if not stored)
        const exercisePrimaryGroup = getPrimaryGroup(exercise);
        
        // Filter by selected group
        const matchesPrimary = !selectedPrimaryGroup || exercisePrimaryGroup === selectedPrimaryGroup;
        const matchesSub = !selectedSubGroup || selectedSubGroup === "All" || exercise.muscleGroup === selectedSubGroup;
        
        if (!matchesPrimary || !matchesSub) return;
        
        // Check if exercise has valid weight/reps data
        const hasValidSets = exercise.sets?.some(s => s.weight && s.weight > 0 && s.reps && s.reps > 0);
        if (!hasValidSets) return;

        if (!frequencyMap[exercise.name]) {
          frequencyMap[exercise.name] = {
            name: exercise.name,
            count: 0,
            primaryGroup: exercisePrimaryGroup,
            muscleGroup: exercise.muscleGroup
          };
        }
        frequencyMap[exercise.name].count++;
      });
    });

    return Object.values(frequencyMap).sort((a, b) => b.count - a.count);
  }, [workouts, selectedPrimaryGroup, selectedSubGroup, parseExercises]);

  // Default strength exercise (most frequent in selected group)
  const defaultStrengthExercise = useMemo(() => {
    return exerciseFrequency[0]?.name || null;
  }, [exerciseFrequency]);

  // Set default exercise when group changes
  useEffect(() => {
    if (metricType === "strength" && !selectedExercise && defaultStrengthExercise) {
      setSelectedExercise(defaultStrengthExercise);
    }
  }, [metricType, defaultStrengthExercise, selectedExercise]);

  // Reset selected exercise when group changes
  useEffect(() => {
    setSelectedExercise(null);
  }, [selectedPrimaryGroup, selectedSubGroup]);

  // Calculate weekly volume data
  const weeklyVolumeData = useMemo((): WeeklyData[] => {
    const weeklyVolumes: Record<string, number> = {};

    workouts.forEach(workout => {
      const logDate = new Date(workout.log_date);
      const weekStart = startOfWeek(logDate, { weekStartsOn: 1 });
      const weekKey = format(weekStart, "yyyy-MM-dd");

      const exercises = parseExercises(workout);
      let volume = 0;

      exercises.forEach(exercise => {
        if (exercise.isCardio) return;
        
        // Get the primary group (derived if not stored)
        const exercisePrimaryGroup = getPrimaryGroup(exercise);
        
        // Filter by selected group
        const matchesPrimary = !selectedPrimaryGroup || exercisePrimaryGroup === selectedPrimaryGroup;
        const matchesSub = !selectedSubGroup || selectedSubGroup === "All" || exercise.muscleGroup === selectedSubGroup;
        
        if (!matchesPrimary || !matchesSub) return;

        exercise.sets?.forEach(set => {
          if (set.weight && set.reps) {
            volume += set.weight * set.reps;
          }
        });
      });

      if (volume > 0) {
        weeklyVolumes[weekKey] = (weeklyVolumes[weekKey] || 0) + volume;
      }
    });

    return Object.entries(weeklyVolumes)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([week, value]) => ({
        week,
        weekLabel: format(new Date(week), "MMM d"),
        value: Math.round(value)
      }));
  }, [workouts, selectedPrimaryGroup, selectedSubGroup, parseExercises]);

  // Calculate weekly e1RM data for selected exercise
  const weeklyStrengthData = useMemo((): WeeklyData[] => {
    if (!selectedExercise) return [];

    const weeklyMaxE1RM: Record<string, number> = {};

    workouts.forEach(workout => {
      const logDate = new Date(workout.log_date);
      const weekStart = startOfWeek(logDate, { weekStartsOn: 1 });
      const weekKey = format(weekStart, "yyyy-MM-dd");

      const exercises = parseExercises(workout);

      exercises.forEach(exercise => {
        if (exercise.name !== selectedExercise) return;

        exercise.sets?.forEach(set => {
          if (set.weight && set.reps && set.weight > 0 && set.reps > 0) {
            const e1rm = calculateE1RM(set.weight, set.reps);
            weeklyMaxE1RM[weekKey] = Math.max(weeklyMaxE1RM[weekKey] || 0, e1rm);
          }
        });
      });
    });

    return Object.entries(weeklyMaxE1RM)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([week, value]) => ({
        week,
        weekLabel: format(new Date(week), "MMM d"),
        value: Math.round(value)
      }));
  }, [workouts, selectedExercise, parseExercises]);

  // Get chart data based on metric type
  const chartData = useMemo(() => {
    return metricType === "volume" ? weeklyVolumeData : weeklyStrengthData;
  }, [metricType, weeklyVolumeData, weeklyStrengthData]);

  // Calculate totals and trends
  const totalVolume = useMemo(() => {
    return weeklyVolumeData.reduce((sum, d) => sum + d.value, 0);
  }, [weeklyVolumeData]);

  const latestValue = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;
  
  const trend = chartData.length >= 2
    ? chartData[chartData.length - 1].value - chartData[chartData.length - 2].value
    : 0;

  return {
    chartData,
    weeklyVolumeData,
    weeklyStrengthData,
    totalVolume,
    latestValue,
    trend,
    isLoading,
    refetch: fetchWorkouts,
    // Filters
    selectedPrimaryGroup,
    setSelectedPrimaryGroup,
    selectedSubGroup,
    setSelectedSubGroup,
    availableSubGroups,
    // Metric type
    metricType,
    setMetricType,
    // Strength exercise
    selectedExercise,
    setSelectedExercise,
    exerciseFrequency,
    defaultStrengthExercise,
    isCoreTimeBasedOnly,
    // Constants
    PRIMARY_GROUP_SUBGROUPS
  };
};
