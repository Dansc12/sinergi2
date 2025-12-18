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

// Unified content carousel that can display images and summary cards
interface CarouselItem {
  type: 'image' | 'summary';
  content: string | React.ReactNode;
}

const ContentCarousel = ({
  items,
  onDoubleTap,
}: {
  items: CarouselItem[];
  onDoubleTap: () => void;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef<number>(0);
  const lastTapRef = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - touchStartX.current;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    const threshold = 50;
    
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset < 0) {
        setCurrentIndex((prev) => (prev + 1) % items.length);
      } else {
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
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

  const renderItem = (item: CarouselItem, isPreview: boolean = false) => {
    if (item.type === 'image') {
      return (
        <img
          src={item.content as string}
          alt="Post"
          className="w-full h-full object-cover"
        />
      );
    } else {
      // Summary card - render full content in fixed container
      return (
        <div className="w-full h-full flex items-center justify-center overflow-hidden p-2">
          <div className={`w-full ${isPreview ? 'scale-[0.85] origin-center' : ''}`}>
            {item.content}
          </div>
        </div>
      );
    }
  };

  // Fixed container class for consistent sizing
  const itemContainerClass = "relative aspect-square w-full max-w-[280px] bg-muted rounded-xl overflow-hidden flex-shrink-0";
  const previewContainerClass = "relative aspect-square w-[70px] bg-muted rounded-lg overflow-hidden flex-shrink-0";

  if (items.length === 1) {
    const item = items[0];
    return (
      <div className="px-4 py-1 flex justify-center">
        <div className={itemContainerClass} onClick={handleClick}>
          {renderItem(item)}
        </div>
      </div>
    );
  }

  const prevIndex = (currentIndex - 1 + items.length) % items.length;
  const nextIndex = (currentIndex + 1) % items.length;

  return (
    <div className="relative py-1 overflow-hidden">
      <div
        className="flex items-center justify-center gap-2 touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Previous item preview */}
        <motion.div 
          className={previewContainerClass}
          style={{ opacity: 0.6 }}
          animate={{ 
            x: isDragging ? dragOffset * 0.3 : 0,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {renderItem(items[prevIndex], true)}
        </motion.div>

        {/* Current item */}
        <motion.div
          className={itemContainerClass}
          onClick={handleClick}
          animate={{ 
            x: isDragging ? dragOffset : 0,
            scale: isDragging ? 0.98 : 1,
          }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 30,
            mass: 0.8
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              className="w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {renderItem(items[currentIndex])}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Next item preview */}
        <motion.div 
          className={previewContainerClass}
          style={{ opacity: 0.6 }}
          animate={{ 
            x: isDragging ? dragOffset * 0.3 : 0,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {renderItem(items[nextIndex], true)}
        </motion.div>
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
      
      {/* Schedule info - only show days, not duration */}
      {daysDisplay && (
        <div className="mb-3 text-sm text-muted-foreground">
          <span>{daysDisplay}</span>
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

        {/* Clickable content area - unified carousel with images + summary card */}
        <div onClick={handleCardClick} className="cursor-pointer">
          {(() => {
            // Build carousel items: images first, then summary card (for meal/workout/routine/recipe)
            const carouselItems: CarouselItem[] = [];
            
            // Add images first
            if (post.images && post.images.length > 0) {
              post.images.forEach(img => {
                carouselItems.push({ type: 'image', content: img });
              });
            }
            
            // Add summary card for supported content types
            if (post.contentData) {
              if (post.type === "meal") {
                carouselItems.push({
                  type: 'summary',
                  content: <MealSummaryCard contentData={post.contentData as MealContentData} />
                });
              } else if (post.type === "workout") {
                carouselItems.push({
                  type: 'summary',
                  content: <WorkoutSummaryCard contentData={post.contentData as WorkoutContentData} createdAt={post.createdAt} />
                });
              } else if (post.type === "routine") {
                carouselItems.push({
                  type: 'summary',
                  content: <RoutineSummaryCard contentData={post.contentData as RoutineContentData} />
                });
              }
            }
            
            // If there are carousel items, render the carousel
            if (carouselItems.length > 0) {
              return <ContentCarousel items={carouselItems} onDoubleTap={handleDoubleTap} />;
            }
            
            // For posts without images and without content data (plain posts), show nothing here
            return null;
          })()}
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

      {/* Caption - always shown below carousel if there's content */}
      {post.content && post.content.trim() && (
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
