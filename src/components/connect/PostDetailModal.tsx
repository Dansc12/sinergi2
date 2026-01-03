import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow, format } from "date-fns";
import { X, Dumbbell, UtensilsCrossed, BookOpen, Calendar, Users, Check, Heart, MessageCircle, Send, ChefHat, ClipboardList, FileText } from "lucide-react";
import { useGroupJoin } from "@/hooks/useGroupJoin";
import { usePostReactions } from "@/hooks/usePostReactions";
import { usePostComments } from "@/hooks/usePostComments";
import { motion, AnimatePresence, PanInfo } from "framer-motion";

interface Exercise {
  name: string;
  notes?: string;
  sets?: Array<{
    weight?: number | string;
    reps?: number | string;
    distance?: number | string;
    time?: string;
    type?: string;
  }>;
  isCardio?: boolean;
  supersetGroup?: number;
}

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

interface RecipeIngredient {
  name: string;
  servings?: number;
  servingSize?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fats?: number;
}

interface RoutineSet {
  id: string;
  minReps: string;
  maxReps: string;
  type?: string;
}

interface RoutineExercise {
  name: string;
  sets?: RoutineSet[] | number;
  minReps?: number;
  maxReps?: number;
  supersetGroup?: number;
}

interface RoutineDay {
  day: string;
  time?: string;
}

interface PostDetailModalProps {
  open: boolean;
  onClose: () => void;
  post: {
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
  };
}

// Map content types to their icons
const typeIcons = {
  workout: Dumbbell,
  meal: UtensilsCrossed,
  recipe: ChefHat,
  routine: ClipboardList,
  post: FileText,
  group: Users,
} as const;

// Superset colors for workout display
const supersetColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-yellow-500",
];

// Set type badges
const setTypeBadges: Record<string, { label: string; color: string }> = {
  warmup: { label: "W", color: "bg-yellow-500/20 text-yellow-400" },
  dropset: { label: "D", color: "bg-red-500/20 text-red-400" },
  failure: { label: "F", color: "bg-orange-500/20 text-orange-400" },
};

