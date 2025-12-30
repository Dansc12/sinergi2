import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, GripHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SavedMealFood } from "@/components/FoodSearchInput";

interface ExpandedFood extends SavedMealFood {
  adjustedQuantity: number;
  adjustedUnit: string;
  adjustedCalories: number;
  adjustedProtein: number;
  adjustedCarbs: number;
  adjustedFats: number;
  // Store the original values so we can properly scale
  originalQuantity: number;
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

const STANDARD_UNITS = ["g", "ml", "oz", "lb", "cup"];

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

  // Initialize expanded foods when modal opens
  useEffect(() => {
    if (isOpen && foods.length > 0) {
      setExpandedFoods(
        foods.map((food) => {
          const quantity = food.rawQuantity || food.servings || 1;
          // Parse unit from servingSize if it contains the quantity (e.g., "100 g" -> "g")
          let unit = food.rawUnit || "g";
          if (food.servingSize && food.servingSize.includes(" ")) {
            const parts = food.servingSize.trim().split(" ");
            if (parts.length >= 2) {
              unit = parts.slice(1).join(" "); // Get everything after the number
            }
          }
          
          return {
            ...food,
            adjustedQuantity: quantity,
            adjustedUnit: unit,
            // The stored calories/macros ARE the values for the stored quantity
            adjustedCalories: food.calories,
            adjustedProtein: food.protein,
            adjustedCarbs: food.carbs,
            adjustedFats: food.fats,
            // Store originals for scaling
            originalQuantity: quantity,
            originalCalories: food.calories,
            originalProtein: food.protein,
            originalCarbs: food.carbs,
            originalFats: food.fats,
          };
        })
      );
    }
  }, [isOpen, foods]);

  const updateFoodQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 0.1) return;
    
    setExpandedFoods((prev) => {
      const updated = [...prev];
      const food = updated[index];
      // Calculate multiplier based on original saved quantity
      const multiplier = newQuantity / food.originalQuantity;
      
      updated[index] = {
        ...food,
        adjustedQuantity: newQuantity,
        // Scale from the original values
        adjustedCalories: Math.round(food.originalCalories * multiplier),
        adjustedProtein: Math.round(food.originalProtein * multiplier * 10) / 10,
        adjustedCarbs: Math.round(food.originalCarbs * multiplier * 10) / 10,
        adjustedFats: Math.round(food.originalFats * multiplier * 10) / 10,
      };
      return updated;
    });
  };

  const updateFoodUnit = (index: number, newUnit: string) => {
    setExpandedFoods((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], adjustedUnit: newUnit };
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
                  <div className="text-sm font-semibold" style={{ color: "#3DD6C6" }}>
                    {totalProtein.toFixed(0)}g
                  </div>
                  <div className="text-xs text-muted-foreground">Protein</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold" style={{ color: "#5B8CFF" }}>
                    {totalCarbs.toFixed(0)}g
                  </div>
                  <div className="text-xs text-muted-foreground">Carbs</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold" style={{ color: "#B46BFF" }}>
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
                        background: `linear-gradient(90deg, #3DD6C6 0%, #3DD6C6 ${pPct * 0.7}%, #5B8CFF ${pPct + cPct * 0.3}%, #5B8CFF ${pPct + cPct * 0.7}%, #B46BFF ${pPct + cPct + (100 - pPct - cPct) * 0.3}%, #B46BFF 100%)`,
                      }}
                    />

                    <div className="p-3">
                      {/* Food name and macros */}
                      <div className="mb-3">
                        <div className="font-medium text-sm">{food.name}</div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-medium">{food.adjustedCalories} cal</span>
                          <div className="flex items-center gap-2 text-xs">
                            <span style={{ color: "#3DD6C6" }}>P: {food.adjustedProtein.toFixed(0)}g</span>
                            <span style={{ color: "#5B8CFF" }}>C: {food.adjustedCarbs.toFixed(0)}g</span>
                            <span style={{ color: "#B46BFF" }}>F: {food.adjustedFats.toFixed(0)}g</span>
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
