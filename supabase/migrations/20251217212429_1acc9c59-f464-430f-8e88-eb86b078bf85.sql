-- Create scheduled_routines table to store routine schedule information
CREATE TABLE public.scheduled_routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  routine_name TEXT NOT NULL,
  routine_data JSONB NOT NULL DEFAULT '{}',
  day_of_week TEXT NOT NULL, -- 'Monday', 'Tuesday', etc.
  scheduled_time TIME,
  recurring TEXT NOT NULL DEFAULT 'none', -- 'none', '2-weeks', '1-month', etc.
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE, -- NULL for indefinite
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create routine_instances table to track individual workout instances
CREATE TABLE public.routine_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scheduled_routine_id UUID NOT NULL REFERENCES public.scheduled_routines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'skipped'
  workout_log_id UUID REFERENCES public.workout_logs(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_instances ENABLE ROW LEVEL SECURITY;

-- RLS policies for scheduled_routines
CREATE POLICY "Users can view their own scheduled routines" 
ON public.scheduled_routines 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled routines" 
ON public.scheduled_routines 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled routines" 
ON public.scheduled_routines 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled routines" 
ON public.scheduled_routines 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for routine_instances
CREATE POLICY "Users can view their own routine instances" 
ON public.routine_instances 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own routine instances" 
ON public.routine_instances 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routine instances" 
ON public.routine_instances 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routine instances" 
ON public.routine_instances 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_scheduled_routines_updated_at
BEFORE UPDATE ON public.scheduled_routines
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_routine_instances_updated_at
BEFORE UPDATE ON public.routine_instances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_scheduled_routines_user_id ON public.scheduled_routines(user_id);
CREATE INDEX idx_scheduled_routines_day_of_week ON public.scheduled_routines(day_of_week);
CREATE INDEX idx_routine_instances_user_date ON public.routine_instances(user_id, scheduled_date);
CREATE INDEX idx_routine_instances_status ON public.routine_instances(status);