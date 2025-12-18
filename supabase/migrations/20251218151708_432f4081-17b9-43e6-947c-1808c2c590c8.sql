-- Create table for tracking group join requests
CREATE TABLE public.group_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Enable RLS
ALTER TABLE public.group_join_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests and group owners can view requests for their groups
CREATE POLICY "Users can view their own requests"
ON public.group_join_requests
FOR SELECT
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM groups g WHERE g.id = group_join_requests.group_id AND g.creator_id = auth.uid()
  )
);

-- Users can create join requests
CREATE POLICY "Users can create join requests"
ON public.group_join_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own requests, group owners can update request status
CREATE POLICY "Users can delete their requests"
ON public.group_join_requests
FOR DELETE
USING (auth.uid() = user_id);

-- Group owners can update requests (accept/reject)
CREATE POLICY "Group owners can update requests"
ON public.group_join_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM groups g WHERE g.id = group_join_requests.group_id AND g.creator_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_group_join_requests_updated_at
BEFORE UPDATE ON public.group_join_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();