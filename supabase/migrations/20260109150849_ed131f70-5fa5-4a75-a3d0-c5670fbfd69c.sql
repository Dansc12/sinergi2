-- Improve Connect feed performance by indexing posts that qualify for the feed
CREATE INDEX IF NOT EXISTS idx_posts_feed_images_created_at
ON public.posts (created_at DESC, id)
WHERE visibility IN ('public','friends')
  AND images <> '{}'::text[];

-- Recreate get_paginated_posts to avoid RLS-heavy COUNT() queries timing out
-- Uses SECURITY DEFINER but enforces caller identity with auth.uid() to prevent impersonation.
CREATE OR REPLACE FUNCTION public.get_paginated_posts(
  p_user_id uuid,
  p_visibility text DEFAULT 'all'::text,
  p_types text[] DEFAULT NULL::text[],
  p_cursor_created_at timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_cursor_id uuid DEFAULT NULL::uuid,
  p_limit integer DEFAULT 15
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  content_type text,
  content_data jsonb,
  description text,
  images text[],
  visibility text,
  created_at timestamp with time zone,
  author_first_name text,
  author_username text,
  author_avatar_url text,
  like_count bigint,
  comment_count bigint,
  viewer_has_liked boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  WITH viewer AS (
    SELECT auth.uid() AS uid
  )
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
    COALESCE(rc.like_count, 0)::bigint AS like_count,
    COALESCE(cc.comment_count, 0)::bigint AS comment_count,
    EXISTS(
      SELECT 1
      FROM public.post_reactions pr
      WHERE pr.post_id = p.id
        AND pr.user_id = v.uid
    ) AS viewer_has_liked
  FROM viewer v
  JOIN public.posts p ON true
  LEFT JOIN public.profiles prof
    ON prof.user_id = p.user_id
   AND (prof.onboarding_completed = true OR prof.user_id = v.uid)
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::bigint AS like_count
    FROM public.post_reactions pr
    WHERE pr.post_id = p.id
  ) rc ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::bigint AS comment_count
    FROM public.post_comments pc
    WHERE pc.post_id = p.id
  ) cc ON true
  WHERE
    -- Prevent impersonation when calling SECURITY DEFINER
    v.uid IS NOT NULL
    AND p_user_id = v.uid

    -- Must have images
    AND p.images IS NOT NULL
    AND p.images <> '{}'::text[]

    -- Only show explicitly shared content
    AND p.visibility IN ('public', 'friends')

    -- Type filter (optional)
    AND (p_types IS NULL OR p.content_type = ANY(p_types))

    -- Cursor pagination
    AND (
      p_cursor_created_at IS NULL
      OR (p.created_at, p.id) < (p_cursor_created_at, p_cursor_id)
    )

    -- Visibility access check
    AND (
      p.visibility = 'public'
      OR p.user_id = v.uid
      OR (
        p.visibility = 'friends'
        AND EXISTS (
          SELECT 1
          FROM public.friendships f
          WHERE f.status = 'accepted'
            AND (
              (f.requester_id = v.uid AND f.addressee_id = p.user_id)
              OR (f.addressee_id = v.uid AND f.requester_id = p.user_id)
            )
        )
      )
    )
  ORDER BY p.created_at DESC, p.id DESC
  LIMIT p_limit;
$function$;

-- Ensure app role can call it
GRANT EXECUTE ON FUNCTION public.get_paginated_posts(uuid, text, text[], timestamp with time zone, uuid, integer) TO authenticated;