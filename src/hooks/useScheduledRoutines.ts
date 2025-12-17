import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { format, addDays, addWeeks, addMonths, isBefore, startOfDay } from "date-fns";
import { Json } from "@/integrations/supabase/types";

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

interface ScheduledRoutine {
  id: string;
  user_id: string;
  post_id: string | null;
  routine_name: string;
  routine_data: RoutineData;
  day_of_week: string;
  scheduled_time: string | null;
  recurring: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
}

interface RoutineInstance {
  id: string;
  scheduled_routine_id: string;
  user_id: string;
  scheduled_date: string;
  scheduled_time: string | null;
  status: "pending" | "completed" | "skipped";
  workout_log_id: string | null;
  completed_at: string | null;
  scheduled_routine?: ScheduledRoutine;
}

export const useScheduledRoutines = (selectedDate?: Date) => {
  const { user } = useAuth();
  const [scheduledRoutines, setScheduledRoutines] = useState<ScheduledRoutine[]>([]);
  const [routineInstances, setRoutineInstances] = useState<RoutineInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchScheduledRoutines = useCallback(async () => {
    if (!user?.id) {
      setScheduledRoutines([]);
      setRoutineInstances([]);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch all active scheduled routines for user
      const { data: routines, error: routinesError } = await supabase
        .from("scheduled_routines")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (routinesError) throw routinesError;
      
      // Cast the data properly
      const typedRoutines = (routines || []).map(r => ({
        ...r,
        routine_data: r.routine_data as unknown as RoutineData
      }));
      
      setScheduledRoutines(typedRoutines);

      // If a date is selected, fetch instances for that date
      if (selectedDate) {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const { data: instances, error: instancesError } = await supabase
          .from("routine_instances")
          .select("*, scheduled_routine:scheduled_routines(*)")
          .eq("user_id", user.id)
          .eq("scheduled_date", dateStr);

        if (instancesError) throw instancesError;
        
        // Cast the data properly
        const typedInstances = (instances || []).map(i => ({
          ...i,
          status: i.status as RoutineInstance['status'],
          scheduled_routine: i.scheduled_routine ? {
            ...(i.scheduled_routine as Record<string, unknown>),
            routine_data: (i.scheduled_routine as Record<string, unknown>).routine_data as unknown as RoutineData
          } as ScheduledRoutine : undefined
        }));
        
        setRoutineInstances(typedInstances);
      }
    } catch (err) {
      console.error("Error fetching scheduled routines:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedDate]);

  useEffect(() => {
    fetchScheduledRoutines();
  }, [fetchScheduledRoutines]);

  const createScheduledRoutine = async (
    routineName: string,
    routineData: RoutineData,
    selectedDays: Record<string, { selected: boolean; time: string }>,
    recurring: string,
    postId?: string
  ) => {
    if (!user?.id) return;

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

      // Create a scheduled routine entry for each selected day
      for (const [dayName, dayInfo] of Object.entries(selectedDays)) {
        if (!dayInfo.selected) continue;

        const { error: routineError } = await supabase
          .from("scheduled_routines")
          .insert({
            user_id: user.id,
            post_id: postId || null,
            routine_name: routineName,
            routine_data: routineData as unknown as Json,
            day_of_week: dayName,
            scheduled_time: dayInfo.time || null,
            recurring,
            start_date: format(startDate, "yyyy-MM-dd"),
            end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
            is_active: true,
          });

        if (routineError) throw routineError;
      }

      // Generate instances for the next period
      await generateRoutineInstances();
      await fetchScheduledRoutines();
    } catch (err) {
      console.error("Error creating scheduled routine:", err);
      throw err;
    }
  };

  const generateRoutineInstances = async () => {
    if (!user?.id) return;

    try {
      const { data: routines, error: routinesError } = await supabase
        .from("scheduled_routines")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);

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
      const endPeriod = addMonths(today, 3); // Generate instances for 3 months ahead

      for (const routine of routines || []) {
        const routineEndDate = routine.end_date ? new Date(routine.end_date) : endPeriod;
        const targetDayIndex = dayMapping[routine.day_of_week];
        
        if (targetDayIndex === undefined) continue;

        let currentDate = today;
        
        // Find the first occurrence of this day from today
        while (currentDate.getDay() !== targetDayIndex) {
          currentDate = addDays(currentDate, 1);
        }

        // Generate instances up to the end date
        while (isBefore(currentDate, routineEndDate) && isBefore(currentDate, endPeriod)) {
          const dateStr = format(currentDate, "yyyy-MM-dd");
          
          // Check if instance already exists
          const { data: existing } = await supabase
            .from("routine_instances")
            .select("id")
            .eq("scheduled_routine_id", routine.id)
            .eq("scheduled_date", dateStr)
            .single();

          if (!existing) {
            await supabase.from("routine_instances").insert({
              scheduled_routine_id: routine.id,
              user_id: user.id,
              scheduled_date: dateStr,
              scheduled_time: routine.scheduled_time,
              status: "pending",
            });
          }

          // Move to next week
          currentDate = addDays(currentDate, 7);
        }
      }
    } catch (err) {
      console.error("Error generating routine instances:", err);
    }
  };

  const markInstanceComplete = async (instanceId: string, workoutLogId?: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from("routine_instances")
        .update({
          status: "completed",
          workout_log_id: workoutLogId || null,
          completed_at: new Date().toISOString(),
        })
        .eq("id", instanceId)
        .eq("user_id", user.id);

      if (error) throw error;
      await fetchScheduledRoutines();
    } catch (err) {
      console.error("Error marking instance complete:", err);
    }
  };

  return {
    scheduledRoutines,
    routineInstances,
    isLoading,
    createScheduledRoutine,
    generateRoutineInstances,
    markInstanceComplete,
    refetch: fetchScheduledRoutines,
  };
};
