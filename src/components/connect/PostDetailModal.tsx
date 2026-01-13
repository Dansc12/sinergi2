import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow, format } from "date-fns";
import { ChevronLeft, MoreHorizontal, Heart, MessageCircle, Bookmark, Send, Dumbbell, Utensils, ChefHat, ClipboardList, FileText, Users, UserPlus, Clock, Calendar, Target, Copy } from "lucide-react";
import { useSavedPosts } from "@/hooks/useSavedPosts";
import { getMuscleContributions, getMuscleDisplayName } from "@/lib/muscleContributions";
import { useGroupJoin } from "@/hooks/useGroupJoin";
import { usePostReactions } from "@/hooks/usePostReactions";
import { usePostComments } from "@/hooks/usePostComments";
import { usePostDetail } from "@/contexts/PostDetailContext";
import { motion, AnimatePresence } from "framer-motion";
import { LazyImage } from "@/components/LazyImage";

// Interfaces
interface Exercise {
  name: string;
  notes?: string;
  category?: string;
  muscleGroup?: string;
  sets?: Array<{
    weight?: number | string;
    reps?: number | string;
    distance?: number | string;
    time?: string;
    type?: string;
    setType?: string;
  }>;
  isCardio?: boolean;
  supersetGroup?: number;
  supersetGroupId?: string;
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
  setType?: string;
}

interface RoutineExercise {
  name: string;
  sets?: RoutineSet[] | number;
  minReps?: number;
  maxReps?: number;
  supersetGroup?: number;
  supersetGroupId?: string;
  category?: string;
  muscleGroup?: string;
  isCardio?: boolean;
  notes?: string;
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
    likeCount?: number;
    commentCount?: number;
    viewerHasLiked?: boolean;
  };
  onCountChange?: (postId: string, updates: { like_count?: number; comment_count?: number; viewer_has_liked?: boolean }) => void;
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

// Superset colors for workout display
const supersetColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-yellow-500",
];

