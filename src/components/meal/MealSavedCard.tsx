import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Utensils } from "lucide-react";

interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servings?: number;
  servingSize?: string;
}

interface Ingredient {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servings: number;
  servingSize: string;
}

interface Creator {
  name: string;
  avatar_url?: string | null;
}

type MealItem = Food | Ingredient;

interface MealSavedCardProps {
  title: string;
  items: MealItem[];
  creator: Creator;
  createdAt: string;
  onCopy: () => void;
  copyButtonText?: string;
  isRecipe?: boolean;
  totalCalories?: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFats?: number;
}

// Nutrition Summary Card with animated liquid blob background
const NutritionSummaryCard = ({
  totalCalories,
  totalProtein,
  totalCarbs,
  totalFats,
  foodCount,
}: {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  foodCount: number;
}) => {
  const proteinColor = '#3DD6C6';
  const carbsColor = '#5B8CFF';
  const fatsColor = '#B46BFF';
  
  const totalMacros = totalProtein + totalCarbs + totalFats;
  const proteinRatio = totalMacros > 0 ? Math.max((totalProtein / totalMacros), 0.08) : 0.33;
  const carbsRatio = totalMacros > 0 ? Math.max((totalCarbs / totalMacros), 0.08) : 0.33;
  const fatsRatio = totalMacros > 0 ? Math.max((totalFats / totalMacros), 0.08) : 0.33;
  
  const totalRatio = proteinRatio + carbsRatio + fatsRatio;
  const normalizedProtein = proteinRatio / totalRatio;
  const normalizedCarbs = carbsRatio / totalRatio;
  const normalizedFats = fatsRatio / totalRatio;
  
  const proteinSize = 40 + normalizedProtein * 50;
  const carbsSize = 40 + normalizedCarbs * 50;
  const fatsSize = 40 + normalizedFats * 50;
  
  const proteinOpacity = totalMacros > 0 ? 0.6 + (totalProtein / totalMacros) * 0.4 : 0.75;
  const carbsOpacity = totalMacros > 0 ? 0.6 + (totalCarbs / totalMacros) * 0.4 : 0.75;
  const fatsOpacity = totalMacros > 0 ? 0.6 + (totalFats / totalMacros) * 0.4 : 0.75;

  const proteinPct = totalMacros > 0 ? Math.round((totalProtein / totalMacros) * 100) : 0;
  const carbsPct = totalMacros > 0 ? Math.round((totalCarbs / totalMacros) * 100) : 0;
  const fatsPct = totalMacros > 0 ? Math.round((totalFats / totalMacros) * 100) : 0;
  
  return (
    <div className="relative w-full rounded-2xl overflow-hidden mt-4 shadow-lg shadow-black/30 p-4">
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
      
      {/* Frosted glass overlay with subtle side vignette */}
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
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 h-14">
        {/* Top left: Fork/knife icon with count */}
        <div className="absolute top-0 left-0 flex items-center gap-1.5 text-muted-foreground">
          <Utensils size={14} />
          <span className="text-xs font-medium">{foodCount}</span>
        </div>
        
        {/* Centered content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Calories */}
          <span className="text-2xl font-bold text-foreground">
            {Math.round(totalCalories)}
          </span>
          <span className="text-xs text-muted-foreground -mt-0.5">calories</span>
        </div>
        
        {/* Bottom macros row */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 text-xs">
          <span>
            <span style={{ color: proteinColor }} className="font-medium">P</span>
            <span className="text-foreground ml-1">{Math.round(totalProtein)}g</span>
            <span className="text-muted-foreground ml-0.5">({proteinPct}%)</span>
          </span>
          <span>
            <span style={{ color: carbsColor }} className="font-medium">C</span>
            <span className="text-foreground ml-1">{Math.round(totalCarbs)}g</span>
            <span className="text-muted-foreground ml-0.5">({carbsPct}%)</span>
          </span>
          <span>
            <span style={{ color: fatsColor }} className="font-medium">F</span>
            <span className="text-foreground ml-1">{Math.round(totalFats)}g</span>
            <span className="text-muted-foreground ml-0.5">({fatsPct}%)</span>
          </span>
        </div>
      </div>
    </div>
  );
};

const MealSavedCard = ({
  title,
  items,
  creator,
  createdAt,
  onCopy,
  copyButtonText = "Copy",
  isRecipe = false,
  totalCalories,
  totalProtein,
  totalCarbs,
  totalFats,
}: MealSavedCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  // Calculate totals if not provided
  const calcCalories = totalCalories ?? items.reduce<number>((sum, f) => sum + f.calories, 0);
  const calcProtein = totalProtein ?? items.reduce<number>((sum, f) => sum + f.protein, 0);
  const calcCarbs = totalCarbs ?? items.reduce<number>((sum, f) => sum + f.carbs, 0);
  const calcFats = totalFats ?? items.reduce<number>((sum, f) => sum + f.fats, 0);

  return (
    <div
      className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          /* Collapsed View */
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3"
          >
            {/* Avatar */}
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={creator.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-sm">
                {getInitials(creator.name)}
              </AvatarFallback>
            </Avatar>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h4 className="font-semibold text-foreground truncate">{title}</h4>
              
              {/* Date */}
              <span className="text-xs text-muted-foreground -mt-0.5 block">
                {formatDate(createdAt)}
              </span>

              {/* Items Preview */}
              <p className="text-xs text-muted-foreground/80 mt-1.5 truncate">
                {items.map((f) => f.name).join(", ")}
              </p>
            </div>

            {/* Copy Button */}
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCopy();
              }}
              className="shrink-0"
            >
              {copyButtonText}
            </Button>
          </motion.div>
        ) : (
          /* Expanded View */
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Header Row */}
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={creator.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-sm">
                  {getInitials(creator.name)}
                </AvatarFallback>
              </Avatar>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Copy Button */}
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy();
                }}
                className="shrink-0"
              >
                {copyButtonText}
              </Button>
            </div>

            {/* Title and Date under avatar */}
            <div className="mt-3">
              <h4 className="font-semibold text-foreground">{title}</h4>
              <span className="text-xs text-muted-foreground">
                {formatDate(createdAt)}
              </span>
            </div>

            {/* Nutrition Summary Card - matching Create Saved Meal style */}
            <NutritionSummaryCard
              totalCalories={calcCalories}
              totalProtein={calcProtein}
              totalCarbs={calcCarbs}
              totalFats={calcFats}
              foodCount={items.length}
            />

            {/* Food/Ingredient Details */}
            <div className="mt-4 space-y-3">
              {items.map((item, idx) => (
                <div key={item.id || idx} className="space-y-1">
                  <h5 className="font-medium text-foreground text-sm">{item.name}</h5>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-muted/50 px-2 py-1 rounded">
                      {item.servings || 1} × {item.servingSize || "serving"}
                    </span>
                    <span className="text-xs bg-muted/50 px-2 py-1 rounded">
                      {Math.round(item.calories)} cal
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MealSavedCard;