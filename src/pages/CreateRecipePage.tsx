import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Camera, X, ChevronDown, ChevronUp, Loader2, Utensils, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TagInput } from "@/components/TagInput";
import { TimePickerPopover } from "@/components/TimePickerPopover";
import { toast } from "@/hooks/use-toast";
import { CameraCapture, PhotoChoiceDialog } from "@/components/CameraCapture";
import { usePhotoPicker } from "@/hooks/useCamera";
import PhotoGallerySheet from "@/components/PhotoGallerySheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FoodSearchInput, FoodItem } from "@/components/FoodSearchInput";
import { FoodDetailModal, FoodItem as FoodDetailItem } from "@/components/FoodDetailModal";

interface Ingredient {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servings: number;
  servingSize: string;
}

interface RestoredState {
  restored?: boolean;
  contentData?: {
    title?: string;
    description?: string;
    tags?: string[];
    prepTime?: number;
    cookTime?: number;
    servings?: string;
    ingredients?: Ingredient[];
    instructions?: string[];
    coverPhoto?: string;
  };
  images?: string[];
}

const CreateRecipePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const restoredState = location.state as RestoredState | null;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [prepTime, setPrepTime] = useState(0); // in minutes
  const [cookTime, setCookTime] = useState(0); // in minutes
  const [servings, setServings] = useState("");
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [instructions, setInstructions] = useState<string[]>([""]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isChoiceDialogOpen, setIsChoiceDialogOpen] = useState(false);
  const [isPhotoGalleryOpen, setIsPhotoGalleryOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [isDetailsSectionOpen, setIsDetailsSectionOpen] = useState(true);

  // Food search state
  const [ingredientSearchValue, setIngredientSearchValue] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodDetailItem | null>(null);
  const [isFoodDetailOpen, setIsFoodDetailOpen] = useState(false);

  const { inputRef, openPicker, handleFileChange } = usePhotoPicker((urls) => {
    if (urls.length > 0) {
      setCoverPhoto(urls[0]);
      toast({ title: "Cover photo added!" });
    }
  });

  // Restore state if coming back from share screen
  useEffect(() => {
    if (restoredState?.restored && restoredState.contentData) {
      const data = restoredState.contentData;
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.tags) setTags(data.tags);
      if (data.prepTime !== undefined) setPrepTime(data.prepTime);
      if (data.cookTime !== undefined) setCookTime(data.cookTime);
      if (data.servings) setServings(data.servings);
      if (data.ingredients) setIngredients(data.ingredients);
      if (data.instructions) setInstructions(data.instructions);
      if (data.coverPhoto) setCoverPhoto(data.coverPhoto);
      window.history.replaceState({}, document.title);
    }
  }, []);

  // Calculate totals
  const totalCalories = ingredients.reduce((sum, i) => sum + i.calories, 0);
  const totalProtein = ingredients.reduce((sum, i) => sum + i.protein, 0);
  const totalCarbs = ingredients.reduce((sum, i) => sum + i.carbs, 0);
  const totalFats = ingredients.reduce((sum, i) => sum + i.fats, 0);

  const handleBack = () => {
    if (title || description || tags.length > 0 || coverPhoto || ingredients.length > 0 || instructions.some(i => i.trim())) {
      setShowBackConfirm(true);
    } else {
      navigate("/");
    }
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

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter((i) => i.id !== id));
  };

  const handleIngredientSelect = (food: FoodItem) => {
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
    setIngredientSearchValue("");
  };

  const handleFoodConfirm = (food: FoodDetailItem, foodServings: number, servingSize: string) => {
    const ratio = foodServings;
    const newIngredient: Ingredient = {
      id: Date.now().toString(),
      name: food.description,
      calories: Math.round(food.calories * ratio),
      protein: Math.round(food.protein * ratio * 10) / 10,
      carbs: Math.round(food.carbs * ratio * 10) / 10,
      fats: Math.round(food.fats * ratio * 10) / 10,
      servings: foodServings,
      servingSize: servingSize,
    };
    setIngredients([...ingredients, newIngredient]);
    setSelectedFood(null);
    setIsFoodDetailOpen(false);
  };

  const addInstruction = () => setInstructions([...instructions, ""]);

  const removeInstruction = (index: number) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter((_, i) => i !== index));
    }
  };

  const updateInstruction = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ title: "Please enter a recipe title", variant: "destructive" });
      return;
    }
    if (ingredients.length === 0) {
      toast({ title: "Please add at least one ingredient", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Please log in to save recipes", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const contentData = JSON.parse(JSON.stringify({
        title: title.trim(),
        description: description.trim(),
        tags,
        prepTime,
        cookTime,
        servings,
        ingredients: ingredients.map(i => ({
          id: i.id,
          name: i.name,
          calories: i.calories,
          protein: i.protein,
          carbs: i.carbs,
          fats: i.fats,
          servings: i.servings,
          servingSize: i.servingSize,
        })),
        instructions: instructions.filter(i => i.trim()),
        totalNutrition: {
          calories: totalCalories,
          protein: totalProtein,
          carbs: totalCarbs,
          fats: totalFats,
        },
        coverPhoto,
      }));

      const { error } = await supabase.from("posts").insert([{
        user_id: user.id,
        content_type: "recipe",
        content_data: contentData,
        images: coverPhoto ? [coverPhoto] : [],
        visibility: "private",
      }]);

      if (error) throw error;

      toast({ title: "Recipe saved!", description: "You can now use this recipe when logging meals." });
      navigate("/");
    } catch (error) {
      console.error("Error saving recipe:", error);
      toast({ title: "Error", description: "Failed to save recipe. Please try again.", variant: "destructive" });
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
          <h1 className="text-xl font-bold">Create Recipe</h1>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="rounded-full px-6">
            {isSubmitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
            Save
          </Button>
        </div>

        {/* Title with Collapsible Toggle */}
        <Collapsible open={isDetailsSectionOpen} onOpenChange={setIsDetailsSectionOpen} className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Input
              placeholder="Recipe name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
            <TagInput
              tags={tags}
              onTagsChange={setTags}
              placeholder="Add tag..."
              maxTags={5}
            />

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

            {/* Prep/Cook/Servings */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Prep Time</Label>
                <TimePickerPopover 
                  value={prepTime} 
                  onChange={setPrepTime} 
                  placeholder="Select Time"
                  className="bg-muted/50 border-0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Cook Time</Label>
                <TimePickerPopover 
                  value={cookTime} 
                  onChange={setCookTime} 
                  placeholder="Select Time"
                  className="bg-muted/50 border-0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Servings</Label>
                <Input placeholder="4" value={servings} onChange={(e) => setServings(e.target.value)} className="bg-muted/50 border-0" />
              </div>
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

        {/* Total Nutrition Card - liquid blob style */}
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

              {/* Frosted glass overlay */}
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
                {/* Main row: Calories left, Macros right */}
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

        {/* Ingredient Search */}
        <div className="mb-6">
          <FoodSearchInput
            value={ingredientSearchValue}
            onChange={setIngredientSearchValue}
            onSelect={handleIngredientSelect}
            placeholder="Search for ingredients to add..."
          />
        </div>

        {/* Ingredients Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-muted-foreground">Ingredients ({ingredients.length})</label>
          </div>

          {ingredients.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-border text-center text-muted-foreground">
              No ingredients added yet
            </div>
          ) : (
            <div className="space-y-2">
              {ingredients.map((ingredient) => (
                <motion.div
                  key={ingredient.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 rounded-xl bg-card border border-border"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-foreground text-sm">{ingredient.name}</div>
                      {ingredient.servingSize && (
                        <div className="text-xs text-primary mt-0.5">
                          {(() => {
                            const servingsVal = ingredient.servings ?? 1;
                            const servingSize = ingredient.servingSize;
                            const hasNumber = /\d/.test(servingSize);
                            if (hasNumber) {
                              return servingsVal > 1 ? `${servingsVal} × ${servingSize}` : servingSize;
                            }
                            return `${servingsVal} × ${servingSize}`;
                          })()}
                        </div>
                      )}
                      <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{ingredient.calories} cal</span>
                        <span>P: {ingredient.protein.toFixed(0)}g</span>
                        <span>C: {ingredient.carbs.toFixed(0)}g</span>
                        <span>F: {ingredient.fats.toFixed(0)}g</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => removeIngredient(ingredient.id)}
                    >
                      <X size={14} className="text-destructive" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-muted-foreground">Instructions</label>
          </div>

          <div className="space-y-3">
            {instructions.map((instruction, index) => (
              <motion.div key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                <div className="flex items-start gap-2 flex-1">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center mt-2 shrink-0">
                    {index + 1}
                  </span>
                  <Textarea
                    placeholder={`Step ${index + 1}`}
                    value={instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    rows={2}
                    className="flex-1 bg-muted/50 border-0"
                  />
                </div>
                {instructions.length > 1 && (
                  <Button variant="ghost" size="icon" className="shrink-0 mt-1" onClick={() => removeInstruction(index)}>
                    <Trash2 size={16} className="text-destructive" />
                  </Button>
                )}
              </motion.div>
            ))}
            <Button variant="outline" size="sm" onClick={addInstruction}>
              + Add Step
            </Button>
          </div>
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
                <Button variant="destructive" className="flex-1" onClick={() => navigate("/")}>
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

export default CreateRecipePage;
