-- Update the function to only show explicitly shared posts (content_type = 'post')
DROP FUNCTION IF EXISTS public.get_paginated_posts;

CREATE OR REPLACE FUNCTION public.get_paginated_posts(
  p_user_id UUID,
  p_visibility TEXT DEFAULT 'all',
  p_types TEXT[] DEFAULT NULL,
  p_cursor_created_at TIMESTAMPTZ DEFAULT NULL,
  p_cursor_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 15
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  content_type TEXT,
  content_data JSONB,
  description TEXT,
  images TEXT[],
  visibility TEXT,
  created_at TIMESTAMPTZ,
  author_first_name TEXT,
  author_username TEXT,
  author_avatar_url TEXT,
  like_count BIGINT,
  comment_count BIGINT,
  viewer_has_liked BOOLEAN
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.content_type,
    p.content_data,
    p.description,
    p.images,
    p.visibility,
    p.created_at,
    COALESCE(prof.first_name, prof.display_name, 'User') AS author_first_name,
    prof.username AS author_username,
    prof.avatar_url AS author_avatar_url,
    (SELECT COUNT(*) FROM post_reactions pr WHERE pr.post_id = p.id)::BIGINT AS like_count,
    (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id)::BIGINT AS comment_count,
    EXISTS(SELECT 1 FROM post_reactions pr WHERE pr.post_id = p.id AND pr.user_id = p_user_id) AS viewer_has_liked
  FROM posts p
  LEFT JOIN profiles prof ON prof.user_id = p.user_id
  WHERE 
    -- ONLY show explicitly shared posts (content_type = 'post')
    p.content_type = 'post'
    -- Must have images
    AND p.images IS NOT NULL AND array_length(p.images, 1) > 0
    -- Type filter (for filtering by attached content type if needed)
    AND (p_types IS NULL OR p.content_type = ANY(p_types))
    -- Cursor pagination
    AND (
      p_cursor_created_at IS NULL 
      OR (p.created_at, p.id) < (p_cursor_created_at, p_cursor_id)
    )
    -- Visibility: public posts or friends-only from actual friends
    AND (
      p.visibility = 'public'
      OR p.user_id = p_user_id
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
$$;