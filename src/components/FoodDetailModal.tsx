import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Minus, Plus, Edit2, AlertCircle } from "lucide-react";
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
  isCustom?: boolean;
  baseUnit?: string; // 'g' or 'oz' for custom foods
}

interface FoodDetailModalProps {
  isOpen: boolean;
  food: FoodItem | null;
  onClose: () => void;
  onConfirm: (food: FoodItem, servings: number, servingSize: string) => void;
  initialQuantity?: number;
  initialUnit?: string;
}

// Standard serving units with gram equivalents
const STANDARD_UNITS = [
  { value: "g", label: "1 g", gramsEquivalent: 1 },
  { value: "ml", label: "1 ml", gramsEquivalent: 1 }, // Approximate for water-like liquids
  { value: "oz", label: "1 oz", gramsEquivalent: 28.35 },
  { value: "lb", label: "1 lb", gramsEquivalent: 453.6 },
  { value: "cup", label: "1 cup", gramsEquivalent: 240, hasEstimate: true }, // Varies by food
];

// Get the gram equivalent for a unit
const getGramsForUnit = (unit: string): { grams: number; isEstimate: boolean } => {
  const found = STANDARD_UNITS.find(u => u.value === unit);
  return {
    grams: found?.gramsEquivalent || 1,
    isEstimate: found?.hasEstimate || false,
  };
};

// Calculate multiplier based on selected unit and base unit
const calculateMultiplier = (
  selectedUnit: string,
  quantity: number,
  baseUnit: string, // 'g' or 'oz' - what the food's macros are stored per
  isUSDA: boolean
): number => {
  const { grams: selectedGrams } = getGramsForUnit(selectedUnit);
  
  if (isUSDA) {
    // USDA foods are per 100g
    return (quantity * selectedGrams) / 100;
  } else {
    // Custom foods are per 1g or 1oz
    const baseGrams = baseUnit === 'oz' ? 28.35 : 1;
    return (quantity * selectedGrams) / baseGrams;
  }
};

