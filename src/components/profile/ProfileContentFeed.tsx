import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserPosts, UserPost } from "@/hooks/useUserPosts";
import { PostCard, PostData } from "@/components/connect/PostCard";
import { PostDetailModal } from "@/components/connect/PostDetailModal";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

type ContentType = "posts" | "workouts" | "meals" | "recipes" | "routines";

export interface ProfileContentFeedProps {
  contentType: ContentType;
  onEmptyAction?: () => void;
  emptyState: {
    title: string;
    description: string;
    action: string;
  };
  userId?: string;
  visibility?: 'public' | 'friends';
}

const transformPostToCardData = (post: UserPost, userName: string, userHandle: string, userAvatar?: string): PostData => {
  const contentData = post.content_data as Record<string, unknown>;
  
  // Build display content based on type
  let displayContent = post.description || "";
  
  if (post.content_type === "meal" && !post.description) {
    const mealType = (contentData?.mealType as string) || "Meal";
    const foods = (contentData?.foods as Array<{ name: string }>) || [];
    const foodNames = foods.map(f => f.name).join(", ");
    displayContent = `Logged ${mealType}: ${foodNames}`;
  } else if (post.content_type === "workout" && !post.description) {
    const exercises = (contentData?.exercises as Array<{ name: string }>) || [];
    const exerciseNames = exercises.map(e => e.name).join(", ");
    displayContent = `Completed workout: ${exerciseNames}`;
  } else if (post.content_type === "recipe" && !post.description) {
    const recipeName = (contentData?.name as string) || "Recipe";
    displayContent = `Shared a recipe: ${recipeName}`;
  } else if (post.content_type === "routine" && !post.description) {
    const routineName = (contentData?.name as string) || "Routine";
    displayContent = `Created routine: ${routineName}`;
  }

  return {
    id: post.id,
    userId: post.user_id,
    user: {
      name: userName,
      avatar: userAvatar,
      handle: userHandle,
    },
    content: displayContent,
    images: post.images || undefined,
    type: post.content_type as PostData["type"],
    timeAgo: formatDistanceToNow(new Date(post.created_at), { addSuffix: true }),
    contentData: post.content_data,
    hasDescription: !!post.description,
    createdAt: post.created_at,
  };
};

export const ProfileContentFeed = ({
  contentType,
  onEmptyAction,
  emptyState,
  userId,
  visibility,
}: ProfileContentFeedProps) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  const { posts, isLoading } = useUserPosts(contentType, targetUserId, visibility);
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  const [profile, setProfile] = useState<{ first_name: string | null; username: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!targetUserId) return;
      const { data } = await supabase
        .from("profiles")
        .select("first_name, username, avatar_url")
        .eq("user_id", targetUserId)
        .single();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, [targetUserId]);

  const isOwnProfile = user?.id === targetUserId;
  const userName = profile?.first_name || (isOwnProfile ? "You" : "User");
  const userHandle = profile?.username ? `@${profile.username}` : (isOwnProfile ? "@you" : "@user");
  const userAvatar = profile?.avatar_url || undefined;

  if (isLoading) {
    return (
      <div className="col-span-3 py-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="col-span-3 py-12 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Plus size={24} className="text-muted-foreground" />
        </div>
        <p className="font-medium mb-1">{emptyState.title}</p>
        <p className="text-sm text-muted-foreground mb-4 max-w-[200px]">
          {emptyState.description}
        </p>
        {onEmptyAction && emptyState.action && (
          <Button size="sm" variant="outline" onClick={onEmptyAction}>
            {emptyState.action}
          </Button>
        )}
      </div>
    );
  }

  const cardPosts = posts.map((post) =>
    transformPostToCardData(post, userName, userHandle, userAvatar)
  );

  return (
    <>
      <div className="col-span-3 space-y-0 -mx-4">
        {cardPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onPostClick={(p) => setSelectedPost(p)}
          />
        ))}
      </div>

      {selectedPost && (
        <PostDetailModal
          open={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          post={selectedPost}
        />
      )}
    </>
  );
};
