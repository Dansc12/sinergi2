import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddCustomFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (food: {
    fdcId: number;
    description: string;
    brandName?: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    servingSize?: string;
    isCustom: boolean;
    baseUnit: string;
  }) => void;
  initialName?: string;
}

export const AddCustomFoodModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialName = "",
}: AddCustomFoodModalProps) => {
  const [name, setName] = useState(initialName);
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [baseUnit, setBaseUnit] = useState<"g" | "oz">("g");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a food name");
      return;
    }

    const parsedCalories = parseFloat(calories) || 0;
    const parsedProtein = parseFloat(protein) || 0;
    const parsedCarbs = parseFloat(carbs) || 0;
    const parsedFat = parseFloat(fat) || 0;

    if (parsedCalories === 0 && parsedProtein === 0 && parsedCarbs === 0 && parsedFat === 0) {
      toast.error("Please enter at least one nutritional value");
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to add custom foods");
        return;
      }

      const { data, error } = await supabase
        .from('custom_foods')
        .insert({
          user_id: user.id,
          name: name.trim(),
          calories: parsedCalories,
          protein: parsedProtein,
          carbs: parsedCarbs,
          fat: parsedFat,
          base_unit: baseUnit,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Custom food added!");

      // Return the food in the format expected by the search
      onSuccess({
        fdcId: -Date.now(), // Negative ID for custom foods
        description: data.name,
        brandName: "Custom",
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fats: data.fat,
        servingSize: baseUnit === "g" ? "1 g" : "1 oz",
        isCustom: true,
        baseUnit: data.base_unit,
      });

      // Reset form
      setName("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      setBaseUnit("g");
      onClose();
    } catch (error) {
      console.error("Error saving custom food:", error);
      toast.error("Failed to save custom food");
    } finally {
      setIsSaving(false);
    }
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
              <h2 className="text-lg font-semibold">Add Custom Food</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Check size={24} className="text-primary" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {/* Food Name */}
              <div className="space-y-2">
                <Label htmlFor="food-name">Food Name</Label>
                <Input
                  id="food-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Homemade Granola"
                  autoFocus
                />
              </div>

              {/* Base Unit Selector */}
              <div className="space-y-2">
                <Label>Nutritional values are per</Label>
                <Select value={baseUnit} onValueChange={(v: "g" | "oz") => setBaseUnit(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="g">1 gram (g)</SelectItem>
                    <SelectItem value="oz">1 ounce (oz)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Enter the nutritional info for 1 {baseUnit === "g" ? "gram" : "ounce"} of this food.
                  Macros will scale automatically when logging.
                </p>
              </div>

              {/* Nutritional Info */}
              <div className="space-y-4">
                <h3 className="font-medium">Nutritional Information (per 1 {baseUnit})</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="calories">Calories</Label>
                    <Input
                      id="calories"
                      type="number"
                      min="0"
                      step="0.1"
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="protein">Protein (g)</Label>
                    <Input
                      id="protein"
                      type="number"
                      min="0"
                      step="0.1"
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="carbs">Carbs (g)</Label>
                    <Input
                      id="carbs"
                      type="number"
                      min="0"
                      step="0.1"
                      value={carbs}
                      onChange={(e) => setCarbs(e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fat">Fat (g)</Label>
                    <Input
                      id="fat"
                      type="number"
                      min="0"
                      step="0.1"
                      value={fat}
                      onChange={(e) => setFat(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Plus size={18} className="text-primary mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Your Custom Food</p>
                    <p>
                      This food will only be visible to you. When you search for foods,
                      your custom entries will appear alongside USDA database results.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="p-4 border-t border-border">
              <Button
                className="w-full"
                onClick={handleSave}
                disabled={isSaving || !name.trim()}
              >
                {isSaving ? "Saving..." : "Save Custom Food"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
