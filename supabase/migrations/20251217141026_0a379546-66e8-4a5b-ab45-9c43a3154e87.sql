-- Create post_reactions table
CREATE TABLE public.post_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, emoji)
);

-- Create post_comments table
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Reactions policies
CREATE POLICY "Users can view reactions on visible posts"
ON public.post_reactions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.posts p
  WHERE p.id = post_reactions.post_id
  AND (
    p.user_id = auth.uid()
    OR p.visibility = 'public'
    OR (p.visibility = 'friends' AND EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.status = 'accepted'
      AND ((f.requester_id = auth.uid() AND f.addressee_id = p.user_id)
        OR (f.addressee_id = auth.uid() AND f.requester_id = p.user_id))
    ))
  )
));

CREATE POLICY "Users can add reactions"
ON public.post_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their reactions"
ON public.post_reactions FOR DELETE
USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Users can view comments on visible posts"
ON public.post_comments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.posts p
  WHERE p.id = post_comments.post_id
  AND (
    p.user_id = auth.uid()
    OR p.visibility = 'public'
    OR (p.visibility = 'friends' AND EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.status = 'accepted'
      AND ((f.requester_id = auth.uid() AND f.addressee_id = p.user_id)
        OR (f.addressee_id = auth.uid() AND f.requester_id = p.user_id))
    ))
  )
));

CREATE POLICY "Users can add comments"
ON public.post_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their comments"
ON public.post_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their comments"
ON public.post_comments FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at on comments
CREATE TRIGGER update_post_comments_updated_at
BEFORE UPDATE ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;

-- Function to create notification on reaction
CREATE OR REPLACE FUNCTION public.notify_on_reaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_owner_id UUID;
  reactor_name TEXT;
BEGIN
  -- Get post owner
  SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
  
  -- Don't notify if reacting to own post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get reactor name
  SELECT first_name INTO reactor_name FROM profiles WHERE user_id = NEW.user_id;
  
  -- Create notification
  INSERT INTO notifications (user_id, type, title, message, related_user_id, related_content_type, related_content_id)
  VALUES (
    post_owner_id,
    'reaction',
    'New reaction',
    COALESCE(reactor_name, 'Someone') || ' reacted ' || NEW.emoji || ' to your post',
    NEW.user_id,
    'post',
    NEW.post_id
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for reaction notifications
CREATE TRIGGER on_reaction_notify
AFTER INSERT ON public.post_reactions
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_reaction();

-- Function to create notification on comment
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_owner_id UUID;
  commenter_name TEXT;
BEGIN
  -- Get post owner
  SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
  
  -- Don't notify if commenting on own post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get commenter name
  SELECT first_name INTO commenter_name FROM profiles WHERE user_id = NEW.user_id;
  
  -- Create notification
  INSERT INTO notifications (user_id, type, title, message, related_user_id, related_content_type, related_content_id)
  VALUES (
    post_owner_id,
    'comment',
    'New comment',
    COALESCE(commenter_name, 'Someone') || ' commented on your post',
    NEW.user_id,
    'post',
    NEW.post_id
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for comment notifications
CREATE TRIGGER on_comment_notify
AFTER INSERT ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_comment();