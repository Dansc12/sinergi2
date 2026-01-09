-- Create a function to get paginated posts with reaction/comment counts and viewer's like status
CREATE OR REPLACE FUNCTION public.get_paginated_posts(
  p_user_id uuid,
  p_visibility text DEFAULT 'all',
  p_types text[] DEFAULT NULL,
  p_cursor_created_at timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 15
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  content_type text,
  content_data jsonb,
  description text,
  images text[],
  visibility text,
  created_at timestamptz,
  like_count bigint,
  comment_count bigint,
  viewer_has_liked boolean,
  author_first_name text,
  author_username text,
  author_avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.content_type,
    p.content_data,
    p.description,
    p.images,
    p.visibility,
    p.created_at,
    COALESCE((SELECT COUNT(*) FROM post_reactions pr WHERE pr.post_id = p.id AND pr.emoji = '❤️'), 0) AS like_count,
    COALESCE((SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id), 0) AS comment_count,
    EXISTS(SELECT 1 FROM post_reactions pr WHERE pr.post_id = p.id AND pr.user_id = p_user_id AND pr.emoji = '❤️') AS viewer_has_liked,
    prof.first_name AS author_first_name,
    prof.username AS author_username,
    prof.avatar_url AS author_avatar_url
  FROM posts p
  LEFT JOIN profiles prof ON prof.user_id = p.user_id
  WHERE 
    -- Visibility filter
    (
      p_visibility = 'all' AND p.visibility != 'private'
      OR p_visibility = 'friends' AND p.visibility = 'friends'
      OR p.user_id = p_user_id
    )
    -- Type filter
    AND (p_types IS NULL OR p.content_type = ANY(p_types))
    -- Cursor-based pagination
    AND (
      p_cursor_created_at IS NULL 
      OR p.created_at < p_cursor_created_at 
      OR (p.created_at = p_cursor_created_at AND p.id < p_cursor_id)
    )
    -- RLS-like visibility check for friends
    AND (
      p.user_id = p_user_id
      OR p.visibility = 'public'
      OR (
        p.visibility = 'friends' 
        AND EXISTS (
          SELECT 1 FROM friendships f
          WHERE f.status = 'accepted'
          AND (
            (f.requester_id = p_user_id AND f.addressee_id = p.user_id)
            OR (f.addressee_id = p_user_id AND f.requester_id = p.user_id)
          )
        )
      )
    )
  ORDER BY p.created_at DESC, p.id DESC
  LIMIT p_limit;
END;
$$;