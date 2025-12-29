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
  coverPhotoUrl?: string | null;
  tags?: string[];
  description?: string;
}

// Nutrition Summary Bar - matching Log Meal button style
const NutritionSummaryBar = ({
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
  
  return (
    <div className="relative w-full h-14 rounded-xl overflow-hidden mt-3 shadow-lg shadow-black/30">
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
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      />
      
      {/* Content - horizontal layout matching Log Meal button */}
      <div className="relative z-10 flex items-center h-full px-4">
        {/* Left: Icon + Count */}
        <div className="flex items-center gap-2 text-white">
          <Utensils size={20} />
          <span className="font-semibold">{foodCount}</span>
        </div>
        
        {/* Center: Macros (absolutely positioned for true centering) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 text-sm">
          <span style={{ color: proteinColor }}>P {Math.round(totalProtein)}g</span>
          <span style={{ color: carbsColor }}>C {Math.round(totalCarbs)}g</span>
          <span style={{ color: fatsColor }}>F {Math.round(totalFats)}g</span>
        </div>
        
        {/* Right: Calories */}
        <div className="ml-auto text-sm text-white">
          <span>{Math.round(totalCalories)} cal</span>
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
  coverPhotoUrl,
  tags = [],
  description,
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
          /* Collapsed View - Show Cover Photo */
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3"
          >
            {/* Cover Photo */}
            <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-muted">
              {coverPhotoUrl ? (
                <img 
                  src={coverPhotoUrl} 
                  alt={title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary/20">
                  <Utensils size={18} className="text-primary" />
                </div>
              )}
            </div>

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
          /* Expanded View - Show Cover Photo as background header */
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Cover Photo Background Header */}
            <div className="relative -mx-4 -mt-4 h-32 overflow-hidden rounded-t-xl">
              {coverPhotoUrl ? (
                <img 
                  src={coverPhotoUrl} 
                  alt={title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                  <Utensils size={40} className="text-primary/50" />
                </div>
              )}
              {/* Gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
            </div>

            {/* Title Row with Copy Button - positioned to overlap cover photo */}
            <div className="flex items-start justify-between gap-3 -mt-6 relative z-10">
              <h4 className="font-bold text-foreground text-xl">{title}</h4>
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

            {/* Profile Photo with Tags and Date - minimal gap from title */}
            <div className="flex items-start gap-3 mt-1.5">
              {/* Profile Avatar - 40px (h-10) */}
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={creator.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-sm">
                  {getInitials(creator.name)}
                </AvatarFallback>
              </Avatar>

              {/* Tags and Date - combined height matches avatar (40px) */}
              <div className="flex-1 min-w-0 flex flex-col justify-between h-10">
                {/* Tags */}
                {tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag, idx) => (
                      <span 
                        key={idx} 
                        className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div />
                )}
                {/* Date */}
                <span className="text-xs text-muted-foreground">
                  {formatDate(createdAt)}
                </span>
              </div>
            </div>

            {/* Description */}
            {description && (
              <p className="text-sm text-muted-foreground mt-3">
                {description}
              </p>
            )}

            {/* Nutrition Summary Bar - matching Log Meal button style */}
            <NutritionSummaryBar
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