export const FoodDetailModal = ({
  isOpen,
  food,
  onClose,
  onConfirm,
  initialQuantity,
  initialUnit,
}: FoodDetailModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState("1");
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState("g");
  const [manualOverride, setManualOverride] = useState(false);
  const [manualCalories, setManualCalories] = useState(0);
  const [manualProtein, setManualProtein] = useState(0);
  const [manualCarbs, setManualCarbs] = useState(0);
  const [manualFats, setManualFats] = useState(0);

  const isCustomFood = food?.isCustom || false;
  const baseUnit = food?.baseUnit || 'g';
  const isUSDA = !isCustomFood;

  // Determine default quantity based on unit
  const getDefaultQuantity = (unit: string): number => {
    switch (unit) {
      case "g":
        return isUSDA ? 100 : 1;
      case "ml":
        return isUSDA ? 100 : 1;
      case "oz":
        return 1;
      case "lb":
        return 1;
      case "cup":
        return 1;
      default:
        return 1;
    }
  };

  // Calculate nutrition based on quantity and unit
  const multiplier = food ? calculateMultiplier(selectedUnit, quantity, baseUnit, isUSDA) : 1;

  const calculatedCalories = food ? Math.round(food.calories * multiplier) : 0;
  const calculatedProtein = food ? food.protein * multiplier : 0;
  const calculatedCarbs = food ? food.carbs * multiplier : 0;
  const calculatedFats = food ? food.fats * multiplier : 0;

  useEffect(() => {
    if (isOpen && food) {
      // Use initial values if provided, otherwise use defaults
      const defaultUnit = initialUnit || (isUSDA ? "g" : (food.baseUnit || "g"));
      const defaultQty = initialQuantity ?? getDefaultQuantity(defaultUnit);
      
      setSelectedUnit(defaultUnit);
      setQuantity(defaultQty);
      setQuantityInput(String(defaultQty));
      setIsEditingQuantity(false);
      setManualOverride(false);
      
      // Initialize manual values
      const initMultiplier = calculateMultiplier(defaultUnit, defaultQty, food.baseUnit || 'g', !food.isCustom);
      setManualCalories(Math.round(food.calories * initMultiplier));
      setManualProtein(Math.round(food.protein * initMultiplier * 10) / 10);
      setManualCarbs(Math.round(food.carbs * initMultiplier * 10) / 10);
      setManualFats(Math.round(food.fats * initMultiplier * 10) / 10);
    }
  }, [isOpen, food, initialQuantity, initialUnit]);

  // Update manual values when quantity/unit changes
  useEffect(() => {
    if (!manualOverride && food) {
      setManualCalories(calculatedCalories);
      setManualProtein(Math.round(calculatedProtein * 10) / 10);
      setManualCarbs(Math.round(calculatedCarbs * 10) / 10);
      setManualFats(Math.round(calculatedFats * 10) / 10);
    }
  }, [quantity, selectedUnit, manualOverride, food, calculatedCalories, calculatedProtein, calculatedCarbs, calculatedFats]);

  if (!food) return null;

  // Use manual values if override is enabled
  const adjustedCalories = manualOverride ? manualCalories : calculatedCalories;
  const adjustedProtein = manualOverride ? manualProtein : calculatedProtein;
  const adjustedCarbs = manualOverride ? manualCarbs : calculatedCarbs;
  const adjustedFats = manualOverride ? manualFats : calculatedFats;

  const totalMacros = adjustedProtein + adjustedCarbs + adjustedFats;
  const proteinPercentage = totalMacros > 0 ? (adjustedProtein / totalMacros) * 100 : 0;
  const carbsPercentage = totalMacros > 0 ? (adjustedCarbs / totalMacros) * 100 : 0;
  const fatsPercentage = totalMacros > 0 ? (adjustedFats / totalMacros) * 100 : 0;

  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const proteinDash = (proteinPercentage / 100) * circumference;
  const carbsDash = (carbsPercentage / 100) * circumference;
  const fatsDash = (fatsPercentage / 100) * circumference;

  const { isEstimate } = getGramsForUnit(selectedUnit);

  const handleConfirm = () => {
    if (manualOverride) {
      const modifiedFood: FoodItem = {
        ...food,
        calories: manualCalories,
        protein: manualProtein,
        carbs: manualCarbs,
        fats: manualFats,
      };
      onConfirm(modifiedFood, 1, `${quantity} ${selectedUnit}`);
    } else {
      const modifiedFood: FoodItem = {
        ...food,
        calories: adjustedCalories,
        protein: adjustedProtein,
        carbs: adjustedCarbs,
        fats: adjustedFats,
      };
      onConfirm(modifiedFood, 1, `${quantity} ${selectedUnit}`);
    }
  };

  const toggleManualOverride = () => {
    if (!manualOverride) {
      setManualCalories(calculatedCalories);
      setManualProtein(Math.round(calculatedProtein * 10) / 10);
      setManualCarbs(Math.round(calculatedCarbs * 10) / 10);
      setManualFats(Math.round(calculatedFats * 10) / 10);
    }
    setManualOverride(!manualOverride);
  };

  const handleUnitChange = (newUnit: string) => {
    setSelectedUnit(newUnit);
    const newDefaultQty = getDefaultQuantity(newUnit);
    setQuantity(newDefaultQty);
    setQuantityInput(String(newDefaultQty));
  };

  const decrementQuantity = () => {
    const step = selectedUnit === "g" || selectedUnit === "ml" ? 10 : 0.5;
    const newValue = Math.max(step, quantity - step);
    setQuantity(newValue);
    setQuantityInput(String(newValue));
  };

  const incrementQuantity = () => {
    const step = selectedUnit === "g" || selectedUnit === "ml" ? 10 : 0.5;
    const newValue = quantity + step;
    setQuantity(newValue);
    setQuantityInput(String(newValue));
  };

  const handleQuantityInputChange = (value: string) => {
    setQuantityInput(value);
  };

  const handleQuantityInputBlur = () => {
    const parsed = parseFloat(quantityInput);
    if (!isNaN(parsed) && parsed > 0) {
      setQuantity(Math.round(parsed * 100) / 100);
    } else {
      setQuantityInput(String(quantity));
    }
    setIsEditingQuantity(false);
  };

  const handleQuantityInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleQuantityInputBlur();
    }
  };

  const handleMacroChange = (setter: (value: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setter(Math.max(0, value) || 0);
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
              <div className="flex-1 text-center px-2">
                <h2 className="text-lg font-semibold truncate">{food.description}</h2>
                {isCustomFood && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                    Custom Food
                  </span>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={handleConfirm}>
                <Check size={24} className="text-primary" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex items-start gap-6">
                {/* Left Column: Circle + Compact Macros */}
                <div className="flex flex-col items-center flex-shrink-0">
                  {/* Calorie Circle with Blob Background */}
                  {(() => {
                    // Macro colors matching the Total Nutrition style
                    const proteinColor = '#3DD6C6';
                    const carbsColor = '#5B8CFF';
                    const fatsColor = '#B46BFF';
                    
                    // Calculate ratios with minimum presence for visual consistency
                    const proteinRatioCalc = totalMacros > 0 ? Math.max((adjustedProtein / totalMacros), 0.08) : 0.33;
                    const carbsRatioCalc = totalMacros > 0 ? Math.max((adjustedCarbs / totalMacros), 0.08) : 0.33;
                    const fatsRatioCalc = totalMacros > 0 ? Math.max((adjustedFats / totalMacros), 0.08) : 0.33;
                    
                    // Normalize ratios
                    const totalRatioCalc = proteinRatioCalc + carbsRatioCalc + fatsRatioCalc;
                    const normalizedProtein = proteinRatioCalc / totalRatioCalc;
                    const normalizedCarbs = carbsRatioCalc / totalRatioCalc;
                    const normalizedFats = fatsRatioCalc / totalRatioCalc;
                    
                    // Calculate blob sizes (50-100% based on ratio - larger for more prominence)
                    const proteinSize = 50 + normalizedProtein * 50;
                    const carbsSize = 50 + normalizedCarbs * 50;
                    const fatsSize = 50 + normalizedFats * 50;
                    
                    // Calculate opacities (0.8 minimum, up to 1.0 - brighter)
                    const proteinOpacity = totalMacros > 0 ? 0.8 + (adjustedProtein / totalMacros) * 0.2 : 0.9;
                    const carbsOpacity = totalMacros > 0 ? 0.8 + (adjustedCarbs / totalMacros) * 0.2 : 0.9;
                    const fatsOpacity = totalMacros > 0 ? 0.8 + (adjustedFats / totalMacros) * 0.2 : 0.9;
                    
                    return (
                      <div 
                        className="relative w-[140px] h-[140px] rounded-full overflow-hidden"
                        style={{
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        {/* Liquid blob background */}
                        <div className="absolute inset-0 bg-card">
                          {/* Protein blob */}
                          <motion.div
                            className="absolute rounded-full blur-3xl"
                            style={{
                              width: `${proteinSize}%`,
                              height: `${proteinSize}%`,
                              background: `radial-gradient(circle, ${proteinColor} 0%, transparent 60%)`,
                              opacity: proteinOpacity,
                              left: '-10%',
                              top: '-5%',
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
                            className="absolute rounded-full blur-3xl"
                            style={{
                              width: `${carbsSize}%`,
                              height: `${carbsSize}%`,
                              background: `radial-gradient(circle, ${carbsColor} 0%, transparent 60%)`,
                              opacity: carbsOpacity,
                              right: '-15%',
                              top: '-10%',
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
                            className="absolute rounded-full blur-3xl"
                            style={{
                              width: `${fatsSize}%`,
                              height: `${fatsSize}%`,
                              background: `radial-gradient(circle, ${fatsColor} 0%, transparent 60%)`,
                              opacity: fatsOpacity,
                              left: '20%',
                              bottom: '-20%',
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
                        
                        {/* Very subtle frosted overlay - minimal to keep blobs bright */}
                        <div 
                          className="absolute inset-0 backdrop-blur-[1px]"
                          style={{
                            background: `radial-gradient(circle, 
                              rgba(0, 0, 0, 0) 50%, 
                              rgba(0, 0, 0, 0.03) 100%)`,
                          }}
                        />
                        
                        {/* Calories content in center */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                          <span className="text-2xl font-bold text-white">{adjustedCalories}</span>
                          <span className="text-xs text-white/70">cal</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Macro Breakdown */}
                  <div className="flex justify-between w-[140px] mt-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full mb-1" style={{ backgroundColor: '#3DD6C6' }} />
                      <span className="text-xs font-semibold">{adjustedProtein.toFixed(0)}g</span>
                      <span className="text-[10px] text-muted-foreground">{proteinPercentage.toFixed(0)}%</span>
                      <span className="text-[10px] text-muted-foreground">Protein</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full mb-1" style={{ backgroundColor: '#5B8CFF' }} />
                      <span className="text-xs font-semibold">{adjustedCarbs.toFixed(0)}g</span>
                      <span className="text-[10px] text-muted-foreground">{carbsPercentage.toFixed(0)}%</span>
                      <span className="text-[10px] text-muted-foreground">Carbs</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full mb-1" style={{ backgroundColor: '#B46BFF' }} />
                      <span className="text-xs font-semibold">{adjustedFats.toFixed(0)}g</span>
                      <span className="text-[10px] text-muted-foreground">{fatsPercentage.toFixed(0)}%</span>
                      <span className="text-[10px] text-muted-foreground">Fats</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Quantity & Unit Controls */}
                <div className="flex-1 space-y-4">
                  {/* Quantity */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Quantity
                    </label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={decrementQuantity}
                        disabled={quantity <= 0.1}
                      >
                        <Minus size={18} />
                      </Button>
                      {isEditingQuantity ? (
                        <Input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={quantityInput}
                          onChange={(e) => handleQuantityInputChange(e.target.value)}
                          onBlur={handleQuantityInputBlur}
                          onKeyDown={handleQuantityInputKeyDown}
                          autoFocus
                          className="text-2xl font-bold w-20 text-center h-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setIsEditingQuantity(true);
                            setQuantityInput(String(quantity));
                          }}
                          className="text-2xl font-bold min-w-[3rem] text-center hover:text-primary transition-colors"
                        >
                          {quantity}
                        </button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={incrementQuantity}
                      >
                        <Plus size={18} />
                      </Button>
                    </div>
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Unit
                    </label>
                    <Select value={selectedUnit} onValueChange={handleUnitChange} disabled={manualOverride}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STANDARD_UNITS.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                            {unit.hasEstimate && " (est.)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Estimate Warning */}
                  {isEstimate && !manualOverride && (
                    <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg text-sm">
                      <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                      <div className="text-muted-foreground">
                        <span className="font-medium text-foreground">Approximate conversion.</span> Cup measurements vary by food density. For accuracy, consider logging in grams or ounces.
                      </div>
                    </div>
                  )}

                  {/* Source Info */}
                  <div className="text-xs text-muted-foreground">
                    {isUSDA ? (
                      <span>Source: USDA (per 100g)</span>
                    ) : (
                      <span>Source: Custom (per 1{baseUnit})</span>
                    )}
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
                      <label className="text-xs text-muted-foreground block mb-1">Calories</label>
                      <Input
                        type="number"
                        min="0"
                        value={manualCalories}
                        onChange={handleMacroChange(setManualCalories)}
                        className="text-center"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Protein (g)</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={manualProtein}
                        onChange={handleMacroChange(setManualProtein)}
                        className="text-center"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Carbs (g)</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={manualCarbs}
                        onChange={handleMacroChange(setManualCarbs)}
                        className="text-center"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Fat (g)</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={manualFats}
                        onChange={handleMacroChange(setManualFats)}
                        className="text-center"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Add Button */}
            <div className="p-4 border-t border-border">
              <Button className="w-full" onClick={handleConfirm}>
                Add {quantity} {selectedUnit} • {adjustedCalories} cal
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
