-- Remove the UNIQUE constraint to allow unlimited reactions per user per emoji
ALTER TABLE public.post_reactions DROP CONSTRAINT IF EXISTS post_reactions_post_id_user_id_emoji_key;