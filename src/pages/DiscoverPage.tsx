import { useRef, useEffect, useCallback, memo, useState } from "react";
import { Compass, Filter, Dumbbell, Utensils, BookOpen, FileText, CalendarClock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { usePaginatedPosts, FeedPost, PostFilters } from "@/hooks/usePaginatedPosts";
import { formatDistanceToNow } from "date-fns";
import { PostCard } from "@/components/connect/PostCard";
import { cn } from "@/lib/utils";

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

const POST_TYPES = [
  { value: "workout", label: "Workout", icon: Dumbbell },
  { value: "meal", label: "Meal", icon: Utensils },
  { value: "recipe", label: "Recipe", icon: BookOpen },
  { value: "post", label: "Post", icon: FileText },
  { value: "routine", label: "Routine", icon: CalendarClock },
  { value: "group", label: "Group", icon: Users },
];

const DiscoverPage = () => {
  const [filters, setFilters] = useState<PostFilters>({ types: [], visibility: "all" });
  const [showFilters, setShowFilters] = useState(false);
  
  const { posts, isLoading, isLoadingMore, hasMore, loadMore } = usePaginatedPosts(filters);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const isLoadingMoreRef = useRef(isLoadingMore);

  const toggleType = (type: string) => {
    setFilters(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
    }));
  };

  const toggleVisibility = () => {
    setFilters(prev => ({
      ...prev,
      visibility: prev.visibility === "all" ? "friends" : "all"
    }));
  };

  const activeFilterCount = filters.types.length + (filters.visibility === "friends" ? 1 : 0);

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
      {/* Filter Bar */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              showFilters || activeFilterCount > 0
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <Filter size={16} />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-primary-foreground text-primary text-xs px-1.5 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Visibility Toggle */}
          <div className="flex items-center gap-2">
            <span className={cn("text-sm", filters.visibility === "all" ? "text-foreground font-medium" : "text-muted-foreground")}>
              Everyone
            </span>
            <button
              onClick={toggleVisibility}
              className={cn(
                "relative w-12 h-6 rounded-full transition-colors",
                filters.visibility === "friends" ? "bg-primary" : "bg-muted"
              )}
            >
              <div
                className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                  filters.visibility === "friends" ? "translate-x-7" : "translate-x-1"
                )}
              />
            </button>
            <span className={cn("text-sm", filters.visibility === "friends" ? "text-foreground font-medium" : "text-muted-foreground")}>
              Friends
            </span>
          </div>
        </div>

        {/* Type Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
            {POST_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => toggleType(value)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                  filters.types.includes(value)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="animate-fade-in pb-24">
        {renderFeed()}
      </div>
    </div>
  );
};

export default DiscoverPage;
