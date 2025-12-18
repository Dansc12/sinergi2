import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Dumbbell, UtensilsCrossed, BookOpen, Calendar, Users, Check } from "lucide-react";
import { useGroupJoin } from "@/hooks/useGroupJoin";

interface Exercise {
  name: string;
  sets?: Array<{
    weight?: number;
    reps?: number;
    distance?: number;
    time?: string;
  }>;
  isCardio?: boolean;
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
}

interface RoutineExercise {
  name: string;
  sets?: RoutineSet[] | number;
  minReps?: number;
  maxReps?: number;
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
  };
}

export const PostDetailModal = ({ open, onClose, post }: PostDetailModalProps) => {
  const contentData = post.contentData as Record<string, unknown> | undefined;
  const groupId = post.type === 'group' ? (contentData?.groupId as string) : undefined;
  const { isMember, hasRequestedInvite, isLoading: joinLoading, joinPublicGroup, requestInvite } = useGroupJoin(groupId);

  const renderWorkoutDetails = () => {
    const exercises = (contentData?.exercises as Exercise[]) || [];
    const notes = contentData?.notes as string;
    // Check both title (from CreateWorkoutPage) and name fields
    const workoutTitle = (contentData?.title as string) || (contentData?.name as string);
    
    // Auto-generate name based on time if not provided
    const getAutoWorkoutName = (): string => {
      if (!post.createdAt) return "Workout";
      const date = new Date(post.createdAt);
      const hour = date.getHours();
      
      if (hour >= 5 && hour < 12) return "Morning Workout";
      if (hour >= 12 && hour < 17) return "Afternoon Workout";
      if (hour >= 17 && hour < 21) return "Evening Workout";
      return "Night Workout";
    };
    
    const workoutName = workoutTitle || getAutoWorkoutName();

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Dumbbell size={20} />
          <h4 className="font-semibold">{workoutName}</h4>
        </div>
        
        {exercises.map((exercise, idx) => {
          const exerciseNotes = (exercise as { notes?: string }).notes;
          return (
            <div key={idx} className="bg-muted/50 rounded-xl p-4">
              <h5 className="font-medium mb-2">{exercise.name}</h5>
              {exerciseNotes && (
                <p className="text-xs text-muted-foreground italic mb-2">"{exerciseNotes}"</p>
              )}
              {exercise.sets && exercise.sets.length > 0 && (
                <div className="space-y-1.5">
                  {exercise.sets.map((set, setIdx) => (
                    <div key={setIdx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium">
                        {setIdx + 1}
                      </span>
                      {exercise.isCardio ? (
                        <span>{set.distance} miles • {set.time}</span>
                      ) : (
                        <span>{set.weight} lbs × {set.reps} reps</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        
        {notes && (
          <div className="bg-muted/30 rounded-xl p-4">
            <p className="text-sm text-muted-foreground">{notes}</p>
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
        <div className="flex items-center gap-2 text-success">
          <UtensilsCrossed size={20} />
          <h4 className="font-semibold">{mealType || "Meal"}</h4>
        </div>
        
        {/* Macro summary */}
        <div className="grid grid-cols-4 gap-2 bg-success/10 rounded-xl p-4">
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
        
        {/* Food items */}
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-muted-foreground">Foods</h5>
          {foods.map((food, idx) => (
            <div key={idx} className="bg-muted/50 rounded-xl p-3 flex justify-between items-center">
              <div>
                <p className="font-medium">{food.name}</p>
                {food.servings && (
                  <p className="text-xs text-muted-foreground">
                    {food.servings} {food.servingSize || 'serving'}
                  </p>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{food.calories || 0} cal</p>
            </div>
          ))}
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
    const instructions = (contentData?.instructions as string[]) || [];
    const totalNutrition = contentData?.totalNutrition as { calories?: number; protein?: number; carbs?: number; fats?: number } | undefined;
    const coverPhoto = contentData?.coverPhoto as string;

    // Calculate totals if not provided
    const totalCalories = totalNutrition?.calories || ingredients.reduce((sum, i) => sum + (i.calories || 0), 0);
    const totalProtein = totalNutrition?.protein || ingredients.reduce((sum, i) => sum + (i.protein || 0), 0);
    const totalCarbs = totalNutrition?.carbs || ingredients.reduce((sum, i) => sum + (i.carbs || 0), 0);
    const totalFat = totalNutrition?.fats || ingredients.reduce((sum, i) => sum + (i.fat || i.fats || 0), 0);

    return (
      <div className="space-y-6 -mx-4 -mt-4">
        {/* Cover Photo */}
        {coverPhoto && (
          <img
            src={coverPhoto}
            alt={title || "Recipe"}
            className="w-full h-64 object-cover"
          />
        )}
        
        <div className="px-4 space-y-6">
          {/* Title and Description */}
          <div>
            <h2 className="text-2xl font-bold">{title || "Recipe"}</h2>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          
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
          
          {/* Calories and Macros */}
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
                      {ingredient.servings || 1} {ingredient.servingSize || 'serving'}
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
      </div>
    );
  };

  const renderRoutineDetails = () => {
    const routineName = contentData?.name as string;
    const exercises = (contentData?.exercises as RoutineExercise[]) || [];
    const days = (contentData?.days as RoutineDay[]) || [];
    const recurring = contentData?.recurring as string;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-violet-400">
          <Calendar size={20} />
          <h4 className="font-semibold">{routineName || "Routine"}</h4>
        </div>
        
        {days.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {days.map((day, idx) => (
              <span key={idx} className="px-3 py-1 bg-violet-500/20 text-violet-400 rounded-full text-sm">
                {day.day} {day.time && `@ ${day.time}`}
              </span>
            ))}
          </div>
        )}
        
        {recurring && (
          <p className="text-sm text-muted-foreground">
            Repeats: {recurring}
          </p>
        )}
        
        {exercises.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-muted-foreground">Exercises</h5>
            {exercises.map((exercise, idx) => {
              // Handle both array of sets and legacy number format
              const setsArray = Array.isArray(exercise.sets) ? exercise.sets : [];
              const setCount = Array.isArray(exercise.sets) ? exercise.sets.length : (exercise.sets || 0);
              const firstSet = setsArray[0];
              const minReps = firstSet?.minReps || exercise.minReps || 0;
              const maxReps = firstSet?.maxReps || exercise.maxReps || 0;
              
              return (
                <div key={idx} className="bg-muted/50 rounded-xl p-3">
                  <p className="font-medium">{exercise.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {setCount} sets × {minReps}-{maxReps} reps
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderPostDetails = () => {
    return (
      <div className="space-y-4">
        {post.content && (
          <p className="text-foreground">{post.content}</p>
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
        <div className="flex items-center gap-2 text-amber-400">
          <span className="text-2xl">👥</span>
          <h4 className="font-semibold text-lg">{name || "Group"}</h4>
        </div>
        
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        
        <div className="flex flex-wrap gap-2">
          {category && (
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm capitalize">
              {category}
            </span>
          )}
          <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm">
            {isPublic ? "Public" : "Private"}
          </span>
        </div>

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
        return renderPostDetails();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border border-border">
              <AvatarImage src={post.user.avatar} />
              <AvatarFallback className="bg-muted">
                {post.user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-sm font-semibold">{post.user.name}</DialogTitle>
              <p className="text-xs text-muted-foreground">{post.timeAgo}</p>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(85vh-80px)]">
          <div className="p-4 space-y-4">
            {/* Description if present - skip for recipe as it handles its own */}
            {post.type !== "recipe" && post.hasDescription && post.content && (
              <p className="text-sm">{post.content}</p>
            )}
            
            {/* Content-specific details */}
            {renderContentDetails()}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
