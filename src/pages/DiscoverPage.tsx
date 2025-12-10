import { useState, useRef, useCallback } from "react";
import { Search, MoreHorizontal, Users, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface FeedPost {
  id: string;
  user: {
    name: string;
    avatar?: string;
    handle: string;
  };
  content: string;
  images?: string[];
  type: "workout" | "meal" | "recipe" | "post";
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

const feedPosts: FeedPost[] = [
  {
    id: "1",
    user: { name: "Sarah Chen", handle: "@sarahfitness", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" },
    content: "Just crushed my first 5K in under 25 minutes! 🏃‍♀️ All those morning runs are finally paying off. Who else is training for a race?",
    images: [
      "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600",
      "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600",
      "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600"
    ],
    type: "workout",
    timeAgo: "2h"
  },
  {
    id: "2",
    user: { name: "Mike Johnson", handle: "@mikej", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" },
    content: "Meal prep Sunday complete! 🥗 Got my protein-packed lunches ready for the week. Sharing the recipe in my stories!",
    images: ["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600"],
    type: "meal",
    timeAgo: "4h"
  },
  {
    id: "3",
    user: { name: "Emma Wilson", handle: "@emmawellness", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100" },
    content: "Morning yoga flow to start the day right ☀️🧘‍♀️ Remember: progress, not perfection!",
    images: [
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600",
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600"
    ],
    type: "post",
    timeAgo: "5h"
  },
  {
    id: "4",
    user: { name: "Alex Rivera", handle: "@alexlifts", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100" },
    content: "New PR on deadlift today! 💪 315 lbs felt smooth. Thanks to everyone in the powerlifting group for the tips!",
    images: ["https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600"],
    type: "workout",
    timeAgo: "6h"
  },
  {
    id: "5",
    user: { name: "Sofia Garcia", handle: "@sofiacooks", avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100" },
    content: "Made this high-protein overnight oats recipe! Perfect for busy mornings. Full recipe in my profile 🥣",
    images: ["https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=600"],
    type: "recipe",
    timeAgo: "8h"
  },
];

const suggestedGroups: SuggestedGroup[] = [
  { name: "Weightlifting", members: 2340, image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300" },
  { name: "Morning Yoga", members: 1850, image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300" },
  { name: "Running Club", members: 3200, image: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=300" },
  { name: "Meal Prep", members: 1560, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300" },
];

const suggestedUsers: SuggestedUser[] = [
  { name: "James Park", handle: "@jamesfit", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100", mutualFriends: 5 },
  { name: "Lily Zhang", handle: "@lilylifts", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100", mutualFriends: 3 },
  { name: "Marcus Johnson", handle: "@marcusmoves", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100", mutualFriends: 8 },
];

const typeLabels = {
  workout: { label: "Workout", color: "bg-primary/20 text-primary" },
  meal: { label: "Meal", color: "bg-success/20 text-success" },
  recipe: { label: "Recipe", color: "bg-rose-500/20 text-rose-400" },
  post: { label: "Post", color: "bg-accent/20 text-accent" },
};

const reactionEmojis = ["🙌", "💯", "❤️", "💪", "🎉"];

interface FloatingReaction {
  id: number;
  emoji: string;
}

const ReactionButton = ({ 
  emoji, 
  count,
  onReact 
}: { 
  emoji: string; 
  count: number;
  onReact: () => void;
}) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const reactionIdRef = useRef(0);

  const triggerAnimation = useCallback(() => {
    const id = reactionIdRef.current++;
    setFloatingReactions(prev => [...prev, { id, emoji }]);
    
    // Remove the reaction after animation completes
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== id));
    }, 800);
  }, [emoji]);

  const startReacting = useCallback(() => {
    setIsPressed(true);
    onReact();
    triggerAnimation();
    intervalRef.current = setInterval(() => {
      onReact();
      triggerAnimation();
    }, 100);
  }, [onReact, triggerAnimation]);

  const stopReacting = useCallback(() => {
    setIsPressed(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return (
    <div className="relative">
      {/* Floating animations */}
      <AnimatePresence>
        {floatingReactions.map((reaction) => (
          <motion.span
            key={reaction.id}
            className="absolute left-1/2 -translate-x-1/2 text-xl pointer-events-none z-10"
            initial={{ opacity: 1, y: 0, scale: 0.8 }}
            animate={{ 
              opacity: 0, 
              y: -40, 
              scale: 1.2,
              x: Math.random() * 20 - 10 
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {reaction.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
      
      {/* Counter badge */}
      {count > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center justify-center px-1 z-10"
        >
          {count > 99 ? "99+" : count}
        </motion.span>
      )}
      
      <motion.button
        className={`flex items-center justify-center w-14 h-14 rounded-full transition-colors select-none ${
          isPressed ? "bg-primary/20" : "hover:bg-muted"
        }`}
        onMouseDown={startReacting}
        onMouseUp={stopReacting}
        onMouseLeave={stopReacting}
        onTouchStart={startReacting}
        onTouchEnd={stopReacting}
        whileTap={{ scale: 1.2 }}
      >
        <span className="text-2xl opacity-80 hover:opacity-100 transition-opacity">{emoji}</span>
      </motion.button>
    </div>
  );
};

const ImageCarousel = ({ images }: { images: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number>(0);
  const touchEndXRef = useRef<number>(0);

  // Image dimensions - consistent for all posts
  const imageWidthPercent = 80;
  const gapPercent = 4;
  const sideOffset = (100 - imageWidthPercent) / 2; // 10%

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartXRef.current - touchEndXRef.current;
    const threshold = 50;
    
    if (diff > threshold) {
      // Swiped left - go to next
      setCurrentIndex(prev => Math.min(prev + 1, images.length - 1));
    } else if (diff < -threshold) {
      // Swiped right - go to previous
      setCurrentIndex(prev => Math.max(prev - 1, 0));
    }
  };
  
  // For single image, still use the same centered layout
  if (images.length === 1) {
    return (
      <div className="flex justify-center">
        <div style={{ width: `${imageWidthPercent}%` }}>
          <div className="aspect-[4/3] bg-muted rounded-xl overflow-hidden">
            <img src={images[0]} alt="Post" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    );
  }

  // Calculate the position for each image to be centered
  // Using CSS calc to ensure proper viewport-relative positioning
  // Each image position: sideOffset + index * (imageWidth + gap)
  // To center current image, shift left by: currentIndex * (imageWidth + gap)
  const shiftAmount = currentIndex * (imageWidthPercent + gapPercent);

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="flex transition-transform duration-300 ease-out"
        style={{ 
          marginLeft: `${sideOffset}%`,
          gap: `${gapPercent}%`,
          transform: `translateX(calc(-${shiftAmount}% * (100vw - 32px) / 100))`,
        }}
      >
        {images.map((image, index) => (
          <div 
            key={index} 
            className="flex-shrink-0"
            style={{ width: `calc(${imageWidthPercent}% * (100vw - 32px) / 100)` }}
          >
            <div className="aspect-[4/3] bg-muted rounded-xl overflow-hidden">
              <img src={image} alt={`Post ${index + 1}`} className="w-full h-full object-cover" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

type ReactionCounts = Record<string, number>;

const PostCard = ({ post }: { post: FeedPost }) => {
  const [reactionCounts, setReactionCounts] = useState<ReactionCounts>(() => 
    reactionEmojis.reduce((acc, emoji) => ({ ...acc, [emoji]: 0 }), {})
  );

  const handleReact = useCallback((emoji: string) => {
    setReactionCounts(prev => ({
      ...prev,
      [emoji]: prev[emoji] + 1
    }));
  }, []);
  
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border-b border-border"
    >
      {/* Header */}
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

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <div className="px-4 py-2">
          <ImageCarousel images={post.images} />
        </div>
      )}

      {/* Reactions */}
      <div className="flex items-center justify-center gap-6 p-4">
        {reactionEmojis.map((emoji) => (
          <ReactionButton
            key={emoji}
            emoji={emoji}
            count={reactionCounts[emoji]}
            onReact={() => handleReact(emoji)}
          />
        ))}
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <p className="text-sm">
          <span className="font-semibold">{post.user.name}</span>{" "}
          {post.content}
        </p>
      </div>
    </motion.article>
  );
};

const SuggestedGroupsSection = () => (
  <section className="bg-card border-b border-border py-4">
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

const SuggestedUsersSection = () => (
  <section className="bg-card border-b border-border py-4">
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

const DiscoverPage = () => {
  const [posts] = useState(feedPosts);
  const [searchQuery, setSearchQuery] = useState("");

  // Insert suggestion sections after certain posts
  const renderFeedWithSuggestions = () => {
    const elements: React.ReactNode[] = [];
    
    posts.forEach((post, index) => {
      elements.push(
        <PostCard
          key={post.id}
          post={post}
        />
      );
      
      // Insert suggested groups after 2nd post
      if (index === 1) {
        elements.push(<SuggestedGroupsSection key="groups-section" />);
      }
      
      // Insert suggested users after 4th post
      if (index === 3) {
        elements.push(<SuggestedUsersSection key="users-section" />);
      }
    });
    
    return elements;
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-elevated">
        <div className="px-4 py-3">
          <h1 className="text-2xl font-bold">Connect</h1>
        </div>
        
        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts, groups, people..."
              className="w-full bg-muted border-0 rounded-xl py-2.5 pl-11 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </header>

      {/* Feed */}
      <div className="animate-fade-in">
        {renderFeedWithSuggestions()}
      </div>
    </div>
  );
};

export default DiscoverPage;
