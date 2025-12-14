import { Droplets, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

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
      <span className="text-xs font-medium w-16 text-right">{current}g / {goal}g</span>
    </div>
  );
};

interface LoggedFood {
  name: string;
  servings: number;
  servingSize: string;
  calories: number;
}

interface MealLogProps {
  name: string;
  mealType: string;
  foods: LoggedFood[];
  onAddFood: () => void;
}

const MealLog = ({ name, mealType, foods, onAddFood }: MealLogProps) => {
  const totalCalories = foods.reduce((sum, food) => sum + food.calories, 0);
  
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
      
      {foods.length > 0 ? (
        <>
          <p className="text-primary font-bold text-lg mb-2">{totalCalories} cal</p>
          <div className="space-y-1">
            {foods.map((food, index) => (
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
  
  // In production, these would come from the database based on selectedDate
  const caloriesConsumed = 0;
  const caloriesGoal = 2200;
  const caloriesLeft = caloriesGoal - caloriesConsumed;
  const waterConsumed = 0;
  const waterGoal = 8;

  // Empty meal data - in production, this would come from the database
  const meals = {
    breakfast: [] as LoggedFood[],
    lunch: [] as LoggedFood[],
    dinner: [] as LoggedFood[],
    snack: [] as LoggedFood[],
  };

  const handleAddFood = (mealType: string) => {
    navigate("/create/meal", { state: { preselectedMealType: mealType } });
  };

  const totalProtein = 0;
  const totalCarbs = 0;
  const totalFats = 0;

  return (
    <div className="space-y-6">
      {/* Calories & Water Rings */}
      <div className="flex gap-4 justify-center">
        {/* Calories Ring */}
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
              strokeDasharray={`${(caloriesConsumed / caloriesGoal) * 377} 377`}
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

        {/* Water Ring */}
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
              stroke="hsl(200, 90%, 55%)"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${(waterConsumed / waterGoal) * 377} 377`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Droplets className="text-blue-400 mb-1" size={20} />
            <span className="text-lg font-bold">{waterConsumed}/{waterGoal}</span>
            <span className="text-xs text-muted-foreground">glasses</span>
          </div>
        </div>
      </div>

      {/* Macros */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <h3 className="font-semibold mb-3">Macros</h3>
        <MacroBar label="P" current={totalProtein} goal={150} color="hsl(270, 91%, 65%)" />
        <MacroBar label="C" current={totalCarbs} goal={250} color="hsl(142, 76%, 45%)" />
        <MacroBar label="F" current={totalFats} goal={70} color="hsl(38, 92%, 50%)" />
      </div>

      {/* Logged Meals */}
      <div>
        <h3 className="font-semibold mb-3">Logged Meals</h3>
        <div className="space-y-3">
          <MealLog 
            name="Breakfast"
            mealType="breakfast"
            foods={meals.breakfast}
            onAddFood={() => handleAddFood("breakfast")}
          />
          <MealLog 
            name="Lunch"
            mealType="lunch"
            foods={meals.lunch}
            onAddFood={() => handleAddFood("lunch")}
          />
          <MealLog 
            name="Dinner"
            mealType="dinner"
            foods={meals.dinner}
            onAddFood={() => handleAddFood("dinner")}
          />
          <MealLog 
            name="Snack"
            mealType="snack"
            foods={meals.snack}
            onAddFood={() => handleAddFood("snack")}
          />
        </div>
      </div>
    </div>
  );
};
