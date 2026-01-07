-- Add unique constraint on routine_instances for upsert to work properly
ALTER TABLE public.routine_instances 
ADD CONSTRAINT routine_instances_routine_date_unique 
UNIQUE (scheduled_routine_id, scheduled_date);