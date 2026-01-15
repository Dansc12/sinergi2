import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Image,
  X,
  Globe,
  Camera,
  ChevronDown,
  ChevronUp,
  Loader2,
  Utensils,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { CameraCapture } from "@/components/CameraCapture";
import { usePhotoPicker } from "@/hooks/useCamera";
import { usePosts } from "@/hooks/usePosts";
import { supabase } from "@/integrations/supabase/client";

interface LocationState {
  contentType: string;
  contentData: Record<string, unknown>;
  images?: string[];
  returnTo?: string;
  routineInstanceId?: string;
}

const SharePostScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const { createPost } = usePosts();

  const isPostType = state?.contentType === "post";
  const fromSelection = (state as LocationState & { fromSelection?: boolean })?.fromSelection;

  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>(state?.images || []);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Content titles (read-only, just for display)
  const isWorkout = state?.contentType === "workout";
  const isSavedMeal = state?.contentType === "meal";
  const isRecipe = state?.contentType === "recipe";
  const isRoutine = state?.contentType === "routine";

  const workoutTitle = (state?.contentData?.title as string) || "";
  const mealTitle = (state?.contentData?.name as string) || "";
  const recipeTitle = (state?.contentData?.title as string) || "";
  const routineTitle = (state?.contentData?.routineName as string) || "";

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
      // Use original content_data without mutation
      const contentData = state?.contentData || {};

      // Create post with visibility always public
      await createPost({
        content_type: state?.contentType || "post",
        content_data: contentData,
        description: description || undefined,
        images: images,
        visibility: "public",
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
        description: `Your ${label.toLowerCase()} is now live.`,
      });
      navigate("/");
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: "Failed to share. Please try again.",
        variant: "destructive",
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

  // Render content details based on content type
  const renderContentDetails = () => {
    const data = state?.contentData;
    if (!data) return null;

    switch (state?.contentType) {
      case "workout":
        return (
          <div className="space-y-4">
            {/* Workout Name - Read-only */}
            {workoutTitle && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Workout Name</Label>
                <p className="text-foreground font-medium">{workoutTitle}</p>
              </div>
            )}

            {/* Separator between name and exercises */}
            {Array.isArray(data.exercises) && (data.exercises as Array<unknown>).length > 0 && (
              <div className="border-t border-border pt-3">
                <p className="text-xs text-muted-foreground font-medium mb-3">Exercises</p>
              </div>
            )}

            {/* Exercise details - vertical list format */}
            <div className="space-y-3">
              {Array.isArray(data.exercises) &&
                (() => {
                  type SetType = "normal" | "warmup" | "failure" | "drop";
                  type ExerciseType = {
                    name: string;
                    category?: string;
                    muscleGroup?: string;
                    supersetGroupId?: string;
                    notes?: string;
                    isCardio?: boolean;
                    sets: Array<{
                      weight?: number;
                      reps?: number;
                      distance?: string;
                      time?: string;
                      completed?: boolean;
                      setType?: SetType;
                    }>;
                  };
                  const exercises = data.exercises as ExerciseType[];
                  const supersetColors = ["bg-cyan-500", "bg-amber-500", "bg-emerald-500", "bg-rose-500", "bg-sky-500"];

                  // Helper to get set label matching Log Workout style
                  const getSetLabel = (setType: SetType | undefined, normalSetNumber: number): string => {
                    switch (setType) {
                      case "warmup":
                        return "W";
                      case "failure":
                        return "F";
                      case "drop":
                        return "D";
                      default:
                        return String(normalSetNumber);
                    }
                  };

                  // Get styling for set type badge matching Log Workout
                  const getSetBadgeStyle = (setType: SetType | undefined): string => {
                    switch (setType) {
                      case "warmup":
                        return "bg-yellow-500/20 text-yellow-600";
                      case "failure":
                        return "bg-red-500/20 text-red-600";
                      case "drop":
                        return "bg-blue-500/20 text-blue-600";
                      default:
                        return "bg-muted text-muted-foreground";
                    }
                  };

                  // Calculate normal set number (only counts normal sets)
                  const getNormalSetNumber = (sets: ExerciseType["sets"], currentIndex: number): number => {
                    let count = 0;
                    for (let i = 0; i <= currentIndex; i++) {
                      if (!sets[i].setType || sets[i].setType === "normal") {
                        count++;
                      }
                    }
                    return count;
                  };

                  // Group exercises by superset
                  const supersetGroups = new Map<string, number>();
                  let groupIndex = 0;
                  exercises.forEach((ex) => {
                    if (ex.supersetGroupId && !supersetGroups.has(ex.supersetGroupId)) {
                      supersetGroups.set(ex.supersetGroupId, groupIndex++);
                    }
                  });

                  return exercises.map((exercise, idx) => {
                    const supersetGroupIndex = exercise.supersetGroupId
                      ? supersetGroups.get(exercise.supersetGroupId)
                      : undefined;
                    const supersetColor =
                      supersetGroupIndex !== undefined
                        ? supersetColors[supersetGroupIndex % supersetColors.length]
                        : null;

                    return (
                      <div key={idx} className="rounded-xl bg-card border border-border overflow-hidden">
                        <div className="flex">
                          {/* Left color bar for all superset exercises */}
                          {supersetColor && <div className={`w-1 ${supersetColor}`} />}

                          <div className="flex-1 p-4 space-y-3">
                            {/* Exercise name and type */}
                            <div>
                              <h4 className="font-semibold text-foreground">{exercise.name}</h4>
                              {exercise.isCardio && <span className="text-xs text-muted-foreground">Cardio</span>}
                              {/* Notes - directly below exercise name */}
                              {exercise.notes && (
                                <p className="text-sm text-foreground italic mt-1">{exercise.notes}</p>
                              )}
                            </div>

                            {/* Sets - row format */}
                            <div className="space-y-1.5">
                              {exercise.sets.map((set, setIdx) => {
                                const normalSetNumber = getNormalSetNumber(exercise.sets, setIdx);
                                const setLabel = getSetLabel(set.setType, normalSetNumber);
                                const badgeStyle = getSetBadgeStyle(set.setType);

                                return (
                                  <div key={setIdx} className="flex items-center gap-3 py-1">
                                    {/* Set type/# badge - matching Log Workout style */}
                                    <div
                                      className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-sm ${badgeStyle}`}
                                    >
                                      {setLabel}
                                    </div>

                                    {/* Weight/Distance and Reps/Time in boxes */}
                                    {exercise.isCardio ? (
                                      <>
                                        <div className="bg-muted/30 rounded-md px-3 py-1.5 flex items-center gap-1.5">
                                          <span className="text-sm font-medium text-foreground">
                                            {set.distance || "0"}
                                          </span>
                                          <span className="text-xs text-muted-foreground">mi</span>
                                        </div>
                                        <div className="bg-muted/30 rounded-md px-3 py-1.5">
                                          <span className="text-sm font-medium text-foreground">
                                            {set.time || "0:00"}
                                          </span>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="bg-muted/30 rounded-md px-3 py-1.5 flex items-center gap-1.5">
                                          <span className="text-sm font-medium text-foreground">{set.weight || 0}</span>
                                          <span className="text-xs text-muted-foreground">lbs</span>
                                        </div>
                                        <span className="text-muted-foreground">×</span>
                                        <div className="bg-muted/30 rounded-md px-3 py-1.5 flex items-center gap-1.5">
                                          <span className="text-sm font-medium text-foreground">{set.reps || 0}</span>
                                          <span className="text-xs text-muted-foreground">reps</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
            </div>
          </div>
        );
      case "meal":
        const mealFoods = Array.isArray(data.foods)
          ? (data.foods as Array<{
              id: string;
              name: string;
              calories: number;
              protein: number;
              carbs: number;
              fats: number;
              servings?: number;
              servingSize?: string;
            }>)
          : [];
        const totalCalories =
          (data.totalCalories as number) ?? mealFoods.reduce((sum, f) => sum + (f.calories || 0), 0);
        const totalProtein = (data.totalProtein as number) ?? mealFoods.reduce((sum, f) => sum + (f.protein || 0), 0);
        const totalCarbs = (data.totalCarbs as number) ?? mealFoods.reduce((sum, f) => sum + (f.carbs || 0), 0);
        const totalFats = (data.totalFats as number) ?? mealFoods.reduce((sum, f) => sum + (f.fats || 0), 0);

        // Cover photo comes from saved meal data (NOT the share-post photo list)
        const coverFromFoods = (() => {
          const first = mealFoods?.[0] as unknown as { savedMealCoverPhoto?: unknown } | undefined;
          return typeof first?.savedMealCoverPhoto === "string" ? first.savedMealCoverPhoto : undefined;
        })();

        const coverPhotoUrl =
          (data.coverPhotoUrl as string | undefined) || (data.coverPhoto as string | undefined) || coverFromFoods;

        const mealDescription = data.description as string | undefined;

        // Macro colors matching MealSavedCard
        const proteinColor = "#3DD6C6";
        const carbsColor = "#5B8CFF";
        const fatsColor = "#B46BFF";

        // Calculate macro ratios for nutrition bar
        const totalMacros = totalProtein + totalCarbs + totalFats;
        const proteinRatio = totalMacros > 0 ? Math.max(totalProtein / totalMacros, 0.08) : 0.33;
        const carbsRatio = totalMacros > 0 ? Math.max(totalCarbs / totalMacros, 0.08) : 0.33;
        const fatsRatio = totalMacros > 0 ? Math.max(totalFats / totalMacros, 0.08) : 0.33;
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

        return (
          <div className="space-y-4">
            {/* Meal Name - Read-only */}
            {mealTitle && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Meal Name</Label>
                <p className="text-foreground font-medium">{mealTitle}</p>
              </div>
            )}

            {/* Separator */}
            {mealTitle && <div className="border-t border-border pt-4" />}

            {/* Cover Photo - matching MealSavedCard expanded view */}
            <div className="relative h-40 overflow-hidden rounded-xl">
              {coverPhotoUrl ? (
                <img src={coverPhotoUrl} alt={mealTitle} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                  <Utensils size={40} className="text-primary/50" />
                </div>
              )}
              {/* Bottom gradient for soft edge */}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
            </div>

            {/* Description */}
            {mealDescription && <p className="text-sm text-muted-foreground">{mealDescription}</p>}

            {/* Nutrition Summary Bar - matching MealSavedCard */}
            <div className="relative w-full h-14 rounded-xl overflow-hidden shadow-lg shadow-black/30">
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
                    left: "5%",
                    top: "-20%",
                  }}
                  animate={{
                    x: [0, 15, -10, 5, 0],
                    y: [0, -10, 15, -5, 0],
                    scale: [1, 1.1, 0.95, 1.05, 1],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
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
                    right: "10%",
                    top: "-30%",
                  }}
                  animate={{
                    x: [0, -20, 10, -5, 0],
                    y: [0, 15, -10, 5, 0],
                    scale: [1, 0.95, 1.1, 0.98, 1],
                  }}
                  transition={{
                    duration: 9,
                    repeat: Infinity,
                    ease: "easeInOut",
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
                    left: "30%",
                    bottom: "-50%",
                  }}
                  animate={{
                    x: [0, 10, -15, 8, 0],
                    y: [0, -15, 10, -8, 0],
                    scale: [1, 1.08, 0.92, 1.04, 1],
                  }}
                  transition={{
                    duration: 7,
                    repeat: Infinity,
                    ease: "easeInOut",
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
                  boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.12)",
                }}
              />

              {/* Border overlay */}
              <div
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              />

              {/* Content - horizontal layout matching Log Meal button */}
              <div className="relative z-10 flex items-center h-full px-4">
                {/* Left: Icon + Count */}
                <div className="flex items-center gap-2 text-white">
                  <Utensils size={20} />
                  <span className="font-semibold">{mealFoods.length}</span>
                </div>

                {/* Center: Macros (absolutely positioned for true centering) */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 text-sm">
                  <span style={{ color: proteinColor }}>P {Math.round(totalProtein)}g</span>
                  <span style={{ color: carbsColor }}>C {Math.round(totalCarbs)}g</span>
                  <span style={{ color: fatsColor }}>F {Math.round(totalFats)}g</span>
                </div>

                {/* Right: Calories */}
                <div className="ml-auto text-sm text-white">
                  <span>{Math.round(totalCalories)} cal</span>
                </div>
              </div>
            </div>

            {/* Food Items - matching MealSavedCard expanded view */}
            <div className="space-y-2">
              {mealFoods.map((food, idx) => {
                const p = food.protein || 0;
                const c = food.carbs || 0;
                const f = food.fats || 0;
                const total = p + c + f;
                const itemPPct = total > 0 ? (p / total) * 100 : 0;
                const itemCPct = total > 0 ? (c / total) * 100 : 0;

                return (
                  <div
                    key={food.id || idx}
                    className="rounded-xl bg-muted/30 border border-border/50 relative overflow-hidden"
                  >
                    {/* Macro gradient bar at top */}
                    {total > 0 && (
                      <div
                        className="absolute left-0 right-0 top-0 h-1"
                        style={{
                          background: `linear-gradient(90deg, #3DD6C6 0%, #3DD6C6 ${itemPPct * 0.7}%, #5B8CFF ${itemPPct + itemCPct * 0.3}%, #5B8CFF ${itemPPct + itemCPct * 0.7}%, #B46BFF ${itemPPct + itemCPct + (100 - itemPPct - itemCPct) * 0.3}%, #B46BFF 100%)`,
                        }}
                      />
                    )}
                    <div className="p-3 pt-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-primary">
                          {(() => {
                            const servings = food.servings ?? 1;
                            const servingSize = food.servingSize || "g";
                            // If servingSize already contains a number (e.g. "100 g"), don't prepend servings
                            const hasNumber = /\d/.test(servingSize);
                            if (hasNumber) {
                              return servings > 1 ? `${servings} × ${servingSize}` : servingSize;
                            }
                            return `${servings}${servingSize}`;
                          })()}
                        </span>
                        <span className="font-medium text-foreground text-sm">{food.name}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-foreground">{Math.round(food.calories || 0)} cal</span>
                        <div className="flex items-center gap-2 text-xs">
                          <span style={{ color: "#3DD6C6" }}>P: {Math.round(p)}g</span>
                          <span style={{ color: "#5B8CFF" }}>C: {Math.round(c)}g</span>
                          <span style={{ color: "#B46BFF" }}>F: {Math.round(f)}g</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case "recipe":
        return (
          <div className="space-y-4">
            {/* Recipe Name - Read-only */}
            {recipeTitle && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Recipe Name</Label>
                <p className="text-foreground font-medium">{recipeTitle}</p>
              </div>
            )}

            {/* Separator */}
            {recipeTitle && <div className="border-t border-border pt-3" />}

            {data.description && <p className="text-xs text-muted-foreground">{data.description as string}</p>}
            <div className="flex gap-3 text-xs text-muted-foreground">
              {data.prepTime && <span>Prep: {data.prepTime as string}</span>}
              {data.cookTime && <span>Cook: {data.cookTime as string}</span>}
              {data.servings && <span>Servings: {data.servings as string}</span>}
            </div>
            {Array.isArray(data.ingredients) && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Ingredients</p>
                {(
                  data.ingredients as Array<{
                    id: string;
                    name: string;
                    calories: number;
                    servings?: number;
                    servingSize?: string;
                  }>
                ).map((ing) => (
                  <div key={ing.id} className="p-2 rounded-lg bg-card border border-border text-sm">
                    <span>{ing.name}</span>
                    {ing.servings && ing.servingSize && (
                      <span className="text-xs text-primary ml-2">
                        ({ing.servings} × {ing.servingSize})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "routine":
        return (
          <div className="space-y-4">
            {/* Routine Name - Read-only */}
            {routineTitle && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Routine Name</Label>
                <p className="text-foreground font-medium">{routineTitle}</p>
              </div>
            )}

            {/* Separator */}
            {routineTitle && <div className="border-t border-border pt-3" />}

            {/* Schedule display if available */}
            {data.selectedDays && Array.isArray(data.selectedDays) && (
              <div className="flex flex-wrap gap-2">
                {(data.selectedDays as string[]).map((day) => (
                  <span key={day} className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    {day}
                  </span>
                ))}
              </div>
            )}

            {/* Exercises */}
            {Array.isArray(data.exercises) && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Exercises</p>
                {(
                  data.exercises as Array<{
                    name: string;
                    muscleGroup?: string;
                    sets?: Array<{ reps?: number; weight?: number }>;
                  }>
                ).map((exercise, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-card border border-border">
                    <h4 className="font-medium text-foreground">{exercise.name}</h4>
                    {exercise.muscleGroup && (
                      <p className="text-xs text-muted-foreground mt-0.5">{exercise.muscleGroup}</p>
                    )}
                    {exercise.sets && exercise.sets.length > 0 && (
                      <p className="text-xs text-primary mt-1">
                        {exercise.sets.length} set{exercise.sets.length > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "group":
        return (
          <div className="space-y-3">
            {data.name && <p className="font-semibold text-foreground">{data.name as string}</p>}
            {data.description && <p className="text-sm text-muted-foreground">{data.description as string}</p>}
            {data.visibility && (
              <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground inline-block">
                {data.visibility as string}
              </span>
            )}
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const returnTo = state?.returnTo || "/";
                navigate(returnTo, {
                  state: {
                    restored: true,
                    contentData: state?.contentData,
                    images: images,
                  },
                  replace: true,
                });
              }}
            >
              <ArrowLeft size={24} />
            </Button>
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getContentTypeIcon()} flex items-center justify-center`}
              >
                <Globe size={20} className="text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">Share {getContentTypeLabel()}</h1>
            </div>
          </div>
        </div>

        {/* Photos Section - Now at top and bigger */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2">
            <Label>Photos</Label>
            {fromSelection && <span className="text-xs text-muted-foreground">(At least one photo is required)</span>}
          </div>

          {/* Hidden file input */}
          <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />

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
        </div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-3 mb-6 overflow-hidden"
        >
          <Textarea
            id="description"
            placeholder="Type a caption and share your awesomeness..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="resize-none focus:ring-0 focus:ring-offset-0"
          />
        </motion.div>

        {/* Content Details Dropdown - Only show if there's actual content data */}
        {state?.contentData &&
          Object.keys(state.contentData).length > 0 &&
          !isPostType &&
          (() => {
            return (
              <div className="mb-6">
                <motion.button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full p-4 rounded-xl bg-card border border-border flex items-center justify-between"
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">View {getContentTypeLabel()} Details</span>
                  </div>
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
            );
          })()}
      </motion.div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="flex gap-3 items-center">
          {/* Static Public Visibility Indicator */}
          <div className="flex-1 h-14 flex items-center gap-3 px-4 rounded-xl border border-border bg-card">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Globe size={18} className="text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-foreground">Public</span>
              <span className="text-xs text-muted-foreground">Anyone can see this post</span>
            </div>
          </div>

          {/* Send Button - Small circle on right */}
          <Button
            className="w-14 h-14 rounded-full p-0 glow-primary flex-shrink-0"
            onClick={handleSubmit}
            disabled={isSubmitting || (fromSelection && images.length === 0)}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </Button>
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
