import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Minus, Plus, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface FoodItem {
  fdcId: number;
  description: string;
  brandName?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize?: string;
  servingSizeValue?: number;
  servingSizeUnit?: string;
}

interface FoodDetailModalProps {
  isOpen: boolean;
  food: FoodItem | null;
  onClose: () => void;
  onConfirm: (food: FoodItem, servings: number, servingSize: string) => void;
}

// Parse serving size from string like "100g" to { value: 100, unit: "g" }
const parseServingSize = (servingSizeStr?: string): { value: number; unit: string } => {
  if (!servingSizeStr) return { value: 100, unit: "g" };
  const match = servingSizeStr.match(/^([\d.]+)\s*(.*)$/);
  if (match) {
    return { value: parseFloat(match[1]) || 100, unit: match[2] || "g" };
  }
  return { value: 100, unit: "g" };
};

// Multiplier for different serving size selections relative to base (which is usually per 100g from USDA)
const getServingSizeMultiplier = (selectedSize: string, baseServing: { value: number; unit: string }): number => {
  // USDA data is typically per 100g, so we calculate based on that
  const baseGrams = baseServing.unit.toLowerCase() === "g" ? baseServing.value : 100;
  
  switch (selectedSize) {
    case "serving":
      return baseGrams / 100; // Use the original serving size
    case "100g":
      return 1; // 100g is the standard
    case "1oz":
      return 28 / 100; // 1 oz = 28g
    case "cup":
      return 240 / 100; // Approximate 1 cup = 240g for most foods
    default:
      return 1;
  }
};

