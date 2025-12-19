import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Utensils, X, Camera, ChevronRight, Clock, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { FoodSearchInput, FoodItem } from "@/components/FoodSearchInput";
import { FoodDetailModal } from "@/components/FoodDetailModal";
import { AddCustomFoodModal } from "@/components/AddCustomFoodModal";
import { CameraCapture, PhotoChoiceDialog } from "@/components/CameraCapture";
import { usePhotoPicker } from "@/hooks/useCamera";
import PhotoGallerySheet from "@/components/PhotoGallerySheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRecentFoods } from "@/hooks/useRecentFoods";

interface SelectedFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servings?: number;
  servingSize?: string;
  rawQuantity?: number;
  rawUnit?: string;
}

interface RestoredState {
  restored?: boolean;
  contentData?: { mealType?: string; foods?: SelectedFood[] };
  images?: string[];
  preselectedMealType?: string;
}

const CreateMealPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const restoredState = location.state as RestoredState | null;
  
  const [mealType, setMealType] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isChoiceDialogOpen, setIsChoiceDialogOpen] = useState(false);
  const [isPhotoGalleryOpen, setIsPhotoGalleryOpen] = useState(false);
  const [showFoodsList, setShowFoodsList] = useState(false);
  const [pendingFood, setPendingFood] = useState<FoodItem | null>(null);
  const [isFoodDetailOpen, setIsFoodDetailOpen] = useState(false);
  const [isCustomFoodModalOpen, setIsCustomFoodModalOpen] = useState(false);
  const [customFoodInitialName, setCustomFoodInitialName] = useState("");
  const [pendingFoodInitialQuantity, setPendingFoodInitialQuantity] = useState<number | undefined>();
  const [pendingFoodInitialUnit, setPendingFoodInitialUnit] = useState<string | undefined>();

  const { recentFoods, isLoading: isLoadingRecentFoods } = useRecentFoods(10);

  const { inputRef, openPicker, handleFileChange } = usePhotoPicker((urls) => {
    setPhotos([...photos, ...urls]);
    toast({ title: "Photos added!", description: `${urls.length} photo(s) added.` });
  });

  // Restore state if coming back from share screen or preselect meal type
  useEffect(() => {
    if (restoredState?.restored) {
      if (restoredState.contentData?.mealType) setMealType(restoredState.contentData.mealType);
      if (restoredState.contentData?.foods) setSelectedFoods(restoredState.contentData.foods);
      if (restoredState.images) setPhotos(restoredState.images);
      window.history.replaceState({}, document.title);
    } else if (restoredState?.preselectedMealType) {
      setMealType(restoredState.preselectedMealType);
      window.history.replaceState({}, document.title);
    }
  }, []);

  const handleBack = () => {
    navigate("/");
  };

  const handleFoodSelect = (food: FoodItem, initialQuantity?: number, initialUnit?: string) => {
    setPendingFood(food);
    setPendingFoodInitialQuantity(initialQuantity);
    setPendingFoodInitialUnit(initialUnit);
    setIsFoodDetailOpen(true);
  };

  const handleAddCustomFood = (searchTerm: string) => {
    setCustomFoodInitialName(searchTerm);
    setIsCustomFoodModalOpen(true);
  };

  const handleCustomFoodCreated = (food: FoodItem) => {
    // After custom food is created, open detail modal to add it
    setPendingFood(food);
    setIsFoodDetailOpen(true);
    setSearchValue("");
  };

  const handleFoodConfirm = (food: FoodItem, servings: number, servingSize: string) => {
    // Parse quantity and unit from servingSize (format: "50 ml")
    const match = servingSize.match(/^([\d.]+)\s+(.+)$/);
    const rawQuantity = match ? parseFloat(match[1]) : servings;
    const rawUnit = match ? match[2] : "g";
    
    // FoodDetailModal now returns pre-calculated values
    const newFood: SelectedFood = {
      id: Date.now().toString(),
      name: food.description,
      calories: Math.round(food.calories),
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
      servings,
      servingSize,
      rawQuantity,
      rawUnit,
    };
    setSelectedFoods([...selectedFoods, newFood]);
    setSearchValue("");
    setIsFoodDetailOpen(false);
    setPendingFood(null);
    setPendingFoodInitialQuantity(undefined);
    setPendingFoodInitialUnit(undefined);
    toast({ title: "Food added!", description: `${servingSize} of ${food.description}` });
  };

  const handleFoodDetailClose = () => {
    setIsFoodDetailOpen(false);
    setPendingFood(null);
    setPendingFoodInitialQuantity(undefined);
    setPendingFoodInitialUnit(undefined);
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
        returnTo: "/create/meal",
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
            <Button variant="ghost" size="icon" onClick={handleBack}>
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
            onAddCustom={handleAddCustomFood}
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
            {isLoadingRecentFoods ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : recentFoods.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No recent foods yet. Start logging meals!
              </div>
            ) : (
              <div className="space-y-2">
                {recentFoods.map((food, index) => (
                  <motion.button
                    key={`${food.fdcId}-${index}`}
                    onClick={() => handleFoodSelect({
                      fdcId: food.fdcId,
                      description: food.description,
                      calories: food.calories,
                      protein: food.protein,
                      carbs: food.carbs,
                      fats: food.fats,
                    }, food.servings, food.servingSize)}
                    className="w-full text-left p-4 rounded-xl bg-card border border-border hover:bg-muted/50 transition-colors"
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground">{food.description}</div>
                        <div className="text-xs text-primary mt-0.5">
                          {food.servings} × {food.servingSize}
                        </div>
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{food.calories} cal</span>
                          <span>P: {food.protein.toFixed(0)}g</span>
                          <span>C: {food.carbs.toFixed(0)}g</span>
                          <span>F: {food.fats.toFixed(0)}g</span>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-muted-foreground" />
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
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

            {/* Recent Foods to add more - combine session foods with DB foods */}
            {(() => {
              // Combine current session foods (reversed, most recent first) with DB recent foods
              const sessionFoods = [...selectedFoods].reverse().map(f => ({
                fdcId: -parseInt(f.id),
                description: f.name,
                calories: f.calories,
                protein: f.protein,
                carbs: f.carbs,
                fats: f.fats,
                servings: f.rawQuantity || f.servings || 1,
                servingSize: f.rawUnit || "g",
                loggedAt: new Date().toISOString(),
                isSessionFood: true,
              }));
              
              // Filter out duplicates from DB foods that are already in session
              const sessionFoodNames = new Set(sessionFoods.map(f => f.description.toLowerCase()));
              const filteredDbFoods = recentFoods.filter(f => !sessionFoodNames.has(f.description.toLowerCase()));
              
              const combinedFoods = [...sessionFoods, ...filteredDbFoods].slice(0, 5);
              
              if (combinedFoods.length === 0) return null;
              
              return (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock size={16} />
                    <span className="text-sm font-medium">Add More</span>
                  </div>
                  <div className="space-y-2">
                    {combinedFoods.map((food, index) => (
                      <motion.button
                        key={`add-more-${food.fdcId}-${index}`}
                        onClick={() => handleFoodSelect({
                          fdcId: food.fdcId,
                          description: food.description,
                          calories: food.calories,
                          protein: food.protein,
                          carbs: food.carbs,
                          fats: food.fats,
                        }, food.servings, food.servingSize)}
                        className="w-full text-left p-3 rounded-xl bg-card border border-border hover:bg-muted/50 transition-colors"
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm text-foreground">
                              {food.description}
                              {'isSessionFood' in food && food.isSessionFood && (
                                <span className="ml-2 text-xs text-primary">(just added)</span>
                              )}
                            </div>
                            <div className="text-xs text-primary">
                              {food.servings} × {food.servingSize}
                            </div>
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
              );
            })()}
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
                        {food.servings && food.servingSize && (
                          <div className="text-xs text-primary mt-0.5">
                            {food.servings} × {food.servingSize}
                          </div>
                        )}
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{food.calories} cal</span>
                          <span>P: {typeof food.protein === 'number' ? food.protein.toFixed(0) : food.protein}g</span>
                          <span>C: {typeof food.carbs === 'number' ? food.carbs.toFixed(0) : food.carbs}g</span>
                          <span>F: {typeof food.fats === 'number' ? food.fats.toFixed(0) : food.fats}g</span>
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="lg"
            className="flex-[4] gap-2 rounded-xl border-border bg-card hover:bg-muted"
            onClick={() => setIsChoiceDialogOpen(true)}
          >
            <Camera size={20} />
            Take a Photo
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="flex-1 gap-1 rounded-xl border-border bg-card hover:bg-muted"
            onClick={() => setIsPhotoGalleryOpen(true)}
            disabled={photos.length === 0}
          >
            <Images size={20} />
            {photos.length > 0 && <span className="text-sm">{photos.length}</span>}
          </Button>
        </div>
      </div>

      {/* Hidden file input for gallery */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Photo Choice Dialog */}
      <PhotoChoiceDialog
        isOpen={isChoiceDialogOpen}
        onClose={() => setIsChoiceDialogOpen(false)}
        onChooseCamera={() => {
          setIsChoiceDialogOpen(false);
          setIsCameraOpen(true);
        }}
        onChooseGallery={() => {
          setIsChoiceDialogOpen(false);
          openPicker();
        }}
      />

      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapturePhoto}
        onSelectFromGallery={handleSelectFromGallery}
      />

      {/* Food Detail Modal */}
      <FoodDetailModal
        isOpen={isFoodDetailOpen}
        food={pendingFood}
        onClose={handleFoodDetailClose}
        onConfirm={handleFoodConfirm}
        initialQuantity={pendingFoodInitialQuantity}
        initialUnit={pendingFoodInitialUnit}
      />

      {/* Photo Gallery Sheet */}
      <PhotoGallerySheet
        isOpen={isPhotoGalleryOpen}
        onClose={() => setIsPhotoGalleryOpen(false)}
        photos={photos}
        onDeletePhoto={removePhoto}
      />

      {/* Add Custom Food Modal */}
      <AddCustomFoodModal
        isOpen={isCustomFoodModalOpen}
        onClose={() => setIsCustomFoodModalOpen(false)}
        onSuccess={handleCustomFoodCreated}
        initialName={customFoodInitialName}
      />
    </div>
  );
};

export default CreateMealPage;
