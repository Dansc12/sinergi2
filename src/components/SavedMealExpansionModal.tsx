import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, GripHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SavedMealFood } from "@/components/FoodSearchInput";

// USDA FoodData Central API
const USDA_API_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";
// DEMO_KEY is a free public API key provided by USDA for demo/testing purposes
// For production, consider using environment variables or a proper API key
const USDA_API_KEY = "DEMO_KEY";

// USDA API response types
interface USDANutrient {
  nutrientNumber?: string;
  nutrientName?: string;
  value?: number;
  unitName?: string;
}

interface USDAFood {
  fdcId: number;
  description: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients?: USDANutrient[];
}

interface USDASearchResponse {
  foods?: USDAFood[];
}

interface ExpandedFood extends SavedMealFood {
  adjustedQuantity: number;
  adjustedUnit: StandardUnit;
  adjustedCalories: number;
  adjustedProtein: number;
  adjustedCarbs: number;
  adjustedFats: number;

  // Saved serving baseline (used for scaling)
  originalQuantity: number;
  originalUnit: StandardUnit;
  originalGrams: number;

  // Baseline macros for the saved serving (prefer USDA-resolved values)
  originalCalories: number;
  originalProtein: number;
  originalCarbs: number;
  originalFats: number;
}

interface SavedMealExpansionModalProps {
  isOpen: boolean;
  mealName: string;
  foods: SavedMealFood[];
  onClose: () => void;
  onConfirm: (foods: ExpandedFood[]) => void;
}

const STANDARD_UNITS = ["g", "ml", "oz", "lb", "cup"] as const;

type StandardUnit = (typeof STANDARD_UNITS)[number];

const UNIT_TO_GRAMS: Record<StandardUnit, number> = {
  g: 1,
  ml: 1, // approximation (water-like)
  oz: 28.3495,
  lb: 453.592,
  cup: 240, // rough estimate; varies by food
};

const gramsFor = (quantity: number, unit: StandardUnit) => quantity * UNIT_TO_GRAMS[unit];

const clampUnit = (unit: string): StandardUnit => {
  const normalized = unit.trim().toLowerCase();

  // Exact match
  if ((STANDARD_UNITS as readonly string[]).includes(normalized)) return normalized as StandardUnit;

  // Prefix match (e.g. "cup (244g)" -> "cup")
  const prefix = (STANDARD_UNITS as readonly string[]).find((u) => normalized.startsWith(u));
  if (prefix) return prefix as StandardUnit;

  return "g";
};

const parseSavedServing = (food: SavedMealFood): { quantity: number; unit: StandardUnit } => {
  const positive = (value: unknown, fallback: number) => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  const parseFromString = (value?: string) => {
    if (!value) return null;
    const match = value.trim().match(/^([\d.]+)\s*(.+)$/);
    if (!match) return null;
    const qty = Number(match[1]);
    if (!Number.isFinite(qty) || qty <= 0) return null;
    const unit = clampUnit(match[2]);
    return { quantity: qty, unit };
  };

  // If servingSize contains quantity + unit (e.g. "100 g"), treat `servings` as a multiplier.
  const fromServingSize = parseFromString(food.servingSize);
  if (fromServingSize) {
    const mult = positive(food.servings, 1);
    return { quantity: fromServingSize.quantity * mult, unit: fromServingSize.unit };
  }

  // Older data sometimes stores quantity+unit in rawUnit (e.g. rawQuantity: 2, rawUnit: "100 g")
  const fromRawUnit = parseFromString(food.rawUnit);
  if (fromRawUnit) {
    const mult = positive(food.rawQuantity ?? food.servings, 1);
    return { quantity: fromRawUnit.quantity * mult, unit: fromRawUnit.unit };
  }

  // Otherwise fall back to numeric quantity + unit
  const qty = positive(food.rawQuantity ?? food.servings, 1);
  const unit = clampUnit(String(food.rawUnit ?? food.servingSize ?? "g"));
  return { quantity: qty, unit };
};

