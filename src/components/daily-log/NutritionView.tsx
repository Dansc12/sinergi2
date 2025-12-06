import { Droplets } from "lucide-react";

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

interface MealLogProps {
  name: string;
  calories: number;
  foods: string[];
  time: string;
}

const MealLog = ({ name, calories, foods, time }: MealLogProps) => (
  <div className="bg-card border border-border rounded-xl p-4">
    <div className="flex items-center justify-between mb-2">
      <h4 className="font-semibold">{name}</h4>
      <span className="text-sm text-muted-foreground">{time}</span>
    </div>
    <p className="text-primary font-bold text-lg mb-1">{calories} cal</p>
    <p className="text-sm text-muted-foreground">{foods.join(", ")}</p>
  </div>
);

export const NutritionView = () => {
  const caloriesConsumed = 1450;
  const caloriesGoal = 2200;
  const caloriesLeft = caloriesGoal - caloriesConsumed;
  const waterConsumed = 6;
  const waterGoal = 8;

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
        <MacroBar label="P" current={98} goal={150} color="hsl(270, 91%, 65%)" />
        <MacroBar label="C" current={165} goal={250} color="hsl(142, 76%, 45%)" />
        <MacroBar label="F" current={45} goal={70} color="hsl(38, 92%, 50%)" />
      </div>

      {/* Meals Log */}
      <div>
        <h3 className="font-semibold mb-3">Today's Meals</h3>
        <div className="space-y-3">
          <MealLog 
            name="Breakfast"
            calories={450}
            foods={["Eggs", "Avocado Toast", "Orange Juice"]}
            time="7:30 AM"
          />
          <MealLog 
            name="Lunch"
            calories={620}
            foods={["Grilled Chicken", "Brown Rice", "Broccoli"]}
            time="12:15 PM"
          />
          <MealLog 
            name="Snack"
            calories={180}
            foods={["Greek Yogurt", "Almonds"]}
            time="3:00 PM"
          />
          <MealLog 
            name="Dinner"
            calories={200}
            foods={["Salmon", "Quinoa", "Asparagus"]}
            time="Planned • 6:30 PM"
          />
        </div>
      </div>
    </div>
  );
};