// Get content title based on type
const getContentTitle = (post: PostDetailModalProps["post"]): string => {
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

// Get CTA label based on post type
const getCTALabel = (type: string): string => {
  switch (type) {
    case "routine": return "Save Routine";
    case "workout": return "Replicate Workout";
    case "meal": return "Log Meal";
    case "recipe": return "Save Recipe";
    case "group": return "Join Group";
    default: return "Save";
  }
};

// Meta chips helper - returns up to 3 meaningful chips
interface MetaChip {
  icon: React.ElementType;
  label: string;
  value: string;
}

const getMetaChips = (post: PostDetailModalProps["post"]): MetaChip[] => {
  const data = post.contentData as Record<string, unknown> | undefined;
  if (!data) return [];
  
  const chips: MetaChip[] = [];
  
  switch (post.type) {
    case "routine": {
      const exercises = (data.exercises as RoutineExercise[]) || [];
      const scheduledDays = (data.scheduledDays as string[]) || [];
      
      // Estimated time (rough: 5 min per exercise)
      const estMinutes = exercises.length * 5;
      if (estMinutes > 0) {
        chips.push({ icon: Clock, label: "Est. Time", value: `${estMinutes} min` });
      }
      
      // Days per week
      if (scheduledDays.length > 0) {
        chips.push({ icon: Calendar, label: "Days/Week", value: `${scheduledDays.length}` });
      }
      
      // Muscles targeted
      const musclesSet = new Set<string>();
      exercises.forEach(ex => {
        if (ex.muscleGroup) musclesSet.add(ex.muscleGroup);
        const config = getMuscleContributions(ex.name, ex.muscleGroup || "");
        Object.keys(config.muscleContributions).forEach(m => musclesSet.add(getMuscleDisplayName(m)));
      });
      if (musclesSet.size > 0) {
        const musclesList = Array.from(musclesSet).slice(0, 2).join(", ");
        chips.push({ icon: Target, label: "Muscles", value: musclesList });
      }
      break;
    }
    case "workout": {
      const exercises = (data.exercises as Exercise[]) || [];
      
      // Duration if available
      const duration = data.duration as string | number | undefined;
      if (duration) {
        chips.push({ icon: Clock, label: "Duration", value: String(duration) });
      } else {
        const estMinutes = exercises.length * 5;
        if (estMinutes > 0) {
          chips.push({ icon: Clock, label: "Est. Time", value: `${estMinutes} min` });
        }
      }
      
      // Muscles
      const musclesSet = new Set<string>();
      exercises.forEach(ex => {
        if (ex.muscleGroup) musclesSet.add(ex.muscleGroup);
      });
      if (musclesSet.size > 0) {
        const musclesList = Array.from(musclesSet).slice(0, 2).join(", ");
        chips.push({ icon: Target, label: "Muscles", value: musclesList });
      }
      
      // Exercise count
      if (exercises.length > 0) {
        chips.push({ icon: Dumbbell, label: "Exercises", value: `${exercises.length}` });
      }
      break;
    }
    case "meal": {
      const foods = (data.foods as MealFood[]) || [];
      const totalCalories = (data.totalCalories as number) || foods.reduce((sum, f) => sum + (f.calories || 0), 0);
      const totalProtein = (data.totalProtein as number) || foods.reduce((sum, f) => sum + (f.protein || 0), 0);
      const mealType = data.mealType as string;
      
      if (totalCalories > 0) {
        chips.push({ icon: Utensils, label: "Calories", value: `${Math.round(totalCalories)}` });
      }
      if (totalProtein > 0) {
        chips.push({ icon: Target, label: "Protein", value: `${Math.round(totalProtein)}g` });
      }
      if (mealType && mealType !== "saved_meal") {
        chips.push({ icon: Clock, label: "Type", value: mealType });
      }
      break;
    }
    case "recipe": {
      const prepTime = data.prepTime as string;
      const servings = data.servings as string;
      const ingredients = (data.ingredients as RecipeIngredient[]) || [];
      const totalCalories = (data.totalCalories as number) || ingredients.reduce((sum, i) => sum + (i.calories || 0), 0);
      
      if (prepTime) {
        chips.push({ icon: Clock, label: "Prep", value: prepTime });
      }
      if (servings) {
        chips.push({ icon: Users, label: "Servings", value: servings });
      }
      if (totalCalories > 0) {
        chips.push({ icon: Utensils, label: "Calories", value: `${Math.round(totalCalories)}` });
      }
      break;
    }
    default:
      break;
  }
  
  return chips.slice(0, 3);
};

// Meta chips row component
const MetaChipsRow = ({ chips }: { chips: MetaChip[] }) => {
  if (chips.length === 0) return null;
  
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {chips.map((chip, idx) => (
        <div 
          key={idx}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm"
        >
          <chip.icon size={14} className="text-muted-foreground" />
          <span className="text-muted-foreground">{chip.label}:</span>
          <span className="font-medium">{chip.value}</span>
        </div>
      ))}
    </div>
  );
};

// Social proof row component
const SocialProofRow = ({ 
  likeCount, 
  commentCount,
  onCommentClick 
}: { 
  likeCount: number; 
  commentCount: number;
  onCommentClick: () => void;
}) => {
  return (
    <div className="flex items-center justify-between py-3 border-t border-b border-border">
      <div className="flex items-center gap-4">
        {likeCount > 0 && (
          <div className="flex items-center gap-1.5">
            <span>❤️</span>
            <span className="text-sm">{likeCount}</span>
          </div>
        )}
      </div>
      {commentCount > 0 && (
        <button 
          onClick={onCommentClick}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>💬</span>
          <span className="text-sm">{commentCount}</span>
        </button>
      )}
    </div>
  );
};

