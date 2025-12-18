import { Users, UserPlus, Compass } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { usePosts } from "@/hooks/usePosts";
import { formatDistanceToNow } from "date-fns";
import { PostCard } from "@/components/connect/PostCard";

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
  const { posts, isLoading } = usePosts();
  
  // Transform database posts to format expected by PostCard
  const feedPosts = posts.map((post) => ({
    id: post.id,
    userId: post.user_id,
    user: {
      name: post.profile?.first_name || "User",
      avatar: post.profile?.avatar_url || undefined,
      handle: post.profile?.username ? `@${post.profile.username}` : "@user",
    },
    content: post.description || "",
    images: post.images || undefined,
    type: post.content_type as "workout" | "meal" | "recipe" | "post" | "routine",
    timeAgo: formatDistanceToNow(new Date(post.created_at), { addSuffix: true }),
    contentData: post.content_data,
    hasDescription: !!post.description,
    createdAt: post.created_at,
  }));
  
  // Empty arrays for suggested content
  const suggestedGroups: SuggestedGroup[] = [];
  const suggestedUsers: SuggestedUser[] = [];

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

      <div className="animate-fade-in pb-24">
        {renderFeed()}
      </div>
    </div>
  );
};

export default DiscoverPage;
