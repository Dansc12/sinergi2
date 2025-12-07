import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Utensils, X, Camera, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { FoodSearchInput, FoodItem } from "@/components/FoodSearchInput";
import { CameraCapture } from "@/components/CameraCapture";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SelectedFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

// Mock recent foods - in production, this would come from the database
const recentFoods: FoodItem[] = [
  { fdcId: 1, description: "Grilled Chicken Breast", calories: 165, protein: 31, carbs: 0, fats: 3.6 },
  { fdcId: 2, description: "Brown Rice, Cooked", calories: 216, protein: 5, carbs: 45, fats: 1.8 },
  { fdcId: 3, description: "Scrambled Eggs", calories: 147, protein: 10, carbs: 2, fats: 11 },
  { fdcId: 4, description: "Greek Yogurt, Plain", calories: 100, protein: 17, carbs: 6, fats: 0.7 },
  { fdcId: 5, description: "Banana, Medium", calories: 105, protein: 1.3, carbs: 27, fats: 0.4 },
];

const CreateMealPage = () => {
  const navigate = useNavigate();
  const [mealType, setMealType] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showFoodsList, setShowFoodsList] = useState(false);

  const handleFoodSelect = (food: FoodItem) => {
    const newFood: SelectedFood = {
      id: Date.now().toString(),
      name: food.description,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
    };
    setSelectedFoods([...selectedFoods, newFood]);
    setSearchValue("");
    toast({ title: "Food added!", description: food.description });
  };

  const removeFood = (id: string) => {
    setSelectedFoods(selectedFoods.filter((f) => f.id !== id));
  };

  const handleCapturePhoto = (imageUrl: string) => {
    setPhotos([...photos, imageUrl]);
    toast({ title: "Photo added!" });
  };

  const handleSelectFromGallery = (imageUrls: string[]) => {
    setPhotos([...photos, ...imageUrls]);
    toast({ title: "Photos added!", description: `${imageUrls.length} photo(s) added.` });
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const totalCalories = selectedFoods.reduce((sum, f) => sum + f.calories, 0);
  const totalProtein = selectedFoods.reduce((sum, f) => sum + f.protein, 0);
  const totalCarbs = selectedFoods.reduce((sum, f) => sum + f.carbs, 0);
  const totalFats = selectedFoods.reduce((sum, f) => sum + f.fats, 0);

  const handleSubmit = () => {
    if (!mealType) {
      toast({ title: "Please select a meal type", variant: "destructive" });
      return;
    }
    if (selectedFoods.length === 0) {
      toast({ title: "Please add at least one food", variant: "destructive" });
      return;
    }
    navigate("/share", {
      state: {
        contentType: "meal",
        contentData: { mealType, foods: selectedFoods, totalCalories, totalProtein, totalCarbs, totalFats },
        images: photos,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background pb-40">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
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
          <Button onClick={handleSubmit} className="rounded-full px-6">
            Finish
          </Button>
        </div>

        {/* Meal Type Selector */}
        <div className="mb-6">
          <Select value={mealType} onValueChange={setMealType}>
            <SelectTrigger className="text-lg font-semibold bg-transparent border-0 border-b border-border rounded-none px-0 focus:ring-0">
              <SelectValue placeholder="Select meal type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="breakfast">Breakfast</SelectItem>
              <SelectItem value="lunch">Lunch</SelectItem>
              <SelectItem value="dinner">Dinner</SelectItem>
              <SelectItem value="snack">Snack</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Food Search */}
        <div className="mb-6">
          <FoodSearchInput
            value={searchValue}
            onChange={setSearchValue}
            onSelect={handleFoodSelect}
            placeholder="Search for a food..."
          />
        </div>

        {/* Recent Foods Section */}
        {searchValue.length < 2 && selectedFoods.length === 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock size={16} />
              <span className="text-sm font-medium">Recent Foods</span>
            </div>
            <div className="space-y-2">
              {recentFoods.map((food) => (
                <motion.button
                  key={food.fdcId}
                  onClick={() => handleFoodSelect(food)}
                  className="w-full text-left p-4 rounded-xl bg-card border border-border hover:bg-muted/50 transition-colors"
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">{food.description}</div>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{food.calories} cal</span>
                        <span>P: {food.protein}g</span>
                        <span>C: {food.carbs}g</span>
                        <span>F: {food.fats}g</span>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-muted-foreground" />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Foods Preview (collapsed) */}
        {selectedFoods.length > 0 && !showFoodsList && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Utensils size={16} />
              <span className="text-sm font-medium">Added Foods ({selectedFoods.length})</span>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-card border border-border">
                <div className="text-muted-foreground">Calories</div>
                <div className="font-bold text-lg text-foreground">{totalCalories}</div>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border">
                <div className="text-muted-foreground">Protein</div>
                <div className="font-bold text-lg text-foreground">{totalProtein.toFixed(0)}g</div>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border">
                <div className="text-muted-foreground">Carbs</div>
                <div className="font-bold text-lg text-foreground">{totalCarbs.toFixed(0)}g</div>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border">
                <div className="text-muted-foreground">Fats</div>
                <div className="font-bold text-lg text-foreground">{totalFats.toFixed(0)}g</div>
              </div>
            </div>

            {/* Recent Foods to add more */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock size={16} />
                <span className="text-sm font-medium">Add More</span>
              </div>
              <div className="space-y-2">
                {recentFoods.slice(0, 3).map((food) => (
                  <motion.button
                    key={food.fdcId}
                    onClick={() => handleFoodSelect(food)}
                    className="w-full text-left p-3 rounded-xl bg-card border border-border hover:bg-muted/50 transition-colors"
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm text-foreground">{food.description}</div>
                        <div className="flex gap-2 mt-0.5 text-xs text-muted-foreground">
                          <span>{food.calories} cal</span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-muted-foreground" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Foods List Modal */}
      <AnimatePresence>
        {showFoodsList && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50"
          >
            <div className="p-4 h-full overflow-y-auto pb-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Selected Foods</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowFoodsList(false)}>
                  <X size={24} />
                </Button>
              </div>

              <div className="space-y-3">
                {selectedFoods.map((food) => (
                  <motion.div
                    key={food.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="p-4 rounded-xl bg-card border border-border"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{food.name}</div>
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{food.calories} cal</span>
                          <span>P: {food.protein}g</span>
                          <span>C: {food.carbs}g</span>
                          <span>F: {food.fats}g</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeFood(food.id)}
                      >
                        <X size={16} className="text-destructive" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
                <div className="text-sm font-medium text-primary mb-2">Total Nutrition</div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div>
                    <div className="text-muted-foreground">Calories</div>
                    <div className="font-bold text-foreground">{totalCalories}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Protein</div>
                    <div className="font-bold text-foreground">{totalProtein.toFixed(0)}g</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Carbs</div>
                    <div className="font-bold text-foreground">{totalCarbs.toFixed(0)}g</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Fats</div>
                    <div className="font-bold text-foreground">{totalFats.toFixed(0)}g</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Preview */}
      {photos.length > 0 && (
        <div className="fixed bottom-36 left-0 right-0 px-4">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
            {photos.map((photo, index) => (
              <div key={index} className="relative flex-shrink-0">
                <img
                  src={photo}
                  alt={`Meal photo ${index + 1}`}
                  className="w-16 h-16 rounded-lg object-cover border border-border"
                />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center"
                >
                  <X size={12} className="text-destructive-foreground" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8 space-y-3">
        {selectedFoods.length > 0 && (
          <Button
            variant="outline"
            size="lg"
            className="w-full gap-2 rounded-xl border-border bg-card hover:bg-muted"
            onClick={() => setShowFoodsList(true)}
          >
            <Utensils size={20} />
            View Foods ({selectedFoods.length})
          </Button>
        )}
        <Button
          variant="outline"
          size="lg"
          className="w-full gap-2 rounded-xl border-border bg-card hover:bg-muted"
          onClick={() => setIsCameraOpen(true)}
        >
          <Camera size={20} />
          Take a Photo {photos.length > 0 && `(${photos.length})`}
        </Button>
      </div>

      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapturePhoto}
        onSelectFromGallery={handleSelectFromGallery}
      />
    </div>
  );
};

export default CreateMealPage;
