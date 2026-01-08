-- Ensure uniqueness for saved workouts coming from posts/logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'saved_workouts_user_post_unique'
      AND conrelid = 'public.saved_workouts'::regclass
  ) THEN
    ALTER TABLE public.saved_workouts
      ADD CONSTRAINT saved_workouts_user_post_unique UNIQUE (user_id, post_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'saved_workouts_user_workoutlog_unique'
      AND conrelid = 'public.saved_workouts'::regclass
  ) THEN
    ALTER TABLE public.saved_workouts
      ADD CONSTRAINT saved_workouts_user_workoutlog_unique UNIQUE (user_id, workout_log_id);
  END IF;
END $$;

-- Sync: when a user saves/unsaves a workout post (Connect) -> mirror into saved_workouts
CREATE OR REPLACE FUNCTION public.sync_saved_workout_from_saved_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  workout_title TEXT;
  workout_exercises JSONB;
  workout_tags TEXT[];
  workout_description TEXT;
  post_content JSONB;
  post_description TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.content_type IN ('workout', 'workouts') THEN
      SELECT (p.content_data::jsonb), p.description
        INTO post_content, post_description
      FROM public.posts p
      WHERE p.id = NEW.post_id;

      IF post_content IS NULL THEN
        RETURN NEW;
      END IF;

      workout_title := COALESCE(post_content->>'title', post_content->>'name', 'Workout');
      workout_exercises := COALESCE(post_content->'exercises', '[]'::jsonb);
      workout_tags := ARRAY(
        SELECT jsonb_array_elements_text(COALESCE(post_content->'tags', '[]'::jsonb))
      );
      workout_description := post_description;

      INSERT INTO public.saved_workouts (user_id, post_id, title, exercises, tags, description)
      VALUES (NEW.user_id, NEW.post_id, workout_title, workout_exercises, workout_tags, workout_description)
      ON CONFLICT (user_id, post_id)
      DO UPDATE SET
        title = EXCLUDED.title,
        exercises = EXCLUDED.exercises,
        tags = EXCLUDED.tags,
        description = EXCLUDED.description,
        updated_at = now();
    END IF;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.content_type IN ('workout', 'workouts') THEN
      DELETE FROM public.saved_workouts
      WHERE user_id = OLD.user_id
        AND post_id = OLD.post_id;
    END IF;

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS saved_posts_sync_workouts_ins ON public.saved_posts;
CREATE TRIGGER saved_posts_sync_workouts_ins
AFTER INSERT ON public.saved_posts
FOR EACH ROW
EXECUTE FUNCTION public.sync_saved_workout_from_saved_post();

DROP TRIGGER IF EXISTS saved_posts_sync_workouts_del ON public.saved_posts;
CREATE TRIGGER saved_posts_sync_workouts_del
AFTER DELETE ON public.saved_posts
FOR EACH ROW
EXECUTE FUNCTION public.sync_saved_workout_from_saved_post();

-- Auto-save: when a user posts a workout -> save it for them
DROP TRIGGER IF EXISTS auto_save_workout_on_post ON public.posts;
CREATE TRIGGER auto_save_workout_on_post
AFTER INSERT ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.auto_save_posted_workout();
