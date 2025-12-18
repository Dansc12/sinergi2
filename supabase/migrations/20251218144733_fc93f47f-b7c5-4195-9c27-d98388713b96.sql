-- Create a function to get user stats (meals, workouts, days) that bypasses RLS for counting
CREATE OR REPLACE FUNCTION public.get_user_stats(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meals_count integer;
  workouts_count integer;
  days_active integer;
  first_meal_date timestamp with time zone;
  first_workout_date timestamp with time zone;
  earliest_date timestamp with time zone;
BEGIN
  -- Count meals
  SELECT COUNT(*) INTO meals_count
  FROM meal_logs
  WHERE user_id = target_user_id;
  
  -- Count workouts
  SELECT COUNT(*) INTO workouts_count
  FROM workout_logs
  WHERE user_id = target_user_id;
  
  -- Get first meal date
  SELECT MIN(created_at) INTO first_meal_date
  FROM meal_logs
  WHERE user_id = target_user_id;
  
  -- Get first workout date
  SELECT MIN(created_at) INTO first_workout_date
  FROM workout_logs
  WHERE user_id = target_user_id;
  
  -- Calculate days active
  earliest_date := LEAST(first_meal_date, first_workout_date);
  IF earliest_date IS NOT NULL THEN
    days_active := GREATEST(1, EXTRACT(DAY FROM (NOW() - earliest_date))::integer + 1);
  ELSE
    days_active := 0;
  END IF;
  
  RETURN json_build_object(
    'meals', meals_count,
    'workouts', workouts_count,
    'days', days_active
  );
END;
$$;