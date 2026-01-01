import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { format, startOfMonth, endOfMonth } from "date-fns";

interface ActivityData {
  [dateStr: string]: {
    hasWorkout: boolean;
    hasMeal: boolean;
  };
}

export const useCalendarActivityDots = (displayedMonth: Date) => {
  const { user } = useAuth();
  const [activityData, setActivityData] = useState<ActivityData>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setActivityData({});
      return;
    }

    fetchActivityData();
  }, [user, displayedMonth]);

  const fetchActivityData = async () => {
    if (!user) return;
    setIsLoading(true);

    const monthStart = format(startOfMonth(displayedMonth), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(displayedMonth), "yyyy-MM-dd");

    try {
      // Fetch meal logs for the month
      const { data: meals } = await supabase
        .from("meal_logs")
        .select("log_date")
        .eq("user_id", user.id)
        .gte("log_date", monthStart)
        .lte("log_date", monthEnd);

      // Fetch workout logs for the month
      const { data: workouts } = await supabase
        .from("workout_logs")
        .select("log_date")
        .eq("user_id", user.id)
        .gte("log_date", monthStart)
        .lte("log_date", monthEnd);

      const data: ActivityData = {};

      meals?.forEach((meal) => {
        const dateStr = meal.log_date;
        if (!data[dateStr]) {
          data[dateStr] = { hasWorkout: false, hasMeal: false };
        }
        data[dateStr].hasMeal = true;
      });

      workouts?.forEach((workout) => {
        const dateStr = workout.log_date;
        if (!data[dateStr]) {
          data[dateStr] = { hasWorkout: false, hasMeal: false };
        }
        data[dateStr].hasWorkout = true;
      });

      setActivityData(data);
    } catch (error) {
      console.error("Error fetching calendar activity:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return { activityData, isLoading };
};
