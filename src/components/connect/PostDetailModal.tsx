import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow, format } from "date-fns";
import { X, BookOpen, Calendar, Users, Check, Heart, MessageCircle, Send, Dumbbell, Utensils, Copy } from "lucide-react";
import { useSavedPosts } from "@/hooks/useSavedPosts";
import { getMuscleContributions, getMuscleDisplayName } from "@/lib/muscleContributions";
import { useGroupJoin } from "@/hooks/useGroupJoin";
import { usePostReactions } from "@/hooks/usePostReactions";
import { usePostComments } from "@/hooks/usePostComments";
import { usePostDetail } from "@/contexts/PostDetailContext";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ContentTypePill, getContentTypeIcon, getContentTypeLabel } from "@/components/connect/ContentTypePill";

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
    setType?: string; // Alternative field name from CreateWorkoutPage
  }>;
  isCardio?: boolean;
  supersetGroup?: number;
  supersetGroupId?: string; // Alternative field name from CreateWorkoutPage
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
  const navigate = useNavigate();
  const contentData = post.contentData as Record<string, unknown> | undefined;
  const groupId = post.type === 'group' ? (contentData?.groupId as string) : undefined;
  const { isMember, hasRequestedInvite, isLoading: joinLoading, joinPublicGroup, requestInvite } = useGroupJoin(groupId);
  const { isLiked, toggleLike } = usePostReactions(post.id);
  const { comments, commentCount, addComment } = usePostComments(post.id);
  const { setIsPostDetailOpen } = usePostDetail();
  const { isSaved, toggleSave } = useSavedPosts(post.id, post.type);

  // Handle copying workout to Log Workout screen
  const handleCopyWorkout = () => {
    const exercises = (contentData?.exercises as Exercise[]) || [];
    const workoutTitle = (contentData?.title as string) || (contentData?.name as string) || "Workout";
    const workoutTags = (contentData?.tags as string[]) || post.tags || [];
    
    // Transform exercises to match CreateWorkoutPage format
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
  
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [imageExpanded, setImageExpanded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync open state with context to hide bottom nav and lock scroll
  useEffect(() => {
    setIsPostDetailOpen(open);
    
    // Lock body scroll when modal is open
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      setIsPostDetailOpen(false);
    };
  }, [open, setIsPostDetailOpen]);

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
      case "meal": {
        // Check for actual meal name first, fallback to mealType display name
        const mealName = (contentData.name as string);
        if (mealName) return mealName;
        const mealType = (contentData.mealType as string);
        // Don't return "saved_meal" as display name
        if (mealType && mealType !== "saved_meal") return mealType;
        return "Meal";
      }
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
  const TypeIcon = getContentTypeIcon(post.type);
  const contentTitle = getContentTitle() || getContentTypeLabel(post.type);

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
    // Allow drag in either direction based on current state
    if (info.offset.y > 0 && !imageExpanded) {
      setDragOffset(Math.min(info.offset.y, 200)); // Cap the offset
    } else if (info.offset.y < 0 && imageExpanded) {
      setDragOffset(Math.max(info.offset.y, -200)); // Cap the offset
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 40;
    const velocity = info.velocity.y;
    
    // Use velocity to make swipe feel more responsive
    if ((info.offset.y > threshold || velocity > 300) && !imageExpanded) {
      setImageExpanded(true);
    } else if ((info.offset.y < -threshold || velocity < -300) && imageExpanded) {
      setImageExpanded(false);
    }
    setDragOffset(0);
  };

  const renderWorkoutDetails = () => {
    const exercises = (contentData?.exercises as Exercise[]) || [];
    const notes = contentData?.notes as string;

    // Helper to get set label matching Log Workout style
    const getSetLabel = (setType: string | undefined, normalSetNumber: number): string => {
      switch (setType) {
        case "warmup": return "W";
        case "failure": return "F";
        case "drop": case "dropset": return "D";
        default: return String(normalSetNumber);
      }
    };

    // Get styling for set type badge matching Log Workout
    const getSetBadgeStyle = (setType: string | undefined): string => {
      switch (setType) {
        case "warmup": return "bg-yellow-500/20 text-yellow-600";
        case "failure": return "bg-red-500/20 text-red-600";
        case "drop": case "dropset": return "bg-blue-500/20 text-blue-600";
        default: return "bg-muted text-muted-foreground";
      }
    };

    // Calculate normal set number (only counts normal sets)
    const getNormalSetNumber = (sets: Exercise["sets"], currentIndex: number): number => {
      if (!sets) return currentIndex + 1;
      let count = 0;
      for (let i = 0; i <= currentIndex; i++) {
        // Check both 'type' and 'setType' field names
        const setType = sets[i]?.type || sets[i]?.setType;
        if (!setType || setType === "normal") {
          count++;
        }
      }
      return count;
    };

    // Group exercises by superset for coloring - handle both supersetGroup (number) and supersetGroupId (string)
    const supersetGroups = new Map<string, number>();
    let groupIndex = 0;
    exercises.forEach(ex => {
      // Use supersetGroupId (string) or supersetGroup (number) - convert to string for consistent Map key
      const ssGroup = ex.supersetGroupId ?? (ex.supersetGroup !== undefined ? String(ex.supersetGroup) : undefined);
      if (ssGroup !== undefined && !supersetGroups.has(ssGroup)) {
        supersetGroups.set(ssGroup, groupIndex++);
      }
    });

    return (
      <div className="space-y-3">
        {exercises.map((exercise, idx) => {
          // Get superset group key (handle both supersetGroupId and supersetGroup)
          const ssGroupKey = exercise.supersetGroupId ?? (exercise.supersetGroup !== undefined ? String(exercise.supersetGroup) : undefined);
          const supersetGroupIndex = ssGroupKey !== undefined 
            ? supersetGroups.get(ssGroupKey) 
            : undefined;
          const supersetColor = supersetGroupIndex !== undefined 
            ? supersetColors[supersetGroupIndex % supersetColors.length]
            : null;

          return (
            <div 
              key={idx} 
              className="rounded-xl bg-card border border-border overflow-hidden w-full"
            >
              <div className="flex w-full min-w-0">
                {/* Left color bar for superset exercises */}
                {supersetColor && (
                  <div className={`w-1 ${supersetColor}`} />
                )}
                
                <div className="flex-1 p-4 space-y-3 min-w-0 overflow-hidden">
                  {/* Exercise header - icon, name, category, muscles */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                      <Dumbbell size={18} className="text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-foreground truncate">{exercise.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {exercise.category || "Exercise"} • {(() => {
                          if (exercise.isCardio) return "Cardio";
                          const config = getMuscleContributions(exercise.name, exercise.muscleGroup || "");
                          const sortedMuscles = Object.entries(config.muscleContributions)
                            .sort(([, a], [, b]) => b - a)
                            .map(([muscle]) => getMuscleDisplayName(muscle));
                          return sortedMuscles.length > 0 ? sortedMuscles.join(", ") : exercise.muscleGroup || "General";
                        })()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Notes - directly below exercise header */}
                  {exercise.notes && (
                    <p className="text-sm text-foreground italic">
                      {exercise.notes}
                    </p>
                  )}
                  
                  {/* Sets - row format */}
                  {exercise.sets && exercise.sets.length > 0 && (
                    <div className="space-y-1.5">
                      {exercise.sets.map((set, setIdx) => {
                        const normalSetNumber = getNormalSetNumber(exercise.sets, setIdx);
                        // Check both 'type' and 'setType' field names
                        const setType = set.type || set.setType;
                        const setLabel = getSetLabel(setType, normalSetNumber);
                        const badgeStyle = getSetBadgeStyle(setType);
                        const weight = typeof set.weight === 'string' ? parseFloat(set.weight) || 0 : set.weight || 0;
                        const reps = typeof set.reps === 'string' ? parseFloat(set.reps) || 0 : set.reps || 0;
                        const distance = typeof set.distance === 'string' ? parseFloat(set.distance) || 0 : set.distance || 0;
                        
                        return (
                          <div 
                            key={setIdx}
                            className="flex items-center flex-wrap gap-2 sm:gap-3 py-1"
                          >
                            {/* Set type/# badge - circular matching Log Workout style */}
                            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm ${badgeStyle}`}> 
                              {setLabel}
                            </div>
                            
                            {/* Weight/Distance and Reps/Time in boxes */}
                            {exercise.isCardio ? (
                              <>
                                <div className="bg-muted/30 rounded-md px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1">
                                  <span className="text-xs sm:text-sm font-medium text-foreground">{distance}</span>
                                  <span className="text-[10px] sm:text-xs text-muted-foreground">mi</span>
                                </div>
                                {set.time && (
                                  <div className="bg-muted/30 rounded-md px-2 sm:px-3 py-1 sm:py-1.5">
                                    <span className="text-xs sm:text-sm font-medium text-foreground">{set.time}</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <div className="bg-muted/30 rounded-md px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1">
                                  <span className="text-xs sm:text-sm font-medium text-foreground">{weight}</span>
                                  <span className="text-[10px] sm:text-xs text-muted-foreground">lbs</span>
                                </div>
                                <span className="text-muted-foreground text-xs sm:text-base">×</span>
                                <div className="bg-muted/30 rounded-md px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1">
                                  <span className="text-xs sm:text-sm font-medium text-foreground">{reps}</span>
                                  <span className="text-[10px] sm:text-xs text-muted-foreground">reps</span>
                                </div>
                              </>
                            )}
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
        
        {notes && (
          <div className="bg-muted/30 rounded-xl p-4">
            <p className="text-sm text-muted-foreground italic">"{notes}"</p>
          </div>
        )}
      </div>
    );
  };

  const renderMealDetails = () => {
    const foods = (contentData?.foods as MealFood[]) || [];
    const coverPhoto = contentData?.coverPhoto as string | undefined;
    const totalCalories = (contentData?.totalCalories as number) || foods.reduce((sum, f) => sum + (f.calories || 0), 0);
    const totalProtein = (contentData?.totalProtein as number) || foods.reduce((sum, f) => sum + (f.protein || 0), 0);
    const totalCarbs = (contentData?.totalCarbs as number) || foods.reduce((sum, f) => sum + (f.carbs || 0), 0);
    const totalFat = (contentData?.totalFats as number) || foods.reduce((sum, f) => sum + (f.fat || f.fats || 0), 0);

    // Macro colors matching MealSavedCard
    const proteinColor = '#3DD6C6';
    const carbsColor = '#5B8CFF';
    const fatsColor = '#B46BFF';
    
    const totalMacros = totalProtein + totalCarbs + totalFat;
    const proteinRatio = totalMacros > 0 ? Math.max((totalProtein / totalMacros), 0.08) : 0.33;
    const carbsRatio = totalMacros > 0 ? Math.max((totalCarbs / totalMacros), 0.08) : 0.33;
    const fatsRatio = totalMacros > 0 ? Math.max((totalFat / totalMacros), 0.08) : 0.33;
    
    const totalRatio = proteinRatio + carbsRatio + fatsRatio;
    const normalizedProtein = proteinRatio / totalRatio;
    const normalizedCarbs = carbsRatio / totalRatio;
    const normalizedFats = fatsRatio / totalRatio;
    
    const proteinSize = 40 + normalizedProtein * 50;
    const carbsSize = 40 + normalizedCarbs * 50;
    const fatsSize = 40 + normalizedFats * 50;
    
    const proteinOpacity = totalMacros > 0 ? 0.6 + (totalProtein / totalMacros) * 0.4 : 0.75;
    const carbsOpacity = totalMacros > 0 ? 0.6 + (totalCarbs / totalMacros) * 0.4 : 0.75;
    const fatsOpacity = totalMacros > 0 ? 0.6 + (totalFat / totalMacros) * 0.4 : 0.75;

    return (
      <div className="space-y-4">
        {/* Cover Photo - styled like MealSavedCard expanded view */}
        {coverPhoto && (
          <div className="relative h-40 overflow-hidden rounded-xl sm:-mx-4">
            <img
              src={coverPhoto} 
              alt="Meal cover" 
              className="h-full w-full object-cover"
            />
            {/* Top gradient for legibility */}
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
            {/* Bottom soft fade */}
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none" />
          </div>
        )}
        {/* Nutrition Summary Bar - matching MealSavedCard style */}
        <div className="relative w-full h-14 rounded-xl overflow-hidden shadow-lg shadow-black/30">
          {/* Liquid blob background */}
          <div className="absolute inset-0 bg-card">
            {/* Protein blob */}
            <motion.div
              className="absolute rounded-full blur-2xl"
              style={{
                width: `${proteinSize}%`,
                height: `${proteinSize * 2}%`,
                background: `radial-gradient(circle, ${proteinColor} 0%, transparent 70%)`,
                opacity: proteinOpacity,
                left: '5%',
                top: '-20%',
              }}
              animate={{
                x: [0, 15, -10, 5, 0],
                y: [0, -10, 15, -5, 0],
                scale: [1, 1.1, 0.95, 1.05, 1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            {/* Carbs blob */}
            <motion.div
              className="absolute rounded-full blur-2xl"
              style={{
                width: `${carbsSize}%`,
                height: `${carbsSize * 2}%`,
                background: `radial-gradient(circle, ${carbsColor} 0%, transparent 70%)`,
                opacity: carbsOpacity,
                right: '10%',
                top: '-30%',
              }}
              animate={{
                x: [0, -20, 10, -5, 0],
                y: [0, 15, -10, 5, 0],
                scale: [1, 0.95, 1.1, 0.98, 1],
              }}
              transition={{
                duration: 9,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.5,
              }}
            />
            {/* Fats blob */}
            <motion.div
              className="absolute rounded-full blur-2xl"
              style={{
                width: `${fatsSize}%`,
                height: `${fatsSize * 2}%`,
                background: `radial-gradient(circle, ${fatsColor} 0%, transparent 70%)`,
                opacity: fatsOpacity,
                left: '30%',
                bottom: '-50%',
              }}
              animate={{
                x: [0, 10, -15, 8, 0],
                y: [0, -15, 10, -8, 0],
                scale: [1, 1.08, 0.92, 1.04, 1],
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1,
              }}
            />
          </div>
          
          {/* Frosted glass overlay */}
          <div 
            className="absolute inset-0 backdrop-blur-[2px]"
            style={{
              background: `linear-gradient(90deg, 
                rgba(0, 0, 0, 0.08) 0%, 
                rgba(0, 0, 0, 0) 12%, 
                rgba(0, 0, 0, 0) 88%, 
                rgba(0, 0, 0, 0.08) 100%)`,
              boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.12)',
            }}
          />
          
          {/* Border overlay */}
          <div 
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          />
          
          {/* Content - horizontal layout matching MealSavedCard NutritionSummaryBar */}
          <div className="relative z-10 flex items-center h-full px-3 sm:px-4">
            {/* Left: Icon + Count */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-white shrink-0">
              <Utensils size={18} className="sm:w-5 sm:h-5" />
              <span className="font-semibold text-sm">{foods.length}</span>
            </div>
            
            {/* Center: Macros (absolutely positioned for true centering) */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <span className="whitespace-nowrap" style={{ color: proteinColor }}>P {Math.round(totalProtein)}g</span>
              <span className="whitespace-nowrap" style={{ color: carbsColor }}>C {Math.round(totalCarbs)}g</span>
              <span className="whitespace-nowrap" style={{ color: fatsColor }}>F {Math.round(totalFat)}g</span>
            </div>
            
            {/* Right: Calories */}
            <div className="ml-auto text-xs sm:text-sm text-white shrink-0">
              <span className="font-medium">{Math.round(totalCalories)} cal</span>
            </div>
          </div>
        </div>
        
        {/* Food items with macro gradient bars - matching MealSavedCard style */}
        <div className="space-y-2">
          {foods.map((food, idx) => {
            const p = food.protein || 0;
            const c = food.carbs || 0;
            const f = food.fat || food.fats || 0;
            const total = p + c + f;
            const itemPPct = total > 0 ? (p / total) * 100 : 0;
            const itemCPct = total > 0 ? (c / total) * 100 : 0;
            
            return (
              <div 
                key={idx} 
                className="rounded-xl bg-muted/30 border border-border/50 relative overflow-hidden"
              >
                {/* Macro gradient bar at top */}
                {total > 0 && (
                  <div 
                    className="absolute left-0 right-0 top-0 h-1"
                    style={{
                      background: `linear-gradient(90deg, ${proteinColor} 0%, ${proteinColor} ${itemPPct * 0.7}%, ${carbsColor} ${itemPPct + itemCPct * 0.3}%, ${carbsColor} ${itemPPct + itemCPct * 0.7}%, ${fatsColor} ${itemPPct + itemCPct + (100 - itemPPct - itemCPct) * 0.3}%, ${fatsColor} 100%)`,
                    }}
                  />
                )}
                <div className="p-2 sm:p-3 pt-3 sm:pt-4">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <span className="text-xs sm:text-sm font-semibold text-primary shrink-0">
                      {(() => {
                        const servings = food.servings ?? 1;
                        const servingSize = food.servingSize || 'g';
                        const hasNumber = /\d/.test(servingSize);
                        if (hasNumber) {
                          return servings > 1 ? `${servings} × ${servingSize}` : servingSize;
                        }
                        return `${servings}${servingSize}`;
                      })()}
                    </span>
                    <span className="font-medium text-foreground text-xs sm:text-sm truncate min-w-0 flex-1">{food.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5 flex-wrap">
                    <span className="text-[10px] sm:text-xs text-foreground shrink-0">{Math.round(food.calories || 0)} cal</span>
                    <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs">
                      <span className="whitespace-nowrap" style={{ color: proteinColor }}>P: {Math.round(p)}g</span>
                      <span className="whitespace-nowrap" style={{ color: carbsColor }}>C: {Math.round(c)}g</span>
                      <span className="whitespace-nowrap" style={{ color: fatsColor }}>F: {Math.round(f)}g</span>
                    </div>
                  </div>
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
          <div className="flex justify-between bg-muted/50 rounded-xl p-3 sm:p-4 gap-1 sm:gap-2">
            {prepTime && (
              <div className="text-center flex-1 min-w-0">
                <p className="text-sm sm:text-lg font-semibold truncate">{prepTime}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Prep Time</p>
              </div>
            )}
            {cookTime && (
              <div className="text-center flex-1 min-w-0">
                <p className="text-sm sm:text-lg font-semibold truncate">{cookTime}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Cook Time</p>
              </div>
            )}
            {servingsCount && (
              <div className="text-center flex-1 min-w-0">
                <p className="text-sm sm:text-lg font-semibold truncate">{servingsCount}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Servings</p>
              </div>
            )}
          </div>
        )}
        
        {/* Macro summary - responsive grid */}
        <div className="grid grid-cols-4 gap-1 sm:gap-2 bg-rose-500/10 rounded-xl p-3 sm:p-4 w-full min-w-0 overflow-hidden">
          <div className="text-center min-w-0">
            <p className="text-base sm:text-xl font-bold truncate">{Math.round(totalCalories)}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">cal</p>
          </div>
          <div className="text-center min-w-0">
            <p className="text-base sm:text-xl font-bold text-primary truncate">{Math.round(totalProtein)}g</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">protein</p>
          </div>
          <div className="text-center min-w-0">
            <p className="text-base sm:text-xl font-bold text-success truncate">{Math.round(totalCarbs)}g</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">carbs</p>
          </div>
          <div className="text-center min-w-0">
            <p className="text-base sm:text-xl font-bold text-amber-500 truncate">{Math.round(totalFat)}g</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">fat</p>
          </div>
        </div>
        
        {/* Ingredients */}
        {ingredients.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-lg font-semibold">Ingredients</h4>
            <div className="space-y-2">
              {ingredients.map((ingredient, idx) => (
                <div key={idx} className="flex items-center gap-2 sm:gap-3 py-2 border-b border-border last:border-0">
                  <span className="text-xs sm:text-sm font-medium text-primary shrink-0">
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
                  <span className="text-xs sm:text-sm flex-1 min-w-0 truncate">{ingredient.name}</span>
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
                  
                  <p className="font-medium mb-2 truncate">{exercise.name}</p>
                  <div className="space-y-1.5">
                    {setsArray.length > 0 ? (
                      setsArray.map((set, setIdx) => {
                        const setType = set.type;
                        const typeBadge = setType && setTypeBadges[setType];

                        return (
                          <div key={setIdx} className="flex items-center flex-wrap gap-2 text-xs sm:text-sm text-muted-foreground min-w-0">
                            {typeBadge ? (
                              <span className={`w-6 h-6 rounded-full ${typeBadge.color} text-xs flex items-center justify-center font-medium shrink-0`}>
                                {typeBadge.label}
                              </span>
                            ) : (
                              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium shrink-0">
                                {setIdx + 1}
                              </span>
                            )}
                            <span className="min-w-0">{set.minReps}-{set.maxReps} reps</span>
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
  const collapsedHeight = '25vh'; // 25% viewport height
  const collapsedImageHeight = 360; // keep image size; container crops middle portion

  // Expanded view - fullscreen overlay
  if (imageExpanded && hasImages) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="expanded-view"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 35,
            mass: 0.8
          }}
          className="fixed inset-0 z-50 bg-background overflow-hidden"
          ref={containerRef}
        >
          {/* Centered content block: Header + Image + Content Type */}
          <div className="h-full w-full flex flex-col items-stretch justify-center">
            {/* Top row - Profile and Close button (directly touching image) */}
            <div className="px-4 py-2 flex items-center justify-between bg-background w-full">
              {/* Profile info */}
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

              {/* Close button - no circle */}
              <button 
                onClick={() => setImageExpanded(false)}
                className="p-1 hover:opacity-70 transition-opacity"
              >
                <X size={22} />
              </button>
            </div>

            {/* Image container - no extra padding, directly touching header and footer */}
            <motion.div
              className="relative w-full bg-black"
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

            {/* Bottom row - Content type/name (directly touching image) */}
            <div className="px-4 py-2 bg-background w-full">
              <ContentTypePill type={post.type} title={contentTitle} noPill className="[&>span]:text-foreground [&>svg]:text-foreground/80" />
            </div>
          </div>
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
          className="fixed inset-0 z-50 bg-background w-screen max-w-screen overflow-hidden"
          ref={containerRef}
        >
          <div className="h-full w-screen max-w-screen overflow-y-auto overflow-x-hidden">
            {/* Image Header - Collapsed/Cropped view */}
            {hasImages && (
              <motion.div
                className="relative w-full overflow-hidden cursor-grab active:cursor-grabbing"
                style={{ 
                  height: collapsedHeight,
                }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.3}
                onDrag={handleVerticalDrag}
                onDragEnd={handleDragEnd}
              >
                {/* Image - fixed height, scales slightly during drag for visual feedback */}
                <motion.div
                  className="flex w-full absolute top-0 left-0"
                  style={{ height: collapsedImageHeight }}
                  animate={{
                    scale: 1 + (dragOffset / 800),
                    y: dragOffset * 0.15,
                  }}
                  transition={{ type: "tween", duration: 0 }}
                >
                  {post.images?.[0] && (
                    <div className="w-full h-full flex-shrink-0">
                      <img
                        src={post.images[0]}
                        alt="Post image"
                        className="w-full h-full object-cover object-center"
                        draggable={false}
                      />
                    </div>
                  )}
                </motion.div>

                {/* Gradient overlay for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Top overlay - Profile and Close button with safe area */}
                <div
                  className="absolute top-0 left-0 right-0 pt-safe px-4 pb-4 flex items-start justify-between z-20"
                  style={{ paddingTop: "max(env(safe-area-inset-top), 1rem)" }}
                >
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
                        <p className="font-semibold text-sm text-white drop-shadow-md">
                          {post.user.name}
                        </p>
                        <span className="text-sm text-white/80 drop-shadow-md">
                          {post.user.handle}
                        </span>
                      </div>
                      <p className="text-xs text-white/70 drop-shadow-md">
                        {formattedDate}
                      </p>
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
                      <span className="text-sm text-muted-foreground">
                        {post.user.handle}
                      </span>
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

            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 pb-safe overflow-hidden w-screen max-w-screen overflow-x-hidden min-w-0 box-border">
              {/* Title row with icon and action buttons */}
              <div className="flex items-start justify-between gap-2 sm:gap-3 w-full min-w-0">
                {/* Left side: Title with icon */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  {getContentTitle() && (
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      {TypeIcon && <TypeIcon size={18} className="text-muted-foreground shrink-0 sm:w-5 sm:h-5" />}
                      <span className="font-semibold text-sm sm:text-base truncate">{getContentTitle()}</span>
                    </div>
                  )}
                </div>

                {/* Right side: Comment and Like buttons */}
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-0.5 sm:gap-1 transition-transform active:scale-90"
                  >
                    <MessageCircle size={20} className="text-foreground sm:w-6 sm:h-6" />
                    {commentCount > 0 && (
                      <span className="text-xs sm:text-sm font-medium">{commentCount}</span>
                    )}
                  </button>
                  <button
                    onClick={() => toggleLike()}
                    className="flex items-center gap-0.5 sm:gap-1 transition-transform active:scale-90"
                  >
                    <Heart
                      size={20}
                      className={`transition-all duration-150 ease-out sm:w-6 sm:h-6 ${
                        isLiked ? "fill-primary text-primary" : "text-foreground"
                      }`}
                    />
                  </button>
                  {/* Copy button for workouts, Save button for other saveable types */}
                  {post.type === "workout" && (
                    <Button
                      onClick={handleCopyWorkout}
                      size="sm"
                      className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-150 ease-out"
                    >
                      <Copy size={12} className="mr-1 sm:mr-1.5 sm:w-3.5 sm:h-3.5" />
                      Copy
                    </Button>
                  )}
                  {(post.type === "meal" || post.type === "recipe" || post.type === "routine") && (
                    <Button
                      onClick={() => toggleSave()}
                      size="sm"
                      className={`h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm transition-all duration-150 ease-out ${
                        isSaved 
                          ? "bg-primary/20 text-primary border border-primary hover:bg-primary/30" 
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      {isSaved ? "Saved" : "Save"}
                    </Button>
                  )}
                </div>
              </div>

              {/* Tags with horizontal scroll and fade */}
              {tags && tags.length > 0 && (
                <div className="relative w-full max-w-full overflow-hidden">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pr-8">
                    {tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground whitespace-nowrap flex-shrink-0 max-w-[60vw] truncate"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  {/* Right fade overlay */}
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
