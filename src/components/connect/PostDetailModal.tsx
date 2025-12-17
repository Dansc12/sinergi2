import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Dumbbell, UtensilsCrossed, BookOpen, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
}

interface RoutineExercise {
  name: string;
  sets?: number;
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
  };
}

export const PostDetailModal = ({ open, onClose, post }: PostDetailModalProps) => {
  const contentData = post.contentData as Record<string, unknown> | undefined;

  const renderWorkoutDetails = () => {
    const exercises = (contentData?.exercises as Exercise[]) || [];
    const notes = contentData?.notes as string;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Dumbbell size={20} />
          <h4 className="font-semibold">Workout Details</h4>
        </div>
        
        {exercises.map((exercise, idx) => (
          <div key={idx} className="bg-muted/50 rounded-xl p-4">
            <h5 className="font-medium mb-2">{exercise.name}</h5>
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
        ))}
        
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
    const recipeName = contentData?.name as string;
    const ingredients = (contentData?.ingredients as RecipeIngredient[]) || [];
    const instructions = contentData?.instructions as string;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-rose-400">
          <BookOpen size={20} />
          <h4 className="font-semibold">{recipeName || "Recipe"}</h4>
        </div>
        
        {ingredients.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-muted-foreground">Ingredients</h5>
            {ingredients.map((ingredient, idx) => (
              <div key={idx} className="bg-muted/50 rounded-xl p-3 flex justify-between items-center">
                <div>
                  <p className="font-medium">{ingredient.name}</p>
                  {ingredient.servings && (
                    <p className="text-xs text-muted-foreground">
                      {ingredient.servings} {ingredient.servingSize || 'serving'}
                    </p>
                  )}
                </div>
                {ingredient.calories && (
                  <p className="text-sm text-muted-foreground">{ingredient.calories} cal</p>
                )}
              </div>
            ))}
          </div>
        )}
        
        {instructions && (
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-muted-foreground">Instructions</h5>
            <div className="bg-muted/30 rounded-xl p-4">
              <p className="text-sm whitespace-pre-wrap">{instructions}</p>
            </div>
          </div>
        )}
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
            {exercises.map((exercise, idx) => (
              <div key={idx} className="bg-muted/50 rounded-xl p-3">
                <p className="font-medium">{exercise.name}</p>
                <p className="text-sm text-muted-foreground">
                  {exercise.sets} sets × {exercise.minReps}-{exercise.maxReps} reps
                </p>
              </div>
            ))}
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
      default:
        return renderPostDetails();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-border flex-row items-center justify-between">
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
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(85vh-80px)]">
          <div className="p-4 space-y-4">
            {/* Images */}
            {post.images && post.images.length > 0 && (
              <div className="space-y-2">
                {post.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${post.type} image ${idx + 1}`}
                    className="w-full rounded-xl object-cover"
                  />
                ))}
              </div>
            )}
            
            {/* Description if present */}
            {post.hasDescription && post.content && (
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
