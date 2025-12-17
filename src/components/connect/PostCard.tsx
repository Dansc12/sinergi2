import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal, MessageCircle, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { usePostReactions } from "@/hooks/usePostReactions";
import { usePostComments } from "@/hooks/usePostComments";
import { formatDistanceToNow } from "date-fns";
import { PostDetailModal } from "./PostDetailModal";

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

interface MealFood {
  name: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  fat?: number;
  servings?: number;
  servingSize?: string;
}

interface MealContentData {
  mealType?: string;
  foods?: MealFood[];
  totalCalories?: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFats?: number;
}

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
  type: "workout" | "meal" | "recipe" | "post" | "routine";
  timeAgo: string;
  contentData?: unknown;
  hasDescription?: boolean;
  createdAt?: string;
}

interface PostCardProps {
  post: PostData;
  onPostClick?: (post: PostData) => void;
}

const ImageCarousel = ({
  images,
  onDoubleTap,
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

  const imageContainerClass =
    "relative aspect-square w-full max-w-[320px] bg-muted rounded-xl overflow-hidden flex-shrink-0";

  if (images.length === 1) {
    return (
      <div className="px-4 py-1 flex justify-center">
        <div className={imageContainerClass} onClick={handleClick}>
          <img
            src={images[0]}
            alt="Post"
            className="w-full h-full object-cover"
          />
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

// Meal Summary Card for meals without photos/descriptions
const MealSummaryCard = ({ contentData }: { contentData: MealContentData }) => {
  const mealType = contentData.mealType || "Meal";
  const foods = contentData.foods || [];
  const totalCalories = contentData.totalCalories || foods.reduce((sum, f) => sum + (f.calories || 0), 0);
  const totalProtein = contentData.totalProtein || foods.reduce((sum, f) => sum + (f.protein || 0), 0);
  const totalCarbs = contentData.totalCarbs || foods.reduce((sum, f) => sum + (f.carbs || 0), 0);
  const totalFat = contentData.totalFats || foods.reduce((sum, f) => sum + (f.fat || f.fats || 0), 0);

  return (
    <div className="mx-4 my-2 bg-gradient-to-br from-success/10 to-success/5 border border-success/20 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🍽️</span>
        <h4 className="font-semibold text-foreground">{mealType}</h4>
      </div>
      
      {/* Food items */}
      <div className="space-y-1.5 mb-4">
        {foods.map((food, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">•</span>
            <span className="text-foreground">{food.name}</span>
            {food.servings && food.servings !== 1 && (
              <span className="text-muted-foreground text-xs">({food.servings} {food.servingSize || 'servings'})</span>
            )}
          </div>
        ))}
      </div>
      
      {/* Macros summary */}
      <div className="grid grid-cols-4 gap-2 pt-3 border-t border-success/20">
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">{Math.round(totalCalories)}</p>
          <p className="text-xs text-muted-foreground">cal</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-primary">{Math.round(totalProtein)}g</p>
          <p className="text-xs text-muted-foreground">protein</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-success">{Math.round(totalCarbs)}g</p>
          <p className="text-xs text-muted-foreground">carbs</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-amber-500">{Math.round(totalFat)}g</p>
          <p className="text-xs text-muted-foreground">fat</p>
        </div>
      </div>
    </div>
  );
};

// Workout types
interface WorkoutSet {
  weight?: number | string;
  reps?: number | string;
  distance?: number | string;
  time?: string;
}

interface WorkoutExercise {
  name: string;
  notes?: string;
  sets?: WorkoutSet[];
  isCardio?: boolean;
}

interface WorkoutContentData {
  title?: string;
  name?: string;
  exercises?: WorkoutExercise[];
  notes?: string;
}

// Helper to generate workout name based on time
const getAutoWorkoutName = (createdAt?: string): string => {
  if (!createdAt) return "Workout";
  const date = new Date(createdAt);
  const hour = date.getHours();
  
  if (hour >= 5 && hour < 12) return "Morning Workout";
  if (hour >= 12 && hour < 17) return "Afternoon Workout";
  if (hour >= 17 && hour < 21) return "Evening Workout";
  return "Night Workout";
};

// Calculate volume for a single exercise
const calculateExerciseVolume = (exercise: WorkoutExercise): number => {
  if (exercise.isCardio || !exercise.sets) return 0;
  return exercise.sets.reduce((sum, set) => {
    const weight = typeof set.weight === 'string' ? parseFloat(set.weight) || 0 : set.weight || 0;
    const reps = typeof set.reps === 'string' ? parseFloat(set.reps) || 0 : set.reps || 0;
    return sum + (weight * reps);
  }, 0);
};

// Workout Summary Card for workouts without photos/descriptions (Preview mode)
const WorkoutSummaryCard = ({ contentData, createdAt }: { contentData: WorkoutContentData; createdAt?: string }) => {
  const exercises = contentData.exercises || [];
  // Check both title (from CreateWorkoutPage) and name fields - ensure non-empty string
  const rawTitle = contentData.title || contentData.name;
  const workoutName = (rawTitle && rawTitle.trim()) ? rawTitle : getAutoWorkoutName(createdAt);
  
  // Calculate total volume (only for weight-based exercises)
  let totalVolume = 0;
  let hasWeightExercises = false;
  
  exercises.forEach(exercise => {
    const exerciseVolume = calculateExerciseVolume(exercise);
    if (exerciseVolume > 0) {
      totalVolume += exerciseVolume;
      hasWeightExercises = true;
    }
  });

  return (
    <div className="mx-4 my-2 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">💪</span>
        <h4 className="font-semibold text-foreground">{workoutName}</h4>
      </div>
      
      {/* Exercises - simplified preview showing exercise name + per-exercise volume */}
      <div className="space-y-2 mb-4">
        {exercises.map((exercise, idx) => {
          const exerciseVolume = calculateExerciseVolume(exercise);
          const isCardio = exercise.isCardio || (exercise.sets && exercise.sets.some(s => s.distance !== undefined));
          
          // For cardio, show total distance/time summary
          let cardioSummary = "";
          if (isCardio && exercise.sets) {
            const totalDistance = exercise.sets.reduce((sum, s) => {
              const dist = typeof s.distance === 'string' ? parseFloat(s.distance) || 0 : s.distance || 0;
              return sum + dist;
            }, 0);
            if (totalDistance > 0) {
              cardioSummary = `${totalDistance} mi`;
            }
          }
          
          return (
            <div key={idx} className="flex items-center justify-between py-1.5">
              <span className="text-sm font-medium text-foreground">{exercise.name}</span>
              <span className="text-sm text-muted-foreground">
                {isCardio ? cardioSummary : (exerciseVolume > 0 ? `${exerciseVolume.toLocaleString()} lbs` : "")}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Total volume - only show if there are weight-based exercises */}
      {hasWeightExercises && (
        <div className="pt-3 border-t border-primary/20">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{totalVolume.toLocaleString()} lbs</p>
            <p className="text-xs text-muted-foreground">Total Volume</p>
          </div>
        </div>
      )}
      
      {/* Tap to view details hint */}
      <p className="text-xs text-center text-muted-foreground mt-3">Tap to view details</p>
    </div>
  );
};

// Routine types
interface RoutineSet {
  id: string;
  minReps: string;
  maxReps: string;
}

interface RoutineExercise {
  name: string;
  sets?: RoutineSet[] | number;
  minReps?: number;
  maxReps?: number;
}

interface RoutineContentData {
  routineName?: string;
  exercises?: RoutineExercise[];
  scheduledDays?: string[];
  recurring?: string;
}

// Routine Summary Card for routines without photos/descriptions
const RoutineSummaryCard = ({ contentData }: { contentData: RoutineContentData }) => {
  const routineName = contentData.routineName || "Workout Routine";
  const exercises = contentData.exercises || [];
  const scheduledDays = contentData.scheduledDays || [];
  const recurring = contentData.recurring;

  // Format scheduled days
  const daysDisplay = scheduledDays.length > 0 
    ? scheduledDays.map(d => d.substring(0, 3)).join(", ")
    : null;

  return (
    <div className="mx-4 my-2 bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/20 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📋</span>
        <h4 className="font-semibold text-foreground">{routineName}</h4>
      </div>
      
      {/* Schedule info */}
      {(daysDisplay || recurring) && (
        <div className="mb-3 text-sm text-muted-foreground">
          {daysDisplay && <span>{daysDisplay}</span>}
          {daysDisplay && recurring && recurring !== "Currently not recurring" && <span> • </span>}
          {recurring && recurring !== "Currently not recurring" && <span>{recurring}</span>}
        </div>
      )}
      
      {/* Exercises */}
      <div className="space-y-2 mb-2">
        {exercises.slice(0, 4).map((exercise, idx) => {
          const setsArray = Array.isArray(exercise.sets) ? exercise.sets : [];
          const setCount = Array.isArray(exercise.sets) ? exercise.sets.length : (exercise.sets || 0);
          const firstSet = setsArray[0];
          const minReps = firstSet?.minReps || exercise.minReps || 0;
          const maxReps = firstSet?.maxReps || exercise.maxReps || 0;
          
          return (
            <div key={idx} className="flex items-center justify-between py-1.5">
              <span className="text-sm font-medium text-foreground">{exercise.name}</span>
              <span className="text-sm text-muted-foreground">
                {setCount} sets × {minReps}-{maxReps} reps
              </span>
            </div>
          );
        })}
        {exercises.length > 4 && (
          <p className="text-xs text-muted-foreground">+{exercises.length - 4} more exercises</p>
        )}
      </div>
      
      {/* Tap to view details hint */}
      <p className="text-xs text-center text-muted-foreground mt-3">Tap to view details</p>
    </div>
  );
};

export const PostCard = ({ post, onPostClick }: PostCardProps) => {
  const navigate = useNavigate();
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const isLongPressActiveRef = useRef(false);
  const cardRef = useRef<HTMLElement>(null);

  const { userReactionCounts, userReactions, addReaction: dbAddReaction } = usePostReactions(post.id);
  
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

  const { comments, commentCount, addComment } = usePostComments(post.id);

  const showFloatingEmoji = useCallback(
    (emoji: string, originX?: number, originY?: number) => {
      const button = buttonRefs.current[emoji];
      const finalOriginX =
        originX ??
        (button
          ? button.getBoundingClientRect().left + button.offsetWidth / 2
          : window.innerWidth / 2);
      const finalOriginY =
        originY ?? (button ? button.getBoundingClientRect().top : 200);

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
    },
    []
  );

  const handleReaction = useCallback(
    async (emoji: string) => {
      showFloatingEmoji(emoji);
      await dbAddReaction(emoji);
    },
    [showFloatingEmoji, dbAddReaction]
  );

  const handleDoubleTap = useCallback(() => {
    const cardRect = cardRef.current?.getBoundingClientRect();
    const centerX = cardRect
      ? cardRect.left + cardRect.width / 2
      : window.innerWidth / 2;
    const centerY = cardRect ? cardRect.top + cardRect.height / 2 : 300;
    showFloatingEmoji("❤️", centerX, centerY);
    dbAddReaction("❤️");
  }, [showFloatingEmoji, dbAddReaction]);

  const startContinuousReactions = useCallback(
    (emoji: string) => {
      handleReaction(emoji);
      holdIntervalRef.current = setInterval(() => {
        showFloatingEmoji(emoji);
        dbAddReaction(emoji);
      }, 150);
    },
    [handleReaction, showFloatingEmoji, dbAddReaction]
  );

  const handlePointerDown = useCallback(
    (emoji: string) => {
      isLongPressActiveRef.current = false;

      longPressTimerRef.current = setTimeout(() => {
        isLongPressActiveRef.current = true;
        startContinuousReactions(emoji);
      }, LONG_PRESS_THRESHOLD);
    },
    [startContinuousReactions]
  );

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

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    await addComment(newComment);
    setNewComment("");
  };

  return (
    <>
      <motion.article
        ref={cardRef}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-card border-b border-border"
      >
        {/* Header area - user info clickable to profile, rest clickable to post details */}
        <div className="flex items-center gap-3 p-4">
          <Avatar 
            className="w-10 h-10 border border-border cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
            onClick={handleUserClick}
          >
            <AvatarImage src={post.user.avatar} />
            <AvatarFallback className="bg-muted">
              {post.user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={handleCardClick}>
            <div className="flex items-center gap-2">
              <p 
                className="font-semibold text-sm hover:underline cursor-pointer"
                onClick={handleUserClick}
              >
                {post.user.name}
              </p>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${typeLabels[post.type].color}`}
              >
                {typeLabels[post.type].label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {post.user.handle} • {post.timeAgo}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal size={18} />
          </Button>
        </div>

        {/* Clickable content area */}
        <div onClick={handleCardClick} className="cursor-pointer">
          {post.images && post.images.length > 0 && (
            <ImageCarousel images={post.images} onDoubleTap={handleDoubleTap} />
          )}

          {/* Meal summary card for meals without photos/description */}
          {post.type === "meal" && (!post.images || post.images.length === 0) && !post.hasDescription && post.contentData && (
            <MealSummaryCard contentData={post.contentData as MealContentData} />
          )}

          {/* Workout summary card for workouts without photos/description */}
          {post.type === "workout" && (!post.images || post.images.length === 0) && !post.hasDescription && post.contentData && (
            <WorkoutSummaryCard contentData={post.contentData as WorkoutContentData} createdAt={post.createdAt} />
          )}

          {/* Routine summary card for routines without photos/description */}
          {post.type === "routine" && (!post.images || post.images.length === 0) && !post.hasDescription && post.contentData && (
            <RoutineSummaryCard contentData={post.contentData as RoutineContentData} />
          )}
        </div>

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
                transform: "translate(-50%, -50%)",
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
              onClick={() => {
                if (!isLongPressActiveRef.current) {
                  dbAddReaction(emoji);
                  showFloatingEmoji(emoji);
                }
              }}
              className={`relative text-xl p-2 rounded-full transition-colors select-none touch-none ${
                userReactions.has(emoji)
                  ? "bg-primary/20"
                  : "hover:bg-muted/50"
              }`}
            >
              {emoji}
              {userReactionCounts[emoji] > 0 && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-lg border border-background">
                  {userReactionCounts[emoji]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Only show text content if it's not a meal/workout/routine without photos/description */}
      {!(post.type === "meal" && (!post.images || post.images.length === 0) && !post.hasDescription) && 
       !(post.type === "workout" && (!post.images || post.images.length === 0) && !post.hasDescription) &&
       !(post.type === "routine" && (!post.images || post.images.length === 0) && !post.hasDescription) && (
        <div className="px-4 pb-2">
          <p className="text-sm">
            <span className="font-semibold">{post.user.name}</span> {post.content}
          </p>
        </div>
      )}

      {/* Comments section */}
      <div className="px-4 pb-4">
        <button
          onClick={() => setShowComments(!showComments)}
          className="text-sm text-muted-foreground flex items-center gap-1"
        >
          <MessageCircle size={16} />
          {commentCount > 0
            ? `View all ${commentCount} comment${commentCount > 1 ? "s" : ""}`
            : "Add a comment"}
        </button>

        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-3"
            >
              {/* Comment list */}
              {comments.map((comment) => (
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

              {/* Comment input */}
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
      />
    </>
  );
};
