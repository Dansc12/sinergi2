-- Create groups table
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'friends_only')),
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  avatar_url TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group_members table
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create friendships table
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

-- Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Groups policies (public groups viewable by all, private by members only)
CREATE POLICY "Public groups are viewable by everyone" 
ON public.groups FOR SELECT 
USING (visibility = 'public' OR creator_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.group_members WHERE group_id = id AND user_id = auth.uid()
));

CREATE POLICY "Users can create groups" 
ON public.groups FOR INSERT 
WITH CHECK (auth.uid() = creator_id OR is_system = true);

CREATE POLICY "Group creators can update their groups" 
ON public.groups FOR UPDATE 
USING (auth.uid() = creator_id);

CREATE POLICY "Group creators can delete their groups" 
ON public.groups FOR DELETE 
USING (auth.uid() = creator_id AND is_system = false);

-- Group members policies
CREATE POLICY "Users can view group members of groups they can see" 
ON public.group_members FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.groups g WHERE g.id = group_id AND (g.visibility = 'public' OR g.creator_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.group_members gm WHERE gm.group_id = g.id AND gm.user_id = auth.uid()
  ))
));

CREATE POLICY "Users can join public groups" 
ON public.group_members FOR INSERT 
WITH CHECK (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM public.groups WHERE id = group_id AND visibility = 'public'
));

CREATE POLICY "Users can leave groups" 
ON public.group_members FOR DELETE 
USING (auth.uid() = user_id);

-- Friendships policies
CREATE POLICY "Users can view their own friendships" 
ON public.friendships FOR SELECT 
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can send friend requests" 
ON public.friendships FOR INSERT 
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update friendships they're part of" 
ON public.friendships FOR UPDATE 
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can delete their own friend requests" 
ON public.friendships FOR DELETE 
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Create triggers for updated_at
CREATE TRIGGER update_groups_updated_at
BEFORE UPDATE ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at
BEFORE UPDATE ON public.friendships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the 3 default system groups
INSERT INTO public.groups (slug, name, description, visibility, is_system) VALUES
('consistency-club', 'Consistency Club', 'Daily check-ins, encouragement, and "back on track" energy.', 'public', true),
('protein-meals-made-simple', 'Protein & Meals Made Simple', 'Share meals, protein wins, and easy ideas. Keep it supportive, not strict.', 'public', true),
('move-your-body', 'Move Your Body', 'Workouts, walks, runs, stretching — celebrate showing up.', 'public', true)
ON CONFLICT (slug) DO NOTHING;