export const FoodDetailModal = ({
  isOpen,
  food,
  onClose,
  onConfirm,
}: FoodDetailModalProps) => {
  const [servings, setServings] = useState(1);
  const [servingSize, setServingSize] = useState("serving");
  const [manualOverride, setManualOverride] = useState(false);
  const [manualCalories, setManualCalories] = useState(0);
  const [manualProtein, setManualProtein] = useState(0);
  const [manualCarbs, setManualCarbs] = useState(0);
  const [manualFats, setManualFats] = useState(0);

  const baseServing = food ? parseServingSize(food.servingSize) : { value: 100, unit: "g" };

  const servingSizeOptions = [
    { value: "serving", label: food?.servingSize || "1 serving" },
    { value: "100g", label: "100g" },
    { value: "1oz", label: "1 oz (28g)" },
    { value: "cup", label: "1 cup" },
  ];

  const sizeMultiplier = food ? getServingSizeMultiplier(servingSize, baseServing) : 1;
  const totalMultiplier = servings * sizeMultiplier;

  // Calculate values based on servings
  const calculatedCalories = food ? Math.round(food.calories * totalMultiplier) : 0;
  const calculatedProtein = food ? food.protein * totalMultiplier : 0;
  const calculatedCarbs = food ? food.carbs * totalMultiplier : 0;
  const calculatedFats = food ? food.fats * totalMultiplier : 0;

  useEffect(() => {
    if (isOpen && food) {
      setServings(1);
      setServingSize("serving");
      setManualOverride(false);
      // Initialize manual values with calculated values
      const initialMultiplier = getServingSizeMultiplier("serving", parseServingSize(food.servingSize));
      setManualCalories(Math.round(food.calories * initialMultiplier));
      setManualProtein(Math.round(food.protein * initialMultiplier * 10) / 10);
      setManualCarbs(Math.round(food.carbs * initialMultiplier * 10) / 10);
      setManualFats(Math.round(food.fats * initialMultiplier * 10) / 10);
    }
  }, [isOpen, food]);

  // Update manual values when servings change (only if not in manual override mode)
  useEffect(() => {
    if (!manualOverride && food) {
      setManualCalories(calculatedCalories);
      setManualProtein(Math.round(calculatedProtein * 10) / 10);
      setManualCarbs(Math.round(calculatedCarbs * 10) / 10);
      setManualFats(Math.round(calculatedFats * 10) / 10);
    }
  }, [servings, servingSize, manualOverride, food, calculatedCalories, calculatedProtein, calculatedCarbs, calculatedFats]);

  if (!food) return null;

  // Use manual values if override is enabled, otherwise use calculated
  const adjustedCalories = manualOverride ? manualCalories : calculatedCalories;
  const adjustedProtein = manualOverride ? manualProtein : calculatedProtein;
  const adjustedCarbs = manualOverride ? manualCarbs : calculatedCarbs;
  const adjustedFats = manualOverride ? manualFats : calculatedFats;

  const totalMacros = adjustedProtein + adjustedCarbs + adjustedFats;
  const proteinPercentage = totalMacros > 0 ? (adjustedProtein / totalMacros) * 100 : 0;
  const carbsPercentage = totalMacros > 0 ? (adjustedCarbs / totalMacros) * 100 : 0;
  const fatsPercentage = totalMacros > 0 ? (adjustedFats / totalMacros) * 100 : 0;

  // Calculate stroke dash for the circular progress
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  
  // Convert percentages to stroke offsets for each macro segment
  const proteinDash = (proteinPercentage / 100) * circumference;
  const carbsDash = (carbsPercentage / 100) * circumference;
  const fatsDash = (fatsPercentage / 100) * circumference;

  const handleConfirm = () => {
    // If manual override is enabled, pass the modified food with manual values
    if (manualOverride) {
      const modifiedFood: FoodItem = {
        ...food,
        calories: manualCalories,
        protein: manualProtein,
        carbs: manualCarbs,
        fats: manualFats,
      };
      onConfirm(modifiedFood, 1, servingSize); // Pass servings as 1 since macros are already adjusted
    } else {
      onConfirm(food, servings, servingSize);
    }
  };

  const toggleManualOverride = () => {
    if (!manualOverride) {
      // When enabling override, copy current calculated values
      setManualCalories(calculatedCalories);
      setManualProtein(Math.round(calculatedProtein * 10) / 10);
      setManualCarbs(Math.round(calculatedCarbs * 10) / 10);
      setManualFats(Math.round(calculatedFats * 10) / 10);
    }
    setManualOverride(!manualOverride);
  };

  const decrementServings = () => {
    if (servings > 0.5) {
      setServings(prev => Math.round((prev - 0.5) * 10) / 10);
    }
  };

  const incrementServings = () => {
    setServings(prev => Math.round((prev + 0.5) * 10) / 10);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background z-50"
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="h-full flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <Button variant="ghost" size="icon" onClick={onClose}>
                <ArrowLeft size={24} />
              </Button>
              <h2 className="text-lg font-semibold flex-1 text-center truncate px-2">
                {food.description}
              </h2>
              <Button variant="ghost" size="icon" onClick={handleConfirm}>
                <Check size={24} className="text-primary" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex items-start gap-6">
                {/* Left Column: Circle + Compact Macros */}
                <div className="flex flex-col items-center flex-shrink-0">
                  {/* Calorie Circle with Macro Ring */}
                  <div className="relative">
                    <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
                      {/* Background circle */}
                      <circle
                        cx="70"
                        cy="70"
                        r={radius}
                        fill="none"
                        stroke="hsl(var(--muted))"
                        strokeWidth="12"
                      />
                      {/* Protein segment (blue) */}
                      <circle
                        cx="70"
                        cy="70"
                        r={radius}
                        fill="none"
                        stroke="hsl(220 90% 56%)"
                        strokeWidth="12"
                        strokeDasharray={`${proteinDash} ${circumference}`}
                        strokeDashoffset="0"
                        strokeLinecap="round"
                      />
                      {/* Carbs segment (yellow/orange) */}
                      <circle
                        cx="70"
                        cy="70"
                        r={radius}
                        fill="none"
                        stroke="hsl(45 93% 47%)"
                        strokeWidth="12"
                        strokeDasharray={`${carbsDash} ${circumference}`}
                        strokeDashoffset={-proteinDash}
                        strokeLinecap="round"
                      />
                      {/* Fats segment (pink/red) */}
                      <circle
                        cx="70"
                        cy="70"
                        r={radius}
                        fill="none"
                        stroke="hsl(340 82% 52%)"
                        strokeWidth="12"
                        strokeDasharray={`${fatsDash} ${circumference}`}
                        strokeDashoffset={-(proteinDash + carbsDash)}
                        strokeLinecap="round"
                      />
                    </svg>
                    {/* Center calorie text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold">{adjustedCalories}</span>
                      <span className="text-xs text-muted-foreground">cal</span>
                    </div>
                  </div>

                  {/* Compact Macro Breakdown - Under Circle */}
                  <div className="flex justify-between w-[140px] mt-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-[hsl(220,90%,56%)] mb-1" />
                      <span className="text-xs font-semibold">{adjustedProtein.toFixed(0)}g</span>
                      <span className="text-[10px] text-muted-foreground">{proteinPercentage.toFixed(0)}%</span>
                      <span className="text-[10px] text-muted-foreground">Protein</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-[hsl(45,93%,47%)] mb-1" />
                      <span className="text-xs font-semibold">{adjustedCarbs.toFixed(0)}g</span>
                      <span className="text-[10px] text-muted-foreground">{carbsPercentage.toFixed(0)}%</span>
                      <span className="text-[10px] text-muted-foreground">Carbs</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-[hsl(340,82%,52%)] mb-1" />
                      <span className="text-xs font-semibold">{adjustedFats.toFixed(0)}g</span>
                      <span className="text-[10px] text-muted-foreground">{fatsPercentage.toFixed(0)}%</span>
                      <span className="text-[10px] text-muted-foreground">Fats</span>
                    </div>
                  </div>
                </div>

                {/* Servings Controls */}
                <div className="flex-1 space-y-4">
                  {/* Number of Servings */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Number of Servings
                    </label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={decrementServings}
                      >
                        <Minus size={18} />
                      </Button>
                      <span className="text-2xl font-bold min-w-[3rem] text-center">
                        {servings}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={incrementServings}
                      >
                        <Plus size={18} />
                      </Button>
                    </div>
                  </div>

                  {/* Serving Size */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Serving Size
                    </label>
                    <Select value={servingSize} onValueChange={setServingSize} disabled={manualOverride}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {servingSizeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Manual Override Section */}
              <div className="mt-6 pt-4 border-t border-border">
                <button
                  onClick={toggleManualOverride}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                  <Edit2 size={14} />
                  <span>{manualOverride ? "Using manual values" : "Edit macros manually"}</span>
                </button>

                {manualOverride && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-4 gap-3"
                  >
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Calories</label>
                      <Input
                        type="number"
                        value={manualCalories}
                        onChange={(e) => setManualCalories(Number(e.target.value) || 0)}
                        className="text-center"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Protein (g)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={manualProtein}
                        onChange={(e) => setManualProtein(Number(e.target.value) || 0)}
                        className="text-center"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Carbs (g)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={manualCarbs}
                        onChange={(e) => setManualCarbs(Number(e.target.value) || 0)}
                        className="text-center"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Fat (g)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={manualFats}
                        onChange={(e) => setManualFats(Number(e.target.value) || 0)}
                        className="text-center"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};