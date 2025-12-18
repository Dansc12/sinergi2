import { useRef, useEffect, useCallback, memo } from "react";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { usePaginatedPosts, FeedPost } from "@/hooks/usePaginatedPosts";
import { formatDistanceToNow } from "date-fns";
import { PostCard } from "@/components/connect/PostCard";

const EmptyFeedState = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Compass size={40} className="text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No Posts Yet</h3>
      <p className="text-muted-foreground mb-6 max-w-[280px]">
        Be the first to share your fitness journey! Log a workout or meal and share it with the community.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-[200px]">
        <Button onClick={() => navigate("/create/workout")} className="w-full">
          Log a Workout
        </Button>
        <Button variant="outline" onClick={() => navigate("/create/meal")} className="w-full">
          Log a Meal
        </Button>
      </div>
    </div>
  );
};

interface PostData {
  id: string;
  userId: string;
  user: {
    name: string;
    avatar?: string;
    handle: string;
  };
  content: string;
  images?: string[];
  type: "workout" | "meal" | "recipe" | "post" | "routine" | "group";
  timeAgo: string;
  contentData: unknown;
  hasDescription: boolean;
  createdAt: string;
}

const transformPost = (post: FeedPost): PostData => ({
  id: post.id,
  userId: post.user_id,
  user: {
    name: post.profile?.first_name || "User",
    avatar: post.profile?.avatar_url || undefined,
    handle: post.profile?.username ? `@${post.profile.username}` : "@user",
  },
  content: post.description || "",
  images: post.images || undefined,
  type: post.content_type as PostData["type"],
  timeAgo: formatDistanceToNow(new Date(post.created_at), { addSuffix: true }),
  contentData: post.content_data,
  hasDescription: !!post.description,
  createdAt: post.created_at,
});

// Memoized post card to prevent unnecessary re-renders
const MemoizedPostCard = memo(({ post }: { post: PostData }) => (
  <PostCard post={post} />
));
MemoizedPostCard.displayName = "MemoizedPostCard";

const DiscoverPage = () => {
  const { posts, isLoading, isLoadingMore, hasMore, loadMore } = usePaginatedPosts();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const isLoadingMoreRef = useRef(isLoadingMore);

  // Keep ref in sync with state
  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore;
  }, [isLoadingMore]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMoreRef.current) {
          loadMore();
        }
      },
      { rootMargin: "300px" }
    );

    if (loadMoreTriggerRef.current) {
      observerRef.current.observe(loadMoreTriggerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadMore]);

  // Transform posts for display
  const feedPosts = posts.map(transformPost);

  const renderFeed = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground text-sm">Loading posts...</p>
        </div>
      );
    }
    
    if (feedPosts.length === 0) {
      return <EmptyFeedState />;
    }

    return (
      <>
        {feedPosts.map((post) => (
          <MemoizedPostCard key={post.id} post={post} />
        ))}
        
        {/* Load more trigger - invisible element that triggers loading when scrolled into view */}
        <div ref={loadMoreTriggerRef} className="h-1" />
        
        {/* Loading indicator */}
        {isLoadingMore && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        )}
        
        {/* End of feed message */}
        {!hasMore && posts.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">You're all caught up! 🎉</p>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="animate-fade-in pb-24">
        {renderFeed()}
      </div>
    </div>
  );
};

export default DiscoverPage;
