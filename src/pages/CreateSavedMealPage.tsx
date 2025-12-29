import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Camera, X, ChevronDown, ChevronUp, Plus, Loader2, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { CameraCapture, PhotoChoiceDialog } from "@/components/CameraCapture";
import { usePhotoPicker } from "@/hooks/useCamera";
import PhotoGallerySheet from "@/components/PhotoGallerySheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FoodSearchInput, FoodItem } from "@/components/FoodSearchInput";
import { FoodDetailModal, FoodItem as FoodDetailItem } from "@/components/FoodDetailModal";

interface SavedMealFood {
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

interface LocationState {
  foods?: SavedMealFood[];
  mealType?: string;
  photos?: string[];
}

const CreateSavedMealPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const state = location.state as LocationState | null;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [foods, setFoods] = useState<SavedMealFood[]>(state?.foods || []);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isChoiceDialogOpen, setIsChoiceDialogOpen] = useState(false);
  const [isPhotoGalleryOpen, setIsPhotoGalleryOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [isDetailsSectionOpen, setIsDetailsSectionOpen] = useState(true);
  
  // Food search state
  const [foodSearchQuery, setFoodSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodDetailItem | null>(null);
  const [isFoodDetailOpen, setIsFoodDetailOpen] = useState(false);

  const { inputRef, openPicker, handleFileChange } = usePhotoPicker((urls) => {
    if (urls.length > 0) {
      setCoverPhoto(urls[0]);
      toast({ title: "Cover photo added!" });
    }
  });

  // Calculate totals
  const totalCalories = foods.reduce((sum, f) => sum + f.calories, 0);
  const totalProtein = foods.reduce((sum, f) => sum + f.protein, 0);
  const totalCarbs = foods.reduce((sum, f) => sum + f.carbs, 0);
  const totalFats = foods.reduce((sum, f) => sum + f.fats, 0);

  const handleBack = () => {
    if (name || description || tags.length > 0 || coverPhoto || foods.length > 0) {
      setShowBackConfirm(true);
    } else {
      navigateBack();
    }
  };

  const navigateBack = () => {
    navigate("/create/meal", {
      state: {
        restored: true,
        contentData: { mealType: state?.mealType, foods },
        images: state?.photos || [],
      },
    });
  };

  const handleCapturePhoto = (imageUrl: string) => {
    setCoverPhoto(imageUrl);
    toast({ title: "Cover photo added!" });
  };

  const handleSelectFromGallery = (imageUrls: string[]) => {
    if (imageUrls.length > 0) {
      setCoverPhoto(imageUrls[0]);
      toast({ title: "Cover photo added!" });
    }
  };

  const handleAddTag = () => {
    const processed = newTag.trim().toLowerCase().replace(/[^a-z]/g, '');
    if (processed && !tags.includes(processed)) {
      setTags([...tags, processed]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const removeFood = (id: string) => {
    setFoods(foods.filter((f) => f.id !== id));
  };

  const handleFoodSelect = (food: FoodItem) => {
    // Convert FoodSearchInput's FoodItem to FoodDetailModal's FoodItem
    const detailFood: FoodDetailItem = {
      fdcId: food.fdcId,
      description: food.description,
      brandName: food.brandName,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
      servingSize: food.servingSize,
      servingSizeValue: food.servingSizeValue,
      servingSizeUnit: food.servingSizeUnit,
      isCustom: food.isCustom,
      baseUnit: food.baseUnit,
    };
    setSelectedFood(detailFood);
    setIsFoodDetailOpen(true);
    setFoodSearchQuery("");
  };

  const handleFoodConfirm = (food: FoodDetailItem, servings: number, servingSize: string) => {
    // Calculate the adjusted macros based on servings
    const ratio = servings;
    const newFood: SavedMealFood = {
      id: Date.now().toString(),
      name: food.description,
      calories: Math.round(food.calories * ratio),
      protein: Math.round(food.protein * ratio * 10) / 10,
      carbs: Math.round(food.carbs * ratio * 10) / 10,
      fats: Math.round(food.fats * ratio * 10) / 10,
      servings: servings,
      servingSize: servingSize,
      rawQuantity: servings,
      rawUnit: servingSize,
    };
    setFoods([...foods, newFood]);
    setSelectedFood(null);
    setIsFoodDetailOpen(false);
    toast({ title: "Food added!" });
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: "Please enter a meal name", variant: "destructive" });
      return;
    }
    if (foods.length === 0) {
      toast({ title: "Please add at least one food", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Please log in to save meals", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const contentData = JSON.parse(JSON.stringify({
        name: name.trim(),
        description: description.trim(),
        tags,
        foods: foods.map(f => ({
          id: f.id,
          name: f.name,
          calories: f.calories,
          protein: f.protein,
          carbs: f.carbs,
          fats: f.fats,
          servings: f.servings,
          servingSize: f.servingSize,
          rawQuantity: f.rawQuantity,
          rawUnit: f.rawUnit,
        })),
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFats,
      }));
      
      const { error } = await supabase.from("posts").insert([{
        user_id: user.id,
        content_type: "saved_meal",
        content_data: contentData,
        images: coverPhoto ? [coverPhoto] : [],
        visibility: "private",
      }]);

      if (error) throw error;

      toast({ title: "Meal saved!", description: "You can now quick-add this meal when logging." });
      navigate("/create/meal");
    } catch (error) {
      console.error("Error saving meal:", error);
      toast({ title: "Error", description: "Failed to save meal. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-xl font-bold">Create Meal</h1>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="rounded-full px-6">
            {isSubmitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
            Save
          </Button>
        </div>

        {/* Title with Collapsible Toggle */}
        <Collapsible open={isDetailsSectionOpen} onOpenChange={setIsDetailsSectionOpen} className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Input
              placeholder="Meal name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 text-2xl font-semibold bg-transparent border-0 rounded-none px-0 focus-visible:ring-0"
            />
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                {isDetailsSectionOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="space-y-6">
            {/* Tags Section */}
            <div>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add tag..."
                  value={newTag}
                  onChange={(e) => {
                    const value = e.target.value.toLowerCase().replace(/[^a-z]/g, '');
                    setNewTag(value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 h-9 bg-muted/50 border-0 text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                  className="h-9"
                >
                  <Plus size={16} />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:bg-muted rounded-full p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <Textarea
                placeholder="Add description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[60px] bg-muted/50 border-0 resize-none text-sm"
                rows={2}
              />
            </div>

            {/* Cover Photo */}
            <div>
              {coverPhoto ? (
                <div className="relative rounded-xl overflow-hidden aspect-video">
                  <img src={coverPhoto} alt="Cover" className="w-full h-full object-cover" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => setCoverPhoto(null)}
                  >
                    <X size={16} />
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setIsChoiceDialogOpen(true)}
                  className="w-full aspect-video rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  <Camera size={32} />
                  <span className="text-sm">Add Cover Photo</span>
                </button>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Divider */}
        <div className="border-b border-border mb-6" />

        {/* Total Nutrition Card - styled like food detail modal */}
        {(() => {
          const proteinColor = '#3DD6C6';
          const carbsColor = '#5B8CFF';
          const fatsColor = '#B46BFF';
          
          const totalMacros = totalProtein + totalCarbs + totalFats;
          const proteinRatio = totalMacros > 0 ? Math.max((totalProtein / totalMacros), 0.08) : 0.33;
          const carbsRatio = totalMacros > 0 ? Math.max((totalCarbs / totalMacros), 0.08) : 0.33;
          const fatsRatio = totalMacros > 0 ? Math.max((totalFats / totalMacros), 0.08) : 0.33;
          
          const totalRatio = proteinRatio + carbsRatio + fatsRatio;
          const normalizedProtein = proteinRatio / totalRatio;
          const normalizedCarbs = carbsRatio / totalRatio;
          const normalizedFats = fatsRatio / totalRatio;
          
          const proteinSize = 40 + normalizedProtein * 50;
          const carbsSize = 40 + normalizedCarbs * 50;
          const fatsSize = 40 + normalizedFats * 50;
          
          const proteinOpacity = totalMacros > 0 ? 0.6 + (totalProtein / totalMacros) * 0.4 : 0.75;
          const carbsOpacity = totalMacros > 0 ? 0.6 + (totalCarbs / totalMacros) * 0.4 : 0.75;
          const fatsOpacity = totalMacros > 0 ? 0.6 + (totalFats / totalMacros) * 0.4 : 0.75;

          const proteinPct = totalMacros > 0 ? Math.round((totalProtein / totalMacros) * 100) : 0;
          const carbsPct = totalMacros > 0 ? Math.round((totalCarbs / totalMacros) * 100) : 0;
          const fatsPct = totalMacros > 0 ? Math.round((totalFats / totalMacros) * 100) : 0;
          
          return (
            <div 
              className="relative w-full rounded-2xl overflow-hidden mb-6 shadow-lg shadow-black/30 p-4"
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
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              />
              
              {/* Content */}
              <div className="relative z-10 h-14">
                {/* Top left: Fork/knife icon with count (overlay, does not affect centering) */}
                <div className="absolute left-0 top-0 flex items-center gap-1.5 text-white/80 text-sm">
                  <Utensils size={14} />
                  <span>{foods.length}</span>
                </div>

                {/* Main row: Calories left, Macros right (perfectly vertically centered) */}
                <div className="flex items-center justify-between h-full">
                  {/* Left: Calories */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-3xl font-bold text-white leading-none">{Math.round(totalCalories)}</span>
                    <span className="text-white/60 text-sm leading-none">cal</span>
                  </div>

                  {/* Right: Macros */}
                  <div className="flex items-center gap-4 h-full">
                    <div className="flex flex-col items-start justify-center h-full">
                      <span className="text-xs leading-none" style={{ color: proteinColor }}>
                        P <span className="text-white/60">{proteinPct}%</span>
                      </span>
                      <div className="text-white font-medium text-sm leading-none mt-0.5">{Math.round(totalProtein)}g</div>
                    </div>
                    <div className="flex flex-col items-start justify-center h-full">
                      <span className="text-xs leading-none" style={{ color: carbsColor }}>
                        C <span className="text-white/60">{carbsPct}%</span>
                      </span>
                      <div className="text-white font-medium text-sm leading-none mt-0.5">{Math.round(totalCarbs)}g</div>
                    </div>
                    <div className="flex flex-col items-start justify-center h-full">
                      <span className="text-xs leading-none" style={{ color: fatsColor }}>
                        F <span className="text-white/60">{fatsPct}%</span>
                      </span>
                      <div className="text-white font-medium text-sm leading-none mt-0.5">{Math.round(totalFats)}g</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Food Search */}
        <div className="mb-6">
          <FoodSearchInput
            value={foodSearchQuery}
            onChange={setFoodSearchQuery}
            onSelect={handleFoodSelect}
            placeholder="Search for foods to add..."
          />
        </div>

        {/* Foods Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-muted-foreground">Foods ({foods.length})</label>
          </div>

          {foods.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-border text-center text-muted-foreground">
              No foods added yet
            </div>
          ) : (
            <div className="space-y-2">
              {foods.map((food) => (
                <motion.div
                  key={food.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 rounded-xl bg-card border border-border"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-foreground text-sm">{food.name}</div>
                      {food.servings && food.servingSize && (
                        <div className="text-xs text-primary mt-0.5">
                          {food.servings} × {food.servingSize}
                        </div>
                      )}
                      <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{food.calories} cal</span>
                        <span>P: {food.protein.toFixed(0)}g</span>
                        <span>C: {food.carbs.toFixed(0)}g</span>
                        <span>F: {food.fats.toFixed(0)}g</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => removeFood(food.id)}
                    >
                      <X size={14} className="text-destructive" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Camera Components */}
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

      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapturePhoto}
      />

      <PhotoGallerySheet
        photos={coverPhoto ? [coverPhoto] : []}
        isOpen={isPhotoGalleryOpen}
        onClose={() => setIsPhotoGalleryOpen(false)}
        onDeletePhoto={() => setCoverPhoto(null)}
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Food Detail Modal */}
      <FoodDetailModal
        isOpen={isFoodDetailOpen}
        food={selectedFood}
        onClose={() => {
          setIsFoodDetailOpen(false);
          setSelectedFood(null);
        }}
        onConfirm={handleFoodConfirm}
      />

      {/* Back Confirmation Dialog */}
      <AnimatePresence>
        {showBackConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowBackConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-2">Discard Changes?</h3>
              <p className="text-muted-foreground text-sm mb-4">
                You have unsaved changes. Are you sure you want to go back?
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowBackConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" className="flex-1" onClick={navigateBack}>
                  Discard
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreateSavedMealPage;