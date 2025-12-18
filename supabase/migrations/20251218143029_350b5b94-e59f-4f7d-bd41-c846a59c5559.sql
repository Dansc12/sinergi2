-- Create feedback_messages table for community message board
CREATE TABLE public.feedback_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feedback_upvotes table for tracking upvotes
CREATE TABLE public.feedback_upvotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_id UUID NOT NULL REFERENCES public.feedback_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(feedback_id, user_id)
);

-- Enable RLS
ALTER TABLE public.feedback_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_upvotes ENABLE ROW LEVEL SECURITY;

-- Policies for feedback_messages
CREATE POLICY "Anyone authenticated can view feedback" 
ON public.feedback_messages 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own feedback" 
ON public.feedback_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback" 
ON public.feedback_messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- Policies for feedback_upvotes
CREATE POLICY "Anyone authenticated can view upvotes" 
ON public.feedback_upvotes 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can add their upvote" 
ON public.feedback_upvotes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their upvote" 
ON public.feedback_upvotes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_feedback_messages_updated_at
BEFORE UPDATE ON public.feedback_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();