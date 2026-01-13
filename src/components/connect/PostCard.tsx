import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Send, Heart, Dumbbell, Utensils, ChefHat, ClipboardList, FileText, Users, UserPlus, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { usePostReactions } from "@/hooks/usePostReactions";
import { usePostComments } from "@/hooks/usePostComments";
import { formatDistanceToNow } from "date-fns";
import { PostDetailModal } from "./PostDetailModal";
import { LazyImage } from "@/components/LazyImage";

interface FloatingEmoji {
  id: number;
  emoji: string;
  originX: number;
  originY: number;
}

const DOUBLE_TAP_DELAY = 300;

export interface PostData {
  id: string;
  userId?: string;
  user: {
    name: string;
    avatar?: string;
    handle: string;
  };
  content: string;
  images?: string[];
  type: "workout" | "meal" | "recipe" | "post" | "routine" | "group";
  timeAgo: string;
  contentData?: unknown;
  hasDescription?: boolean;
  createdAt?: string;
  tags?: string[];
  likeCount?: number;
  commentCount?: number;
  viewerHasLiked?: boolean;
}

// Map content types to their icons
const typeIcons = {
  workout: Dumbbell,
  meal: Utensils,
  recipe: ChefHat,
  routine: ClipboardList,
  post: FileText,
  group: Users,
} as const;

interface PostCardProps {
  post: PostData;
  onPostClick?: (post: PostData) => void;
  onTagClick?: (tag: string) => void;
  onCountChange?: (postId: string, updates: { like_count?: number; comment_count?: number; viewer_has_liked?: boolean }) => void;
}

