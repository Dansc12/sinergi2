import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useDailyLogs } from "@/hooks/useDailyLogs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
}

interface MealLogDisplayProps {
  name: string;
  mealType: string;
  mealLogs: MealLog[];
  onAddFood: () => void;
}

const MealLogDisplay = ({ name, mealLogs, onAddFood }: MealLogDisplayProps) => {
  const allFoods = mealLogs.flatMap((log) => log.foods || []);
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
      
      {allFoods.length > 0 ? (
        <>
          <p className="text-primary font-bold text-lg mb-2">{totalCalories} cal</p>
          <div className="space-y-1">
            {allFoods.map((food, index) => (
              <div key={index} className="text-sm text-muted-foreground flex justify-between">
                <span>{food.name}</span>
                <span className="text-xs">{food.servings} × {food.servingSize}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground italic">No foods logged yet</p>
      )}
    </div>
  );
};

interface NutritionViewProps {
  selectedDate?: Date;
}

export const NutritionView = ({ selectedDate }: NutritionViewProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mealsByType, totals, isLoading } = useDailyLogs(selectedDate || new Date());
  const [caloriesGoal, setCaloriesGoal] = useState(2200);
  const [macroGoals, setMacroGoals] = useState({ protein: 150, carbs: 250, fat: 70 });

  // Fetch user's calorie target from profile
  useEffect(() => {
    const fetchUserGoals = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("daily_calorie_target")
        .eq("user_id", user.id)
        .single();
      
      if (data?.daily_calorie_target) {
        setCaloriesGoal(data.daily_calorie_target);
        // Calculate macro goals based on calorie target
        // Typical split: 30% protein, 40% carbs, 30% fat
        const proteinCals = data.daily_calorie_target * 0.30;
        const carbsCals = data.daily_calorie_target * 0.40;
        const fatCals = data.daily_calorie_target * 0.30;
        setMacroGoals({
          protein: Math.round(proteinCals / 4), // 4 cal per gram
          carbs: Math.round(carbsCals / 4), // 4 cal per gram
          fat: Math.round(fatCals / 9), // 9 cal per gram
        });
      }
    };
    
    fetchUserGoals();
  }, [user]);

  const caloriesConsumed = totals.calories;
  const caloriesLeft = Math.max(caloriesGoal - caloriesConsumed, 0);

  const handleAddFood = (mealType: string) => {
    navigate("/create/meal", { state: { preselectedMealType: mealType } });
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
      {/* Calories Ring - Centered */}
      <div className="flex justify-center">
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="72"
              cy="72"
              r="60"
              strokeWidth="12"
              stroke="hsl(var(--muted))"
              fill="none"
            />
            <circle
              cx="72"
              cy="72"
              r="60"
              strokeWidth="12"
              stroke="url(#calorieGradient)"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${Math.min((caloriesConsumed / caloriesGoal) * 377, 377)} 377`}
            />
            <defs>
              <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(270, 91%, 65%)" />
                <stop offset="100%" stopColor="hsl(320, 100%, 60%)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">{caloriesLeft}</span>
            <span className="text-xs text-muted-foreground">cal left</span>
          </div>
        </div>
      </div>

      {/* Macros */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <h3 className="font-semibold mb-3">Macros</h3>
        <MacroBar label="P" current={totals.protein} goal={macroGoals.protein} color="#3DD6C6" />
        <MacroBar label="C" current={totals.carbs} goal={macroGoals.carbs} color="#5B8CFF" />
        <MacroBar label="F" current={totals.fat} goal={macroGoals.fat} color="#B46BFF" />
      </div>

      {/* Logged Meals */}
      <div>
        <h3 className="font-semibold mb-3">Logged Meals</h3>
        <div className="space-y-3">
          <MealLogDisplay 
            name="Breakfast"
            mealType="breakfast"
            mealLogs={mealsByType.breakfast}
            onAddFood={() => handleAddFood("breakfast")}
          />
          <MealLogDisplay 
            name="Lunch"
            mealType="lunch"
            mealLogs={mealsByType.lunch}
            onAddFood={() => handleAddFood("lunch")}
          />
          <MealLogDisplay 
            name="Dinner"
            mealType="dinner"
            mealLogs={mealsByType.dinner}
            onAddFood={() => handleAddFood("dinner")}
          />
          <MealLogDisplay 
            name="Snack"
            mealType="snack"
            mealLogs={mealsByType.snack}
            onAddFood={() => handleAddFood("snack")}
          />
        </div>
      </div>
    </div>
  );
};
