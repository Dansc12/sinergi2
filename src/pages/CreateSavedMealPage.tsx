import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Camera, Images, X, ChevronRight, Plus, Loader2 } from "lucide-react";
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

const SUGGESTED_TAGS = [
  "High Protein",
  "Low Carb",
  "Keto",
  "Vegan",
  "Quick",
  "Meal Prep",
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
  "Post-Workout",
  "Pre-Workout",
];

const CreateSavedMealPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const state = location.state as LocationState | null;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [foods, setFoods] = useState<SavedMealFood[]>(state?.foods || []);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isChoiceDialogOpen, setIsChoiceDialogOpen] = useState(false);
  const [isPhotoGalleryOpen, setIsPhotoGalleryOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);

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
    if (name || description || tags.length > 0 || coverPhoto) {
      setShowBackConfirm(true);
    } else {
      navigateBack();
    }
  };

  const navigateBack = () => {
    // Navigate back to meal creation with the foods preserved
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

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const addCustomTag = () => {
    const trimmed = customTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setCustomTag("");
    }
  };

  const removeFood = (id: string) => {
    setFoods(foods.filter((f) => f.id !== id));
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
      
      // Save as a post with content_type "saved_meal"
      const { error } = await supabase.from("posts").insert([{
        user_id: user.id,
        content_type: "saved_meal",
        content_data: contentData,
        images: coverPhoto ? [coverPhoto] : [],
        visibility: "private", // Saved meals are private by default
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
    <div className="min-h-screen bg-background pb-24">
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

        {/* Cover Photo */}
        <div className="mb-6">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Cover Photo</label>
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

        {/* Name */}
        <div className="mb-4">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., My Go-To Breakfast"
            className="bg-card"
          />
        </div>

        {/* Tags */}
        <div className="mb-4">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Tags</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {SUGGESTED_TAGS.map((tag) => (
              <Badge
                key={tag}
                variant={tags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              placeholder="Add custom tag..."
              className="bg-card flex-1"
              onKeyDown={(e) => e.key === "Enter" && addCustomTag()}
            />
            <Button variant="outline" size="icon" onClick={addCustomTag}>
              <Plus size={18} />
            </Button>
          </div>
          {tags.filter((t) => !SUGGESTED_TAGS.includes(t)).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags
                .filter((t) => !SUGGESTED_TAGS.includes(t))
                .map((tag) => (
                  <Badge key={tag} variant="default" className="cursor-pointer" onClick={() => toggleTag(tag)}>
                    {tag} <X size={12} className="ml-1" />
                  </Badge>
                ))}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add notes about this meal..."
            className="bg-card min-h-[80px]"
          />
        </div>

        {/* Foods Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-muted-foreground">Foods ({foods.length})</label>
            <div className="text-sm text-muted-foreground">
              {totalCalories} cal
            </div>
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

          {/* Nutrition Summary */}
          {foods.length > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-card border border-border">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Total Nutrition
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">{totalCalories}</div>
                  <div className="text-xs text-muted-foreground">Calories</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[#3DD6C6]">{totalProtein.toFixed(0)}g</div>
                  <div className="text-xs text-muted-foreground">Protein</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[#5B8CFF]">{totalCarbs.toFixed(0)}g</div>
                  <div className="text-xs text-muted-foreground">Carbs</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[#B46BFF]">{totalFats.toFixed(0)}g</div>
                  <div className="text-xs text-muted-foreground">Fats</div>
                </div>
              </div>
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
