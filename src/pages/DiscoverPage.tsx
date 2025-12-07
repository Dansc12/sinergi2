import { useState } from "react";
import { Search, HandMetal, MessageCircle, ClipboardList, Share2, MoreHorizontal, Users, UserPlus, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface FeedPost {
  id: string;
  user: {
    name: string;
    avatar?: string;
    handle: string;
  };
  content: string;
  image?: string;
  type: "workout" | "meal" | "recipe" | "post";
  stats: {
    likes: number;
    comments: number;
  };
  liked: boolean;
  saved: boolean;
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
    image: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600",
    type: "workout",
    stats: { likes: 142, comments: 28 },
    liked: false,
    saved: false,
    timeAgo: "2h"
  },
  {
    id: "2",
    user: { name: "Mike Johnson", handle: "@mikej", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" },
    content: "Meal prep Sunday complete! 🥗 Got my protein-packed lunches ready for the week. Sharing the recipe in my stories!",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600",
    type: "meal",
    stats: { likes: 89, comments: 15 },
    liked: true,
    saved: false,
    timeAgo: "4h"
  },
  {
    id: "3",
    user: { name: "Emma Wilson", handle: "@emmawellness", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100" },
    content: "Morning yoga flow to start the day right ☀️🧘‍♀️ Remember: progress, not perfection!",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600",
    type: "post",
    stats: { likes: 234, comments: 42 },
    liked: false,
    saved: true,
    timeAgo: "5h"
  },
  {
    id: "4",
    user: { name: "Alex Rivera", handle: "@alexlifts", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100" },
    content: "New PR on deadlift today! 💪 315 lbs felt smooth. Thanks to everyone in the powerlifting group for the tips!",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600",
    type: "workout",
    stats: { likes: 312, comments: 67 },
    liked: false,
    saved: false,
    timeAgo: "6h"
  },
  {
    id: "5",
    user: { name: "Sofia Garcia", handle: "@sofiacooks", avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100" },
    content: "Made this high-protein overnight oats recipe! Perfect for busy mornings. Full recipe in my profile 🥣",
    image: "https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=600",
    type: "recipe",
    stats: { likes: 178, comments: 34 },
    liked: false,
    saved: false,
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

const PostCard = ({ post, onLike, onSave }: { post: FeedPost; onLike: () => void; onSave: () => void }) => (
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

    {/* Image */}
    {post.image && (
      <div className="px-4 py-2">
        <div className="relative aspect-square bg-muted rounded-2xl overflow-hidden">
          <img src={post.image} alt="Post" className="w-full h-full object-cover" />
        </div>
      </div>
    )}

    {/* Actions */}
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-4">
        <button onClick={onLike} className="flex items-center gap-1.5 group">
          <HandMetal
            size={24}
            className={`transition-colors ${post.liked ? "fill-primary text-primary" : "text-foreground group-hover:text-primary"}`}
          />
        </button>
        <button className="flex items-center gap-1.5 group">
          <MessageCircle size={24} className="text-foreground group-hover:text-primary transition-colors" />
        </button>
        <button className="flex items-center gap-1.5 group">
          <Share2 size={24} className="text-foreground group-hover:text-primary transition-colors" />
        </button>
      </div>
      <button onClick={onSave}>
        <ClipboardList
          size={24}
          className={`transition-colors ${post.saved ? "text-primary" : "text-foreground hover:text-primary"}`}
        />
      </button>
    </div>

    {/* Stats & Content */}
    <div className="px-4 pb-4">
      <p className="font-semibold text-sm mb-1">{post.stats.likes.toLocaleString()} likes</p>
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
  const [posts, setPosts] = useState(feedPosts);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLike = (postId: string) => {
    setPosts(posts.map(post =>
      post.id === postId
        ? { ...post, liked: !post.liked, stats: { ...post.stats, likes: post.liked ? post.stats.likes - 1 : post.stats.likes + 1 } }
        : post
    ));
  };

  const handleSave = (postId: string) => {
    setPosts(posts.map(post =>
      post.id === postId ? { ...post, saved: !post.saved } : post
    ));
  };

  // Insert suggestion sections after certain posts
  const renderFeedWithSuggestions = () => {
    const elements: React.ReactNode[] = [];
    
    posts.forEach((post, index) => {
      elements.push(
        <PostCard
          key={post.id}
          post={post}
          onLike={() => handleLike(post.id)}
          onSave={() => handleSave(post.id)}
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
    <div className="min-h-screen bg-background">
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
