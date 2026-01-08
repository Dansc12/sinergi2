-- Create saved_workouts table to track explicitly saved workouts
CREATE TABLE public.saved_workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workout_log_id UUID REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT saved_workout_source CHECK (
    (workout_log_id IS NOT NULL) OR (post_id IS NOT NULL) OR (exercises != '[]'::jsonb)
  )
);

-- Enable RLS
ALTER TABLE public.saved_workouts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own saved workouts"
ON public.saved_workouts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved workouts"
ON public.saved_workouts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved workouts"
ON public.saved_workouts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved workouts"
ON public.saved_workouts
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_saved_workouts_updated_at
BEFORE UPDATE ON public.saved_workouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for user lookups
CREATE INDEX idx_saved_workouts_user_id ON public.saved_workouts(user_id);

-- Auto-save posted workouts: Create a trigger that saves workouts when posted
CREATE OR REPLACE FUNCTION public.auto_save_posted_workout()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  workout_title TEXT;
  workout_exercises JSONB;
  workout_tags TEXT[];
  workout_description TEXT;
BEGIN
  -- Only process workout posts
  IF NEW.content_type = 'workout' THEN
    workout_title := COALESCE(
      NEW.content_data->>'title',
      NEW.content_data->>'name',
      'Workout'
    );
    workout_exercises := COALESCE(NEW.content_data->'exercises', '[]'::jsonb);
    workout_tags := ARRAY(SELECT jsonb_array_elements_text(COALESCE(NEW.content_data->'tags', '[]'::jsonb)));
    workout_description := NEW.description;
    
    -- Check if already saved for this post
    IF NOT EXISTS (SELECT 1 FROM saved_workouts WHERE post_id = NEW.id AND user_id = NEW.user_id) THEN
      INSERT INTO saved_workouts (user_id, post_id, title, exercises, tags, description)
      VALUES (NEW.user_id, NEW.id, workout_title, workout_exercises, workout_tags, workout_description);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-saving posted workouts
CREATE TRIGGER auto_save_workout_on_post
AFTER INSERT ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.auto_save_posted_workout();