export const PostDetailModal = ({ open, onClose, post }: PostDetailModalProps) => {
  const contentData = post.contentData as Record<string, unknown> | undefined;
  const groupId = post.type === 'group' ? (contentData?.groupId as string) : undefined;
  const { isMember, hasRequestedInvite, isLoading: joinLoading, joinPublicGroup, requestInvite } = useGroupJoin(groupId);
  const { isLiked, toggleLike } = usePostReactions(post.id);
  const { comments, commentCount, addComment } = usePostComments(post.id);
  
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [imageExpanded, setImageExpanded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    await addComment(newComment);
    setNewComment("");
  };

  // Format date for display
  const formattedDate = post.createdAt 
    ? format(new Date(post.createdAt), "MMM d, yyyy")
    : post.timeAgo;

  // Get content title based on type
  const getContentTitle = (): string | null => {
    if (!contentData) return null;
    
    switch (post.type) {
      case "workout": {
        const title = (contentData.title as string) || (contentData.name as string);
        if (title) return title;
        // Auto-generate name based on time
        if (post.createdAt) {
          const hour = new Date(post.createdAt).getHours();
          if (hour >= 5 && hour < 12) return "Morning Workout";
          if (hour >= 12 && hour < 17) return "Afternoon Workout";
          if (hour >= 17 && hour < 21) return "Evening Workout";
          return "Night Workout";
        }
        return "Workout";
      }
      case "meal":
        return (contentData.mealType as string) || "Meal";
      case "recipe":
        return (contentData.title as string) || "Recipe";
      case "routine":
        return (contentData.routineName as string) || (contentData.name as string) || "Routine";
      case "group":
        return (contentData.name as string) || "Group";
      default:
        return null;
    }
  };

  const tags = post.tags || (contentData?.tags as string[] | undefined);
  const TypeIcon = typeIcons[post.type];

  // Image carousel touch handling
  const touchStartX = useRef<number>(0);
  const [carouselDrag, setCarouselDrag] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleCarouselTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleCarouselTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !post.images || post.images.length <= 1) return;
    const diff = e.touches[0].clientX - touchStartX.current;
    setCarouselDrag(diff);
  };

  const handleCarouselTouchEnd = () => {
    if (!post.images) return;
    const threshold = 50;
    
    if (Math.abs(carouselDrag) > threshold) {
      if (carouselDrag < 0 && currentImageIndex < post.images.length - 1) {
        setCurrentImageIndex((prev) => prev + 1);
      } else if (carouselDrag > 0 && currentImageIndex > 0) {
        setCurrentImageIndex((prev) => prev - 1);
      }
    }
    setCarouselDrag(0);
    setIsDragging(false);
  };

  // Vertical drag to expand image
  const handleVerticalDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 0 && !imageExpanded) {
      setDragOffset(info.offset.y);
    } else if (info.offset.y < 0 && imageExpanded) {
      setDragOffset(info.offset.y);
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.y > threshold && !imageExpanded) {
      setImageExpanded(true);
    } else if (info.offset.y < -threshold && imageExpanded) {
      setImageExpanded(false);
    }
    setDragOffset(0);
  };

  const renderWorkoutDetails = () => {
    const exercises = (contentData?.exercises as Exercise[]) || [];
    const notes = contentData?.notes as string;

    // Group exercises by superset
    const exercisesWithSuperset = exercises.map((ex, idx) => ({
      ...ex,
      originalIndex: idx,
    }));

    return (
      <div className="space-y-3">
        {exercisesWithSuperset.map((exercise, idx) => {
          const supersetGroup = exercise.supersetGroup;
          const supersetColor = supersetGroup !== undefined 
            ? supersetColors[supersetGroup % supersetColors.length]
            : null;

          return (
            <div 
              key={idx} 
              className={`relative bg-muted/50 rounded-xl p-4 ${supersetColor ? 'pl-6' : ''}`}
            >
              {/* Superset indicator bar */}
              {supersetColor && (
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${supersetColor} rounded-l-xl`} />
              )}
              
              <h5 className="font-medium mb-1">{exercise.name}</h5>
              {exercise.notes && (
                <p className="text-xs text-muted-foreground italic mb-2">"{exercise.notes}"</p>
              )}
              {exercise.sets && exercise.sets.length > 0 && (
                <div className="space-y-2">
                  {exercise.sets.map((set, setIdx) => {
                    const weight = typeof set.weight === 'string' ? parseFloat(set.weight) || 0 : set.weight || 0;
                    const reps = typeof set.reps === 'string' ? parseFloat(set.reps) || 0 : set.reps || 0;
                    const distance = typeof set.distance === 'string' ? parseFloat(set.distance) || 0 : set.distance || 0;
                    const setType = set.type as string | undefined;
                    const typeBadge = setType && setTypeBadges[setType];

                    return (
                      <div key={setIdx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        {typeBadge ? (
                          <span className={`w-6 h-6 rounded-full ${typeBadge.color} text-xs flex items-center justify-center font-medium`}>
                            {typeBadge.label}
                          </span>
                        ) : (
                          <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium">
                            {setIdx + 1}
                          </span>
                        )}
                        <div className="flex gap-2">
                          {exercise.isCardio ? (
                            <>
                              <span className="px-2 py-0.5 rounded bg-muted text-foreground text-xs">{distance} mi</span>
                              {set.time && <span className="px-2 py-0.5 rounded bg-muted text-foreground text-xs">{set.time}</span>}
                            </>
                          ) : (
                            <>
                              <span className="px-2 py-0.5 rounded bg-muted text-foreground text-xs">{weight} lbs</span>
                              <span className="px-2 py-0.5 rounded bg-muted text-foreground text-xs">{reps} reps</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        
        {notes && (
          <div className="bg-muted/30 rounded-xl p-4">
            <p className="text-sm text-muted-foreground italic">"{notes}"</p>
          </div>
        )}
      </div>
    );
  };

  const renderMealDetails = () => {
    const mealType = contentData?.mealType as string;
    const foods = (contentData?.foods as MealFood[]) || [];
    const totalCalories = (contentData?.totalCalories as number) || foods.reduce((sum, f) => sum + (f.calories || 0), 0);
    const totalProtein = (contentData?.totalProtein as number) || foods.reduce((sum, f) => sum + (f.protein || 0), 0);
    const totalCarbs = (contentData?.totalCarbs as number) || foods.reduce((sum, f) => sum + (f.carbs || 0), 0);
    const totalFat = (contentData?.totalFats as number) || foods.reduce((sum, f) => sum + (f.fat || f.fats || 0), 0);

    return (
      <div className="space-y-4">
        {/* Macro summary - liquid style */}
        <div className="relative rounded-xl p-4 overflow-hidden">
          {/* Macro gradient background */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: `linear-gradient(90deg, 
                hsl(var(--primary)) 0%, 
                hsl(var(--primary)) ${(totalProtein * 4 / totalCalories) * 100}%, 
                hsl(var(--success)) ${(totalProtein * 4 / totalCalories) * 100}%, 
                hsl(var(--success)) ${((totalProtein * 4 + totalCarbs * 4) / totalCalories) * 100}%, 
                hsl(45, 100%, 50%) ${((totalProtein * 4 + totalCarbs * 4) / totalCalories) * 100}%, 
                hsl(45, 100%, 50%) 100%)`
            }}
          />
          <div className="relative grid grid-cols-4 gap-2">
            <div className="text-center">
              <p className="text-xl font-bold">{Math.round(totalCalories)}</p>
              <p className="text-xs text-muted-foreground">cal</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-primary">{Math.round(totalProtein)}g</p>
              <p className="text-xs text-muted-foreground">protein</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-success">{Math.round(totalCarbs)}g</p>
              <p className="text-xs text-muted-foreground">carbs</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-amber-500">{Math.round(totalFat)}g</p>
              <p className="text-xs text-muted-foreground">fat</p>
            </div>
          </div>
        </div>
        
        {/* Food items with macro gradient bars */}
        <div className="space-y-2">
          {foods.map((food, idx) => {
            const foodCals = food.calories || 0;
            const foodProtein = food.protein || 0;
            const foodCarbs = food.carbs || 0;
            const foodFat = food.fat || food.fats || 0;
            const total = (foodProtein * 4) + (foodCarbs * 4) + (foodFat * 9);

            return (
              <div key={idx} className="bg-muted/50 rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{food.name}</p>
                    {food.servings && (
                      <p className="text-xs text-muted-foreground">
                        {food.servings} {food.servingSize || 'serving'}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground shrink-0 ml-2">{foodCals} cal</p>
                </div>
                {/* Macro colorbar */}
                <div className="h-1 rounded-full overflow-hidden bg-muted flex">
                  {total > 0 && (
                    <>
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${(foodProtein * 4 / total) * 100}%` }}
                      />
                      <div 
                        className="h-full bg-success" 
                        style={{ width: `${(foodCarbs * 4 / total) * 100}%` }}
                      />
                      <div 
                        className="h-full bg-amber-500" 
                        style={{ width: `${(foodFat * 9 / total) * 100}%` }}
                      />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderRecipeDetails = () => {
    const title = contentData?.title as string;
    const description = contentData?.description as string;
    const prepTime = contentData?.prepTime as string;
    const cookTime = contentData?.cookTime as string;
    const servingsCount = contentData?.servings as string;
    const ingredients = (contentData?.ingredients as RecipeIngredient[]) || [];
    const instructions = (contentData?.instructions as string[]) || (contentData?.steps as string[]) || [];
    const totalNutrition = contentData?.totalNutrition as { calories?: number; protein?: number; carbs?: number; fats?: number } | undefined;

    const totalCalories = totalNutrition?.calories || ingredients.reduce((sum, i) => sum + (i.calories || 0), 0);
    const totalProtein = totalNutrition?.protein || ingredients.reduce((sum, i) => sum + (i.protein || 0), 0);
    const totalCarbs = totalNutrition?.carbs || ingredients.reduce((sum, i) => sum + (i.carbs || 0), 0);
    const totalFat = totalNutrition?.fats || ingredients.reduce((sum, i) => sum + (i.fat || i.fats || 0), 0);

    return (
      <div className="space-y-6">
        {/* Prep Time, Cook Time, Servings */}
        {(prepTime || cookTime || servingsCount) && (
          <div className="flex justify-between bg-muted/50 rounded-xl p-4">
            {prepTime && (
              <div className="text-center flex-1">
                <p className="text-lg font-semibold">{prepTime}</p>
                <p className="text-xs text-muted-foreground">Prep Time</p>
              </div>
            )}
            {cookTime && (
              <div className="text-center flex-1">
                <p className="text-lg font-semibold">{cookTime}</p>
                <p className="text-xs text-muted-foreground">Cook Time</p>
              </div>
            )}
            {servingsCount && (
              <div className="text-center flex-1">
                <p className="text-lg font-semibold">{servingsCount}</p>
                <p className="text-xs text-muted-foreground">Servings</p>
              </div>
            )}
          </div>
        )}
        
        {/* Macro summary */}
        <div className="grid grid-cols-4 gap-2 bg-rose-500/10 rounded-xl p-4">
          <div className="text-center">
            <p className="text-xl font-bold">{Math.round(totalCalories)}</p>
            <p className="text-xs text-muted-foreground">cal</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-primary">{Math.round(totalProtein)}g</p>
            <p className="text-xs text-muted-foreground">protein</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-success">{Math.round(totalCarbs)}g</p>
            <p className="text-xs text-muted-foreground">carbs</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-amber-500">{Math.round(totalFat)}g</p>
            <p className="text-xs text-muted-foreground">fat</p>
          </div>
        </div>
        
        {/* Ingredients */}
        {ingredients.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-lg font-semibold">Ingredients</h4>
            <div className="space-y-2">
              {ingredients.map((ingredient, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <span className="text-sm font-medium text-primary min-w-[60px]">
                    {(() => {
                      const servings = ingredient.servings ?? 1;
                      const servingSize = ingredient.servingSize || 'serving';
                      const hasNumber = /\d/.test(servingSize);
                      if (hasNumber) {
                        return servings > 1 ? `${servings} × ${servingSize}` : servingSize;
                      }
                      return `${servings} ${servingSize}`;
                    })()}
                  </span>
                  <span className="text-sm flex-1">{ingredient.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Instructions */}
        {instructions.length > 0 && instructions.some(i => i.trim()) && (
          <div className="space-y-3">
            <h4 className="text-lg font-semibold">Instructions</h4>
            <div className="space-y-4">
              {instructions.filter(i => i.trim()).map((step, idx) => (
                <div key={idx} className="flex gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center flex-shrink-0 font-medium">
                    {idx + 1}
                  </span>
                  <p className="text-sm pt-1">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRoutineDetails = () => {
    const routineName = contentData?.routineName as string || contentData?.name as string;
    const exercises = (contentData?.exercises as RoutineExercise[]) || [];
    const scheduledDays = (contentData?.scheduledDays as string[]) || [];

    // Group exercises by superset
    const exercisesWithSuperset = exercises.map((ex, idx) => ({
      ...ex,
      originalIndex: idx,
    }));

    return (
      <div className="space-y-4">
        {scheduledDays.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {scheduledDays.map((day, idx) => (
              <span key={idx} className="px-3 py-1 bg-violet-500/20 text-violet-400 rounded-full text-sm">
                {day}
              </span>
            ))}
          </div>
        )}
        
        {exercisesWithSuperset.length > 0 && (
          <div className="space-y-3">
            {exercisesWithSuperset.map((exercise, idx) => {
              const setsArray = Array.isArray(exercise.sets) ? exercise.sets : [];
              const supersetGroup = exercise.supersetGroup;
              const supersetColor = supersetGroup !== undefined 
                ? supersetColors[supersetGroup % supersetColors.length]
                : null;

              return (
                <div 
                  key={idx} 
                  className={`relative bg-muted/50 rounded-xl p-4 ${supersetColor ? 'pl-6' : ''}`}
                >
                  {/* Superset indicator bar */}
                  {supersetColor && (
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${supersetColor} rounded-l-xl`} />
                  )}
                  
                  <p className="font-medium mb-2">{exercise.name}</p>
                  <div className="space-y-1.5">
                    {setsArray.length > 0 ? (
                      setsArray.map((set, setIdx) => {
                        const setType = set.type;
                        const typeBadge = setType && setTypeBadges[setType];

                        return (
                          <div key={setIdx} className="flex items-center gap-2 text-sm text-muted-foreground">
                            {typeBadge ? (
                              <span className={`w-6 h-6 rounded-full ${typeBadge.color} text-xs flex items-center justify-center font-medium`}>
                                {typeBadge.label}
                              </span>
                            ) : (
                              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium">
                                {setIdx + 1}
                              </span>
                            )}
                            <span>{set.minReps}-{set.maxReps} reps</span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {typeof exercise.sets === 'number' ? exercise.sets : 0} sets × {exercise.minReps || 0}-{exercise.maxReps || 0} reps
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderGroupDetails = () => {
    const name = contentData?.name as string;
    const description = contentData?.description as string;
    const category = contentData?.category as string;
    const privacy = contentData?.privacy as string;
    const isPublic = privacy === 'public';
    const creatorId = post.userId;

    const handleJoinClick = () => {
      if (isPublic) {
        joinPublicGroup();
      } else if (creatorId) {
        requestInvite(creatorId, name || 'the group');
      }
    };

    return (
      <div className="space-y-4">
        {/* Category and Privacy */}
        <div className="flex flex-wrap gap-3">
          {category && (
            <span className="px-4 py-1.5 bg-amber-500/20 text-amber-400 rounded-full text-base font-medium capitalize">
              {category}
            </span>
          )}
          <span className="px-4 py-1.5 bg-muted text-muted-foreground rounded-full text-base font-medium">
            {isPublic ? "Public" : "Private"}
          </span>
        </div>
        
        {/* Description */}
        {description && (
          <p className="text-base text-muted-foreground">{description}</p>
        )}

        {/* Join/Request Button */}
        {isMember ? (
          <div className="flex items-center gap-2 text-success">
            <Check size={18} />
            <span className="text-sm font-medium">You're a member</span>
          </div>
        ) : hasRequestedInvite ? (
          <Button disabled className="w-full">
            Invite Sent
          </Button>
        ) : (
          <Button 
            onClick={handleJoinClick} 
            className="w-full"
            disabled={joinLoading}
          >
            <Users size={18} className="mr-2" />
            {isPublic ? 'Join Group' : 'Request Invite'}
          </Button>
        )}
      </div>
    );
  };

  const renderContentDetails = () => {
    switch (post.type) {
      case "workout":
        return renderWorkoutDetails();
      case "meal":
        return renderMealDetails();
      case "recipe":
        return renderRecipeDetails();
      case "routine":
        return renderRoutineDetails();
      case "group":
        return renderGroupDetails();
      default:
        return null;
    }
  };

  if (!open) return null;

  const hasImages = post.images && post.images.length > 0;
  const collapsedHeight = 180; // Cropped view

  // Expanded view - fullscreen overlay
  if (imageExpanded && hasImages) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          ref={containerRef}
        >
          {/* Fullscreen image carousel */}
          <motion.div
            className="relative w-full h-full flex items-center justify-center"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDrag={handleVerticalDrag}
            onDragEnd={handleDragEnd}
          >
            <motion.div
              className="flex w-full"
              onTouchStart={handleCarouselTouchStart}
              onTouchMove={handleCarouselTouchMove}
              onTouchEnd={handleCarouselTouchEnd}
              animate={{ 
                x: `calc(-${currentImageIndex * 100}% + ${isDragging ? carouselDrag : 0}px)`,
              }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
              }}
            >
              {post.images?.map((img, idx) => (
                <div key={idx} className="w-full flex-shrink-0 aspect-[4/5]">
                  <img
                    src={img}
                    alt={`Post image ${idx + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
              ))}
            </motion.div>

            {/* Gradient overlay for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/70 pointer-events-none" />

            {/* Top overlay - Profile info */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between z-10">
              {/* Profile info */}
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border-2 border-white/30">
                  <AvatarImage src={post.user.avatar} />
                  <AvatarFallback className="bg-muted">
                    {post.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm text-white drop-shadow-md">{post.user.name}</p>
                    <span className="text-sm text-white/80 drop-shadow-md">{post.user.handle}</span>
                  </div>
                  <p className="text-xs text-white/70 drop-shadow-md">{formattedDate}</p>
                </div>
              </div>

              {/* Close button */}
              <button 
                onClick={() => setImageExpanded(false)}
                className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Bottom overlay - Creation type/name */}
            <div className="absolute left-0 right-0 p-4 z-20 bottom-[env(safe-area-inset-bottom)]">
              <div className="inline-flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-sm px-3 py-1.5 shadow-lg">
                {TypeIcon && <TypeIcon size={18} className="text-white/90 drop-shadow-md" />}
                <span className="max-w-[70vw] truncate text-base font-semibold text-white drop-shadow-md">
                  {getContentTitle() || post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                </span>
              </div>

              {/* Pagination dots */}
              {post.images && post.images.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-3">
                  {post.images.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        idx === currentImageIndex ? "bg-white" : "bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background"
          ref={containerRef}
        >
          {/* Image Header - Collapsed/Cropped view */}
          {hasImages && (
            <motion.div
              className="relative w-full overflow-hidden cursor-grab active:cursor-grabbing"
              style={{ height: collapsedHeight }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDrag={handleVerticalDrag}
              onDragEnd={handleDragEnd}
            >
              {/* Image carousel - images are cropped via object-cover and container height */}
              <motion.div
                className="flex w-full absolute top-1/2 -translate-y-1/2"
                style={{ height: 360 }} // Full image height, container crops it
                onTouchStart={handleCarouselTouchStart}
                onTouchMove={handleCarouselTouchMove}
                onTouchEnd={handleCarouselTouchEnd}
                animate={{ 
                  x: `calc(-${currentImageIndex * 100}% + ${isDragging ? carouselDrag : 0}px)`,
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 30,
                }}
              >
                {post.images?.map((img, idx) => (
                  <div key={idx} className="w-full h-full flex-shrink-0">
                    <img
                      src={img}
                      alt={`Post image ${idx + 1}`}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </div>
                ))}
              </motion.div>

              {/* Gradient overlay for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none" />

              {/* Top overlay - Profile and Close button */}
              <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between z-10">
                {/* Profile info */}
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border-2 border-white/30">
                    <AvatarImage src={post.user.avatar} />
                    <AvatarFallback className="bg-muted">
                      {post.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-sm text-white drop-shadow-md">{post.user.name}</p>
                      <span className="text-sm text-white/80 drop-shadow-md">{post.user.handle}</span>
                    </div>
                    <p className="text-xs text-white/70 drop-shadow-md">{formattedDate}</p>
                  </div>
                </div>

                {/* Close button */}
                <button 
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition-colors z-10"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>

              {/* Pagination dots */}
              {post.images && post.images.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {post.images.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        idx === currentImageIndex ? "bg-white" : "bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* No images header - show profile info differently */}
          {!hasImages && (
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border border-border">
                  <AvatarImage src={post.user.avatar} />
                  <AvatarFallback className="bg-muted">
                    {post.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm">{post.user.name}</p>
                    <span className="text-sm text-muted-foreground">{post.user.handle}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{formattedDate}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          )}

          {/* Scrollable content */}
          <ScrollArea 
            className="flex-1" 
            style={{ height: hasImages ? `calc(100vh - ${collapsedHeight}px)` : 'calc(100vh - 72px)' }}
          >
            <div className="p-4 space-y-4 pb-safe">
              {/* Title row with icon and action buttons */}
              <div className="flex items-start justify-between gap-3">
                {/* Left side: Title with icon */}
                <div className="flex-1 min-w-0">
                  {getContentTitle() && (
                    <div className="flex items-center gap-2">
                      {TypeIcon && <TypeIcon size={20} className="text-muted-foreground shrink-0" />}
                      <span className="font-semibold text-base">{getContentTitle()}</span>
                    </div>
                  )}
                </div>

                {/* Right side: Comment and Like buttons */}
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-1 transition-transform active:scale-90"
                  >
                    <MessageCircle size={24} className="text-foreground" />
                    {commentCount > 0 && (
                      <span className="text-sm font-medium">{commentCount}</span>
                    )}
                  </button>
                  <button
                    onClick={() => toggleLike()}
                    className="flex items-center gap-1 transition-transform active:scale-90"
                  >
                    <Heart
                      size={24}
                      className={`transition-all duration-150 ease-out ${
                        isLiked ? "fill-primary text-primary" : "text-foreground"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Tags */}
              {tags && tags.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground whitespace-nowrap flex-shrink-0"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Caption */}
              {post.content && post.content.trim() && (
                <p className="text-sm">
                  <span className="font-semibold">{post.user.name}</span> {post.content}
                </p>
              )}

              {/* Comments section */}
              <div>
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

              {/* Divider before creation details */}
              <div className="border-t border-border pt-4">
                {/* Creation details */}
                {renderContentDetails()}
              </div>
            </div>
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
