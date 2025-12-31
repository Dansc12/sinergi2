-- Add duration_seconds column to workout_logs table
ALTER TABLE public.workout_logs 
ADD COLUMN duration_seconds INTEGER DEFAULT NULL;