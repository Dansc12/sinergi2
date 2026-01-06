import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useDailyLogs } from "@/hooks/useDailyLogs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
interface MacroBarProps {
  label: string;
  current: number;
  goal: number;
  color: string;
}

const MacroBar = ({ label, current, goal, color }: MacroBarProps) => {
  const percentage = Math.min((current / goal) * 100, 100);
  
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-8">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-medium w-16 text-right">{Math.round(current)}g / {goal}g</span>
    </div>
  );
};

interface LoggedFood {
  name: string;
  servings: number;
  servingSize: string;
  calories: number;
}

interface MealLog {
  id: string;
  meal_type: string;
  foods: LoggedFood[];
  total_calories: number;
  total_protein?: number;
  total_carbs?: number;
  total_fat?: number;
}

interface FoodToDelete {
  mealLogId: string;
  foodIndex: number;
  foodName: string;
}

// Helper to format serving display consistently
const formatServingDisplay = (servings: number, servingSize: string): string => {
  // Check if servingSize already contains a numeric value (e.g., "114 g", "100g", "123 g")
  const numericMatch = servingSize.match(/^(\d+(?:\.\d+)?)\s*/);
  if (numericMatch) {
    const sizeValue = parseFloat(numericMatch[1]);
    // If servings equals the numeric value in servingSize, data is "baked in" - just show servingSize
    // This handles saved meals where servings=123 and servingSize="123 g"
    if (servings === sizeValue) {
      return servingSize;
    }
    // If servings is 1, just show the serving size directly
    if (servings === 1) {
      return servingSize;
    }
    // Otherwise, calculate total and show combined (e.g., 2 x 100g = "200g")
    const unit = servingSize.replace(/^[\d.]+\s*/, '').trim();
    return `${Math.round(servings * sizeValue)}${unit ? ' ' + unit : ''}`;
  }
  // Fallback: show multiplier format if serving size doesn't have a number
  if (servings === 1) {
    return servingSize;
  }
  return `${servings} × ${servingSize}`;
};

interface MealLogDisplayProps {
  name: string;
  mealType: string;
  mealLogs: MealLog[];
  onAddFood: () => void;
  onDeleteFood: (mealLogId: string, foodIndex: number, foodName: string) => void;
}

