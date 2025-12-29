import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Minus, Plus, Edit2, AlertCircle } from "lucide-react";
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
  const [isEditingManual, setIsEditingManual] = useState(false);
  const [manualCalories, setManualCalories] = useState("");
  const [manualProtein, setManualProtein] = useState("");
  const [manualCarbs, setManualCarbs] = useState("");
  const [manualFats, setManualFats] = useState("");
  const macroEditRef = useRef<HTMLDivElement>(null);
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
      setIsEditingManual(false);
      
      // Initialize manual values
      const initMultiplier = calculateMultiplier(defaultUnit, defaultQty, food.baseUnit || 'g', !food.isCustom);
      setManualCalories(String(Math.round(food.calories * initMultiplier)));
      setManualProtein(String(Math.round(food.protein * initMultiplier * 10) / 10));
      setManualCarbs(String(Math.round(food.carbs * initMultiplier * 10) / 10));
      setManualFats(String(Math.round(food.fats * initMultiplier * 10) / 10));
    }
  }, [isOpen, food, initialQuantity, initialUnit]);

  // Update manual values when quantity/unit changes
  useEffect(() => {
    if (!manualOverride && food) {
      setManualCalories(String(calculatedCalories));
      setManualProtein(String(Math.round(calculatedProtein * 10) / 10));
      setManualCarbs(String(Math.round(calculatedCarbs * 10) / 10));
      setManualFats(String(Math.round(calculatedFats * 10) / 10));
    }
  }, [quantity, selectedUnit, manualOverride, food, calculatedCalories, calculatedProtein, calculatedCarbs, calculatedFats]);

  const finalizeManualValues = () => {
    const normalize = (v: string) => {
      const parsed = parseFloat(v);
      if (v === "" || Number.isNaN(parsed)) return "0";
      return String(Math.max(0, parsed));
    };

    setManualCalories(normalize(manualCalories));
    setManualProtein(normalize(manualProtein));
    setManualCarbs(normalize(manualCarbs));
    setManualFats(normalize(manualFats));
  };

  // Click outside the macro area to exit edit mode (keep manual values)
  useEffect(() => {
    if (!isEditingManual) return;

    const handlePointerDown = (e: Event) => {
      if (macroEditRef.current && !macroEditRef.current.contains(e.target as Node)) {
        finalizeManualValues();
        setIsEditingManual(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isEditingManual, manualCalories, manualProtein, manualCarbs, manualFats]);

  if (!food) return null;

  // Use manual values if override is enabled
  const adjustedCalories = manualOverride ? (parseFloat(manualCalories) || 0) : calculatedCalories;
  const adjustedProtein = manualOverride ? (parseFloat(manualProtein) || 0) : calculatedProtein;
  const adjustedCarbs = manualOverride ? (parseFloat(manualCarbs) || 0) : calculatedCarbs;
  const adjustedFats = manualOverride ? (parseFloat(manualFats) || 0) : calculatedFats;

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
    const modifiedFood: FoodItem = {
      ...food,
      calories: adjustedCalories,
      protein: adjustedProtein,
      carbs: adjustedCarbs,
      fats: adjustedFats,
    };
    onConfirm(modifiedFood, 1, `${quantity} ${selectedUnit}`);
  };

  const handleManualButtonClick = () => {
    if (!manualOverride) {
      // Enable manual values + enter edit mode
      setManualCalories(String(calculatedCalories));
      setManualProtein(String(Math.round(calculatedProtein * 10) / 10));
      setManualCarbs(String(Math.round(calculatedCarbs * 10) / 10));
      setManualFats(String(Math.round(calculatedFats * 10) / 10));
      setManualOverride(true);
      setIsEditingManual(true);
      return;
    }

    if (isEditingManual) {
      // Done editing (keep manual values enabled)
      finalizeManualValues();
      setIsEditingManual(false);
      return;
    }

    // Re-enter edit mode
    setIsEditingManual(true);
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

  const handleMacroChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
  };

  const handleMacroBlur = (setter: (value: string) => void, currentValue: string) => () => {
    const parsed = parseFloat(currentValue);
    if (isNaN(parsed) || currentValue === "") {
      setter("0");
    } else {
      setter(String(Math.max(0, parsed)));
    }
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full bg-background rounded-t-3xl flex flex-col max-h-[85vh]"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
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
              <Button variant="default" size="sm" onClick={handleConfirm}>
                Add
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {/* Nutrition Card - Rectangle with blob background */}
              <div ref={macroEditRef}>
                {(() => {
                  const proteinColor = '#3DD6C6';
                  const carbsColor = '#5B8CFF';
                  const fatsColor = '#B46BFF';
                  
                  const proteinRatioCalc = totalMacros > 0 ? Math.max((adjustedProtein / totalMacros), 0.08) : 0.33;
                  const carbsRatioCalc = totalMacros > 0 ? Math.max((adjustedCarbs / totalMacros), 0.08) : 0.33;
                  const fatsRatioCalc = totalMacros > 0 ? Math.max((adjustedFats / totalMacros), 0.08) : 0.33;
                  
                  const totalRatioCalc = proteinRatioCalc + carbsRatioCalc + fatsRatioCalc;
                  const normalizedProtein = proteinRatioCalc / totalRatioCalc;
                  const normalizedCarbs = carbsRatioCalc / totalRatioCalc;
                  const normalizedFats = fatsRatioCalc / totalRatioCalc;
                  
                  const proteinSize = 60 + normalizedProtein * 40;
                  const carbsSize = 60 + normalizedCarbs * 40;
                  const fatsSize = 60 + normalizedFats * 40;
                  
                  return (
                    <div 
                      className="relative w-full rounded-2xl overflow-hidden p-5"
                      style={{
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                      }}
                    >
                      {/* Dark base */}
                      <div className="absolute inset-0 bg-card" />
                      
                      {/* Protein blob */}
                      <motion.div
                        className="absolute rounded-full"
                        style={{
                          width: `${proteinSize}%`,
                          height: `${proteinSize * 1.5}%`,
                          background: proteinColor,
                          filter: 'blur(40px)',
                          opacity: 0.4,
                          left: '-15%',
                          top: '-20%',
                        }}
                        animate={{
                          x: [0, 20, -15, 10, 0],
                          y: [0, -15, 20, -10, 0],
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
                        className="absolute rounded-full"
                        style={{
                          width: `${carbsSize}%`,
                          height: `${carbsSize * 1.5}%`,
                          background: carbsColor,
                          filter: 'blur(40px)',
                          opacity: 0.4,
                          right: '-20%',
                          top: '-10%',
                        }}
                        animate={{
                          x: [0, -25, 15, -10, 0],
                          y: [0, 20, -15, 10, 0],
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
                        className="absolute rounded-full"
                        style={{
                          width: `${fatsSize}%`,
                          height: `${fatsSize * 1.2}%`,
                          background: fatsColor,
                          filter: 'blur(40px)',
                          opacity: 0.4,
                          left: '20%',
                          bottom: '-40%',
                        }}
                        animate={{
                          x: [0, 15, -20, 12, 0],
                          y: [0, -20, 15, -12, 0],
                          scale: [1, 1.08, 0.92, 1.04, 1],
                        }}
                        transition={{
                          duration: 7,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: 1,
                        }}
                      />
                      
                      {/* Edit pencil icon - top left */}
                      <button
                        onClick={handleManualButtonClick}
                        className="absolute top-3 left-3 z-20 hover:opacity-100 transition-opacity"
                      >
                        <Edit2 size={14} className={isEditingManual ? "text-primary" : "text-white/50 hover:text-white/80"} />
                      </button>
                      
                      {/* Content */}
                      <div className="relative z-10 flex items-center justify-between w-full pt-2">
                        {/* Calories - Left */}
                        <div className="flex items-baseline gap-1.5">
                          {isEditingManual ? (
                            <input
                              type="number"
                              min="0"
                              value={manualCalories}
                              onChange={handleMacroChange(setManualCalories)}
                              onBlur={handleMacroBlur(setManualCalories, manualCalories)}
                              className="w-16 text-2xl font-bold text-white text-left bg-transparent border-b border-white/30 focus:border-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          ) : (
                            <span className="text-2xl font-bold text-white tracking-tight">{adjustedCalories}</span>
                          )}
                          <span className="text-base font-medium text-white/80">cal</span>
                        </div>
                        
                        {/* Macros - Right */}
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-start">
                            <div className="flex items-center gap-1 mb-0.5">
                              <span 
                                className="text-[11px] font-medium uppercase tracking-wide"
                                style={{ color: proteinColor, opacity: 0.8 }}
                              >
                                P
                              </span>
                              <span className="text-[10px] text-white/50">{proteinPercentage.toFixed(0)}%</span>
                            </div>
                            <div className="flex items-baseline gap-0.5">
                              {isEditingManual ? (
                                <input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  value={manualProtein}
                                  onChange={handleMacroChange(setManualProtein)}
                                  onBlur={handleMacroBlur(setManualProtein, manualProtein)}
                                  className="w-10 text-base font-semibold text-white text-left bg-transparent border-b border-white/30 focus:border-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              ) : (
                                <span className="text-base font-semibold text-white">{adjustedProtein.toFixed(0)}g</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-start">
                            <div className="flex items-center gap-1 mb-0.5">
                              <span 
                                className="text-[11px] font-medium uppercase tracking-wide"
                                style={{ color: carbsColor, opacity: 0.8 }}
                              >
                                C
                              </span>
                              <span className="text-[10px] text-white/50">{carbsPercentage.toFixed(0)}%</span>
                            </div>
                            <div className="flex items-baseline gap-0.5">
                              {isEditingManual ? (
                                <input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  value={manualCarbs}
                                  onChange={handleMacroChange(setManualCarbs)}
                                  onBlur={handleMacroBlur(setManualCarbs, manualCarbs)}
                                  className="w-10 text-base font-semibold text-white text-left bg-transparent border-b border-white/30 focus:border-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              ) : (
                                <span className="text-base font-semibold text-white">{adjustedCarbs.toFixed(0)}g</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-start">
                            <div className="flex items-center gap-1 mb-0.5">
                              <span 
                                className="text-[11px] font-medium uppercase tracking-wide"
                                style={{ color: fatsColor, opacity: 0.8 }}
                              >
                                F
                              </span>
                              <span className="text-[10px] text-white/50">{fatsPercentage.toFixed(0)}%</span>
                            </div>
                            <div className="flex items-baseline gap-0.5">
                              {isEditingManual ? (
                                <input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  value={manualFats}
                                  onChange={handleMacroChange(setManualFats)}
                                  onBlur={handleMacroBlur(setManualFats, manualFats)}
                                  className="w-10 text-base font-semibold text-white text-left bg-transparent border-b border-white/30 focus:border-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              ) : (
                                <span className="text-base font-semibold text-white">{adjustedFats.toFixed(0)}g</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Quantity & Unit Controls - Same Row */}
              <div className="flex items-end gap-3">
                {/* Quantity - 80% */}
                <div className="flex-[4]">
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Quantity
                  </label>
                  <div className="flex items-center h-10 rounded-md border border-input bg-background">
                    <button
                      onClick={decrementQuantity}
                      disabled={quantity <= 0.1}
                      className="flex items-center justify-center h-full px-3 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <div className="flex-1 h-full border-x border-input">
                      {isEditingQuantity ? (
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={quantityInput}
                          onChange={(e) => handleQuantityInputChange(e.target.value)}
                          onBlur={handleQuantityInputBlur}
                          onKeyDown={handleQuantityInputKeyDown}
                          autoFocus
                          className="w-full h-full text-base font-medium text-center bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setIsEditingQuantity(true);
                            setQuantityInput(String(quantity));
                          }}
                          className="w-full h-full text-base font-medium text-center hover:text-primary transition-colors"
                        >
                          {quantity}
                        </button>
                      )}
                    </div>
                    <button
                      onClick={incrementQuantity}
                      className="flex items-center justify-center h-full px-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Unit - 20% */}
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Unit
                  </label>
                  <Select value={selectedUnit} onValueChange={handleUnitChange} disabled={manualOverride}>
                    <SelectTrigger className="w-full h-10">
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
