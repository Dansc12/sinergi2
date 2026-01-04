-- Create shared_posts table to store posts shared directly to groups and users
CREATE TABLE public.shared_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  recipient_user_id UUID, -- For direct shares to users
  recipient_group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE, -- For shares to groups
  message TEXT, -- Optional message with the share
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Either recipient_user_id or recipient_group_id must be set
  CONSTRAINT shared_posts_recipient_check CHECK (
    (recipient_user_id IS NOT NULL AND recipient_group_id IS NULL) OR
    (recipient_user_id IS NULL AND recipient_group_id IS NOT NULL)
  )
);

-- Enable Row Level Security
ALTER TABLE public.shared_posts ENABLE ROW LEVEL SECURITY;

-- Users can view shared posts they sent or received (or in groups they're members of)
CREATE POLICY "Users can view shared posts they're involved in"
ON public.shared_posts
FOR SELECT
USING (
  auth.uid() = sender_id OR 
  auth.uid() = recipient_user_id OR
  (recipient_group_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_members.group_id = shared_posts.recipient_group_id 
    AND group_members.user_id = auth.uid()
  ))
);

-- Users can create shared posts
CREATE POLICY "Users can create shared posts"
ON public.shared_posts
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Users can delete their own shared posts
CREATE POLICY "Users can delete their own shared posts"
ON public.shared_posts
FOR DELETE
USING (auth.uid() = sender_id);

-- Enable realtime for shared_posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_posts;

-- Create indexes for efficient queries
CREATE INDEX idx_shared_posts_recipient_user ON public.shared_posts(recipient_user_id) WHERE recipient_user_id IS NOT NULL;
CREATE INDEX idx_shared_posts_recipient_group ON public.shared_posts(recipient_group_id) WHERE recipient_group_id IS NOT NULL;
CREATE INDEX idx_shared_posts_sender ON public.shared_posts(sender_id);
CREATE INDEX idx_shared_posts_created_at ON public.shared_posts(created_at DESC);