const MealLogDisplay = ({ name, mealLogs, onAddFood, onDeleteFood }: MealLogDisplayProps) => {
  const totalCalories = mealLogs.reduce((sum, log) => sum + (log.total_calories || 0), 0);
  
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold">{name}</h4>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-primary hover:bg-primary/10"
          onClick={onAddFood}
        >
          <Plus size={18} />
        </Button>
      </div>
      
      {mealLogs.length > 0 && mealLogs.some(log => log.foods?.length > 0) ? (
        <>
          <p className="text-primary font-bold text-lg mb-2">{totalCalories} cal</p>
          <div className="space-y-1">
            {mealLogs.map((log) => (
              (log.foods || []).map((food, foodIndex) => (
                <div key={`${log.id}-${foodIndex}`} className="text-sm text-muted-foreground flex items-center gap-2">
                  <button
                    onClick={() => onDeleteFood(log.id, foodIndex, food.name)}
                    className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                  <span className="flex-1 truncate">{food.name}</span>
                  <span className="text-xs flex-shrink-0">{formatServingDisplay(food.servings, food.servingSize)}</span>
                </div>
              ))
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground italic">No foods logged yet</p>
      )}
    </div>
  );
};

// Floating bubble component
const Bubble = ({ delay, duration, left, size }: { delay: number; duration: number; left: number; size: number }) => (
  <div
    className="absolute rounded-full animate-bubble"
    style={{
      left: `${left}%`,
      bottom: '-10px',
      width: `${size}px`,
      height: `${size}px`,
      background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), rgba(255,255,255,0.1) 50%, transparent 70%)`,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
    }}
  />
);

// Animated liquid wave component
const LiquidWave = ({ fillPercentage }: { fillPercentage: number }) => {
  // Background color from CSS: 0 0% 7%
  const bgColor = "hsl(0, 0%, 7%)";
  
  // Generate random bubbles
  const bubbles = [
    { delay: 0, duration: 4, left: 15, size: 6 },
    { delay: 1.5, duration: 5, left: 35, size: 4 },
    { delay: 0.5, duration: 4.5, left: 55, size: 8 },
    { delay: 2, duration: 3.5, left: 75, size: 5 },
    { delay: 3, duration: 5.5, left: 25, size: 3 },
    { delay: 1, duration: 4, left: 85, size: 7 },
    { delay: 2.5, duration: 4.8, left: 45, size: 4 },
    { delay: 0.8, duration: 5.2, left: 65, size: 6 },
    { delay: 3.5, duration: 4.2, left: 10, size: 5 },
    { delay: 1.8, duration: 3.8, left: 90, size: 4 },
  ];
  
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradient overlay for depth - blends perfectly to background */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: `linear-gradient(to top, 
            ${bgColor} 0%,
            hsla(0, 0%, 7%, 0.98) 5%,
            hsla(0, 0%, 7%, 0.9) 12%,
            hsla(270, 10%, 10%, 0.7) 25%, 
            hsla(270, 20%, 15%, 0.4) 40%, 
            transparent 60%
          )`,
        }}
      />
      
      {/* Liquid container */}
      <div 
        className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out"
        style={{ height: `${Math.min(fillPercentage, 100)}%` }}
      >
        {/* Bubbles */}
        <div className="absolute inset-0 overflow-hidden">
          {bubbles.map((bubble, i) => (
            <Bubble key={i} {...bubble} />
          ))}
        </div>
        
        {/* Primary wave */}
        <svg 
          className="absolute -top-[20px] left-0 w-[200%] animate-liquid-wave"
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none"
          style={{ height: '25px' }}
        >
          <defs>
            <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(270, 91%, 65%)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="hsl(280, 85%, 55%)" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <path 
            d="M0,60 C150,120 350,0 600,60 C850,120 1050,0 1200,60 L1200,120 L0,120 Z"
            fill="url(#waveGradient1)"
          />
        </svg>
        
        {/* Secondary wave (offset for depth) */}
        <svg 
          className="absolute -top-[15px] left-0 w-[200%] animate-liquid-wave-slow"
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none"
          style={{ height: '20px' }}
        >
          <defs>
            <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(280, 80%, 60%)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(290, 75%, 50%)" stopOpacity="0.5" />
            </linearGradient>
          </defs>
          <path 
            d="M0,40 C200,100 400,20 600,60 C800,100 1000,20 1200,60 L1200,120 L0,120 Z"
            fill="url(#waveGradient2)"
          />
        </svg>
        
        {/* Liquid body with gradient - seamlessly blending to background at bottom */}
        <div 
          className="absolute top-[5px] left-0 right-0 bottom-0"
          style={{
            background: `linear-gradient(to top, 
              ${bgColor} 0%,
              hsl(0, 0%, 8%) 5%,
              hsl(270, 15%, 12%) 15%,
              hsl(275, 35%, 20%) 30%,
              hsl(280, 55%, 32%) 45%,
              hsl(275, 70%, 45%) 60%,
              hsl(270, 82%, 52%) 75%,
              hsl(268, 88%, 58%) 90%,
              hsl(265, 90%, 60%) 100%
            )`,
          }}
        />
        
        {/* Shimmer effect */}
        <div 
          className="absolute inset-0 animate-liquid-shimmer"
          style={{
            background: `linear-gradient(105deg, 
              transparent 40%, 
              rgba(255,255,255,0.08) 50%, 
              transparent 60%
            )`,
            backgroundSize: '200% 100%',
          }}
        />
      </div>
    </div>
  );
};

interface NutritionViewProps {
  selectedDate?: Date;
}

export const NutritionView = ({ selectedDate }: NutritionViewProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mealsByType, mealLogs, totals, isLoading, refetch } = useDailyLogs(selectedDate || new Date());
  const [caloriesGoal, setCaloriesGoal] = useState(2200);
  const [macroGoals, setMacroGoals] = useState({ protein: 150, carbs: 250, fat: 70 });
  const [foodToDelete, setFoodToDelete] = useState<FoodToDelete | null>(null);
  const [isDeletingFood, setIsDeletingFood] = useState(false);

  // Delete food handler
  const handleDeleteFood = async () => {
    if (!foodToDelete) return;
    
    setIsDeletingFood(true);
    try {
      // Find the meal log
      const mealLog = mealLogs.find(m => m.id === foodToDelete.mealLogId);
      if (!mealLog) throw new Error("Meal log not found");
      
      const updatedFoods = [...(mealLog.foods || [])];
      const removedFood = updatedFoods[foodToDelete.foodIndex];
      updatedFoods.splice(foodToDelete.foodIndex, 1);
      
      if (updatedFoods.length === 0) {
        // If no foods left, delete the entire meal log
        const { error } = await supabase
          .from("meal_logs")
          .delete()
          .eq("id", foodToDelete.mealLogId);
        
        if (error) throw error;
      } else {
        // Recalculate totals
        const newTotals = updatedFoods.reduce((acc, food) => ({
          calories: acc.calories + (food.calories || 0),
          protein: acc.protein + (food.protein || 0),
          carbs: acc.carbs + (food.carbs || 0),
          fat: acc.fat + (food.fat || 0),
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
        
        const { error } = await supabase
          .from("meal_logs")
          .update({
            foods: updatedFoods as unknown as import("@/integrations/supabase/types").Json,
            total_calories: Math.round(newTotals.calories),
            total_protein: newTotals.protein,
            total_carbs: newTotals.carbs,
            total_fat: newTotals.fat,
          })
          .eq("id", foodToDelete.mealLogId);
        
        if (error) throw error;
      }
      
      toast({ title: "Food deleted", description: `${removedFood?.name || "Food item"} has been removed.` });
      refetch();
    } catch (error) {
      console.error("Error deleting food:", error);
      toast({ title: "Error", description: "Failed to delete food item.", variant: "destructive" });
    } finally {
      setIsDeletingFood(false);
      setFoodToDelete(null);
    }
  };

  const handleFoodDeleteRequest = (mealLogId: string, foodIndex: number, foodName: string) => {
    setFoodToDelete({ mealLogId, foodIndex, foodName });
  };

  // Fetch user's calorie and macro targets from profile
  useEffect(() => {
    const fetchUserGoals = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("daily_calorie_target, macro_targets")
        .eq("user_id", user.id)
        .single();
      
      if (data?.daily_calorie_target) {
        setCaloriesGoal(data.daily_calorie_target);
      }
      
      // Use saved macro targets if available, otherwise calculate defaults
      if (data?.macro_targets && typeof data.macro_targets === 'object') {
        const macros = data.macro_targets as { protein?: number; carbs?: number; fat?: number };
        if (macros.protein && macros.carbs && macros.fat) {
          setMacroGoals({
            protein: macros.protein,
            carbs: macros.carbs,
            fat: macros.fat,
          });
          return;
        }
      }
      
      // Fallback to calculated defaults if no macro targets saved
      if (data?.daily_calorie_target) {
        const proteinCals = data.daily_calorie_target * 0.30;
        const carbsCals = data.daily_calorie_target * 0.40;
        const fatCals = data.daily_calorie_target * 0.30;
        setMacroGoals({
          protein: Math.round(proteinCals / 4),
          carbs: Math.round(carbsCals / 4),
          fat: Math.round(fatCals / 9),
        });
      }
    };
    
    fetchUserGoals();
  }, [user]);

  const caloriesConsumed = totals.calories;
  const isOverGoal = caloriesConsumed > caloriesGoal;
  const caloriesDisplay = isOverGoal 
    ? caloriesConsumed - caloriesGoal 
    : caloriesGoal - caloriesConsumed;
  const fillPercentage = (caloriesConsumed / caloriesGoal) * 100;

  const handleAddFood = (mealType: string) => {
    navigate("/create/meal", { 
      state: { 
        preselectedMealType: mealType,
        logDate: selectedDate ? selectedDate.toISOString() : undefined,
      } 
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calories Container with Liquid Fill - edge to edge, full height */}
      <div className="relative overflow-visible -mx-4 -mt-6" style={{ minHeight: '320px' }}>
        {/* Liquid wave animation */}
        <LiquidWave fillPercentage={fillPercentage} />
        
        {/* Content overlay */}
        <div className="relative z-20 px-4 pt-8 pb-6 flex flex-col h-full" style={{ minHeight: '320px' }}>
          {/* Calories display at top */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <span className={`text-5xl font-bold drop-shadow-lg ${isOverGoal ? 'text-red-400' : 'text-white'}`}>
              {caloriesDisplay}
            </span>
            <span className={`text-sm font-medium mt-1 drop-shadow ${isOverGoal ? 'text-red-300/80' : 'text-white/80'}`}>
              {isOverGoal ? 'calories over' : 'calories remaining'}
            </span>
            <span className="text-xs text-white/60 mt-2">{caloriesConsumed} / {caloriesGoal} consumed</span>
          </div>
          
          {/* Macros - no frame */}
          <div className="backdrop-blur-sm rounded-xl p-4 space-y-3 mt-auto mx-4">
            <h3 className="font-semibold text-sm text-white/90">Macros</h3>
            <MacroBar label="P" current={totals.protein} goal={macroGoals.protein} color="#3DD6C6" />
            <MacroBar label="C" current={totals.carbs} goal={macroGoals.carbs} color="#5B8CFF" />
            <MacroBar label="F" current={totals.fat} goal={macroGoals.fat} color="#B46BFF" />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border/40 mx-4" />

      {/* Logged Meals */}
      <div>
        <h3 className="font-semibold mb-3">Logged Meals</h3>
        <div className="space-y-3">
          <MealLogDisplay 
            name="Breakfast"
            mealType="breakfast"
            mealLogs={mealsByType.breakfast}
            onAddFood={() => handleAddFood("breakfast")}
            onDeleteFood={handleFoodDeleteRequest}
          />
          <MealLogDisplay 
            name="Lunch"
            mealType="lunch"
            mealLogs={mealsByType.lunch}
            onAddFood={() => handleAddFood("lunch")}
            onDeleteFood={handleFoodDeleteRequest}
          />
          <MealLogDisplay 
            name="Dinner"
            mealType="dinner"
            mealLogs={mealsByType.dinner}
            onAddFood={() => handleAddFood("dinner")}
            onDeleteFood={handleFoodDeleteRequest}
          />
          <MealLogDisplay 
            name="Snack"
            mealType="snack"
            mealLogs={mealsByType.snack}
            onAddFood={() => handleAddFood("snack")}
            onDeleteFood={handleFoodDeleteRequest}
          />
        </div>
      </div>

      {/* Delete Food Confirmation Dialog */}
      <AlertDialog open={!!foodToDelete} onOpenChange={(open) => !open && setFoodToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Food Item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Are you sure you want to remove "{foodToDelete?.foodName}" from your log?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingFood}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFood}
              disabled={isDeletingFood}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingFood ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};