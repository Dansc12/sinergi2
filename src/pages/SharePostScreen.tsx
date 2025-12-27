import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Image, X, Globe, Users, Camera, ChevronDown, ChevronUp, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { CameraCapture } from "@/components/CameraCapture";
import { usePhotoPicker } from "@/hooks/useCamera";
import { usePosts } from "@/hooks/usePosts";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Visibility = "public" | "friends" | "private";

interface LocationState {
  contentType: string;
  contentData: Record<string, unknown>;
  images?: string[];
  returnTo?: string;
  routineInstanceId?: string;
}

const visibilityOptions = [
  { value: "public" as Visibility, label: "Public", icon: Globe, description: "Share with everyone" },
  { value: "friends" as Visibility, label: "Friends Only", icon: Users, description: "Share with friends" },
];

const SharePostScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const { createPost } = usePosts();

  const isPostType = state?.contentType === "post";
  const fromSelection = (state as LocationState & { fromSelection?: boolean })?.fromSelection;

  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>((isPostType && fromSelection) ? "public" : "friends");
  const [images, setImages] = useState<string[]>(state?.images || []);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { inputRef, openPicker, handleFileChange } = usePhotoPicker((urls) => {
    setImages([...images, ...urls]);
  });

  useEffect(() => {
    if (!state?.contentType) {
      navigate("/");
    }
  }, [state, navigate]);

  const handleCapturePhoto = (imageUrl: string) => {
    setImages([...images, imageUrl]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const contentTypeLabels: Record<string, string> = {
      workout: "Workout",
      meal: "Meal",
      recipe: "Recipe",
      routine: "Routine",
      group: "Group",
      post: "Post",
    };

    const label = contentTypeLabels[state?.contentType || "post"] || "Post";

    setIsSubmitting(true);
    try {
      await createPost({
        content_type: state?.contentType || "post",
        content_data: state?.contentData || {},
        description: description || undefined,
        images: images,
        visibility: visibility,
      });

      // If this workout was from a routine, mark the instance as completed
      if (state?.routineInstanceId && state?.contentType === "workout") {
        await supabase
          .from("routine_instances")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", state.routineInstanceId);
      }

      toast({ 
        title: `${label} shared!`, 
        description: visibility === "private" 
          ? `Your ${label.toLowerCase()} has been saved privately.`
          : `Your ${label.toLowerCase()} is now live.` 
      });
      navigate("/");
    } catch (error) {
      console.error("Error creating post:", error);
      toast({ 
        title: "Error", 
        description: "Failed to share. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getContentTypeIcon = () => {
    const typeColors: Record<string, string> = {
      workout: "from-primary to-accent",
      meal: "from-success to-emerald-400",
      recipe: "from-rose-500 to-pink-400",
      routine: "from-violet-500 to-purple-400",
      group: "from-amber-500 to-orange-400",
      post: "from-blue-500 to-cyan-400",
    };
    return typeColors[state?.contentType || "post"] || "from-primary to-accent";
  };

  const getContentTypeLabel = () => {
    const labels: Record<string, string> = {
      workout: "Workout",
      meal: "Meal",
      recipe: "Recipe",
      routine: "Routine",
      group: "Group",
      post: "Post",
    };
    return labels[state?.contentType || "post"] || "Post";
  };

  const getCurrentVisibilityOption = () => {
    return visibilityOptions.find((opt) => opt.value === visibility) || visibilityOptions[0];
  };

  const showDescription = visibility === "public" || visibility === "friends";

  // Render content details based on content type
  const renderContentDetails = () => {
    const data = state?.contentData;
    if (!data) return null;

    switch (state?.contentType) {
      case "workout":
        return (
          <div className="space-y-3">
            {Array.isArray(data.exercises) && (data.exercises as Array<{ name: string; sets: Array<{ weight?: number; reps?: number; distance?: string; time?: string }> }>).map((exercise, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-card border border-border">
                <p className="font-medium text-sm">{exercise.name}</p>
                <div className="mt-2 space-y-1">
                  {exercise.sets.map((set, setIdx) => (
                    <p key={setIdx} className="text-xs text-muted-foreground">
                      Set {setIdx + 1}: {set.weight ? `${set.weight} lbs × ${set.reps} reps` : `${set.distance} × ${set.time}`}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      case "meal":
        return (
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary capitalize">{data.mealType as string}</p>
            {Array.isArray(data.foods) && (data.foods as Array<{ id: string; name: string; calories: number; protein: number; carbs: number; fats: number; servings?: number; servingSize?: string }>).map((food) => (
              <div key={food.id} className="p-3 rounded-xl bg-card border border-border">
                <p className="font-medium text-sm">{food.name}</p>
                {food.servings && food.servingSize && (
                  <p className="text-xs text-primary mt-0.5">{food.servings} × {food.servingSize}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {food.calories ?? 0} cal • P: {(food.protein ?? 0).toFixed(0)}g • C: {(food.carbs ?? 0).toFixed(0)}g • F: {(food.fats ?? 0).toFixed(0)}g
                </p>
              </div>
            ))}
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-semibold">
                {(data.totalCalories as number) ?? 0} cal • P: {((data.totalProtein as number) ?? 0).toFixed(0)}g • C: {((data.totalCarbs as number) ?? 0).toFixed(0)}g • F: {((data.totalFats as number) ?? 0).toFixed(0)}g
              </p>
            </div>
          </div>
        );
      case "recipe":
        return (
          <div className="space-y-3">
            <p className="text-sm font-medium">{data.title as string}</p>
            {data.description && <p className="text-xs text-muted-foreground">{data.description as string}</p>}
            <div className="flex gap-3 text-xs text-muted-foreground">
              {data.prepTime && <span>Prep: {data.prepTime as string}</span>}
              {data.cookTime && <span>Cook: {data.cookTime as string}</span>}
              {data.servings && <span>Servings: {data.servings as string}</span>}
            </div>
            {Array.isArray(data.ingredients) && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Ingredients</p>
                {(data.ingredients as Array<{ id: string; name: string; calories: number; servings?: number; servingSize?: string }>).map((ing) => (
                  <div key={ing.id} className="p-2 rounded-lg bg-card border border-border text-sm">
                    <span>{ing.name}</span>
                    {ing.servings && ing.servingSize && (
                      <span className="text-xs text-primary ml-2">({ing.servings} × {ing.servingSize})</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "routine":
        return (
          <div className="space-y-3">
            <p className="text-sm font-medium">{data.routineName as string}</p>
            {data.description && <p className="text-xs text-muted-foreground">{data.description as string}</p>}
            {Array.isArray(data.scheduleDays) && (data.scheduleDays as string[]).length > 0 && (
              <p className="text-xs text-muted-foreground">
                Schedule: {(data.scheduleDays as string[]).join(", ")}
              </p>
            )}
            {Array.isArray(data.exercises) && (data.exercises as Array<{ name: string; sets: Array<{ minReps: string; maxReps: string }> }>).map((exercise, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-card border border-border">
                <p className="font-medium text-sm">{exercise.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {exercise.sets.length} sets • {exercise.sets[0]?.minReps}-{exercise.sets[0]?.maxReps} reps
                </p>
              </div>
            ))}
          </div>
        );
      case "group":
        return (
          <div className="space-y-3">
            <p className="text-sm font-medium">{data.name as string}</p>
            {data.description && <p className="text-xs text-muted-foreground">{data.description as string}</p>}
            <div className="flex gap-3 text-xs text-muted-foreground">
              {data.category && <span className="capitalize">Category: {data.category as string}</span>}
              {data.privacy && <span className="capitalize">Privacy: {data.privacy as string}</span>}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="p-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => {
              const returnTo = state?.returnTo || "/";
              navigate(returnTo, {
                state: {
                  restored: true,
                  contentData: state?.contentData,
                  images: images,
                },
                replace: true,
              });
            }}>
              <ArrowLeft size={24} />
            </Button>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getContentTypeIcon()} flex items-center justify-center`}>
                <Globe size={20} className="text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">Share {getContentTypeLabel()}</h1>
            </div>
          </div>
        </div>

        {/* Photos Section - Now at top and bigger */}
        <div className="space-y-3 mb-6">
          <Label>Photos</Label>
          
          {/* Hidden file input */}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence>
              {images.map((img, index) => (
                <motion.div
                  key={img + index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative aspect-square rounded-2xl overflow-hidden bg-muted"
                >
                  <img src={img} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 bg-background/80 hover:bg-background rounded-full"
                    onClick={() => removeImage(index)}
                  >
                    <X size={16} />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Camera button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCameraOpen(true)}
              className="aspect-square rounded-2xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              <Camera size={32} />
              <span className="text-sm">Camera</span>
            </motion.button>

            {/* Gallery button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openPicker}
              className="aspect-square rounded-2xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              <Image size={32} />
              <span className="text-sm">Gallery</span>
            </motion.button>
          </div>
          <p className="text-xs text-muted-foreground">
            {fromSelection ? "At least one photo is required" : "Photos are optional"}
          </p>
        </div>

        {/* Description - Only visible for public/friends */}
        <AnimatePresence>
          {showDescription && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 mb-6 overflow-hidden"
            >
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Share your thoughts, celebrate your win, or motivate others..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Details Dropdown - Only show if there's actual content data */}
        {state?.contentData && Object.keys(state.contentData).length > 0 && (
          <div className="mb-6">
            <motion.button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full p-4 rounded-xl bg-card border border-border flex items-center justify-between"
              whileTap={{ scale: 0.98 }}
            >
              <span className="font-medium">View {getContentTypeLabel()} Details</span>
              {showDetails ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </motion.button>
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 border border-t-0 border-border rounded-b-xl bg-card/50">
                    {renderContentDetails()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="flex gap-3">
          {/* Save Button - Takes 2/3 of space */}
          <Button 
            className="flex-[2] glow-primary h-14 text-lg" 
            onClick={handleSubmit}
            disabled={isSubmitting || (fromSelection && images.length === 0)}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin mr-2" size={20} />
            ) : null}
            {visibility === "private" ? "Save" : "Save & Share"}
          </Button>
          
          {/* Visibility Dropdown - Takes 1/3 of space */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="flex-1 h-14 gap-2 border-border"
              >
                {(() => {
                  const opt = getCurrentVisibilityOption();
                  const Icon = opt.icon;
                  return (
                    <>
                      <Icon size={18} />
                      <span className="hidden sm:inline">{opt.label}</span>
                    </>
                  );
                })()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-80 p-2 bg-card border border-border"
              sideOffset={8}
            >
              {visibilityOptions
                .filter((option) => !isPostType || option.value !== "private")
                .map((option) => {
                  const Icon = option.icon;
                  const isSelected = visibility === option.value;
                  const isSocial = option.value === "public" || option.value === "friends";
                  
                  const descriptions: Record<Visibility, string> = {
                    public: "Anyone can see this post in the public feed",
                    friends: "Only your friends will see this in their feed",
                    private: "Only you can see this - saved to your library",
                  };
                  
                  return (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => setVisibility(option.value)}
                      className={`p-3 rounded-xl cursor-pointer transition-all mb-1 last:mb-0 ${
                        isSocial 
                          ? "bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 border border-primary/20" 
                          : "hover:bg-muted"
                      } ${isSelected ? "ring-2 ring-primary" : ""}`}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isSocial 
                            ? "bg-gradient-to-br from-primary to-accent text-primary-foreground" 
                            : "bg-muted text-muted-foreground"
                        }`}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{option.label}</p>
                            {isSocial && (
                              <Sparkles size={14} className="text-primary" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{descriptions[option.value]}</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapturePhoto}
        onSelectFromGallery={(urls) => setImages([...images, ...urls])}
      />
    </div>
  );
};

export default SharePostScreen;
