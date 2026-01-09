# Fix Summary: get_paginated_posts RPC Function

## Problem
The Connect/Discover feed was broken due to multiple conflicting migration files that created different versions of the `get_paginated_posts` function with incompatible signatures.

## Root Cause
Four migration files (20260109135545 through 20260109141625) each dropped and recreated the function with different WHERE clauses and parameters:
1. **20260109135545**: Used `SECURITY DEFINER` with emoji filter for reactions
2. **20260109140758**: Required images to be present
3. **20260109141353**: Only showed `content_type='post'`
4. **20260109141625**: Excluded private posts

A fifth migration (20260109155141) added the `p_images_only` parameter which the TypeScript hook was already using, but the earlier conflicting migrations were causing issues.

## Solution Implemented

### Migration 20260109183253_352a9f0b-8872-4f89-934c-03f623dcf118.sql

Created a **consolidated migration** that:

1. **Drops all existing versions** of the function (both with and without the boolean parameter)
2. **Creates one definitive version** based on the latest migration (20260109155141) with:
   - All 7 parameters including `p_images_only`
   - Proper return signature matching TypeScript expectations
   - Efficient query using LATERAL joins for counts
   - Security check to prevent impersonation (`v.uid IS NOT NULL` and `p_user_id = v.uid`)
   - Visibility filtering (public/friends only, no private posts)
   - Friends-only access control via friendships table
   - Cursor-based pagination
   - Optional image filtering
   
3. **Creates all necessary indexes** for optimal performance:
   - Posts: created_at DESC + id DESC composite, visibility, user_id, content_type
   - Post reactions: post_id, user_id, composite (post_id, user_id)
   - Post comments: post_id
   - Friendships: status, conditional indexes for accepted friendships
   - Profiles: user_id

4. **Grants execute permission** to authenticated users

### Function Signature
```sql
get_paginated_posts(
  p_user_id uuid,
  p_visibility text DEFAULT 'all',
  p_types text[] DEFAULT NULL,
  p_cursor_created_at timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 15,
  p_images_only boolean DEFAULT false
)
```

### Return Columns
- id, user_id, content_type, content_data, description, images, visibility, created_at
- author_first_name, author_username, author_avatar_url
- like_count, comment_count, viewer_has_liked

### Key Features
1. **Security**: Uses SECURITY DEFINER with impersonation prevention
2. **Performance**: LATERAL joins for efficient count aggregation
3. **Visibility**: Only shows public/friends posts (no private)
4. **Access Control**: Friends-only posts require accepted friendship
5. **Pagination**: Efficient cursor-based pagination
6. **Flexibility**: Optional filtering by content types and images

## TypeScript Hook (usePaginatedPosts.ts)

**No changes needed** - The hook was already correctly using:
- `p_images_only` parameter (line 116)
- Proper error handling with retry logic
- Timeout handling with AbortController
- Cache management
- Optimistic updates

The hook already has:
- 10-second timeout with retry (max 1 retry)
- Proper error messages for users
- Graceful degradation on failures

## Expected Behavior After Fix

✅ Feed loads within 5 seconds  
✅ Infinite scroll works smoothly  
✅ No "Failed to load posts" error on refresh  
✅ Timeout errors handled gracefully with retry button  
✅ Proper engagement counts (likes/comments)  
✅ Correct visibility filtering  
✅ Efficient database queries with proper indexes  

## Verification

- ✅ TypeScript compiles successfully (`npm run build`)
- ✅ No new linting errors introduced
- ✅ Migration syntax is valid SQL
- ✅ All indexes are idempotent (CREATE INDEX IF NOT EXISTS)
- ✅ Function drops are safe (DROP FUNCTION IF EXISTS)

## Files Changed

1. **New**: `supabase/migrations/20260109183253_352a9f0b-8872-4f89-934c-03f623dcf118.sql` (140 lines)
   - Consolidated migration that fixes all conflicts

## No Changes Needed To

1. `src/hooks/usePaginatedPosts.ts` - Already correctly implemented
2. `src/pages/DiscoverPage.tsx` - Already has proper error handling and retry UI

## Testing Recommendations

1. Apply migration to database
2. Test feed loading on DiscoverPage
3. Verify infinite scroll works
4. Test visibility filtering (public vs friends-only posts)
5. Verify engagement counts are accurate
6. Test error handling by simulating network issues

## Performance Notes

The function uses:
- LATERAL joins instead of correlated subqueries for better performance
- Composite indexes for optimal cursor pagination
- Conditional indexes on friendships for faster friend lookups
- `STABLE SECURITY DEFINER` for efficient query planning
