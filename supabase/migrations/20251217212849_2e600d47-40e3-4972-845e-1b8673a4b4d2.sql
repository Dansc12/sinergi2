-- Create function to check for pending workout notifications
CREATE OR REPLACE FUNCTION public.check_pending_workout_notifications()
RETURNS TRIGGER AS $$
DECLARE
  routine_name TEXT;
BEGIN
  -- Only trigger for pending instances on current date
  IF NEW.status = 'pending' AND NEW.scheduled_date = CURRENT_DATE THEN
    -- Get routine name
    SELECT sr.routine_name INTO routine_name
    FROM scheduled_routines sr
    WHERE sr.id = NEW.scheduled_routine_id;
    
    -- Create notification
    INSERT INTO notifications (user_id, type, title, message, related_content_type, related_content_id)
    VALUES (
      NEW.user_id,
      'workout_reminder',
      'Time to workout!',
      'You have a scheduled workout: ' || COALESCE(routine_name, 'Workout'),
      'routine_instance',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Note: In production, you'd use pg_cron to check for due workouts periodically
-- For now, notifications will be created when instances are generated