import { Heart, MessageCircle, Share2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface FeedPost {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  content: string;
  image?: string;
  type: "workout" | "meal" | "post";
  stats: {
    likes: number;
    comments: number;
  };
  timeAgo: string;
}

const feedPosts: FeedPost[] = [
  {
    id: "1",
    user: {
      name: "Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"
    },
    content: "Just crushed my first 5K in under 25 minutes! 🏃‍♀️ All those morning runs are finally paying off.",
    type: "workout",
    stats: { likes: 42, comments: 8 },
    timeAgo: "2h ago"
  },
  {
    id: "2",
    user: {
      name: "Mike Johnson",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"
    },
    content: "Meal prep Sunday! 🥗 Got my protein-packed lunches ready for the week.",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
    type: "meal",
    stats: { likes: 28, comments: 5 },
    timeAgo: "4h ago"
  },
  {
    id: "3",
    user: {
      name: "Alex Rivera",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100"
    },
    content: "New PR on deadlift today! 💪 315 lbs felt smooth. Thanks to everyone in the powerlifting group for the tips!",
    type: "workout",
    stats: { likes: 67, comments: 12 },
    timeAgo: "5h ago"
  }
];

const typeLabels = {
  workout: { label: "Workout", color: "bg-primary/20 text-primary" },
  meal: { label: "Meal", color: "bg-success/20 text-success" },
  post: { label: "Post", color: "bg-accent/20 text-accent" },
};

export const FriendFeed = () => {
  return (
    <section className="px-4 py-4">
      <h2 className="text-lg font-semibold mb-3">Friend Activity</h2>
      
      <div className="space-y-4">
        {feedPosts.map((post) => (
          <article
            key={post.id}
            className="bg-card border border-border rounded-2xl p-4 shadow-card"
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={post.user.avatar} />
                <AvatarFallback className="bg-muted">
                  {post.user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-sm">{post.user.name}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${typeLabels[post.type].color}`}>
                    {typeLabels[post.type].label}
                  </span>
                  <span className="text-xs text-muted-foreground">{post.timeAgo}</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <p className="text-sm mb-3 leading-relaxed">{post.content}</p>

            {/* Image */}
            {post.image && (
              <div className="mb-3 -mx-4">
                <img 
                  src={post.image} 
                  alt="Post content" 
                  className="w-full aspect-video object-cover"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 pt-2 border-t border-border">
              <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                <Heart size={18} />
                <span className="text-sm">{post.stats.likes}</span>
              </button>
              <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                <MessageCircle size={18} />
                <span className="text-sm">{post.stats.comments}</span>
              </button>
              <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors ml-auto">
                <Share2 size={18} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
