-- Allow group creators to add members to their groups (for accepting invite requests)
CREATE POLICY "Group creators can add members" 
ON public.group_members 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_members.group_id 
    AND g.creator_id = auth.uid()
  )
);