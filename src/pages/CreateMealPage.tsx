import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Utensils, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { FoodSearchInput, FoodItem } from "@/components/FoodSearchInput";

interface Food {
  id: string;
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
}

const CreateMealPage = () => {
  const navigate = useNavigate();
  const [mealType, setMealType] = useState("");
  const [foods, setFoods] = useState<Food[]>([
    { id: "1", name: "", calories: "", protein: "", carbs: "", fats: "" }
  ]);

  const addFood = () => {
    setFoods([...foods, { id: Date.now().toString(), name: "", calories: "", protein: "", carbs: "", fats: "" }]);
  };

  const removeFood = (id: string) => {
    if (foods.length > 1) {
      setFoods(foods.filter(f => f.id !== id));
    }
  };

  const updateFoodName = (id: string, value: string) => {
    setFoods(foods.map(f => f.id === id ? { ...f, name: value } : f));
  };

  const handleFoodSelect = (id: string, food: FoodItem) => {
    setFoods(foods.map(f => f.id === id ? {
      ...f,
      name: food.description,
      calories: food.calories.toString(),
      protein: food.protein.toString(),
      carbs: food.carbs.toString(),
      fats: food.fats.toString(),
    } : f));
  };

  const handleSubmit = () => {
    if (!mealType) {
      toast({ title: "Please select a meal type", variant: "destructive" });
      return;
    }
    toast({ title: "Meal logged!", description: "Your meal has been tracked." });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success to-emerald-400 flex items-center justify-center">
              <Utensils size={20} className="text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Log Meal</h1>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Meal Type</Label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger>
                <SelectValue placeholder="Select meal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label>Foods</Label>
            {foods.map((food, index) => (
              <motion.div
                key={food.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 rounded-2xl bg-card border border-border space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Food {index + 1}</span>
                  {foods.length > 1 && (
                    <Button variant="ghost" size="icon-sm" onClick={() => removeFood(food.id)}>
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                  )}
                </div>
                <FoodSearchInput
                  value={food.name}
                  onChange={(value) => updateFoodName(food.id, value)}
                  onSelect={(selectedFood) => handleFoodSelect(food.id, selectedFood)}
                  placeholder="Search for a food..."
                />
                {food.calories && (
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-accent/30">
                      <div className="text-muted-foreground">Calories</div>
                      <div className="font-semibold text-foreground">{food.calories}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-accent/30">
                      <div className="text-muted-foreground">Protein</div>
                      <div className="font-semibold text-foreground">{food.protein}g</div>
                    </div>
                    <div className="p-2 rounded-lg bg-accent/30">
                      <div className="text-muted-foreground">Carbs</div>
                      <div className="font-semibold text-foreground">{food.carbs}g</div>
                    </div>
                    <div className="p-2 rounded-lg bg-accent/30">
                      <div className="text-muted-foreground">Fats</div>
                      <div className="font-semibold text-foreground">{food.fats}g</div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
            <Button variant="outline" className="w-full" onClick={addFood}>
              <Plus size={18} /> Add Food
            </Button>
          </div>

          <Button className="w-full" size="lg" onClick={handleSubmit}>
            Save Meal
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateMealPage;