// Hero media component with fallback
const HeroMedia = ({
  images,
  type,
  onDoubleTap,
}: {
  images?: string[];
  type: PostData["type"];
  onDoubleTap: () => void;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef<number>(0);
  const lastTapRef = useRef<number>(0);

  const hasImages = images && images.length > 0;
  const TypeIcon = typeIcons[type];

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !hasImages) return;
    const diff = e.touches[0].clientX - touchStartX.current;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    if (!hasImages || !images) return;
    const threshold = 50;
    
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset < 0 && currentIndex < images.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else if (dragOffset > 0 && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
    }
    setDragOffset(0);
    setIsDragging(false);
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

  // Fallback when no images
  if (!hasImages) {
    return (
      <div 
        className="relative w-full aspect-[4/5] bg-gradient-to-br from-muted/80 to-muted flex items-center justify-center rounded-xl"
        onClick={handleClick}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          {TypeIcon && <TypeIcon size={48} className="opacity-50" />}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div
        className="relative w-full aspect-[4/5] overflow-hidden rounded-xl bg-muted"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        <motion.div
          className="flex h-full"
          animate={{ 
            x: `calc(-${currentIndex * 100}% + ${isDragging ? dragOffset : 0}px)`,
          }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
          }}
        >
          {images.map((img, idx) => {
            const shouldRender = Math.abs(idx - currentIndex) <= 1;
            return (
              <div key={idx} className="w-full h-full flex-shrink-0">
                {shouldRender ? (
                  <LazyImage
                    src={img}
                    alt="Post"
                    className="w-full h-full object-cover"
                    width={800}
                    quality={80}
                    unloadWhenHidden={true}
                  />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
              </div>
            );
          })}
        </motion.div>

        {/* Pagination dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  idx === currentIndex ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper to get content title
const getContentTitle = (post: PostData): string => {
  const data = post.contentData as Record<string, unknown> | undefined;
  if (!data) return post.type.charAt(0).toUpperCase() + post.type.slice(1);
  
  switch (post.type) {
    case "workout": {
      const title = (data.title as string) || (data.name as string);
      if (title) return title;
      if (post.createdAt) {
        const hour = new Date(post.createdAt).getHours();
        if (hour >= 5 && hour < 12) return "Morning Workout";
        if (hour >= 12 && hour < 17) return "Afternoon Workout";
        if (hour >= 17 && hour < 21) return "Evening Workout";
        return "Night Workout";
      }
      return "Workout";
    }
    case "meal": {
      const mealName = data.name as string;
      if (mealName) return mealName;
      const mealType = data.mealType as string;
      if (mealType && mealType !== "saved_meal") return mealType;
      return "Meal";
    }
    case "recipe":
      return (data.title as string) || "Recipe";
    case "routine":
      return (data.routineName as string) || (data.name as string) || "Routine";
    case "group":
      return (data.name as string) || "Group";
    default:
      return post.type.charAt(0).toUpperCase() + post.type.slice(1);
  }
};

export const PostCard = ({ post, onPostClick, onTagClick, onCountChange }: PostCardProps) => {
  const navigate = useNavigate();
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const heartButtonRef = useRef<HTMLButtonElement | null>(null);

  // Use reactions hook with initial values from feed
  const { isLiked, likeCount, toggleLike } = usePostReactions(post.id, {
    initialLikeCount: post.likeCount ?? 0,
    initialIsLiked: post.viewerHasLiked ?? false,
    onCountChange: (newCount, newIsLiked) => {
      onCountChange?.(post.id, { like_count: newCount, viewer_has_liked: newIsLiked });
    },
  });
  
  // Use comments hook with initial count
  const { comments, commentCount, addComment, fetchComments, isLoading: commentsLoading } = usePostComments(post.id, {
    initialCommentCount: post.commentCount ?? 0,
    onCountChange: (newCount) => {
      onCountChange?.(post.id, { comment_count: newCount });
    },
  });
  
  const handleToggleComments = useCallback(() => {
    const newShowComments = !showComments;
    setShowComments(newShowComments);
    if (newShowComments) {
      fetchComments();
    }
  }, [showComments, fetchComments]);
  
  const handleCardClick = () => {
    if (onPostClick) {
      onPostClick(post);
    } else {
      setShowDetailModal(true);
    }
  };

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.userId) {
      navigate(`/user/${post.userId}`);
    }
  };

  const showFloatingHeart = useCallback(
    (originX?: number, originY?: number) => {
      const button = heartButtonRef.current;
      const finalOriginX =
        originX ??
        (button
          ? button.getBoundingClientRect().left + button.offsetWidth / 2
          : window.innerWidth / 2);
      const finalOriginY =
        originY ?? (button ? button.getBoundingClientRect().top : 200);

      const newEmoji: FloatingEmoji = {
        id: Date.now() + Math.random(),
        emoji: "❤️",
        originX: finalOriginX,
        originY: finalOriginY,
      };
      setFloatingEmojis((prev) => [...prev, newEmoji]);

      setTimeout(() => {
        setFloatingEmojis((prev) => prev.filter((e) => e.id !== newEmoji.id));
      }, 1000);
    },
    []
  );

  const handleDoubleTap = useCallback(() => {
    if (!isLiked) {
      const cardRect = cardRef.current?.getBoundingClientRect();
      const centerX = cardRect
        ? cardRect.left + cardRect.width / 2
        : window.innerWidth / 2;
      const centerY = cardRect ? cardRect.top + cardRect.height / 2 : 300;
      showFloatingHeart(centerX, centerY);
      toggleLike();
    }
  }, [isLiked, showFloatingHeart, toggleLike]);

  const handleLikeClick = useCallback(() => {
    if (!isLiked) {
      showFloatingHeart();
    }
    toggleLike();
  }, [isLiked, showFloatingHeart, toggleLike]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    await addComment(newComment);
    setNewComment("");
  };

  const contentTitle = getContentTitle(post);
  const TypeIcon = typeIcons[post.type];
  const tags = post.tags || (post.contentData as Record<string, unknown>)?.tags as string[] | undefined;

  return (
    <>
      <motion.article
        ref={cardRef}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-background border-b border-border"
      >
        {/* Top row: Avatar + Name + @handle + timeAgo | Follow pill */}
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar 
              className="w-10 h-10 border border-border cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all shrink-0"
              onClick={handleUserClick}
            >
              <AvatarImage src={post.user.avatar} />
              <AvatarFallback className="bg-muted">
                {post.user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p 
                  className="font-semibold text-sm hover:underline cursor-pointer truncate"
                  onClick={handleUserClick}
                >
                  {post.user.name}
                </p>
                <span className="text-sm text-muted-foreground truncate">{post.user.handle}</span>
              </div>
              <p className="text-xs text-muted-foreground">{post.timeAgo}</p>
            </div>
          </div>
          
          {/* Follow pill - placeholder for now */}
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-3 text-xs rounded-full shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <UserPlus size={12} className="mr-1" />
            Follow
          </Button>
        </div>

        {/* Hero media area - tappable to open modal */}
        <div className="px-4 cursor-pointer" onClick={handleCardClick}>
          <div className="relative">
            <HeroMedia 
              images={post.images} 
              type={post.type} 
              onDoubleTap={handleDoubleTap} 
            />
            
            {/* Overlay: Type icon + Title at bottom-left */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent rounded-b-xl">
              <div className="flex items-center gap-2">
                {TypeIcon && <TypeIcon size={18} className="text-white/90 shrink-0" />}
                <span className="font-semibold text-white text-sm truncate">{contentTitle}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating hearts animation */}
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
                transform: "translate(-50%, -50%)",
              }}
            >
              {floating.emoji}
            </motion.span>
          ))}
        </AnimatePresence>

        {/* Tags row */}
        {tags && tags.length > 0 && (
          <div className="px-4 pt-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {tags.slice(0, 5).map((tag, idx) => (
                <button
                  key={idx}
                  onClick={() => onTagClick?.(tag)}
                  className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors whitespace-nowrap"
                >
                  #{tag}
                </button>
              ))}
              {tags.length > 5 && (
                <span className="text-xs text-muted-foreground">+{tags.length - 5}</span>
              )}
            </div>
          </div>
        )}

        {/* Action row: Like + Comment icons | View pill */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              ref={heartButtonRef}
              onClick={handleLikeClick}
              className="flex items-center gap-1 transition-transform active:scale-90"
            >
              <Heart
                size={22}
                className={`transition-all duration-150 ease-out ${
                  isLiked ? "fill-primary text-primary" : "text-foreground"
                }`}
              />
              {likeCount > 0 && (
                <span className="text-sm font-medium">{likeCount}</span>
              )}
            </button>
            <button
              onClick={handleToggleComments}
              className="flex items-center gap-1 transition-transform active:scale-90"
            >
              <MessageCircle size={22} className="text-foreground" />
              {commentCount > 0 && (
                <span className="text-sm font-medium">{commentCount}</span>
              )}
            </button>
          </div>
          
          <Button
            variant="secondary"
            size="sm"
            className="h-7 px-3 text-xs rounded-full"
            onClick={handleCardClick}
          >
            <Eye size={12} className="mr-1" />
            View
          </Button>
        </div>

        {/* Caption */}
        {post.content && post.content.trim() && (
          <div className="px-4 pb-2">
            <p className="text-sm">
              <span className="font-semibold">{post.user.name}</span> {post.content}
            </p>
          </div>
        )}

        {/* Expandable Comments section */}
        <div className="px-4 pb-4">
          {commentCount > 0 && !showComments && (
            <button
              onClick={handleToggleComments}
              className="text-sm text-muted-foreground"
            >
              View all {commentCount} comment{commentCount > 1 ? "s" : ""}
            </button>
          )}

          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                {commentsLoading && (
                  <div className="flex justify-center py-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                  </div>
                )}
                
                {!commentsLoading && comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={comment.profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-muted">
                        {comment.profile?.first_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">
                          {comment.profile?.first_name || "User"}
                        </span>{" "}
                        {comment.content}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="flex gap-2 pt-2">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 h-9 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitComment();
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    className="h-9 w-9"
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim()}
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.article>
      
      <PostDetailModal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        post={post}
        onCountChange={onCountChange}
      />
    </>
  );
};