export const PostDetailModal = ({ open, onClose, post, onCountChange }: PostDetailModalProps) => {
  const navigate = useNavigate();
  const contentData = post.contentData as Record<string, unknown> | undefined;
  const groupId = post.type === 'group' ? (contentData?.groupId as string) : undefined;
  const { isMember, hasRequestedInvite, isLoading: joinLoading, joinPublicGroup, requestInvite } = useGroupJoin(groupId);
  const { isSaved, toggleSave } = useSavedPosts(post.id, post.type);
  const { setIsPostDetailOpen } = usePostDetail();

  // Use hooks with initial values and callbacks
  const { isLiked, likeCount, toggleLike } = usePostReactions(post.id, {
    initialLikeCount: post.likeCount ?? 0,
    initialIsLiked: post.viewerHasLiked ?? false,
    onCountChange: (newCount, newIsLiked) => {
      onCountChange?.(post.id, { like_count: newCount, viewer_has_liked: newIsLiked });
    },
  });

  const { comments, commentCount, addComment, fetchComments, isLoading: commentsLoading } = usePostComments(post.id, {
    initialCommentCount: post.commentCount ?? 0,
    onCountChange: (newCount) => {
      onCountChange?.(post.id, { comment_count: newCount });
    },
  });
  
  const [newComment, setNewComment] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [carouselDrag, setCarouselDrag] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const commentsRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);

  // Sync open state with context
  useEffect(() => {
    setIsPostDetailOpen(open);
    if (open) {
      document.body.style.overflow = 'hidden';
      fetchComments();
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      setIsPostDetailOpen(false);
    };
  }, [open, setIsPostDetailOpen, fetchComments]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    await addComment(newComment);
    setNewComment("");
  };

  const scrollToComments = useCallback(() => {
    commentsRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Copy workout handler
  const handleCopyWorkout = () => {
    const exercises = (contentData?.exercises as Exercise[]) || [];
    const workoutTitle = (contentData?.title as string) || (contentData?.name as string) || "Workout";
    const workoutTags = (contentData?.tags as string[]) || post.tags || [];
    
    const transformedExercises = exercises.map((ex, index) => ({
      id: `copied-${index}-${Date.now()}`,
      name: ex.name,
      notes: ex.notes || "",
      category: ex.category || "",
      muscleGroup: ex.muscleGroup || "",
      isCardio: ex.isCardio || false,
      supersetGroupId: ex.supersetGroupId || (ex.supersetGroup !== undefined ? String(ex.supersetGroup) : undefined),
      sets: (ex.sets || []).map((set, setIdx) => ({
        id: `set-${index}-${setIdx}-${Date.now()}`,
        weight: set.weight?.toString() || "",
        reps: set.reps?.toString() || "",
        distance: set.distance?.toString() || "",
        time: set.time || "",
        completed: false,
        setType: set.setType || set.type || "normal",
      })),
    }));

    onClose();
    navigate("/create/workout", {
      state: {
        prefilled: true,
        routineName: workoutTitle,
        exercises: transformedExercises,
        copiedTags: workoutTags,
        sourcePostId: post.id,
      },
      replace: true,
    });
  };

  // CTA handler
  const handleCTAClick = () => {
    switch (post.type) {
      case "workout":
        handleCopyWorkout();
        break;
      case "routine":
      case "meal":
      case "recipe":
        toggleSave();
        break;
      case "group": {
        const privacy = contentData?.privacy as string;
        const isPublic = privacy === 'public';
        if (isPublic) {
          joinPublicGroup();
        } else if (post.userId) {
          const name = contentData?.name as string;
          requestInvite(post.userId, name || 'the group');
        }
        break;
      }
      default:
        break;
    }
  };

  // Image carousel handlers
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

  const contentTitle = getContentTitle(post);
  const TypeIcon = typeIcons[post.type];
  const metaChips = getMetaChips(post);
  const tags = post.tags || (contentData?.tags as string[] | undefined);
  const formattedDate = post.createdAt 
    ? format(new Date(post.createdAt), "MMM d, yyyy")
    : post.timeAgo;
  const hasImages = post.images && post.images.length > 0;

  // Get CTA state
  const getCTAState = () => {
    if (post.type === "workout") {
      return { label: "Replicate Workout", icon: Copy, active: false };
    }
    if (post.type === "group") {
      if (isMember) return { label: "Joined", icon: Users, active: true };
      if (hasRequestedInvite) return { label: "Requested", icon: Users, active: true };
      return { label: getCTALabel(post.type), icon: Users, active: false };
    }
    return { 
      label: isSaved ? "Saved" : getCTALabel(post.type), 
      icon: Bookmark, 
      active: isSaved 
    };
  };
  const ctaState = getCTAState();

  // Render content details
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

  // Workout details renderer
  const renderWorkoutDetails = () => {
    const exercises = (contentData?.exercises as Exercise[]) || [];
    
    const supersetGroups = new Map<string, number>();
    let groupIndex = 0;
    exercises.forEach(ex => {
      const ssGroup = ex.supersetGroupId ?? (ex.supersetGroup !== undefined ? String(ex.supersetGroup) : undefined);
      if (ssGroup !== undefined && !supersetGroups.has(ssGroup)) {
        supersetGroups.set(ssGroup, groupIndex++);
      }
    });

    return (
      <div className="space-y-3">
        {exercises.map((exercise, idx) => {
          const ssGroupKey = exercise.supersetGroupId ?? (exercise.supersetGroup !== undefined ? String(exercise.supersetGroup) : undefined);
          const supersetGroupIndex = ssGroupKey !== undefined ? supersetGroups.get(ssGroupKey) : undefined;
          const supersetColor = supersetGroupIndex !== undefined ? supersetColors[supersetGroupIndex % supersetColors.length] : null;

          return (
            <div key={idx} className="rounded-xl bg-card border border-border overflow-hidden">
              <div className="flex">
                {supersetColor && <div className={`w-1 ${supersetColor}`} />}
                <div className="flex-1 p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                      <Dumbbell size={18} className="text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-foreground truncate">{exercise.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {exercise.category || "Exercise"} • {exercise.muscleGroup || "General"}
                      </p>
                    </div>
                  </div>
                  {exercise.notes && (
                    <p className="text-sm text-muted-foreground italic">"{exercise.notes}"</p>
                  )}
                  {exercise.sets && exercise.sets.length > 0 && (
                    <div className="space-y-1">
                      {exercise.sets.map((set, setIdx) => {
                        const weight = typeof set.weight === 'string' ? parseFloat(set.weight) || 0 : set.weight || 0;
                        const reps = typeof set.reps === 'string' ? parseFloat(set.reps) || 0 : set.reps || 0;
                        return (
                          <div key={setIdx} className="flex items-center gap-2 text-sm">
                            <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                              {setIdx + 1}
                            </span>
                            <span className="text-muted-foreground">{weight} lbs × {reps} reps</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Meal details renderer
  const renderMealDetails = () => {
    const foods = (contentData?.foods as MealFood[]) || [];
    
    return (
      <div className="space-y-2">
        {foods.map((food, idx) => (
          <div key={idx} className="rounded-xl bg-card border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium truncate">{food.name}</span>
              <span className="text-sm text-muted-foreground">{Math.round(food.calories || 0)} cal</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>P: {Math.round(food.protein || 0)}g</span>
              <span>C: {Math.round(food.carbs || 0)}g</span>
              <span>F: {Math.round(food.fat || food.fats || 0)}g</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Recipe details renderer
  const renderRecipeDetails = () => {
    const ingredients = (contentData?.ingredients as RecipeIngredient[]) || [];
    const instructions = (contentData?.instructions as string[]) || (contentData?.steps as string[]) || [];

    return (
      <div className="space-y-6">
        {ingredients.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3">Ingredients</h4>
            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                  <span className="text-sm text-primary font-medium shrink-0">
                    {ing.servings || 1} {ing.servingSize || 'serving'}
                  </span>
                  <span className="text-sm truncate">{ing.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {instructions.length > 0 && instructions.some(i => i.trim()) && (
          <div>
            <h4 className="font-semibold mb-3">Instructions</h4>
            <div className="space-y-3">
              {instructions.filter(i => i.trim()).map((step, idx) => (
                <div key={idx} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center shrink-0 font-medium">
                    {idx + 1}
                  </span>
                  <p className="text-sm pt-0.5">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Routine details renderer
  const renderRoutineDetails = () => {
    const exercises = (contentData?.exercises as RoutineExercise[]) || [];
    
    const supersetGroups = new Map<string, number>();
    let groupIndex = 0;
    exercises.forEach(ex => {
      const ssGroup = ex.supersetGroupId ?? (ex.supersetGroup !== undefined ? String(ex.supersetGroup) : undefined);
      if (ssGroup !== undefined && !supersetGroups.has(ssGroup)) {
        supersetGroups.set(ssGroup, groupIndex++);
      }
    });

    return (
      <div className="space-y-3">
        {exercises.map((exercise, idx) => {
          const ssGroupKey = exercise.supersetGroupId ?? (exercise.supersetGroup !== undefined ? String(exercise.supersetGroup) : undefined);
          const supersetGroupIndex = ssGroupKey !== undefined ? supersetGroups.get(ssGroupKey) : undefined;
          const supersetColor = supersetGroupIndex !== undefined ? supersetColors[supersetGroupIndex % supersetColors.length] : null;
          const setsArray = Array.isArray(exercise.sets) ? exercise.sets : [];

          return (
            <div key={idx} className="rounded-xl bg-card border border-border overflow-hidden">
              <div className="flex">
                {supersetColor && <div className={`w-1 ${supersetColor}`} />}
                <div className="flex-1 p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                      <Dumbbell size={18} className="text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-foreground truncate">{exercise.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {exercise.category || "Exercise"} • {exercise.muscleGroup || "General"}
                      </p>
                    </div>
                  </div>
                  {exercise.notes && (
                    <p className="text-sm text-muted-foreground italic">"{exercise.notes}"</p>
                  )}
                  {setsArray.length > 0 && (
                    <div className="space-y-1">
                      {setsArray.map((set, setIdx) => (
                        <div key={setIdx} className="flex items-center gap-2 text-sm">
                          <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                            {setIdx + 1}
                          </span>
                          <span className="text-muted-foreground">{set.minReps}-{set.maxReps} reps</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Group details renderer
  const renderGroupDetails = () => {
    const description = contentData?.description as string;
    const category = contentData?.category as string;
    const privacy = contentData?.privacy as string;

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {category && (
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium capitalize">
              {category}
            </span>
          )}
          <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm font-medium">
            {privacy === "public" ? "Public" : "Private"}
          </span>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    );
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background"
        >
          <div className="h-full w-full overflow-y-auto overflow-x-hidden flex flex-col">
            {/* (A) Top app bar */}
            <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
              <button onClick={onClose} className="p-1 -ml-1">
                <ChevronLeft size={24} />
              </button>
              <h1 className="font-semibold text-base truncate flex-1 text-center mx-4">
                {contentTitle}
              </h1>
              <button className="p-1 -mr-1">
                <MoreHorizontal size={24} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              {/* (B) Author row */}
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="w-10 h-10 border border-border shrink-0">
                    <AvatarImage src={post.user.avatar} />
                    <AvatarFallback className="bg-muted">
                      {post.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-semibold text-sm truncate">{post.user.name}</p>
                      <span className="text-sm text-muted-foreground truncate">{post.user.handle}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{formattedDate}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-3 text-xs rounded-full shrink-0"
                >
                  <UserPlus size={12} className="mr-1" />
                  Follow
                </Button>
              </div>

              {/* (C) Hero media */}
              <div className="px-4">
                {hasImages ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <motion.div
                      className="flex"
                      onTouchStart={handleCarouselTouchStart}
                      onTouchMove={handleCarouselTouchMove}
                      onTouchEnd={handleCarouselTouchEnd}
                      animate={{ 
                        x: `calc(-${currentImageIndex * 100}% + ${isDragging ? carouselDrag : 0}px)`,
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      {post.images?.map((img, idx) => (
                        <div key={idx} className="w-full flex-shrink-0 aspect-[4/5]">
                          <LazyImage
                            src={img}
                            alt={`Post image ${idx + 1}`}
                            className="w-full h-full object-cover"
                            width={800}
                            quality={85}
                          />
                        </div>
                      ))}
                    </motion.div>
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
                  </div>
                ) : (
                  <div className="rounded-xl bg-gradient-to-br from-muted/80 to-muted aspect-[4/5] flex items-center justify-center">
                    {TypeIcon && <TypeIcon size={64} className="text-muted-foreground/50" />}
                  </div>
                )}
              </div>

              {/* (D) Primary CTA */}
              <div className="px-4 py-4">
                <Button
                  onClick={handleCTAClick}
                  disabled={joinLoading}
                  className={`w-full h-12 text-base font-semibold rounded-xl ${
                    ctaState.active 
                      ? "bg-primary/20 text-primary border border-primary hover:bg-primary/30" 
                      : ""
                  }`}
                  variant={ctaState.active ? "outline" : "default"}
                >
                  <ctaState.icon size={18} className="mr-2" />
                  {ctaState.label}
                </Button>
              </div>

              {/* (E) Meta chips row */}
              {metaChips.length > 0 && (
                <div className="px-4 pb-4">
                  <MetaChipsRow chips={metaChips} />
                </div>
              )}

              {/* Tags */}
              {tags && tags.length > 0 && (
                <div className="px-4 pb-4">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* (F) Description */}
              {post.content && post.content.trim() && (
                <div className="px-4 pb-4">
                  <p className="text-sm leading-relaxed">{post.content}</p>
                </div>
              )}

              {/* (G) Content block */}
              <div className="px-4 pb-4">
                {renderContentDetails()}
              </div>

              {/* (H) Social proof row */}
              <div className="px-4">
                <SocialProofRow 
                  likeCount={likeCount} 
                  commentCount={commentCount}
                  onCommentClick={scrollToComments}
                />
              </div>

              {/* Action buttons */}
              <div className="px-4 py-3 flex items-center gap-4">
                <button
                  onClick={() => toggleLike()}
                  className="flex items-center gap-1.5 transition-transform active:scale-90"
                >
                  <Heart
                    size={24}
                    className={`transition-all duration-150 ease-out ${
                      isLiked ? "fill-primary text-primary" : "text-foreground"
                    }`}
                  />
                </button>
                <button
                  onClick={scrollToComments}
                  className="flex items-center gap-1.5 transition-transform active:scale-90"
                >
                  <MessageCircle size={24} className="text-foreground" />
                </button>
              </div>

              {/* (I) Comments section */}
              <div ref={commentsRef} className="px-4 pb-24">
                <h3 className="font-semibold mb-4">Comments {commentCount > 0 && `(${commentCount})`}</h3>
                
                {commentsLoading && (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                )}
                
                {!commentsLoading && comments.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
                )}
                
                {!commentsLoading && comments.length > 0 && (
                  <div className="space-y-4">
                    {comments.map((comment, idx) => (
                      <div 
                        key={comment.id} 
                        className={`flex gap-3 p-3 rounded-xl ${idx === 0 ? 'bg-muted/50' : ''}`}
                      >
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarImage src={comment.profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-muted">
                            {comment.profile?.first_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-semibold">
                              {comment.profile?.first_name || "User"}
                            </span>{" "}
                            {comment.content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sticky comment input */}
            <div className="sticky bottom-0 bg-background border-t border-border p-4 pb-safe shrink-0">
              <div className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 h-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitComment();
                    }
                  }}
                />
                <Button
                  size="icon"
                  className="h-10 w-10"
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim()}
                >
                  <Send size={18} />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
