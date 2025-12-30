import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Utensils, X, Camera, ChevronRight, Clock, Images, Loader2, ChefHat, Compass, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { FoodSearchInput, FoodItem, SavedMealFood } from "@/components/FoodSearchInput";
import { FoodDetailModal } from "@/components/FoodDetailModal";
import { SavedMealExpansionModal } from "@/components/SavedMealExpansionModal";
import { AddCustomFoodModal } from "@/components/AddCustomFoodModal";
import { CameraCapture, PhotoChoiceDialog } from "@/components/CameraCapture";
import { usePhotoPicker } from "@/hooks/useCamera";
import PhotoGallerySheet from "@/components/PhotoGallerySheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRecentFoods } from "@/hooks/useRecentFoods";
import { usePosts } from "@/hooks/usePosts";
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
  // Grouping info for saved meals/recipes
  savedMealGroupId?: string;
  savedMealName?: string;
  savedMealCoverPhoto?: string;
}

interface RestoredState {
  restored?: boolean;
  contentData?: { mealType?: string; foods?: SelectedFood[] };
  images?: string[];
  preselectedMealType?: string;
  // From MyRecipesPage or DiscoverMealsPage
  selectedRecipe?: {
    ingredients: {
      id: string;
      name: string;
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
      servings: number;
      servingSize: string;
    }[];
  };
}

const CreateMealPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const restoredState = location.state as RestoredState | null;
  const { createPost } = usePosts();
  
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [showSaveAsMealDialog, setShowSaveAsMealDialog] = useState(false);
  
  // For saved meal expansion modal
  const [isSavedMealExpansionOpen, setIsSavedMealExpansionOpen] = useState(false);
  const [savedMealFoods, setSavedMealFoods] = useState<SavedMealFood[]>([]);
  const [savedMealName, setSavedMealName] = useState("");
  const [savedMealCoverPhoto, setSavedMealCoverPhoto] = useState<string | undefined>();

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
    if (selectedFoods.length > 0) {
      setShowBackConfirm(true);
    } else {
      navigate("/");
    }
  };

  const confirmBack = () => {
    setShowBackConfirm(false);
    navigate("/");
  };

  const handleFoodSelect = (food: FoodItem, initialQuantity?: number, initialUnit?: string) => {
    // If it's a saved meal or recipe, open the expansion modal to review all foods at once
    if ((food.isSavedMeal || food.isRecipe) && food.savedMealFoods && food.savedMealFoods.length > 0) {
      setSavedMealName(food.description);
      setSavedMealFoods(food.savedMealFoods);
      setSavedMealCoverPhoto(food.savedMealCoverPhoto);
      setIsSavedMealExpansionOpen(true);
      setSearchValue("");
      return;
    }
    
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
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
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
    setSelectedFoods(prev => [...prev, newFood]);
    
    setSearchValue("");
    setIsFoodDetailOpen(false);
    setPendingFood(null);
    setPendingFoodInitialQuantity(undefined);
    setPendingFoodInitialUnit(undefined);
    toast({ title: "Food added!", description: `${servingSize} of ${food.description}` });
  };

  // Handle saved meal expansion confirmation
  const handleSavedMealConfirm = (expandedFoods: Array<{
    id: string;
    name: string;
    adjustedQuantity: number;
    adjustedUnit: string;
    adjustedCalories: number;
    adjustedProtein: number;
    adjustedCarbs: number;
    adjustedFats: number;
  }>) => {
    // Generate a unique group ID for this saved meal
    const groupId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const mealName = savedMealName;
    const coverPhoto = savedMealCoverPhoto;
    
    const newFoods: SelectedFood[] = expandedFoods.map((food) => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: food.name,
      calories: food.adjustedCalories,
      protein: food.adjustedProtein,
      carbs: food.adjustedCarbs,
      fats: food.adjustedFats,
      servings: food.adjustedQuantity,
      servingSize: `${food.adjustedQuantity} ${food.adjustedUnit}`,
      rawQuantity: food.adjustedQuantity,
      rawUnit: food.adjustedUnit,
      savedMealGroupId: groupId,
      savedMealName: mealName,
      savedMealCoverPhoto: coverPhoto,
    }));
    
    setSelectedFoods(prev => [...prev, ...newFoods]);
    setIsSavedMealExpansionOpen(false);
    setSavedMealFoods([]);
    setSavedMealName("");
    setSavedMealCoverPhoto(undefined);
    toast({ 
      title: `"${mealName}" added!`, 
      description: `${expandedFoods.length} foods have been added` 
    });
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

  // Check if the meal contains a saved meal group (shareable) or just individual foods
  const hasSavedMealGroup = selectedFoods.some(food => food.savedMealGroupId);

  const handleSubmit = async () => {
    if (!mealType) {
      toast({ title: "Please select a meal type", variant: "destructive" });
      return;
    }
    if (selectedFoods.length === 0) {
      toast({ title: "Please add at least one food", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createPost({
        content_type: "meal",
        content_data: { mealType, foods: selectedFoods, totalCalories, totalProtein, totalCarbs, totalFats },
        images: photos,
        visibility: "private",
      });

      // Navigate home and show congrats popup
      // Only show share option in popup if the meal contains a saved meal group
      navigate("/", {
        state: {
          showCongrats: true,
          contentType: "meal",
          contentData: { mealType, foods: selectedFoods, totalCalories, totalProtein, totalCarbs, totalFats },
          images: photos,
          canShare: hasSavedMealGroup,
        },
      });
    } catch (error) {
      console.error("Error saving meal:", error);
      toast({ title: "Error", description: "Failed to save meal. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for when user wants to share but doesn't have a saved meal
  const handleShareAttempt = () => {
    if (!hasSavedMealGroup) {
      setShowSaveAsMealDialog(true);
    }
  };

  // Navigate to create saved meal with current foods
  const handleSaveAsMeal = () => {
    setShowSaveAsMealDialog(false);
    navigate('/create/saved-meal', {
      state: {
        foods: selectedFoods,
        mealType,
        photos,
      },
    });
  };

  // Navigation handlers for My Recipes and Discover pages
  const handleNavigateToMyRecipes = () => {
    navigate("/meal/my-recipes", {
      state: {
        returnTo: "/create/meal",
        currentFoods: selectedFoods,
        mealType,
        photos,
      },
    });
  };

  const handleNavigateToDiscover = () => {
    navigate("/meal/discover", {
      state: {
        returnTo: "/create/meal",
        currentFoods: selectedFoods,
        mealType,
        photos,
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
          <div className="w-20">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft size={24} />
            </Button>
          </div>
          
          {/* Centered Meal Type Selector */}
          <div className="flex-1 flex justify-center">
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger className="w-auto min-w-[160px] text-xl font-bold bg-transparent border-0 ring-0 focus:ring-0 focus:ring-offset-0 outline-none justify-center gap-2">
                <SelectValue placeholder="Select Meal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-20 flex justify-end">
            <Button onClick={handleSubmit} disabled={isSubmitting} className="rounded-full px-6">
              {isSubmitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Finish
            </Button>
          </div>
        </div>

        {/* Food Search */}
        <div className="mb-4">
          <FoodSearchInput
            value={searchValue}
            onChange={setSearchValue}
            onSelect={handleFoodSelect}
            onAddCustom={handleAddCustomFood}
            placeholder="Search for a food..."
          />
        </div>

        {/* My Saved & Discover Buttons */}
        <div className="flex gap-3 mb-6">
          <Button
            variant="outline"
            className="flex-1 gap-2 h-12 rounded-xl border-border bg-card hover:bg-muted hover:border-primary/30 transition-colors"
            onClick={handleNavigateToMyRecipes}
          >
            <ChefHat size={18} className="text-primary" />
            <span>My Saved</span>
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2 h-12 rounded-xl border-border bg-card hover:bg-muted hover:border-primary/30 transition-colors"
            onClick={handleNavigateToDiscover}
          >
            <Compass size={18} className="text-primary" />
            <span>Discover</span>
          </Button>
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
                    className="w-full text-left rounded-xl bg-card border border-border hover:bg-muted/50 transition-colors relative overflow-hidden"
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Macro gradient bar at top */}
                    {(() => {
                      const total = food.protein + food.carbs + food.fats;
                      if (total === 0) return null;
                      const pPct = (food.protein / total) * 100;
                      const cPct = (food.carbs / total) * 100;
                      return (
                        <div 
                          className="absolute left-0 right-0 top-0 h-1"
                          style={{
                            background: `linear-gradient(90deg, #3DD6C6 0%, #3DD6C6 ${pPct * 0.7}%, #5B8CFF ${pPct + cPct * 0.3}%, #5B8CFF ${pPct + cPct * 0.7}%, #B46BFF ${pPct + cPct + (100 - pPct - cPct) * 0.3}%, #B46BFF 100%)`,
                          }}
                        />
                      );
                    })()}
                    <div className="flex items-center justify-between p-4 pt-5">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-primary">
                            {(() => {
                              const servings = food.servings ?? 1;
                              const servingSize = food.servingSize || 'g';
                              const hasNumber = /\d/.test(servingSize);
                              if (hasNumber) return servings > 1 ? `${servings} × ${servingSize}` : servingSize;
                              return `${servings}${servingSize}`;
                            })()}
                          </span>
                          <span className="font-medium text-foreground">{food.description}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-foreground">{food.calories} cal</span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span style={{ color: '#3DD6C6' }}>P: {food.protein.toFixed(0)}g</span>
                            <span style={{ color: '#5B8CFF' }}>C: {food.carbs.toFixed(0)}g</span>
                            <span style={{ color: '#B46BFF' }}>F: {food.fats.toFixed(0)}g</span>
                          </div>
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

        {/* Recent Foods to add more when foods are selected */}
        {selectedFoods.length > 0 && !showFoodsList && (() => {
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
            <div className="space-y-4">
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
                    className="w-full text-left rounded-xl bg-card border border-border hover:bg-muted/50 transition-colors relative overflow-hidden"
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Macro gradient bar at top */}
                    {(() => {
                      const total = food.protein + food.carbs + food.fats;
                      if (total === 0) return null;
                      const pPct = (food.protein / total) * 100;
                      const cPct = (food.carbs / total) * 100;
                      return (
                        <div 
                          className="absolute left-0 right-0 top-0 h-1"
                          style={{
                            background: `linear-gradient(90deg, #3DD6C6 0%, #3DD6C6 ${pPct * 0.7}%, #5B8CFF ${pPct + cPct * 0.3}%, #5B8CFF ${pPct + cPct * 0.7}%, #B46BFF ${pPct + cPct + (100 - pPct - cPct) * 0.3}%, #B46BFF 100%)`,
                          }}
                        />
                      );
                    })()}
                    <div className="flex items-center justify-between p-3 pt-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-primary">
                            {(() => {
                              const servings = food.servings ?? 1;
                              const servingSize = food.servingSize || 'g';
                              const hasNumber = /\d/.test(servingSize);
                              if (hasNumber) return servings > 1 ? `${servings} × ${servingSize}` : servingSize;
                              return `${servings}${servingSize}`;
                            })()}
                          </span>
                          <span className="font-medium text-sm text-foreground">
                            {food.description}
                            {'isSessionFood' in food && food.isSessionFood && (
                              <span className="ml-2 text-xs text-primary">(just added)</span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-foreground">{food.calories} cal</span>
                          <div className="flex items-center gap-2 text-xs">
                            <span style={{ color: '#3DD6C6' }}>P: {food.protein.toFixed(0)}g</span>
                            <span style={{ color: '#5B8CFF' }}>C: {food.carbs.toFixed(0)}g</span>
                            <span style={{ color: '#B46BFF' }}>F: {food.fats.toFixed(0)}g</span>
                          </div>
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

              {/* Total Nutrition + Create Buttons Row */}
              {(() => {
                const totalMacros = totalProtein + totalCarbs + totalFats;
                
                // Calculate ratios with minimum presence for visual consistency
                const proteinRatio = totalMacros > 0 ? Math.max((totalProtein / totalMacros), 0.08) : 0.33;
                const carbsRatio = totalMacros > 0 ? Math.max((totalCarbs / totalMacros), 0.08) : 0.33;
                const fatsRatio = totalMacros > 0 ? Math.max((totalFats / totalMacros), 0.08) : 0.33;
                
                // Normalize ratios
                const totalRatio = proteinRatio + carbsRatio + fatsRatio;
                const normalizedProtein = proteinRatio / totalRatio;
                const normalizedCarbs = carbsRatio / totalRatio;
                const normalizedFats = fatsRatio / totalRatio;
                
                // Macro colors
                const proteinColor = '#3DD6C6';
                const carbsColor = '#5B8CFF';
                const fatsColor = '#B46BFF';
                
                // Calculate blob sizes (40-90px based on ratio)
                const proteinSize = 40 + normalizedProtein * 50;
                const carbsSize = 40 + normalizedCarbs * 50;
                const fatsSize = 40 + normalizedFats * 50;
                
                // Calculate opacities (0.6 minimum, up to 1.0 for very bright colors)
                const proteinOpacity = totalMacros > 0 ? 0.6 + (totalProtein / totalMacros) * 0.4 : 0.75;
                const carbsOpacity = totalMacros > 0 ? 0.6 + (totalCarbs / totalMacros) * 0.4 : 0.75;
                const fatsOpacity = totalMacros > 0 ? 0.6 + (totalFats / totalMacros) * 0.4 : 0.75;
                
                return (
                  <div className="relative mb-6 rounded-[18px] overflow-hidden shadow-lg shadow-black/30">
                    {/* Liquid blob background */}
                    <div className="absolute inset-0 bg-card">
                      {/* Protein blob */}
                      <motion.div
                        className="absolute rounded-full blur-2xl"
                        style={{
                          width: `${proteinSize}%`,
                          height: `${proteinSize}%`,
                          background: `radial-gradient(circle, ${proteinColor} 0%, transparent 70%)`,
                          opacity: proteinOpacity,
                          left: '5%',
                          top: '10%',
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
                        className="absolute rounded-full blur-2xl"
                        style={{
                          width: `${carbsSize}%`,
                          height: `${carbsSize}%`,
                          background: `radial-gradient(circle, ${carbsColor} 0%, transparent 70%)`,
                          opacity: carbsOpacity,
                          right: '10%',
                          top: '5%',
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
                        className="absolute rounded-full blur-2xl"
                        style={{
                          width: `${fatsSize}%`,
                          height: `${fatsSize}%`,
                          background: `radial-gradient(circle, ${fatsColor} 0%, transparent 70%)`,
                          opacity: fatsOpacity,
                          left: '30%',
                          bottom: '-10%',
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
                    
                    {/* Frosted glass overlay with subtle side vignette */}
                    <div 
                      className="absolute inset-0 backdrop-blur-[2px]"
                      style={{
                        background: `linear-gradient(90deg, 
                          rgba(0, 0, 0, 0.08) 0%, 
                          rgba(0, 0, 0, 0) 12%, 
                          rgba(0, 0, 0, 0) 88%, 
                          rgba(0, 0, 0, 0.08) 100%)`,
                        boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.12)',
                      }}
                    />
                    
                    {/* Border overlay */}
                    <div 
                      className="absolute inset-0 rounded-[18px] pointer-events-none"
                      style={{
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    />
                    
                    {/* Content */}
                    <div className="relative z-10 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Total Nutrition label */}
                          <div className="text-xs font-medium text-white/50 uppercase tracking-wide mb-3">
                            Total Nutrition
                          </div>
                          
                          {/* Calories - Primary emphasis */}
                          <div className="flex items-baseline gap-1.5 mb-4">
                            <span className="text-3xl font-bold text-white tracking-tight">{totalCalories}</span>
                            <span className="text-lg font-medium text-white/80">Calories</span>
                          </div>
                          
                          {/* Macros Row - 3 columns */}
                          <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col">
                              <div 
                                className="text-[11px] font-medium uppercase tracking-wide mb-0.5"
                                style={{ color: proteinColor, opacity: 0.8 }}
                              >
                                Protein
                              </div>
                              <div className="text-base font-semibold text-white">{totalProtein.toFixed(0)}g</div>
                            </div>
                            <div className="flex flex-col">
                              <div 
                                className="text-[11px] font-medium uppercase tracking-wide mb-0.5"
                                style={{ color: carbsColor, opacity: 0.8 }}
                              >
                                Carbs
                              </div>
                              <div className="text-base font-semibold text-white">{totalCarbs.toFixed(0)}g</div>
                            </div>
                            <div className="flex flex-col">
                              <div 
                                className="text-[11px] font-medium uppercase tracking-wide mb-0.5"
                                style={{ color: fatsColor, opacity: 0.8 }}
                              >
                                Fats
                              </div>
                              <div className="text-base font-semibold text-white">{totalFats.toFixed(0)}g</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Frosted buttons */}
                        <div className="flex flex-col gap-2">
                          <motion.button
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/90 transition-all"
                            style={{
                              background: 'rgba(255, 255, 255, 0.12)',
                              border: '1px solid rgba(255, 255, 255, 0.10)',
                            }}
                            whileHover={{
                              background: 'rgba(255, 255, 255, 0.18)',
                              boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
                            }}
                          whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              setShowFoodsList(false);
                              navigate('/create/saved-meal', {
                                state: {
                                  foods: selectedFoods,
                                  mealType,
                                  photos,
                                },
                              });
                            }}
                          >
                            <Plus size={14} />
                            Create Meal
                          </motion.button>
                          <motion.button
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/90 transition-all"
                            style={{
                              background: 'rgba(255, 255, 255, 0.12)',
                              border: '1px solid rgba(255, 255, 255, 0.10)',
                            }}
                            whileHover={{
                              background: 'rgba(255, 255, 255, 0.18)',
                              boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
                            }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/create/recipe')}
                          >
                            <ChefHat size={14} />
                            Create Recipe
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Group foods by savedMealGroupId */}
              {(() => {
                // Separate foods into groups and ungrouped
                const groups: Record<string, SelectedFood[]> = {};
                const ungroupedFoods: SelectedFood[] = [];
                
                selectedFoods.forEach((food) => {
                  if (food.savedMealGroupId) {
                    if (!groups[food.savedMealGroupId]) {
                      groups[food.savedMealGroupId] = [];
                    }
                    groups[food.savedMealGroupId].push(food);
                  } else {
                    ungroupedFoods.push(food);
                  }
                });
                
                // Render helper for individual food items
                const renderFoodItem = (food: SelectedFood, showRemove = true) => {
                  const p = typeof food.protein === 'number' ? food.protein : 0;
                  const c = typeof food.carbs === 'number' ? food.carbs : 0;
                  const f = typeof food.fats === 'number' ? food.fats : 0;
                  const total = p + c + f;
                  const pPct = total > 0 ? (p / total) * 100 : 0;
                  const cPct = total > 0 ? (c / total) * 100 : 0;
                  
                  return (
                    <motion.div
                      key={food.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="rounded-xl bg-muted/30 border border-border/50 relative overflow-hidden"
                    >
                      {total > 0 && (
                        <div 
                          className="absolute left-0 right-0 top-0 h-1"
                          style={{
                            background: `linear-gradient(90deg, #3DD6C6 0%, #3DD6C6 ${pPct * 0.7}%, #5B8CFF ${pPct + cPct * 0.3}%, #5B8CFF ${pPct + cPct * 0.7}%, #B46BFF ${pPct + cPct + (100 - pPct - cPct) * 0.3}%, #B46BFF 100%)`,
                          }}
                        />
                      )}
                      <div className="flex items-start justify-between p-3 pt-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {food.servingSize && (
                              <span className="text-sm font-semibold text-primary">
                                {(() => {
                                  const servings = food.servings ?? 1;
                                  const servingSize = food.servingSize;
                                  const hasNumber = /\d/.test(servingSize);

                                  if (hasNumber) {
                                    const leadingMatch = servingSize.trim().match(/^(\d+(?:\.\d+)?)/);
                                    const leadingNumber = leadingMatch ? Number(leadingMatch[1]) : NaN;
                                    if (!Number.isNaN(leadingNumber) && Math.abs(servings - leadingNumber) < 1e-6) {
                                      return servingSize;
                                    }
                                    return servings > 1 ? `${servings} × ${servingSize}` : servingSize;
                                  }
                                  return `${servings}${servingSize}`;
                                })()}
                              </span>
                            )}
                            <span className="font-medium text-sm text-foreground">{food.name}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-foreground">{food.calories} cal</span>
                            <div className="flex items-center gap-2 text-xs">
                              <span style={{ color: '#3DD6C6' }}>P: {p.toFixed(0)}g</span>
                              <span style={{ color: '#5B8CFF' }}>C: {c.toFixed(0)}g</span>
                              <span style={{ color: '#B46BFF' }}>F: {f.toFixed(0)}g</span>
                            </div>
                          </div>
                        </div>
                        {showRemove && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeFood(food.id)}
                          >
                            <X size={14} className="text-destructive" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                };
                
                // Render grouped meals first, then ungrouped foods
                return (
                  <div className="space-y-3">
                    {/* Grouped foods (Saved Meals / Recipes) */}
                    {Object.entries(groups).map(([groupId, foods]) => {
                      const mealName = foods[0]?.savedMealName || 'Saved Meal';
                      const coverPhoto = foods[0]?.savedMealCoverPhoto;
                      const groupCalories = foods.reduce((sum, f) => sum + f.calories, 0);
                      const groupProtein = foods.reduce((sum, f) => sum + f.protein, 0);
                      const groupCarbs = foods.reduce((sum, f) => sum + f.carbs, 0);
                      const groupFats = foods.reduce((sum, f) => sum + f.fats, 0);
                      
                      const removeGroup = () => {
                        const foodIds = foods.map(f => f.id);
                        setSelectedFoods(prev => prev.filter(f => !foodIds.includes(f.id)));
                      };
                      
                      // Calculate macro percentages for the group colorbar
                      const groupTotal = groupProtein + groupCarbs + groupFats;
                      const groupPPct = groupTotal > 0 ? (groupProtein / groupTotal) * 100 : 0;
                      const groupCPct = groupTotal > 0 ? (groupCarbs / groupTotal) * 100 : 0;
                      
                      return (
                        <motion.div
                          key={groupId}
                          layout
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl bg-card border border-border overflow-hidden relative"
                        >
                          {/* Macro colorbar at top */}
                          {groupTotal > 0 && (
                            <div 
                              className="absolute left-0 right-0 top-0 h-1"
                              style={{
                                background: `linear-gradient(90deg, #3DD6C6 0%, #3DD6C6 ${groupPPct * 0.7}%, #5B8CFF ${groupPPct + groupCPct * 0.3}%, #5B8CFF ${groupPPct + groupCPct * 0.7}%, #B46BFF ${groupPPct + groupCPct + (100 - groupPPct - groupCPct) * 0.3}%, #B46BFF 100%)`,
                              }}
                            />
                          )}
                          
                          {/* Header with circular cover photo and name */}
                          <div className="flex items-center justify-between p-3 pt-4 border-b border-border/50">
                            <div className="flex items-center gap-3">
                              {/* Circular cover photo */}
                              <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden bg-primary/20">
                                {coverPhoto ? (
                                  <img 
                                    src={coverPhoto} 
                                    alt={mealName}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center">
                                    <Utensils size={18} className="text-primary" />
                                  </div>
                                )}
                              </div>
                              {/* Name and macros */}
                              <div>
                                <h4 className="font-bold text-foreground">{mealName}</h4>
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-foreground font-medium">{Math.round(groupCalories)} cal</span>
                                  <span style={{ color: '#3DD6C6' }}>P: {Math.round(groupProtein)}g</span>
                                  <span style={{ color: '#5B8CFF' }}>C: {Math.round(groupCarbs)}g</span>
                                  <span style={{ color: '#B46BFF' }}>F: {Math.round(groupFats)}g</span>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={removeGroup}
                            >
                              <X size={16} />
                            </Button>
                          </div>
                          
                          {/* Individual foods */}
                          <div className="p-2 space-y-2">
                            {foods.map((food) => renderFoodItem(food, false))}
                          </div>
                        </motion.div>
                      );
                    })}
                    
                    {/* Ungrouped foods */}
                    {ungroupedFoods.map((food) => {
                      const p = typeof food.protein === 'number' ? food.protein : 0;
                      const c = typeof food.carbs === 'number' ? food.carbs : 0;
                      const f = typeof food.fats === 'number' ? food.fats : 0;
                      const total = p + c + f;
                      const pPct = total > 0 ? (p / total) * 100 : 0;
                      const cPct = total > 0 ? (c / total) * 100 : 0;
                      
                      return (
                        <motion.div
                          key={food.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          className="rounded-xl bg-card border border-border relative overflow-hidden"
                        >
                          {total > 0 && (
                            <div 
                              className="absolute left-0 right-0 top-0 h-1"
                              style={{
                                background: `linear-gradient(90deg, #3DD6C6 0%, #3DD6C6 ${pPct * 0.7}%, #5B8CFF ${pPct + cPct * 0.3}%, #5B8CFF ${pPct + cPct * 0.7}%, #B46BFF ${pPct + cPct + (100 - pPct - cPct) * 0.3}%, #B46BFF 100%)`,
                              }}
                            />
                          )}
                          <div className="flex items-start justify-between p-4 pt-5">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {food.servingSize && (
                                  <span className="text-sm font-semibold text-primary">
                                    {(() => {
                                      const servings = food.servings ?? 1;
                                      const servingSize = food.servingSize;
                                      const hasNumber = /\d/.test(servingSize);

                                      if (hasNumber) {
                                        const leadingMatch = servingSize.trim().match(/^(\d+(?:\.\d+)?)/);
                                        const leadingNumber = leadingMatch ? Number(leadingMatch[1]) : NaN;
                                        if (!Number.isNaN(leadingNumber) && Math.abs(servings - leadingNumber) < 1e-6) {
                                          return servingSize;
                                        }
                                        return servings > 1 ? `${servings} × ${servingSize}` : servingSize;
                                      }
                                      return `${servings}${servingSize}`;
                                    })()}
                                  </span>
                                )}
                                <span className="font-medium text-foreground">{food.name}</span>
                              </div>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-xs text-foreground">{food.calories} cal</span>
                                <div className="flex items-center gap-2 text-xs">
                                  <span style={{ color: '#3DD6C6' }}>P: {p.toFixed(0)}g</span>
                                  <span style={{ color: '#5B8CFF' }}>C: {c.toFixed(0)}g</span>
                                  <span style={{ color: '#B46BFF' }}>F: {f.toFixed(0)}g</span>
                                </div>
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
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Foods Button - Fixed at bottom when foods are selected */}
      {selectedFoods.length > 0 && !showFoodsList && (() => {
        const totalMacros = totalProtein + totalCarbs + totalFats;
        
        // Calculate ratios with minimum presence for visual consistency
        const proteinRatio = totalMacros > 0 ? Math.max((totalProtein / totalMacros), 0.08) : 0.33;
        const carbsRatio = totalMacros > 0 ? Math.max((totalCarbs / totalMacros), 0.08) : 0.33;
        const fatsRatio = totalMacros > 0 ? Math.max((totalFats / totalMacros), 0.08) : 0.33;
        
        // Normalize ratios
        const totalRatio = proteinRatio + carbsRatio + fatsRatio;
        const normalizedProtein = proteinRatio / totalRatio;
        const normalizedCarbs = carbsRatio / totalRatio;
        const normalizedFats = fatsRatio / totalRatio;
        
        // Macro colors
        const proteinColor = '#3DD6C6';
        const carbsColor = '#5B8CFF';
        const fatsColor = '#B46BFF';
        
        // Calculate blob sizes (40-90px based on ratio)
        const proteinSize = 40 + normalizedProtein * 50;
        const carbsSize = 40 + normalizedCarbs * 50;
        const fatsSize = 40 + normalizedFats * 50;
        
        // Calculate opacities (0.6 minimum, up to 1.0 for very bright colors)
        const proteinOpacity = totalMacros > 0 ? 0.6 + (totalProtein / totalMacros) * 0.4 : 0.75;
        const carbsOpacity = totalMacros > 0 ? 0.6 + (totalCarbs / totalMacros) * 0.4 : 0.75;
        const fatsOpacity = totalMacros > 0 ? 0.6 + (totalFats / totalMacros) * 0.4 : 0.75;
        
        return (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border">
            <button
              onClick={() => setShowFoodsList(true)}
              className="relative w-full h-14 rounded-xl overflow-hidden shadow-lg shadow-black/30"
            >
              {/* Liquid blob background */}
              <div className="absolute inset-0 bg-card">
                {/* Protein blob */}
                <motion.div
                  className="absolute rounded-full blur-2xl"
                  style={{
                    width: `${proteinSize}%`,
                    height: `${proteinSize * 2}%`,
                    background: `radial-gradient(circle, ${proteinColor} 0%, transparent 70%)`,
                    opacity: proteinOpacity,
                    left: '5%',
                    top: '-20%',
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
                  className="absolute rounded-full blur-2xl"
                  style={{
                    width: `${carbsSize}%`,
                    height: `${carbsSize * 2}%`,
                    background: `radial-gradient(circle, ${carbsColor} 0%, transparent 70%)`,
                    opacity: carbsOpacity,
                    right: '10%',
                    top: '-30%',
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
                  className="absolute rounded-full blur-2xl"
                  style={{
                    width: `${fatsSize}%`,
                    height: `${fatsSize * 2}%`,
                    background: `radial-gradient(circle, ${fatsColor} 0%, transparent 70%)`,
                    opacity: fatsOpacity,
                    left: '30%',
                    bottom: '-50%',
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
              
              {/* Frosted glass overlay with subtle side vignette */}
              <div 
                className="absolute inset-0 backdrop-blur-[2px]"
                style={{
                  background: `linear-gradient(90deg, 
                    rgba(0, 0, 0, 0.08) 0%, 
                    rgba(0, 0, 0, 0) 12%, 
                    rgba(0, 0, 0, 0) 88%, 
                    rgba(0, 0, 0, 0.08) 100%)`,
                  boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.12)',
                }}
              />
              
              {/* Border overlay */}
              <div 
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              />
              
              {/* Content */}
              <div className="relative z-10 flex items-center h-full px-4">
                {/* Left: Icon + Count */}
                <div className="flex items-center gap-2 text-white">
                  <Utensils size={20} />
                  <span className="font-semibold">{selectedFoods.length}</span>
                </div>
                
                {/* Center: Macros (absolutely positioned for true centering) */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 text-sm">
                  <span style={{ color: proteinColor }}>P {totalProtein.toFixed(0)}g</span>
                  <span style={{ color: carbsColor }}>C {totalCarbs.toFixed(0)}g</span>
                  <span style={{ color: fatsColor }}>F {totalFats.toFixed(0)}g</span>
                </div>
                
                {/* Right: Calories */}
                <div className="ml-auto text-sm text-white">
                  <span>{totalCalories} cal</span>
                </div>
              </div>
            </button>
          </div>
        );
      })()}

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

      {/* Saved Meal Expansion Modal */}
      <SavedMealExpansionModal
        isOpen={isSavedMealExpansionOpen}
        mealName={savedMealName}
        foods={savedMealFoods}
        onClose={() => {
          setIsSavedMealExpansionOpen(false);
          setSavedMealFoods([]);
          setSavedMealName("");
        }}
        onConfirm={handleSavedMealConfirm}
      />

      {/* Back Confirmation Dialog */}
      <AlertDialog open={showBackConfirm} onOpenChange={setShowBackConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your added foods will be deleted if you go back. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBack} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save as Meal Dialog */}
      <Dialog open={showSaveAsMealDialog} onOpenChange={setShowSaveAsMealDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Save as a Meal to Share</DialogTitle>
            <DialogDescription>
              To share your meal with friends, you need to save it as a Meal first. Would you like to create a Saved Meal with these foods?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowSaveAsMealDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAsMeal}>
              Save as Meal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default CreateMealPage;
