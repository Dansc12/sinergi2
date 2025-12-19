-- Create custom_foods table for user-scoped custom food entries
CREATE TABLE public.custom_foods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  calories NUMERIC NOT NULL DEFAULT 0,
  protein NUMERIC NOT NULL DEFAULT 0,
  carbs NUMERIC NOT NULL DEFAULT 0,
  fat NUMERIC NOT NULL DEFAULT 0,
  base_unit TEXT NOT NULL DEFAULT 'g' CHECK (base_unit IN ('g', 'oz')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.custom_foods ENABLE ROW LEVEL SECURITY;

-- Create policies for user-scoped access (only owner can see their custom foods)
CREATE POLICY "Users can view their own custom foods"
ON public.custom_foods
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom foods"
ON public.custom_foods
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom foods"
ON public.custom_foods
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom foods"
ON public.custom_foods
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_custom_foods_updated_at
BEFORE UPDATE ON public.custom_foods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster user queries
CREATE INDEX idx_custom_foods_user_id ON public.custom_foods(user_id);
CREATE INDEX idx_custom_foods_name ON public.custom_foods USING gin(to_tsvector('english', name));