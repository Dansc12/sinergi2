import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Image, X, Globe, Users, Camera, ChevronDown, ChevronUp, Sparkles, Loader2, Tag, Plus, HelpCircle, Utensils, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Visibility = "public" | "friends" | "private" | "direct" | null;

interface LocationState {
  contentType: string;
  contentData: Record<string, unknown>;
  images?: string[];
  returnTo?: string;
  routineInstanceId?: string;
  directShareGroups?: string[];
  directShareUsers?: string[];
  directShareGroupNames?: string[];
  directShareUserNames?: string[];
  visibility?: Visibility;
}

const visibilityOptions = [
  { value: "public" as Visibility, label: "Public", icon: Globe, description: "Share with everyone" },
  { value: "friends" as Visibility, label: "Friends Only", icon: Users, description: "Share with friends" },
  { value: "direct" as Visibility, label: "Send Directly", icon: Send, description: "Send to specific people or groups" },
];

const SharePostScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const { createPost } = usePosts();

  const isPostType = state?.contentType === "post";
  const fromSelection = (state as LocationState & { fromSelection?: boolean })?.fromSelection;

  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>(state?.visibility ?? null);
  const [images, setImages] = useState<string[]>(state?.images || []);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Direct share state
  const [directShareGroups, setDirectShareGroups] = useState<string[]>(state?.directShareGroups || []);
  const [directShareUsers, setDirectShareUsers] = useState<string[]>(state?.directShareUsers || []);
  const [directShareGroupNames, setDirectShareGroupNames] = useState<string[]>(state?.directShareGroupNames || []);
  const [directShareUserNames, setDirectShareUserNames] = useState<string[]>(state?.directShareUserNames || []);
  
  // Update direct share state and visibility when returning from selection screen
  useEffect(() => {
    if (state?.directShareGroups) setDirectShareGroups(state.directShareGroups);
    if (state?.directShareUsers) setDirectShareUsers(state.directShareUsers);
    if (state?.directShareGroupNames) setDirectShareGroupNames(state.directShareGroupNames);
    if (state?.directShareUserNames) setDirectShareUserNames(state.directShareUserNames);
    if (state?.visibility !== undefined) setVisibility(state.visibility);
  }, [state?.directShareGroups, state?.directShareUsers, state?.directShareGroupNames, state?.directShareUserNames, state?.visibility]);
  
  // Workout-specific state
  const isWorkout = state?.contentType === "workout";
  const [workoutTitle, setWorkoutTitle] = useState((state?.contentData?.title as string) || "");
  const [workoutTags, setWorkoutTags] = useState<string[]>((state?.contentData?.tags as string[]) || []);
  const [newTag, setNewTag] = useState("");
  const [showTagsInfo, setShowTagsInfo] = useState(false);
  
  // Saved Meal-specific state
  const isSavedMeal = state?.contentType === "meal";
  const [mealTitle, setMealTitle] = useState((state?.contentData?.name as string) || "");
  const [mealTags, setMealTags] = useState<string[]>((state?.contentData?.tags as string[]) || []);
  const [newMealTag, setNewMealTag] = useState("");
  const [showMealTagsInfo, setShowMealTagsInfo] = useState(false);
  
  // Recipe-specific state
  const isRecipe = state?.contentType === "recipe";
  const [recipeTitle, setRecipeTitle] = useState((state?.contentData?.title as string) || "");
  const [recipeTags, setRecipeTags] = useState<string[]>((state?.contentData?.tags as string[]) || []);
  const [newRecipeTag, setNewRecipeTag] = useState("");
  const [showRecipeTagsInfo, setShowRecipeTagsInfo] = useState(false);
  
  // Routine-specific state
  const isRoutine = state?.contentType === "routine";
  const [routineTitle, setRoutineTitle] = useState((state?.contentData?.routineName as string) || "");
  const [routineTags, setRoutineTags] = useState<string[]>((state?.contentData?.tags as string[]) || []);
  const [newRoutineTag, setNewRoutineTag] = useState("");
  const [showRoutineTagsInfo, setShowRoutineTagsInfo] = useState(false);
  
  // Get auto-generated name for placeholder - show it as editable default value
  const getAutoGeneratedPlaceholder = () => {
    return "Give your workout a unique name...";
  };
  
  // Initialize workout title with the auto-generated name if user hasn't customized it
  const originalTitle = state?.contentData?.title as string;
  const isOriginalAutoGenerated = originalTitle && ["Morning Workout", "Afternoon Workout", "Evening Workout", "Night Workout", "Untitled Workout"].some(
    name => originalTitle.toLowerCase().trim() === name.toLowerCase()
  );
  
  // Auto-generated workout names that should require a custom name
  const autoGeneratedNames = [
    "Morning Workout",
    "Afternoon Workout", 
    "Evening Workout",
    "Night Workout",
    "Untitled Workout",
    "",
  ];
  
  const isAutoGeneratedName = autoGeneratedNames.some(
    name => workoutTitle.toLowerCase().trim() === name.toLowerCase()
  );
  
  // Auto-generated meal names that should require a custom name
  const autoGeneratedMealNames = [
    "Saved Meal",
    "Untitled Meal",
    "",
  ];
  
  const isAutoGeneratedMealName = autoGeneratedMealNames.some(
    name => mealTitle.toLowerCase().trim() === name.toLowerCase()
  );

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

  const addTag = () => {
    const trimmedTag = newTag.trim().toLowerCase();
    if (trimmedTag && !workoutTags.includes(trimmedTag) && workoutTags.length < 5) {
      setWorkoutTags([...workoutTags, trimmedTag]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setWorkoutTags(workoutTags.filter(tag => tag !== tagToRemove));
  };

  const addMealTag = () => {
    const trimmedTag = newMealTag.trim().toLowerCase();
    if (trimmedTag && !mealTags.includes(trimmedTag) && mealTags.length < 5) {
      setMealTags([...mealTags, trimmedTag]);
      setNewMealTag("");
    }
  };

  const removeMealTag = (tagToRemove: string) => {
    setMealTags(mealTags.filter(tag => tag !== tagToRemove));
  };

  const addRecipeTag = () => {
    const trimmedTag = newRecipeTag.trim().toLowerCase();
    if (trimmedTag && !recipeTags.includes(trimmedTag) && recipeTags.length < 5) {
      setRecipeTags([...recipeTags, trimmedTag]);
      setNewRecipeTag("");
    }
  };

  const removeRecipeTag = (tagToRemove: string) => {
    setRecipeTags(recipeTags.filter(tag => tag !== tagToRemove));
  };

  const addRoutineTag = () => {
    const trimmedTag = newRoutineTag.trim().toLowerCase();
    if (trimmedTag && !routineTags.includes(trimmedTag) && routineTags.length < 5) {
      setRoutineTags([...routineTags, trimmedTag]);
      setNewRoutineTag("");
    }
  };

  const removeRoutineTag = (tagToRemove: string) => {
    setRoutineTags(routineTags.filter(tag => tag !== tagToRemove));
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

    // Check if user has selected any visibility option
    const hasAnySelection = isSharing || hasDirectRecipients;
    
    if (!hasAnySelection) {
      toast({ 
        title: "Select visibility", 
        description: "Please choose how you'd like to share this content.",
        variant: "destructive"
      });
      return;
    }

    // Validation for workouts when sharing (not private)
    if (isWorkout && hasAnySelection) {
      if (!workoutTitle.trim() || isAutoGeneratedName) {
        toast({ 
          title: "Workout name required", 
          description: "Please give your workout a custom name before sharing.",
          variant: "destructive"
        });
        return;
      }
      if (workoutTags.length === 0) {
        toast({ 
          title: "Tags required", 
          description: "Please add at least one tag to help others find your workout.",
          variant: "destructive"
        });
        return;
      }
    }

    // Validation for saved meals when sharing (not private)
    if (isSavedMeal && hasAnySelection) {
      if (!mealTitle.trim() || isAutoGeneratedMealName) {
        toast({ 
          title: "Meal name required", 
          description: "Please give your meal a custom name before sharing.",
          variant: "destructive"
        });
        return;
      }
      if (mealTags.length === 0) {
        toast({ 
          title: "Tags required", 
          description: "Please add at least one tag to help others find your meal.",
          variant: "destructive"
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // For workouts, include the updated title and tags in content_data
      let contentData = state?.contentData || {};
      if (isWorkout) {
        contentData = { ...contentData, title: workoutTitle, tags: workoutTags };
      } else if (isSavedMeal) {
        contentData = { ...contentData, name: mealTitle, tags: mealTags };
      } else if (isRecipe) {
        contentData = { ...contentData, title: recipeTitle, tags: recipeTags };
      } else if (isRoutine) {
        contentData = { ...contentData, routineName: routineTitle, tags: routineTags };
      }

      // Update the original creation with the modified name/tags
      const originalId = state?.contentData?.id as string | undefined;
      if (originalId) {
        if (isWorkout) {
          // Update workout_logs with the new title (stored in exercises JSON or notes)
          const { data: existingWorkout } = await supabase
            .from("workout_logs")
            .select("exercises")
            .eq("id", originalId)
            .single();
          
          if (existingWorkout) {
            // Store title and tags in the exercises JSON structure
            const updatedExercises = {
              ...(typeof existingWorkout.exercises === 'object' ? existingWorkout.exercises : {}),
              _metadata: { title: workoutTitle, tags: workoutTags }
            };
            await supabase
              .from("workout_logs")
              .update({ exercises: updatedExercises })
              .eq("id", originalId);
          }
        } else if (isSavedMeal || isRecipe) {
          // Update the saved_meal post with new name/tags
          const postId = state?.contentData?.postId as string | undefined;
          if (postId) {
            const { data: existingPost } = await supabase
              .from("posts")
              .select("content_data")
              .eq("id", postId)
              .single();
            
            if (existingPost) {
              const existingData = existingPost.content_data as Record<string, unknown>;
              const updatedData = isSavedMeal 
                ? { ...existingData, name: mealTitle, tags: mealTags }
                : { ...existingData, title: recipeTitle, tags: recipeTags };
              await supabase
                .from("posts")
                .update({ content_data: updatedData })
                .eq("id", postId);
            }
          }
        } else if (isRoutine) {
          // Update scheduled_routines with the new name/tags
          const routineIds = state?.contentData?.routineIds as string[] | undefined;
          if (routineIds && routineIds.length > 0) {
            const { data: existingRoutine } = await supabase
              .from("scheduled_routines")
              .select("routine_data")
              .eq("id", routineIds[0])
              .single();
            
            if (existingRoutine) {
              const existingData = existingRoutine.routine_data as Record<string, unknown>;
              const updatedData = { ...existingData, tags: routineTags };
              
              // Update all routine entries with the new name and tags
              for (const routineId of routineIds) {
                await supabase
                  .from("scheduled_routines")
                  .update({ 
                    routine_name: routineTitle,
                    routine_data: updatedData 
                  })
                  .eq("id", routineId);
              }
            }
          }
        }
      }

      // Create post if sharing publicly or with friends or directly
      let postId: string | undefined;
      if (visibility === "public" || visibility === "friends" || hasDirectRecipients) {
        const post = await createPost({
          content_type: state?.contentType || "post",
          content_data: contentData,
          description: description || undefined,
          images: images,
          visibility: hasDirectRecipients && !isSharing ? "private" : (visibility || "private"),
        });
        postId = post?.id;
      }

      // Handle direct sharing to groups and users
      if ((directShareGroups.length > 0 || directShareUsers.length > 0) && postId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Create shared_posts entries for each group
          for (const groupId of directShareGroups) {
            await supabase.from("shared_posts").insert({
              post_id: postId,
              sender_id: user.id,
              recipient_group_id: groupId,
              message: description || null,
            });
          }
          
          // Create shared_posts entries for each user
          for (const userId of directShareUsers) {
            await supabase.from("shared_posts").insert({
              post_id: postId,
              sender_id: user.id,
              recipient_user_id: userId,
              message: description || null,
            });
          }
        }
      }

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

      // Show appropriate toast message
      const hasDirectShare = directShareGroups.length > 0 || directShareUsers.length > 0;
      const hasFeedShare = visibility === "public" || visibility === "friends";
      
      let toastMessage = "";
      if (hasDirectShare && hasFeedShare) {
        toastMessage = `Shared to feed and sent directly!`;
      } else if (hasDirectShare) {
        toastMessage = `Sent to ${directShareGroups.length + directShareUsers.length} recipient(s)!`;
      } else if (visibility === "private") {
        toastMessage = `Your ${label.toLowerCase()} has been saved privately.`;
      } else {
        toastMessage = `Your ${label.toLowerCase()} is now live.`;
      }

      toast({ 
        title: `${label} shared!`, 
        description: toastMessage
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
    if (!visibility) return null;
    return visibilityOptions.find((opt) => opt.value === visibility) || null;
  };

  const hasDirectRecipients = directShareGroups.length > 0 || directShareUsers.length > 0;
  const isSharing = visibility === "public" || visibility === "friends";
  const showDescription = true; // Always show caption section

  // Render content details based on content type
  const renderContentDetails = () => {
    const data = state?.contentData;
    if (!data) return null;

    switch (state?.contentType) {
      case "workout":
        return (
          <div className="space-y-4">
            {/* Workout Name - Inside details for workouts being shared */}
            {(isSharing || hasDirectRecipients) && (
              <div className="space-y-2">
                <Label htmlFor="workoutTitleDetails" className="flex items-center gap-2 text-sm">
                  Workout Name
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="workoutTitleDetails"
                  placeholder={getAutoGeneratedPlaceholder()}
                  value={workoutTitle}
                  onChange={(e) => setWorkoutTitle(e.target.value)}
                />
              </div>
            )}

            {/* Tags - Inside details for workouts being shared */}
            {(isSharing || hasDirectRecipients) && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Tag size={14} />
                  <button 
                    type="button"
                    onClick={() => setShowTagsInfo(true)}
                    className="flex items-center gap-1 hover:text-primary transition-colors underline-offset-2 hover:underline"
                  >
                    Tags
                    <HelpCircle size={12} className="text-muted-foreground" />
                  </button>
                  <span className="text-destructive">*</span>
                  <span className="text-xs text-muted-foreground ml-1">({workoutTags.length}/5)</span>
                </Label>
                
                {/* Tag Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag (e.g., legs, push, strength)..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    maxLength={20}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={addTag}
                    disabled={!newTag.trim() || workoutTags.length >= 5}
                  >
                    <Plus size={18} />
                  </Button>
                </div>

                {/* Suggested Tags - Horizontal scrollable row */}
                <div className="flex items-center gap-2 relative isolate">
                  <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 bg-background pr-1 relative z-20">Suggested:</span>
                  <div className="relative flex-1 overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
                    <div className="flex gap-2 overflow-x-auto py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {["push", "pull", "legs", "upper", "lower", "full body", "strength", "hypertrophy", "cardio", "hiit"].map((suggestion) => (
                        !workoutTags.includes(suggestion) && (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => {
                              if (workoutTags.length < 5) {
                                setWorkoutTags([...workoutTags, suggestion]);
                              }
                            }}
                            className="text-xs px-2 py-0.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors whitespace-nowrap flex-shrink-0"
                          >
                            {suggestion}
                          </button>
                        )
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tags Display - Below suggested tags */}
                {workoutTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 min-h-[32px]">
                    <AnimatePresence>
                      {workoutTags.map((tag) => (
                        <motion.span
                          key={tag}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-destructive transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}

            {/* Separator between name/tags and exercises */}
            {Array.isArray(data.exercises) && (data.exercises as Array<unknown>).length > 0 && (
              <div className="border-t border-border pt-3">
                <p className="text-xs text-muted-foreground font-medium mb-3">Exercises</p>
              </div>
            )}

            {/* Exercise details - vertical list format */}
            <div className="space-y-3">
              {Array.isArray(data.exercises) && (() => {
                type SetType = "normal" | "warmup" | "failure" | "drop";
                type ExerciseType = { 
                  name: string; 
                  category?: string; 
                  muscleGroup?: string; 
                  supersetGroupId?: string; 
                  notes?: string;
                  isCardio?: boolean;
                  sets: Array<{ weight?: number; reps?: number; distance?: string; time?: string; completed?: boolean; setType?: SetType }> 
                };
                const exercises = data.exercises as ExerciseType[];
                const supersetColors = ["bg-cyan-500", "bg-amber-500", "bg-emerald-500", "bg-rose-500", "bg-sky-500"];
                
                // Helper to get set label matching Log Workout style
                const getSetLabel = (setType: SetType | undefined, normalSetNumber: number): string => {
                  switch (setType) {
                    case "warmup": return "W";
                    case "failure": return "F";
                    case "drop": return "D";
                    default: return String(normalSetNumber);
                  }
                };

                // Get styling for set type badge matching Log Workout
                const getSetBadgeStyle = (setType: SetType | undefined): string => {
                  switch (setType) {
                    case "warmup": return "bg-yellow-500/20 text-yellow-600";
                    case "failure": return "bg-red-500/20 text-red-600";
                    case "drop": return "bg-blue-500/20 text-blue-600";
                    default: return "bg-muted text-muted-foreground";
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
                exercises.forEach(ex => {
                  if (ex.supersetGroupId && !supersetGroups.has(ex.supersetGroupId)) {
                    supersetGroups.set(ex.supersetGroupId, groupIndex++);
                  }
                });

                return exercises.map((exercise, idx) => {
                  const supersetGroupIndex = exercise.supersetGroupId ? supersetGroups.get(exercise.supersetGroupId) : undefined;
                  const supersetColor = supersetGroupIndex !== undefined 
                    ? supersetColors[supersetGroupIndex % supersetColors.length]
                    : null;
                  
                  // Check if this is the first exercise in a superset group
                  const isFirstInSuperset = exercise.supersetGroupId && 
                    exercises.findIndex(e => e.supersetGroupId === exercise.supersetGroupId) === idx;
                  
                  // Count exercises in this superset
                  const supersetCount = exercise.supersetGroupId 
                    ? exercises.filter(e => e.supersetGroupId === exercise.supersetGroupId).length
                    : 0;

                  return (
                    <div 
                      key={idx} 
                      className="rounded-xl bg-card border border-border overflow-hidden"
                    >
                      <div className="flex">
                        {/* Left color bar for all superset exercises */}
                        {supersetColor && (
                          <div className={`w-1 ${supersetColor}`} />
                        )}
                        
                        <div className="flex-1 p-4 space-y-3">
                          {/* Exercise name and type */}
                          <div>
                            <h4 className="font-semibold text-foreground">{exercise.name}</h4>
                            {exercise.isCardio && (
                              <span className="text-xs text-muted-foreground">Cardio</span>
                            )}
                            {/* Notes - directly below exercise name */}
                            {exercise.notes && (
                              <p className="text-sm text-foreground italic mt-1">
                                {exercise.notes}
                              </p>
                            )}
                          </div>
                          
                          {/* Sets - row format */}
                          <div className="space-y-1.5">
                            {exercise.sets.map((set, setIdx) => {
                              const normalSetNumber = getNormalSetNumber(exercise.sets, setIdx);
                              const setLabel = getSetLabel(set.setType, normalSetNumber);
                              const badgeStyle = getSetBadgeStyle(set.setType);
                              
                              return (
                                <div 
                                  key={setIdx}
                                  className="flex items-center gap-3 py-1"
                                >
                                  {/* Set type/# badge - matching Log Workout style */}
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-sm ${badgeStyle}`}>
                                    {setLabel}
                                  </div>
                                  
                                  {/* Weight/Distance and Reps/Time in boxes */}
                                  {exercise.isCardio ? (
                                    <>
                                      <div className="bg-muted/30 rounded-md px-3 py-1.5 flex items-center gap-1.5">
                                        <span className="text-sm font-medium text-foreground">{set.distance || '0'}</span>
                                        <span className="text-xs text-muted-foreground">mi</span>
                                      </div>
                                      <div className="bg-muted/30 rounded-md px-3 py-1.5">
                                        <span className="text-sm font-medium text-foreground">{set.time || '0:00'}</span>
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
        const mealFoods = Array.isArray(data.foods) ? data.foods as Array<{ id: string; name: string; calories: number; protein: number; carbs: number; fats: number; servings?: number; servingSize?: string }> : [];
        const totalCalories = (data.totalCalories as number) ?? mealFoods.reduce((sum, f) => sum + (f.calories || 0), 0);
        const totalProtein = (data.totalProtein as number) ?? mealFoods.reduce((sum, f) => sum + (f.protein || 0), 0);
        const totalCarbs = (data.totalCarbs as number) ?? mealFoods.reduce((sum, f) => sum + (f.carbs || 0), 0);
        const totalFats = (data.totalFats as number) ?? mealFoods.reduce((sum, f) => sum + (f.fats || 0), 0);

        // Cover photo comes from saved meal data (NOT the share-post photo list)
        const coverFromFoods = (() => {
          const first = mealFoods?.[0] as unknown as { savedMealCoverPhoto?: unknown } | undefined;
          return typeof first?.savedMealCoverPhoto === "string" ? first.savedMealCoverPhoto : undefined;
        })();

        const coverPhotoUrl =
          (data.coverPhotoUrl as string | undefined) ||
          (data.coverPhoto as string | undefined) ||
          coverFromFoods;

        const mealDescription = data.description as string | undefined;
        
        // Macro colors matching MealSavedCard
        const proteinColor = '#3DD6C6';
        const carbsColor = '#5B8CFF';
        const fatsColor = '#B46BFF';
        
        // Calculate macro ratios for nutrition bar
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
        
        return (
          <div className="space-y-4">
            {/* Meal Name - Inside details for meals being shared */}
            {(isSharing || hasDirectRecipients) && (
              <div className="space-y-2">
                <Label htmlFor="mealTitleDetails" className="flex items-center gap-2 text-sm">
                  Meal Name
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="mealTitleDetails"
                  placeholder="Give your meal a unique name..."
                  value={mealTitle}
                  onChange={(e) => setMealTitle(e.target.value)}
                />
              </div>
            )}

            {/* Tags - Inside details for meals being shared */}
            {(isSharing || hasDirectRecipients) && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Tag size={14} />
                  <button 
                    type="button"
                    onClick={() => setShowMealTagsInfo(true)}
                    className="flex items-center gap-1 hover:text-primary transition-colors underline-offset-2 hover:underline"
                  >
                    Tags
                    <HelpCircle size={12} className="text-muted-foreground" />
                  </button>
                  <span className="text-destructive">*</span>
                  <span className="text-xs text-muted-foreground ml-1">({mealTags.length}/5)</span>
                </Label>
                
                {/* Tag Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag (e.g., breakfast, high-protein, quick)..."
                    value={newMealTag}
                    onChange={(e) => setNewMealTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addMealTag();
                      }
                    }}
                    maxLength={20}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={addMealTag}
                    disabled={!newMealTag.trim() || mealTags.length >= 5}
                  >
                    <Plus size={18} />
                  </Button>
                </div>

                {/* Suggested Tags - Horizontal scrollable row */}
                <div className="flex items-center gap-2 relative isolate">
                  <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 bg-background pr-1 relative z-20">Suggested:</span>
                  <div className="relative flex-1 overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
                    <div className="flex gap-2 overflow-x-auto py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {["breakfast", "lunch", "dinner", "snack", "high-protein", "low-carb", "quick", "meal-prep", "healthy", "comfort-food"].map((suggestion) => (
                        !mealTags.includes(suggestion) && (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => {
                              if (mealTags.length < 5) {
                                setMealTags([...mealTags, suggestion]);
                              }
                            }}
                            className="text-xs px-2 py-0.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors whitespace-nowrap flex-shrink-0"
                          >
                            {suggestion}
                          </button>
                        )
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tags Display - Below suggested tags */}
                {mealTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 min-h-[32px]">
                    <AnimatePresence>
                      {mealTags.map((tag) => (
                        <motion.span
                          key={tag}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeMealTag(tag)}
                            className="ml-1 hover:text-destructive transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}

            {/* Separator between name/tags and expanded view */}
            {(isSharing || hasDirectRecipients) && (
              <div className="border-t border-border pt-4" />
            )}

            {/* Cover Photo - matching MealSavedCard expanded view */}
            <div className="relative h-40 overflow-hidden rounded-xl">
              {coverPhotoUrl ? (
                <img 
                  src={coverPhotoUrl} 
                  alt={mealTitle}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                  <Utensils size={40} className="text-primary/50" />
                </div>
              )}
              {/* Bottom gradient for soft edge */}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
            </div>

            {/* Description */}
            {mealDescription && (
              <p className="text-sm text-muted-foreground">
                {mealDescription}
              </p>
            )}

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
                            const servingSize = food.servingSize || 'g';
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
                          <span style={{ color: '#3DD6C6' }}>P: {Math.round(p)}g</span>
                          <span style={{ color: '#5B8CFF' }}>C: {Math.round(c)}g</span>
                          <span style={{ color: '#B46BFF' }}>F: {Math.round(f)}g</span>
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
            {/* Recipe Name - Inside details for recipes being shared */}
            {(isSharing || hasDirectRecipients) && (
              <div className="space-y-2">
                <Label htmlFor="recipeTitleDetails" className="flex items-center gap-2 text-sm">
                  Recipe Name
                </Label>
                <Input
                  id="recipeTitleDetails"
                  placeholder="Give your recipe a name..."
                  value={recipeTitle}
                  onChange={(e) => setRecipeTitle(e.target.value)}
                />
              </div>
            )}

            {/* Tags - Inside details for recipes being shared */}
            {(isSharing || hasDirectRecipients) && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Tag size={14} />
                  <button 
                    type="button"
                    onClick={() => setShowRecipeTagsInfo(true)}
                    className="flex items-center gap-1 hover:text-primary transition-colors underline-offset-2 hover:underline"
                  >
                    Tags
                    <HelpCircle size={12} className="text-muted-foreground" />
                  </button>
                  <span className="text-xs text-muted-foreground ml-1">({recipeTags.length}/5)</span>
                </Label>
                
                {/* Tag Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag (e.g., healthy, quick, vegan)..."
                    value={newRecipeTag}
                    onChange={(e) => setNewRecipeTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addRecipeTag();
                      }
                    }}
                    maxLength={20}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={addRecipeTag}
                    disabled={!newRecipeTag.trim() || recipeTags.length >= 5}
                  >
                    <Plus size={18} />
                  </Button>
                </div>

                {/* Suggested Tags */}
                <div className="flex items-center gap-2 relative isolate">
                  <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 bg-background pr-1 relative z-20">Suggested:</span>
                  <div className="relative flex-1 overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
                    <div className="flex gap-2 overflow-x-auto py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {["breakfast", "lunch", "dinner", "healthy", "quick", "vegan", "keto", "high-protein", "meal-prep", "comfort-food"].map((suggestion) => (
                        !recipeTags.includes(suggestion) && (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => {
                              if (recipeTags.length < 5) {
                                setRecipeTags([...recipeTags, suggestion]);
                              }
                            }}
                            className="text-xs px-2 py-0.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors whitespace-nowrap flex-shrink-0"
                          >
                            {suggestion}
                          </button>
                        )
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tags Display */}
                {recipeTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 min-h-[32px]">
                    <AnimatePresence>
                      {recipeTags.map((tag) => (
                        <motion.span
                          key={tag}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeRecipeTag(tag)}
                            className="ml-1 hover:text-destructive transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}

            {/* Separator */}
            {(isSharing || hasDirectRecipients) && (
              <div className="border-t border-border pt-3" />
            )}

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
          <div className="space-y-4">
            {/* Routine Name - Inside details for routines being shared */}
            {(isSharing || hasDirectRecipients) && (
              <div className="space-y-2">
                <Label htmlFor="routineTitleDetails" className="flex items-center gap-2 text-sm">
                  Routine Name
                </Label>
                <Input
                  id="routineTitleDetails"
                  placeholder="Give your routine a name..."
                  value={routineTitle}
                  onChange={(e) => setRoutineTitle(e.target.value)}
                />
              </div>
            )}

            {/* Tags - Inside details for routines being shared */}
            {(isSharing || hasDirectRecipients) && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Tag size={14} />
                  <button 
                    type="button"
                    onClick={() => setShowRoutineTagsInfo(true)}
                    className="flex items-center gap-1 hover:text-primary transition-colors underline-offset-2 hover:underline"
                  >
                    Tags
                    <HelpCircle size={12} className="text-muted-foreground" />
                  </button>
                  <span className="text-xs text-muted-foreground ml-1">({routineTags.length}/5)</span>
                </Label>
                
                {/* Tag Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag (e.g., strength, full body, beginner)..."
                    value={newRoutineTag}
                    onChange={(e) => setNewRoutineTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addRoutineTag();
                      }
                    }}
                    maxLength={20}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={addRoutineTag}
                    disabled={!newRoutineTag.trim() || routineTags.length >= 5}
                  >
                    <Plus size={18} />
                  </Button>
                </div>

                {/* Suggested Tags */}
                <div className="flex items-center gap-2 relative isolate">
                  <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 bg-background pr-1 relative z-20">Suggested:</span>
                  <div className="relative flex-1 overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
                    <div className="flex gap-2 overflow-x-auto py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {["push", "pull", "legs", "upper", "lower", "full body", "strength", "hypertrophy", "beginner", "advanced"].map((suggestion) => (
                        !routineTags.includes(suggestion) && (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => {
                              if (routineTags.length < 5) {
                                setRoutineTags([...routineTags, suggestion]);
                              }
                            }}
                            className="text-xs px-2 py-0.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors whitespace-nowrap flex-shrink-0"
                          >
                            {suggestion}
                          </button>
                        )
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tags Display */}
                {routineTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 min-h-[32px]">
                    <AnimatePresence>
                      {routineTags.map((tag) => (
                        <motion.span
                          key={tag}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeRoutineTag(tag)}
                            className="ml-1 hover:text-destructive transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}

            {/* Separator */}
            {(isSharing || hasDirectRecipients) && (
              <div className="border-t border-border pt-3" />
            )}

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
              // Include updated title and tags when navigating back
              let updatedContentData = state?.contentData;
              if (isWorkout) {
                updatedContentData = { ...updatedContentData, title: workoutTitle, tags: workoutTags };
              } else if (isSavedMeal) {
                updatedContentData = { ...updatedContentData, name: mealTitle, tags: mealTags };
              } else if (isRecipe) {
                updatedContentData = { ...updatedContentData, title: recipeTitle, tags: recipeTags };
              } else if (isRoutine) {
                updatedContentData = { ...updatedContentData, routineName: routineTitle, tags: routineTags };
              }
              navigate(returnTo, {
                state: {
                  restored: true,
                  contentData: updatedContentData,
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
          <div className="flex items-center gap-2">
            <Label>Photos</Label>
            {fromSelection && (
              <span className="text-xs text-muted-foreground">(At least one photo is required)</span>
            )}
          </div>
          
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
              <Textarea
                id="description"
                placeholder="Type a caption and share your awesomeness..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="resize-none focus:ring-0 focus:ring-offset-0"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Details Dropdown - Only show if there's actual content data */}
        {state?.contentData && Object.keys(state.contentData).length > 0 && (() => {
          const workoutNeedsAttention = isWorkout && (isSharing || hasDirectRecipients) && (!workoutTitle.trim() || isAutoGeneratedName || workoutTags.length === 0);
          const mealNeedsAttention = isSavedMeal && (isSharing || hasDirectRecipients) && (!mealTitle.trim() || isAutoGeneratedMealName || mealTags.length === 0);
          const needsAttention = workoutNeedsAttention || mealNeedsAttention;
          
          return (
          <div className="mb-6">
            <motion.button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full p-4 rounded-xl bg-card border border-border flex items-center justify-between"
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">View {getContentTypeLabel()} Details</span>
                {needsAttention && (
                  <span className="text-destructive">*</span>
                )}
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

      {/* Direct Share Recipients Indicator */}
      {hasDirectRecipients && (
        <div className="fixed bottom-24 left-0 right-0 px-4 z-40">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send size={16} className="text-blue-500" />
              <span className="text-sm">
                Sending to {[...directShareGroupNames, ...directShareUserNames].slice(0, 2).join(", ")}
                {(directShareGroups.length + directShareUsers.length) > 2 && ` +${(directShareGroups.length + directShareUsers.length) - 2} more`}
              </span>
            </div>
            <button 
              onClick={() => navigate("/direct-share", {
                state: {
                  shareState: { ...state, images, description },
                  selectedGroups: directShareGroups,
                  selectedUsers: directShareUsers,
                },
              })}
              className="text-xs text-blue-500 font-medium"
            >
              Edit
            </button>
          </div>
        </div>
      )}

      {/* Fixed Bottom Action Bar */}
      <div className={`fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent ${hasDirectRecipients ? 'pt-2' : ''}`}>
        <div className="flex gap-3 items-center">
          {/* Visibility Dropdown - Fills remaining space */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className={`flex-1 h-14 gap-2 border-border ${hasDirectRecipients ? "border-blue-500/50" : ""}`}
              >
                {(() => {
                  const directCount = directShareGroups.length + directShareUsers.length;
                  const opt = getCurrentVisibilityOption();
                  
                  // Both direct recipients AND visibility selected
                  if (hasDirectRecipients && isSharing && opt) {
                    const Icon = opt.icon;
                    return (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 text-blue-500">
                          <Send size={18} />
                          <span>{directCount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon size={18} />
                          <span>{opt.label}</span>
                        </div>
                      </div>
                    );
                  }
                  
                  // Only direct recipients (no feed visibility)
                  if (hasDirectRecipients) {
                    return (
                      <>
                        <Send size={18} className="text-blue-500" />
                        <span className="text-blue-500">
                          Sending to {directCount}
                        </span>
                      </>
                    );
                  }
                  
                  // Only visibility selected (no direct recipients)
                  if (opt) {
                    const Icon = opt.icon;
                    const descriptions: Record<string, string> = {
                      public: "Anyone can see this post",
                      friends: "Only your friends will see this",
                    };
                    return (
                      <div className="flex items-center gap-2 w-full">
                        <Icon size={18} className="flex-shrink-0" />
                        <div className="flex flex-col items-start text-left">
                          <span>{opt.label}</span>
                          {(opt.value === "public" || opt.value === "friends") && (
                            <span className="text-xs text-muted-foreground">
                              {descriptions[opt.value]}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }
                  
                  // Nothing selected yet
                  return (
                    <>
                      <ChevronDown size={18} className="text-muted-foreground" />
                      <span className="text-muted-foreground">Select visibility</span>
                    </>
                  );
                })()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="start" 
              className="w-80 p-2 bg-card border border-border"
              sideOffset={8}
            >
              {visibilityOptions
                .filter((option) => !isPostType || option.value !== "private")
                .map((option) => {
                  const Icon = option.icon;
                  // "direct" is selected if we have recipients, others match visibility
                  const isSelected = option.value === "direct" 
                    ? hasDirectRecipients 
                    : visibility === option.value;
                  const isSocial = option.value === "public" || option.value === "friends";
                  const isDirect = option.value === "direct";
                  
                  const descriptions: Record<string, string> = {
                    public: "Anyone can see this post in the public feed",
                    friends: "Only your friends will see this in their feed",
                    private: "Only you can see this - saved to your library",
                    direct: "Send directly to specific people or groups",
                  };
                  
                  const handleVisibilityClick = () => {
                    if (isDirect) {
                      // Navigate to direct share selection, preserving visibility
                      navigate("/direct-share", {
                        state: {
                          shareState: {
                            ...state,
                            images,
                            description,
                            visibility,
                          },
                          selectedGroups: directShareGroups,
                          selectedUsers: directShareUsers,
                        },
                      });
                    } else {
                      // Toggle visibility - deselect if already selected
                      setVisibility(visibility === option.value ? null : option.value);
                    }
                  };
                  
                  return (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={handleVisibilityClick}
                      className={`p-3 rounded-xl cursor-pointer transition-all mb-1 last:mb-0 ${
                        isSocial 
                          ? "bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 border border-primary/20" 
                          : isDirect
                            ? "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 border border-blue-500/20"
                            : "hover:bg-muted"
                      } ${isSelected ? "ring-2 ring-primary" : ""}`}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isSocial 
                            ? "bg-gradient-to-br from-primary to-accent text-primary-foreground" 
                            : isDirect
                              ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white"
                              : "bg-muted text-muted-foreground"
                        }`}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{option.label}</p>
                            {(isSocial || isDirect) && (
                              <Sparkles size={14} className={isDirect ? "text-blue-500" : "text-primary"} />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {descriptions[option.value]}
                          </p>
                          {isDirect && (directShareGroups.length > 0 || directShareUsers.length > 0) && (
                            <p className="text-xs text-blue-500 mt-1">
                              {[...directShareGroupNames, ...directShareUserNames].slice(0, 3).join(", ")}
                              {(directShareGroups.length + directShareUsers.length) > 3 && ` +${(directShareGroups.length + directShareUsers.length) - 3} more`}
                            </p>
                          )}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Send Button - Small circle on right */}
          <Button 
            className="w-14 h-14 rounded-full p-0 glow-primary flex-shrink-0" 
            onClick={handleSubmit}
            disabled={
              isSubmitting || 
              (fromSelection && images.length === 0) ||
              (isWorkout && (isSharing || hasDirectRecipients) && (!workoutTitle.trim() || isAutoGeneratedName || workoutTags.length === 0)) ||
              (isSavedMeal && (isSharing || hasDirectRecipients) && (!mealTitle.trim() || isAutoGeneratedMealName || mealTags.length === 0))
            }
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Send size={20} />
            )}
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

      {/* Tags Info Dialog */}
      <Dialog open={showTagsInfo} onOpenChange={setShowTagsInfo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag size={18} />
              What are Tags?
            </DialogTitle>
            <DialogDescription className="text-left space-y-3 pt-2">
              <p>
                Tags are keywords that describe your workout and make it easier for others to find.
              </p>
              <p>
                When you add tags like "push", "legs", or "strength", other users can search for these terms and discover your workout.
              </p>
              <p>
                Good tags help build community by connecting people with similar training styles and goals.
              </p>
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowTagsInfo(false)} className="mt-2">
            Got it!
          </Button>
        </DialogContent>
      </Dialog>

      {/* Meal Tags Info Dialog */}
      <Dialog open={showMealTagsInfo} onOpenChange={setShowMealTagsInfo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag size={18} />
              What are Tags?
            </DialogTitle>
            <DialogDescription className="text-left space-y-3 pt-2">
              <p>
                Tags are keywords that describe your meal and make it easier for others to find.
              </p>
              <p>
                When you add tags like "breakfast", "high-protein", or "quick", other users can search for these terms and discover your meal.
              </p>
              <p>
                Good tags help build community by connecting people with similar eating styles and goals.
              </p>
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowMealTagsInfo(false)} className="mt-2">
            Got it!
          </Button>
        </DialogContent>
      </Dialog>

      {/* Recipe Tags Info Dialog */}
      <Dialog open={showRecipeTagsInfo} onOpenChange={setShowRecipeTagsInfo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag size={18} />
              What are Tags?
            </DialogTitle>
            <DialogDescription className="text-left space-y-3 pt-2">
              <p>
                Tags are keywords that describe your recipe and make it easier for others to find.
              </p>
              <p>
                When you add tags like "healthy", "quick", or "vegan", other users can search for these terms and discover your recipe.
              </p>
              <p>
                Good tags help build community by connecting people with similar cooking styles and dietary preferences.
              </p>
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowRecipeTagsInfo(false)} className="mt-2">
            Got it!
          </Button>
        </DialogContent>
      </Dialog>

      {/* Routine Tags Info Dialog */}
      <Dialog open={showRoutineTagsInfo} onOpenChange={setShowRoutineTagsInfo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag size={18} />
              What are Tags?
            </DialogTitle>
            <DialogDescription className="text-left space-y-3 pt-2">
              <p>
                Tags are keywords that describe your routine and make it easier for others to find.
              </p>
              <p>
                When you add tags like "push", "legs", or "strength", other users can search for these terms and discover your routine.
              </p>
              <p>
                Good tags help build community by connecting people with similar training styles and goals.
              </p>
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowRoutineTagsInfo(false)} className="mt-2">
            Got it!
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SharePostScreen;
