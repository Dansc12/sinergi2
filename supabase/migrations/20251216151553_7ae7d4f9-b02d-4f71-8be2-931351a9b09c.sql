-- Add bio column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;

-- Create chat_messages table for group chat messages
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  message_type text NOT NULL DEFAULT 'message', -- 'message', 'system' (for join notifications)
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create chat_read_status to track which messages users have read
CREATE TABLE public.chat_read_status (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  last_read_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, group_id)
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_read_status ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_messages
CREATE POLICY "Users can view messages from groups they're members of"
ON public.chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = chat_messages.group_id
    AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages to groups they're members of"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = chat_messages.group_id
    AND gm.user_id = auth.uid()
  )
);

-- RLS policies for chat_read_status
CREATE POLICY "Users can view their own read status"
ON public.chat_read_status
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own read status"
ON public.chat_read_status
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own read status"
ON public.chat_read_status
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at on chat_read_status
CREATE TRIGGER update_chat_read_status_updated_at
BEFORE UPDATE ON public.chat_read_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;