export const SavedMealExpansionModal = ({
  isOpen,
  mealName,
  foods,
  onClose,
  onConfirm,
}: SavedMealExpansionModalProps) => {
  const [expandedFoods, setExpandedFoods] = useState<ExpandedFood[]>([]);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  // Initialize expanded foods when modal opens (and resolve USDA-correct macros)
  useEffect(() => {
    if (!isOpen || foods.length === 0) return;

    const initialExpanded: ExpandedFood[] = foods.map((food) => {
      const { quantity, unit } = parseSavedServing(food);
      const originalGrams = gramsFor(quantity, unit);

      return {
        ...food,
        adjustedQuantity: quantity,
        adjustedUnit: unit,
        // Start with stored values; we will replace with USDA-resolved values below
        adjustedCalories: food.calories,
        adjustedProtein: food.protein,
        adjustedCarbs: food.carbs,
        adjustedFats: food.fats,
        originalQuantity: quantity,
        originalUnit: unit,
        originalGrams,
        originalCalories: food.calories,
        originalProtein: food.protein,
        originalCarbs: food.carbs,
        originalFats: food.fats,
      };
    });

    setExpandedFoods(initialExpanded);

    let cancelled = false;

    (async () => {
      const resolved = await Promise.all(
        initialExpanded.map(async (f) => {
          try {
            const response = await fetch(
              `${USDA_API_URL}?api_key=${USDA_API_KEY}&query=${encodeURIComponent(f.name)}&pageSize=50&dataType=Foundation,SR Legacy`,
              {
                method: 'GET',
              }
            );

            if (!response.ok) {
              console.error('USDA API error:', response.status);
              return f;
            }

            const data: USDASearchResponse = await response.json();
            const foods = data.foods || [];
            
            // Find USDA food (non-custom)
            const usdaFood = foods.find((food: USDAFood) => {
              const nutrients = food.foodNutrients || [];
              const hasNutrients = nutrients.length > 0;
              return hasNutrients && food.description?.toLowerCase().includes(f.name.toLowerCase());
            });
            
            if (!usdaFood) return f;

            // Extract nutrients
            const nutrients = usdaFood.foodNutrients || [];
            
            const getNutrient = (nameOrNumber: string): number | null => {
              const needle = nameOrNumber.toLowerCase();
              const nutrient = nutrients.find((n: USDANutrient) =>
                String(n.nutrientNumber) === nameOrNumber ||
                n.nutrientName?.toLowerCase().includes(needle)
              );
              if (nutrient?.value == null) return null;
              return Math.round(Number(nutrient.value));
            };

            const getEnergyKcal = (): number => {
              const kcal = nutrients.find((n: USDANutrient) =>
                String(n.nutrientNumber) === "1008" ||
                (n.nutrientName?.toLowerCase() === "energy" && String(n.unitName).toLowerCase() === "kcal")
              );
              if (kcal?.value != null) return Number(kcal.value);

              const kj = nutrients.find((n: USDANutrient) =>
                String(n.nutrientNumber) === "1062" ||
                (n.nutrientName?.toLowerCase() === "energy" && String(n.unitName).toLowerCase() === "kj")
              );
              if (kj?.value != null) return Number(kj.value) / 4.184;

              return 0;
            };

            const usda = {
              calories: getEnergyKcal(),
              protein: getNutrient('protein') ?? getNutrient('1003') ?? 0,
              carbs: getNutrient('carbohydrate') ?? getNutrient('1005') ?? 0,
              fats: getNutrient('fat') ?? getNutrient('1004') ?? 0,
              servingSizeValue: usdaFood.servingSize || 100,
              servingSizeUnit: usdaFood.servingSizeUnit || 'g',
            };

            const refQty = Number(usda.servingSizeValue) || 100;
            const refUnit = clampUnit(String(usda.servingSizeUnit || "g"));
            const refGrams = gramsFor(refQty, refUnit);
            const multiplier = refGrams > 0 ? f.originalGrams / refGrams : 1;

            const baseCalories = Math.round(Number(usda.calories || 0) * multiplier);
            const baseProtein = Math.round(Number(usda.protein || 0) * multiplier * 10) / 10;
            const baseCarbs = Math.round(Number(usda.carbs || 0) * multiplier * 10) / 10;
            const baseFats = Math.round(Number(usda.fats || 0) * multiplier * 10) / 10;

            return {
              ...f,
              // Set the saved-serving baseline to USDA-correct values
              originalCalories: baseCalories,
              originalProtein: baseProtein,
              originalCarbs: baseCarbs,
              originalFats: baseFats,
              // And reflect them immediately in the UI
              adjustedCalories: baseCalories,
              adjustedProtein: baseProtein,
              adjustedCarbs: baseCarbs,
              adjustedFats: baseFats,
            };
          } catch (err) {
            console.error("Failed to resolve USDA food:", f.name, err);
            return f;
          }
        })
      );

      if (cancelled) return;
      setExpandedFoods(resolved);
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, foods]);

  const recalcFromBaseline = (food: ExpandedFood, quantity: number, unit: StandardUnit) => {
    const newGrams = gramsFor(quantity, unit);
    const multiplier = food.originalGrams > 0 ? newGrams / food.originalGrams : 1;

    return {
      ...food,
      adjustedQuantity: quantity,
      adjustedUnit: unit,
      adjustedCalories: Math.round(food.originalCalories * multiplier),
      adjustedProtein: Math.round(food.originalProtein * multiplier * 10) / 10,
      adjustedCarbs: Math.round(food.originalCarbs * multiplier * 10) / 10,
      adjustedFats: Math.round(food.originalFats * multiplier * 10) / 10,
    };
  };

  const updateFoodQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 0.1) return;

    setExpandedFoods((prev) => {
      const updated = [...prev];
      const food = updated[index];
      updated[index] = recalcFromBaseline(food, newQuantity, food.adjustedUnit);
      return updated;
    });
  };

  const updateFoodUnit = (index: number, newUnit: string) => {
    const unit = clampUnit(newUnit);
    setExpandedFoods((prev) => {
      const updated = [...prev];
      const food = updated[index];
      updated[index] = recalcFromBaseline(food, food.adjustedQuantity, unit);
      return updated;
    });
  };

  const handleDragStart = (e: React.TouchEvent | React.MouseEvent, index: number) => {
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    setDragStartX(clientX);
    setDraggingIndex(index);
  };

  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (dragStartX === null || draggingIndex === null) return;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const diff = clientX - dragStartX;

    if (Math.abs(diff) > 30) {
      const change = diff > 0 ? 1 : -1;
      const currentQty = expandedFoods[draggingIndex].adjustedQuantity;
      updateFoodQuantity(draggingIndex, Math.max(0.1, currentQty + change));
      setDragStartX(clientX);
    }
  };

  const handleDragEnd = () => {
    setDragStartX(null);
    setDraggingIndex(null);
  };

  // Calculate totals
  const totalCalories = expandedFoods.reduce((sum, f) => sum + f.adjustedCalories, 0);
  const totalProtein = expandedFoods.reduce((sum, f) => sum + f.adjustedProtein, 0);
  const totalCarbs = expandedFoods.reduce((sum, f) => sum + f.adjustedCarbs, 0);
  const totalFats = expandedFoods.reduce((sum, f) => sum + f.adjustedFats, 0);

  const handleConfirm = () => {
    onConfirm(expandedFoods);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-card rounded-t-3xl max-h-[90vh] flex flex-col"
            onTouchMove={handleDragMove}
            onMouseMove={handleDragMove}
            onTouchEnd={handleDragEnd}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-4">
              <div>
                <h2 className="text-lg font-bold">{mealName}</h2>
                <p className="text-sm text-muted-foreground">{expandedFoods.length} foods</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X size={20} />
              </Button>
            </div>

            {/* Total Nutrition Card */}
            <div className="mx-4 mb-4 p-4 rounded-2xl bg-muted/50 border border-border">
              <div className="text-center mb-3">
                <span className="text-3xl font-bold">{totalCalories}</span>
                <span className="text-muted-foreground ml-1">cal</span>
              </div>
              <div className="flex justify-center gap-6">
                <div className="text-center">
                  <div
                    className="text-sm font-semibold"
                    style={{ color: "hsl(var(--macro-protein))" }}
                  >
                    {totalProtein.toFixed(0)}g
                  </div>
                  <div className="text-xs text-muted-foreground">Protein</div>
                </div>
                <div className="text-center">
                  <div
                    className="text-sm font-semibold"
                    style={{ color: "hsl(var(--macro-carbs))" }}
                  >
                    {totalCarbs.toFixed(0)}g
                  </div>
                  <div className="text-xs text-muted-foreground">Carbs</div>
                </div>
                <div className="text-center">
                  <div
                    className="text-sm font-semibold"
                    style={{ color: "hsl(var(--macro-fats))" }}
                  >
                    {totalFats.toFixed(0)}g
                  </div>
                  <div className="text-xs text-muted-foreground">Fat</div>
                </div>
              </div>
            </div>

            {/* Foods List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
              {expandedFoods.map((food, index) => {
                const total = food.adjustedProtein + food.adjustedCarbs + food.adjustedFats;
                const pPct = total > 0 ? (food.adjustedProtein / total) * 100 : 33;
                const cPct = total > 0 ? (food.adjustedCarbs / total) * 100 : 33;

                return (
                  <div
                    key={food.id || index}
                    className="rounded-xl bg-card border border-border overflow-hidden"
                  >
                    {/* Macro gradient bar */}
                    <div
                      className="h-1"
                      style={{
                        background: `linear-gradient(90deg, hsl(var(--macro-protein)) 0%, hsl(var(--macro-protein)) ${
                          pPct * 0.7
                        }%, hsl(var(--macro-carbs)) ${pPct + cPct * 0.3}%, hsl(var(--macro-carbs)) ${
                          pPct + cPct * 0.7
                        }%, hsl(var(--macro-fats)) ${
                          pPct + cPct + (100 - pPct - cPct) * 0.3
                        }%, hsl(var(--macro-fats)) 100%)`,
                      }}
                    />

                    <div className="p-3">
                      {/* Food name and macros */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-primary">
                            {food.adjustedQuantity % 1 === 0 ? food.adjustedQuantity : food.adjustedQuantity.toFixed(1)}
                            {food.adjustedUnit}
                          </span>
                          <span className="font-medium text-sm">{food.name}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-medium">{food.adjustedCalories} cal</span>
                          <div className="flex items-center gap-2 text-xs">
                            <span style={{ color: "hsl(var(--macro-protein))" }}>
                              P: {food.adjustedProtein.toFixed(0)}g
                            </span>
                            <span style={{ color: "hsl(var(--macro-carbs))" }}>
                              C: {food.adjustedCarbs.toFixed(0)}g
                            </span>
                            <span style={{ color: "hsl(var(--macro-fats))" }}>
                              F: {food.adjustedFats.toFixed(0)}g
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity and Unit controls */}
                      <div className="flex gap-2">
                        {/* Quantity control - 80% width */}
                        <div
                          className="flex-[4] flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 cursor-ew-resize select-none"
                          onTouchStart={(e) => handleDragStart(e, index)}
                          onMouseDown={(e) => handleDragStart(e, index)}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateFoodQuantity(index, food.adjustedQuantity - 1);
                            }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Minus size={16} />
                          </button>
                          <div className="flex items-center gap-1">
                            <GripHorizontal size={12} className="text-muted-foreground/50" />
                            <span className="font-medium text-sm min-w-[3ch] text-center">
                              {food.adjustedQuantity % 1 === 0
                                ? food.adjustedQuantity
                                : food.adjustedQuantity.toFixed(1)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateFoodQuantity(index, food.adjustedQuantity + 1);
                            }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        {/* Unit selector - 20% width */}
                        <select
                          value={food.adjustedUnit}
                          onChange={(e) => updateFoodUnit(index, e.target.value)}
                          className="flex-1 bg-muted/50 rounded-lg px-2 py-2 text-sm font-medium text-center appearance-none cursor-pointer border-0 focus:ring-1 focus:ring-primary"
                        >
                          {STANDARD_UNITS.map((unit) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Button */}
            <div className="p-4 border-t border-border">
              <Button onClick={handleConfirm} className="w-full h-12 rounded-xl text-base font-semibold">
                Add {expandedFoods.length} Foods
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
