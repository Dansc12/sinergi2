import { Heart, MessageCircle, Share2, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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

const typeLabels = {
  workout: { label: "Workout", color: "bg-primary/20 text-primary" },
  meal: { label: "Meal", color: "bg-success/20 text-success" },
  post: { label: "Post", color: "bg-accent/20 text-accent" },
};

const EmptyFeedState = () => {
  const navigate = useNavigate();
  
  return (
    <div className="bg-card border border-border rounded-2xl p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
        <Users size={24} className="text-primary" />
      </div>
      <h3 className="font-semibold mb-1">No Friend Activity</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Connect with friends to see their fitness journey
      </p>
      <Button size="sm" onClick={() => navigate("/discover")}>
        Find Friends
      </Button>
    </div>
  );
};

export const FriendFeed = () => {
  // Empty array - will be populated from real friend posts
  const feedPosts: FeedPost[] = [];

  return (
    <section className="px-4 py-4">
      <h2 className="text-lg font-semibold mb-3">Friend Activity</h2>
      
      {feedPosts.length === 0 ? (
        <EmptyFeedState />
      ) : (
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
      )}
    </section>
  );
};
