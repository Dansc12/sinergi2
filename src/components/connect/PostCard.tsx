import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal, MessageCircle, Send, Heart } from "lucide-react";
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
  group: { label: "Group", color: "bg-amber-500/20 text-amber-400" },
};

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
  type: "workout" | "meal" | "recipe" | "post" | "routine" | "group";
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
      if (dragOffset < 0 && currentIndex < items.length - 1) {
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

  const renderItem = (item: CarouselItem) => {
    if (item.type === 'image') {
      return (
        <div className="w-full h-full bg-muted">
          <img
            src={item.content as string}
            alt="Post"
            className="w-full h-full object-cover"
          />
        </div>
      );
    } else {
      return (
        <div className="w-full h-full p-4">
          {item.content}
        </div>
      );
    }
  };

  return (
    <div className="relative w-full">
      {/* Main carousel container - Instagram style 4:5 aspect ratio */}
      <div
        className="relative w-full aspect-[4/5] overflow-hidden bg-muted"
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
          {items.map((item, idx) => (
            <div key={idx} className="w-full h-full flex-shrink-0">
              {renderItem(item)}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Pagination dots - only show if more than 1 item */}
      {items.length > 1 && (
        <div className="flex justify-center gap-1.5 py-3">
          {items.map((_, idx) => (
            <div
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                idx === currentIndex ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      )}
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
    <div className="h-full w-full bg-gradient-to-br from-success/15 to-success/5 border border-success/30 rounded-xl p-5 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">🍽️</span>
        <h4 className="text-xl font-bold text-foreground">{mealType}</h4>
      </div>

      {/* Food items */}
      <div className="space-y-2 mb-4 flex-1 overflow-hidden">
        {foods.map((food, idx) => (
          <div key={idx} className="flex items-center gap-2 text-base min-w-0">
            <span className="text-muted-foreground">•</span>
            <span className="text-foreground truncate font-medium">{food.name}</span>
            {food.servings && food.servings !== 1 && (
              <span className="text-muted-foreground text-sm shrink-0">
                ({food.servings} {food.servingSize || "servings"})
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Macros summary */}
      <div className="mt-auto grid grid-cols-4 gap-3 pt-4 border-t border-success/30">
        <div className="text-center">
          <p className="text-xl font-bold text-foreground">{Math.round(totalCalories)}</p>
          <p className="text-sm text-muted-foreground">cal</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-primary">{Math.round(totalProtein)}g</p>
          <p className="text-sm text-muted-foreground">protein</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-success">{Math.round(totalCarbs)}g</p>
          <p className="text-sm text-muted-foreground">carbs</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-amber-500">{Math.round(totalFat)}g</p>
          <p className="text-sm text-muted-foreground">fat</p>
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
  const rawTitle = contentData.title || contentData.name;
  const workoutName = (rawTitle && rawTitle.trim()) ? rawTitle : getAutoWorkoutName(createdAt);

  return (
    <div className="h-full w-full bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/30 rounded-xl p-5 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <span className="text-2xl">💪</span>
        <h4 className="text-xl font-bold text-foreground truncate">{workoutName}</h4>
      </div>

      {/* Exercises with individual set details */}
      <div className="space-y-4 flex-1 overflow-hidden">
        {exercises.map((exercise, idx) => {
          // Check if this is a cardio exercise - only true if explicitly marked or has meaningful distance values
          const isCardio = exercise.isCardio === true;

          return (
            <div key={idx} className="space-y-1">
              <p className="text-base font-semibold text-foreground truncate">{exercise.name}</p>
              {exercise.notes && (
                <p className="text-sm text-muted-foreground italic truncate">"{exercise.notes}"</p>
              )}
              {exercise.sets && exercise.sets.length > 0 && (
                <div className="flex flex-col gap-0.5">
                  {exercise.sets.map((set, setIdx) => {
                    const weight = typeof set.weight === 'string' ? parseFloat(set.weight) || 0 : set.weight || 0;
                    const reps = typeof set.reps === 'string' ? parseFloat(set.reps) || 0 : set.reps || 0;
                    const distance = typeof set.distance === 'string' ? parseFloat(set.distance) || 0 : set.distance || 0;
                    
                    return (
                      <span key={setIdx} className="text-sm text-muted-foreground">
                        {isCardio ? (
                          <>Set {setIdx + 1}: {distance} mi{set.time ? ` • ${set.time}` : ''}</>
                        ) : (
                          <>Set {setIdx + 1}: {weight} lbs × {reps} reps</>
                        )}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
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
  name?: string; // Legacy fallback
  exercises?: RoutineExercise[];
  scheduledDays?: string[];
  recurring?: string;
}

// Recipe types
interface RecipeIngredient {
  id: string;
  name: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  servings?: number;
  servingSize?: string;
}

interface RecipeContentData {
  title?: string;
  description?: string;
  prepTime?: string;
  cookTime?: string;
  servings?: string;
  ingredients?: RecipeIngredient[];
  steps?: string[];
  totalCalories?: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFats?: number;
}

// Routine Summary Card for routines without photos/descriptions
const RoutineSummaryCard = ({ contentData }: { contentData: RoutineContentData }) => {
  const routineName = contentData.routineName || contentData.name || "Workout Routine";
  const exercises = contentData.exercises || [];
  const scheduledDays = contentData.scheduledDays || [];

  // Format scheduled days
  const daysDisplay = scheduledDays.length > 0 
    ? scheduledDays.map(d => d.substring(0, 3)).join(", ")
    : null;

  return (
    <div className="h-full w-full bg-gradient-to-br from-violet-500/15 to-violet-500/5 border border-violet-500/30 rounded-xl p-5 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <span className="text-2xl">📋</span>
        <h4 className="text-xl font-bold text-foreground truncate">{routineName}</h4>
      </div>

      {/* Schedule info */}
      {daysDisplay && (
        <p className="text-sm text-muted-foreground mb-4 shrink-0">{daysDisplay}</p>
      )}

      {/* Exercises with individual set details stacked vertically */}
      <div className="space-y-4 flex-1 overflow-hidden">
        {exercises.map((exercise, idx) => {
          const setsArray = Array.isArray(exercise.sets) ? exercise.sets : [];
          const setCount = Array.isArray(exercise.sets) ? exercise.sets.length : (exercise.sets || 0);

          return (
            <div key={idx} className="space-y-1">
              <p className="text-base font-semibold text-foreground truncate">{exercise.name}</p>
              <div className="flex flex-col gap-0.5">
                {setsArray.length > 0 ? (
                  setsArray.map((set, setIdx) => (
                    <span key={setIdx} className="text-sm text-muted-foreground">
                      Set {setIdx + 1}: {set.minReps}-{set.maxReps} reps
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {setCount} sets × {exercise.minReps || 0}-{exercise.maxReps || 0} reps
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Recipe Summary Card for recipes
const RecipeSummaryCard = ({ contentData }: { contentData: RecipeContentData }) => {
  const title = contentData.title || "Recipe";
  const description = contentData.description || "";
  const prepTime = contentData.prepTime;
  const cookTime = contentData.cookTime;
  const servings = contentData.servings;
  const ingredients = contentData.ingredients || [];
  const totalCalories = contentData.totalCalories;

  return (
    <div className="h-full w-full bg-gradient-to-br from-rose-500/15 to-pink-500/5 border border-rose-500/30 rounded-xl p-5 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 mb-2 shrink-0">
        <span className="text-2xl">🍳</span>
        <h4 className="text-xl font-bold text-foreground truncate">{title}</h4>
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2 shrink-0">{description}</p>
      )}

      {/* Time and servings info */}
      <div className="flex flex-wrap gap-3 mb-4 shrink-0">
        {prepTime && (
          <span className="text-sm text-muted-foreground">⏱️ Prep: {prepTime}</span>
        )}
        {cookTime && (
          <span className="text-sm text-muted-foreground">🔥 Cook: {cookTime}</span>
        )}
        {servings && (
          <span className="text-sm text-muted-foreground">🍽️ {servings} servings</span>
        )}
      </div>

      {/* Calories if available */}
      {totalCalories && (
        <div className="mb-3 shrink-0">
          <span className="text-base font-semibold text-foreground">{totalCalories} cal</span>
          <span className="text-sm text-muted-foreground"> per serving</span>
        </div>
      )}

      {/* Ingredients preview */}
      {ingredients.length > 0 && (
        <div className="flex-1 overflow-hidden">
          <p className="text-sm font-medium text-muted-foreground mb-2">Ingredients</p>
          <div className="space-y-1">
            {ingredients.slice(0, 4).map((ing, idx) => (
              <p key={idx} className="text-sm text-foreground truncate">
                • {ing.name}
              </p>
            ))}
            {ingredients.length > 4 && (
              <p className="text-sm text-muted-foreground">+{ingredients.length - 4} more</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Group types
interface GroupContentData {
  name?: string;
  description?: string;
  category?: string;
  privacy?: string;
  coverPhoto?: string;
}

// Group Summary Card for groups - styled like RecipeSummaryCard
const GroupSummaryCard = ({ contentData, coverPhoto }: { contentData: GroupContentData; coverPhoto?: string }) => {
  const name = contentData.name || "Group";
  const category = contentData.category || "";
  const privacy = contentData.privacy || "public";
  const photo = coverPhoto || contentData.coverPhoto;

  return (
    <div className="h-full w-full bg-gradient-to-br from-amber-500/15 to-orange-500/5 border border-amber-500/30 rounded-xl overflow-hidden flex flex-col">
      {/* Cover Photo */}
      {photo && (
        <div className="w-full h-32 shrink-0">
          <img
            src={photo}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-5 flex flex-col flex-1">
        {/* Group Name */}
        <div className="flex items-center gap-2 mb-2 shrink-0">
          <span className="text-2xl">👥</span>
          <h4 className="text-xl font-bold text-foreground truncate">{name}</h4>
        </div>

        {/* Category and Privacy - horizontally aligned */}
        <div className="flex flex-wrap gap-3 mt-auto">
          {category && (
            <span className="text-base bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded-full capitalize font-medium">
              {category}
            </span>
          )}
          <span className="text-base bg-muted text-muted-foreground px-3 py-1.5 rounded-full capitalize font-medium">
            {privacy === "public" ? "Public" : "Private"}
          </span>
        </div>
      </div>
    </div>
  );
};

export const PostCard = ({ post, onPostClick }: PostCardProps) => {
  const navigate = useNavigate();
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const heartButtonRef = useRef<HTMLButtonElement | null>(null);

  const { isLiked, likeCount, toggleLike } = usePostReactions(post.id);
  
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
              } else if (post.type === "recipe") {
                carouselItems.push({
                  type: 'summary',
                  content: <RecipeSummaryCard contentData={post.contentData as RecipeContentData} />
                });
              } else if (post.type === "group") {
                // For groups, pass the first image as cover photo since it's stored separately
                const groupCoverPhoto = post.images && post.images.length > 0 ? post.images[0] : undefined;
                carouselItems.push({
                  type: 'summary',
                  content: <GroupSummaryCard contentData={post.contentData as GroupContentData} coverPhoto={groupCoverPhoto} />
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

      {/* Like button and floating hearts */}
      <div className="px-4 py-2">
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

        <div className="flex items-center gap-4">
          <button
            ref={heartButtonRef}
            onClick={handleLikeClick}
            className="flex items-center gap-1.5 transition-transform active:scale-90"
          >
            <Heart
              size={24}
              className={`transition-colors ${
                isLiked ? "fill-red-500 text-red-500" : "text-foreground"
              }`}
            />
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="transition-transform active:scale-90"
          >
            <MessageCircle size={24} className="text-foreground" />
          </button>
        </div>

        {/* Like count */}
        {likeCount > 0 && (
          <p className="text-sm font-semibold mt-2">
            {likeCount} {likeCount === 1 ? "like" : "likes"}
          </p>
        )}
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
        {commentCount > 0 && !showComments && (
          <button
            onClick={() => setShowComments(true)}
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
