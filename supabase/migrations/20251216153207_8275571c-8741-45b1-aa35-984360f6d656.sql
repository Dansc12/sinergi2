-- Drop existing restrictive SELECT policy on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new policy that allows viewing own profile fully and other users' public info
CREATE POLICY "Users can view profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id 
  OR (onboarding_completed = true)
);