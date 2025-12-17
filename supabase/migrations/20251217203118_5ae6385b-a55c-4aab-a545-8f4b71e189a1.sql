-- Create direct_messages table for DMs between users
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own DMs (sent or received)
CREATE POLICY "Users can view their own DMs"
ON public.direct_messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send DMs
CREATE POLICY "Users can send DMs"
ON public.direct_messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Users can update (mark as read) their received DMs
CREATE POLICY "Users can update their received DMs"
ON public.direct_messages
FOR UPDATE
USING (auth.uid() = receiver_id);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;