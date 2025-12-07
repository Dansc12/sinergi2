import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Utensils, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

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

  const updateFood = (id: string, field: keyof Food, value: string) => {
    setFoods(foods.map(f => f.id === id ? { ...f, [field]: value } : f));
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
                <Input
                  placeholder="Food name"
                  value={food.name}
                  onChange={(e) => updateFood(food.id, "name", e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Calories</Label>
                    <Input
                      placeholder="250"
                      value={food.calories}
                      onChange={(e) => updateFood(food.id, "calories", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Protein (g)</Label>
                    <Input
                      placeholder="20"
                      value={food.protein}
                      onChange={(e) => updateFood(food.id, "protein", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Carbs (g)</Label>
                    <Input
                      placeholder="30"
                      value={food.carbs}
                      onChange={(e) => updateFood(food.id, "carbs", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Fats (g)</Label>
                    <Input
                      placeholder="10"
                      value={food.fats}
                      onChange={(e) => updateFood(food.id, "fats", e.target.value)}
                    />
                  </div>
                </div>
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
