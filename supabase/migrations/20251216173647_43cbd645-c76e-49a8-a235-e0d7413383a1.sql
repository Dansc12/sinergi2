-- Create posts table for shared content
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  content_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  images TEXT[] DEFAULT '{}'::text[],
  visibility TEXT NOT NULL DEFAULT 'friends',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create their own posts
CREATE POLICY "Users can create their own posts"
ON public.posts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own posts
CREATE POLICY "Users can update their own posts"
ON public.posts
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own posts
CREATE POLICY "Users can delete their own posts"
ON public.posts
FOR DELETE
USING (auth.uid() = user_id);

-- Policy: Users can view posts based on visibility
-- Public posts: everyone can see
-- Friends posts: only friends can see
-- Private posts: only owner can see
CREATE POLICY "Users can view posts based on visibility"
ON public.posts
FOR SELECT
USING (
  -- Own posts always visible
  auth.uid() = user_id
  OR
  -- Public posts visible to all authenticated users
  visibility = 'public'
  OR
  -- Friends-only posts visible to accepted friends
  (
    visibility = 'friends' 
    AND EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.status = 'accepted'
      AND (
        (f.requester_id = auth.uid() AND f.addressee_id = posts.user_id)
        OR
        (f.addressee_id = auth.uid() AND f.requester_id = posts.user_id)
      )
    )
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;