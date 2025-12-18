import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ChefHat, Trash2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { FoodSearchInput, FoodItem } from "@/components/FoodSearchInput";
import { CameraCapture, PhotoChoiceDialog } from "@/components/CameraCapture";
import { usePhotoPicker } from "@/hooks/useCamera";
import { FoodDetailModal } from "@/components/FoodDetailModal";

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
    prepTime?: string;
    cookTime?: string;
    servings?: string;
    ingredients?: Ingredient[];
    instructions?: string[];
  };
  images?: string[];
}

const CreateRecipePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const restoredState = location.state as RestoredState | null;
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [instructions, setInstructions] = useState<string[]>([""]);
  const [ingredientSearchValue, setIngredientSearchValue] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isChoiceDialogOpen, setIsChoiceDialogOpen] = useState(false);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [isCoverPhotoMode, setIsCoverPhotoMode] = useState(false);

  const { inputRef, openPicker, handleFileChange } = usePhotoPicker((urls) => {
    if (isCoverPhotoMode && urls.length > 0) {
      setCoverPhoto(urls[0]);
    } else {
      setAdditionalImages([...additionalImages, ...urls]);
    }
    setIsCoverPhotoMode(false);
  });

  // Restore state if coming back from share screen
  useEffect(() => {
    if (restoredState?.restored && restoredState.contentData) {
      const data = restoredState.contentData as typeof restoredState.contentData & { coverPhoto?: string };
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.prepTime) setPrepTime(data.prepTime);
      if (data.cookTime) setCookTime(data.cookTime);
      if (data.servings) setServings(data.servings);
      if (data.ingredients) setIngredients(data.ingredients);
      if (data.instructions) setInstructions(data.instructions);
      if (data.coverPhoto) setCoverPhoto(data.coverPhoto);
      if (restoredState.images) setAdditionalImages(restoredState.images);
      window.history.replaceState({}, document.title);
    }
  }, []);

  const handleBack = () => {
    navigate("/");
  };

  const handleIngredientSelect = (food: FoodItem) => {
    setSelectedFood(food);
    setIsFoodModalOpen(true);
    setIngredientSearchValue("");
  };

  const handleFoodConfirm = (food: FoodItem, foodServings: number, servingSize: string) => {
    const newIngredient: Ingredient = {
      id: Date.now().toString(),
      name: food.description,
      calories: Math.round(food.calories * foodServings),
      protein: Math.round(food.protein * foodServings * 10) / 10,
      carbs: Math.round(food.carbs * foodServings * 10) / 10,
      fats: Math.round(food.fats * foodServings * 10) / 10,
      servings: foodServings,
      servingSize: servingSize,
    };
    setIngredients([...ingredients, newIngredient]);
    setIsFoodModalOpen(false);
    setSelectedFood(null);
  };

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter((i) => i.id !== id));
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

  // Calculate total nutrition
  const totalNutrition = ingredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + ing.calories,
      protein: acc.protein + ing.protein,
      carbs: acc.carbs + ing.carbs,
      fats: acc.fats + ing.fats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const handleFinish = () => {
    if (!coverPhoto) {
      toast({ title: "Please add a cover photo", variant: "destructive" });
      return;
    }
    if (!title.trim()) {
      toast({ title: "Please enter a recipe title", variant: "destructive" });
      return;
    }
    // Navigate to share screen with recipe data - cover photo is first image
    const allImages = [coverPhoto, ...additionalImages];
    navigate("/share", {
      state: {
        contentType: "recipe",
        contentData: { title, description, prepTime, cookTime, servings, ingredients, instructions, totalNutrition, coverPhoto },
        images: allImages,
        returnTo: "/create/recipe",
      },
    });
  };

  const handleCapturePhoto = (imageUrl: string) => {
    if (isCoverPhotoMode) {
      setCoverPhoto(imageUrl);
    } else {
      setAdditionalImages([...additionalImages, imageUrl]);
    }
    setIsCameraOpen(false);
    setIsCoverPhotoMode(false);
  };

  const handleSelectFromGallery = (imageUrls: string[]) => {
    if (isCoverPhotoMode && imageUrls.length > 0) {
      setCoverPhoto(imageUrls[0]);
      if (imageUrls.length > 1) {
        setAdditionalImages([...additionalImages, ...imageUrls.slice(1)]);
      }
    } else {
      setAdditionalImages([...additionalImages, ...imageUrls]);
    }
    setIsCoverPhotoMode(false);
  };

  const openCoverPhotoCamera = () => {
    setIsCoverPhotoMode(true);
    setIsChoiceDialogOpen(true);
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
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft size={24} />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-400 flex items-center justify-center">
                <ChefHat size={20} className="text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">Create Recipe</h1>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleFinish}
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            Finish
          </Button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Cover Photo Section */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Cover Photo <span className="text-destructive">*</span>
            </Label>
            {coverPhoto ? (
              <div className="relative">
                <img
                  src={coverPhoto}
                  alt="Cover"
                  className="w-full h-48 object-cover rounded-xl"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-2 right-2"
                  onClick={openCoverPhotoCamera}
                >
                  Change
                </Button>
              </div>
            ) : (
              <button
                onClick={openCoverPhotoCamera}
                className="w-full h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Camera size={32} />
                <span className="text-sm">Add Cover Photo</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Recipe Title</Label>
            <Input
              id="title"
              placeholder="e.g., High Protein Overnight Oats"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe your recipe..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Prep Time</Label>
              <Input placeholder="10 min" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Cook Time</Label>
              <Input placeholder="20 min" value={cookTime} onChange={(e) => setCookTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Servings</Label>
              <Input placeholder="4" value={servings} onChange={(e) => setServings(e.target.value)} />
            </div>
          </div>

          {/* Total Nutrition Summary */}
          {totalNutrition.calories > 0 && (
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
              <Label className="text-xs text-muted-foreground mb-2 block">Total Recipe Nutrition</Label>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <div className="font-semibold text-lg text-foreground">{totalNutrition.calories}</div>
                  <div className="text-muted-foreground">Calories</div>
                </div>
                <div>
                  <div className="font-semibold text-lg text-foreground">{totalNutrition.protein}g</div>
                  <div className="text-muted-foreground">Protein</div>
                </div>
                <div>
                  <div className="font-semibold text-lg text-foreground">{totalNutrition.carbs}g</div>
                  <div className="text-muted-foreground">Carbs</div>
                </div>
                <div>
                  <div className="font-semibold text-lg text-foreground">{totalNutrition.fats}g</div>
                  <div className="text-muted-foreground">Fats</div>
                </div>
              </div>
            </div>
          )}

          {/* Ingredients Search */}
          <div className="space-y-3">
            <Label>Ingredients</Label>
            <FoodSearchInput
              value={ingredientSearchValue}
              onChange={setIngredientSearchValue}
              onSelect={handleIngredientSelect}
              placeholder="Search ingredient to add..."
            />
            
            {/* Ingredient List */}
            {ingredients.length > 0 && (
              <div className="space-y-2 mt-3">
                {ingredients.map((ingredient) => (
                  <motion.div 
                    key={ingredient.id} 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    className="flex items-center justify-between p-3 rounded-xl bg-card border border-border"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{ingredient.name}</p>
                      {ingredient.servings && ingredient.servingSize && (
                        <p className="text-xs text-primary mt-0.5">
                          {ingredient.servings} × {ingredient.servingSize}
                        </p>
                      )}
                      <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                        <span>{ingredient.calories} cal</span>
                        <span>P: {ingredient.protein}g</span>
                        <span>C: {ingredient.carbs}g</span>
                        <span>F: {ingredient.fats}g</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeIngredient(ingredient.id)}>
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            <Label>Instructions</Label>
            {instructions.map((instruction, index) => (
              <motion.div key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                <div className="flex items-start gap-2 flex-1">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center mt-2">
                    {index + 1}
                  </span>
                  <Textarea
                    placeholder={`Step ${index + 1}`}
                    value={instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                </div>
                {instructions.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeInstruction(index)}>
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

      {/* Fixed Bottom Camera Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <Button 
          variant="outline" 
          className="w-full h-14 gap-2 border-border"
          onClick={() => setIsChoiceDialogOpen(true)}
        >
          <Camera size={20} />
          Add More Photos
        </Button>
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

      {/* Camera Modal */}
      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => {
          setIsCameraOpen(false);
          setIsCoverPhotoMode(false);
        }}
        onCapture={handleCapturePhoto}
        onSelectFromGallery={handleSelectFromGallery}
      />

      {/* Food Detail Modal */}
      <FoodDetailModal
        isOpen={isFoodModalOpen}
        food={selectedFood}
        onClose={() => {
          setIsFoodModalOpen(false);
          setSelectedFood(null);
        }}
        onConfirm={handleFoodConfirm}
      />
    </div>
  );
};

export default CreateRecipePage;