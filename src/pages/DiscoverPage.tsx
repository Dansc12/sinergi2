import { useState, useRef, useCallback } from "react";
import { Search, MoreHorizontal, Users, UserPlus, Compass } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { usePosts, Post } from "@/hooks/usePosts";
import { formatDistanceToNow } from "date-fns";
import { Json } from "@/integrations/supabase/types";

interface FeedPost {
  id: string;
  user: {
    name: string;
    avatar?: string;
    handle: string;
  };
  content: string;
  images?: string[];
  type: "workout" | "meal" | "recipe" | "post" | "routine";
  stats: {
    likes: number;
    comments: number;
  };
  timeAgo: string;
}

interface SuggestedGroup {
  name: string;
  members: number;
  image: string;
}

interface SuggestedUser {
  name: string;
  avatar?: string;
  handle: string;
  mutualFriends: number;
}

interface FloatingEmoji {
  id: number;
  emoji: string;
  originX: number;
  originY: number;
}

const typeLabels: Record<string, { label: string; color: string }> = {
  workout: { label: "Workout", color: "bg-primary/20 text-primary" },
  meal: { label: "Meal", color: "bg-success/20 text-success" },
  recipe: { label: "Recipe", color: "bg-rose-500/20 text-rose-400" },
  post: { label: "Post", color: "bg-accent/20 text-accent" },
  routine: { label: "Routine", color: "bg-violet-500/20 text-violet-400" },
};

const reactionEmojis = ["🙌", "💯", "❤️", "💪", "🎉"];

const LONG_PRESS_THRESHOLD = 300;
const DOUBLE_TAP_DELAY = 300;

// Helper to generate post description from content data
const generateDescription = (contentType: string, contentData: Json, description: string | null): string => {
  if (description) return description;
  
  const data = contentData as Record<string, unknown>;
  
  switch (contentType) {
    case "workout":
      const exercises = data.exercises as Array<{ name: string }> | undefined;
      if (exercises?.length) {
        return `Completed ${exercises.length} exercise${exercises.length > 1 ? 's' : ''}: ${exercises.map(e => e.name).join(', ')}`;
      }
      return "Logged a workout";
    case "meal":
      const mealType = data.mealType as string | undefined;
      const foods = data.foods as Array<{ name: string }> | undefined;
      if (mealType && foods?.length) {
        return `${mealType}: ${foods.map(f => f.name).join(', ')}`;
      }
      return `Logged a ${mealType || 'meal'}`;
    case "recipe":
      const title = data.title as string | undefined;
      return title ? `Shared a recipe: ${title}` : "Shared a new recipe";
    case "routine":
      const routineName = data.routineName as string | undefined;
      return routineName ? `Created routine: ${routineName}` : "Created a new routine";
    default:
      return "Shared a post";
  }
};

const ImageCarousel = ({ 
  images, 
  onDoubleTap 
}: { 
  images: string[]; 
  onDoubleTap: () => void;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const lastTapRef = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      } else {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    }
  };

  const handleClick = () => {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      onDoubleTap();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const imageContainerClass = "relative aspect-square w-full max-w-[320px] bg-muted rounded-xl overflow-hidden flex-shrink-0";

  if (images.length === 1) {
    return (
      <div className="px-4 py-1 flex justify-center">
        <div 
          className={imageContainerClass}
          onClick={handleClick}
        >
          <img src={images[0]} alt="Post" className="w-full h-full object-cover" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative py-1 px-2">
      <div 
        className="flex items-center justify-center gap-3 overflow-hidden touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-10 h-20 rounded-lg overflow-hidden opacity-30 flex-shrink-0">
          <img 
            src={images[(currentIndex - 1 + images.length) % images.length]} 
            alt="Previous" 
            className="w-full h-full object-cover"
          />
        </div>

        <motion.div 
          key={currentIndex}
          initial={{ opacity: 0.9, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={imageContainerClass}
          onClick={handleClick}
        >
          <img 
            src={images[currentIndex]} 
            alt="Post" 
            className="w-full h-full object-cover"
          />
        </motion.div>

        <div className="w-10 h-20 rounded-lg overflow-hidden opacity-30 flex-shrink-0">
          <img 
            src={images[(currentIndex + 1) % images.length]} 
            alt="Next" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

const PostCard = ({ post }: { post: FeedPost }) => {
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const isLongPressActiveRef = useRef(false);
  const cardRef = useRef<HTMLElement>(null);

  const addReaction = useCallback((emoji: string, originX?: number, originY?: number) => {
    setReactions((prev) => ({
      ...prev,
      [emoji]: (prev[emoji] || 0) + 1,
    }));

    const button = buttonRefs.current[emoji];
    const finalOriginX = originX ?? (button ? button.getBoundingClientRect().left + button.offsetWidth / 2 : window.innerWidth / 2);
    const finalOriginY = originY ?? (button ? button.getBoundingClientRect().top : 200);

    const newEmoji: FloatingEmoji = {
      id: Date.now() + Math.random(),
      emoji,
      originX: finalOriginX,
      originY: finalOriginY,
    };
    setFloatingEmojis((prev) => [...prev, newEmoji]);

    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== newEmoji.id));
    }, 1000);
  }, []);

  const handleDoubleTap = useCallback(() => {
    const cardRect = cardRef.current?.getBoundingClientRect();
    const centerX = cardRect ? cardRect.left + cardRect.width / 2 : window.innerWidth / 2;
    const centerY = cardRect ? cardRect.top + cardRect.height / 2 : 300;
    addReaction("❤️", centerX, centerY);
  }, [addReaction]);

  const startContinuousReactions = useCallback((emoji: string) => {
    addReaction(emoji);
    holdIntervalRef.current = setInterval(() => {
      addReaction(emoji);
    }, 150);
  }, [addReaction]);

  const handlePointerDown = useCallback((emoji: string) => {
    isLongPressActiveRef.current = false;
    
    longPressTimerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      startContinuousReactions(emoji);
    }, LONG_PRESS_THRESHOLD);
  }, [startContinuousReactions]);

  const handlePointerUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    
    isLongPressActiveRef.current = false;
  }, []);

  return (
    <motion.article
      ref={cardRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-card border-b border-border"
    >
      <div className="flex items-center gap-3 p-4">
        <Avatar className="w-10 h-10 border border-border">
          <AvatarImage src={post.user.avatar} />
          <AvatarFallback className="bg-muted">{post.user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">{post.user.name}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${typeLabels[post.type].color}`}>
              {typeLabels[post.type].label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{post.user.handle} • {post.timeAgo}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal size={18} />
        </Button>
      </div>

      {post.images && post.images.length > 0 && (
        <ImageCarousel images={post.images} onDoubleTap={handleDoubleTap} />
      )}

      <div className="relative px-4 py-1.5">
        <AnimatePresence>
          {floatingEmojis.map((floating) => (
            <motion.span
              key={floating.id}
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -60, scale: 1.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="fixed text-2xl pointer-events-none z-50"
              style={{ 
                left: floating.originX, 
                top: floating.originY, 
                transform: "translate(-50%, -50%)" 
              }}
            >
              {floating.emoji}
            </motion.span>
          ))}
        </AnimatePresence>

        <div className="flex items-center justify-center gap-4">
          {reactionEmojis.map((emoji) => (
            <button
              key={emoji}
              ref={(el) => (buttonRefs.current[emoji] = el)}
              onPointerDown={() => handlePointerDown(emoji)}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="relative text-xl p-2 rounded-full hover:bg-muted/50 transition-colors select-none touch-none"
            >
              {emoji}
              {reactions[emoji] > 0 && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-lg border border-background">
                  {reactions[emoji]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-4">
        <p className="text-sm">
          <span className="font-semibold">{post.user.name}</span>{" "}
          {post.content}
        </p>
        {post.stats.comments > 0 && (
          <button className="text-sm text-muted-foreground mt-1">
            View all {post.stats.comments} comments
          </button>
        )}
      </div>
    </motion.article>
  );
};

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

const DiscoverPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { posts, isLoading } = usePosts();
  
  // Transform database posts to FeedPost format
  const feedPosts: FeedPost[] = posts.map((post) => ({
    id: post.id,
    user: {
      name: post.profile?.first_name || "User",
      avatar: post.profile?.avatar_url || undefined,
      handle: post.profile?.username ? `@${post.profile.username}` : "@user",
    },
    content: generateDescription(post.content_type, post.content_data, post.description),
    images: post.images || undefined,
    type: post.content_type as "workout" | "meal" | "recipe" | "post" | "routine",
    stats: {
      likes: 0,
      comments: 0,
    },
    timeAgo: formatDistanceToNow(new Date(post.created_at), { addSuffix: true }),
  }));
  
  // Empty arrays for suggested content
  const suggestedGroups: SuggestedGroup[] = [];
  const suggestedUsers: SuggestedUser[] = [];

  const renderFeed = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    if (feedPosts.length === 0) {
      return <EmptyFeedState />;
    }

    const elements: React.ReactNode[] = [];
    
    feedPosts.forEach((post, index) => {
      elements.push(
        <PostCard key={post.id} post={post} />
      );
      
      if (index === 1 && suggestedGroups.length > 0) {
        elements.push(
          <section key="groups-section" className="bg-card border-b border-border py-4">
            <div className="flex items-center justify-between px-4 mb-3">
              <h3 className="font-semibold">Suggested Groups</h3>
              <button className="text-sm text-primary font-medium">See All</button>
            </div>
            <div className="flex gap-3 overflow-x-auto px-4 hide-scrollbar">
              {suggestedGroups.map((group) => (
                <div key={group.name} className="min-w-[140px] rounded-xl overflow-hidden border border-border bg-background">
                  <img src={group.image} alt={group.name} className="w-full h-20 object-cover" />
                  <div className="p-3">
                    <h4 className="font-semibold text-sm truncate">{group.name}</h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users size={12} />
                      {group.members.toLocaleString()}
                    </p>
                    <Button size="sm" className="w-full mt-2 h-7 text-xs">Join</Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      }
      
      if (index === 3 && suggestedUsers.length > 0) {
        elements.push(
          <section key="users-section" className="bg-card border-b border-border py-4">
            <div className="flex items-center justify-between px-4 mb-3">
              <h3 className="font-semibold">People to Follow</h3>
              <button className="text-sm text-primary font-medium">See All</button>
            </div>
            <div className="flex gap-3 overflow-x-auto px-4 hide-scrollbar">
              {suggestedUsers.map((user) => (
                <div key={user.handle} className="min-w-[140px] rounded-xl border border-border bg-background p-4 flex flex-col items-center text-center">
                  <Avatar className="w-16 h-16 mb-2 border-2 border-primary/30">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="bg-primary/20 text-primary">{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <h4 className="font-semibold text-sm truncate w-full">{user.name}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{user.mutualFriends} mutual friends</p>
                  <Button size="sm" variant="outline" className="w-full h-7 text-xs gap-1">
                    <UserPlus size={14} />
                    Follow
                  </Button>
                </div>
              ))}
            </div>
          </section>
        );
      }
    });
    
    return elements;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass-elevated">
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts, people, groups..."
              className="w-full bg-muted border-0 rounded-xl py-3 pl-12 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </header>

      <div className="animate-fade-in pb-24">
        {renderFeed()}
      </div>
    </div>
  );
};

export default DiscoverPage;
