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
            {allFoods.map((food, index) => {
              // Format serving display - combine quantity and unit as single value
              // e.g., servings: 63, servingSize: "63 g" should show "63g" not "63 x 63 g"
              const servingUnit = food.servingSize?.replace(/^\d+\s*/, '').trim() || 'g';
              const servingDisplay = `${food.servings}${servingUnit}`;
              
              return (
                <div key={index} className="text-sm text-muted-foreground flex justify-between">
                  <span>{food.name}</span>
                  <span className="text-xs">{servingDisplay}</span>
                </div>
              );
            })}
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

// Animated liquid wave component with underwater caustics
const LiquidWave = ({ fillPercentage }: { fillPercentage: number }) => {
  const bgColor = "hsl(0, 0%, 7%)";
  
  // Caustics intensity increases as liquid nears the top
  const causticsIntensity = Math.min(fillPercentage / 100, 1);
  
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
      {/* Underwater caustics light rays - intensity based on fill */}
      <div 
        className="absolute inset-0 z-5 pointer-events-none animate-caustics"
        style={{
          opacity: causticsIntensity * 0.4,
          background: `
            radial-gradient(ellipse 80% 50% at 20% 20%, rgba(255,255,255,0.15) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 70% 30%, rgba(200,180,255,0.12) 0%, transparent 45%),
            radial-gradient(ellipse 50% 60% at 40% 60%, rgba(255,255,255,0.1) 0%, transparent 40%),
            radial-gradient(ellipse 70% 50% at 80% 70%, rgba(180,200,255,0.08) 0%, transparent 50%)
          `,
        }}
      />
      
      {/* Gradient overlay for depth */}
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
        
        {/* Secondary wave */}
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
        
        {/* Liquid body */}
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
        
        {/* Caustics ripples inside liquid - more intense near top */}
        <div 
          className="absolute inset-0 animate-caustics-ripple"
          style={{
            opacity: causticsIntensity * 0.25,
            background: `
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 20px,
                rgba(255,255,255,0.03) 20px,
                rgba(255,255,255,0.03) 40px
              )
            `,
            transform: 'skewX(-15deg)',
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
  const isOverGoal = caloriesConsumed > caloriesGoal;
  const caloriesDisplay = isOverGoal 
    ? caloriesConsumed - caloriesGoal 
    : caloriesGoal - caloriesConsumed;
  const fillPercentage = (caloriesConsumed / caloriesGoal) * 100;

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
    <div className="space-y-6 overflow-x-hidden">
      {/* Calories Container with Liquid Fill - full bleed edge to edge */}
      <div className="relative overflow-hidden w-screen left-1/2 -translate-x-1/2 -mt-4" style={{ minHeight: '300px' }}>
        {/* Liquid wave animation */}
        <LiquidWave fillPercentage={fillPercentage} />
        
        {/* Content overlay */}
        <div className="relative z-20 px-4 pt-6 pb-3 flex flex-col" style={{ minHeight: '300px' }}>
          {/* Calories display */}
          <div className="flex flex-col items-center justify-center" style={{ minHeight: '140px' }}>
            <span className={`text-5xl font-bold drop-shadow-lg ${isOverGoal ? 'text-red-400' : 'text-white'}`}>
              {caloriesDisplay}
            </span>
            <span className={`text-sm font-medium mt-1 drop-shadow ${isOverGoal ? 'text-red-300/80' : 'text-white/80'}`}>
              {isOverGoal ? 'calories over' : 'calories remaining'}
            </span>
            <span className="text-xs text-white/60 mt-1">{caloriesConsumed} / {caloriesGoal} consumed</span>
          </div>
          
          {/* Macros - reduced gap from consumed text */}
          <div className="backdrop-blur-sm rounded-xl p-4 space-y-3 mx-4 mt-2">
            <h3 className="font-semibold text-sm text-white/90">Macros</h3>
            <MacroBar label="P" current={totals.protein} goal={macroGoals.protein} color="#3DD6C6" />
            <MacroBar label="C" current={totals.carbs} goal={macroGoals.carbs} color="#5B8CFF" />
            <MacroBar label="F" current={totals.fat} goal={macroGoals.fat} color="#B46BFF" />
          </div>
        </div>
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