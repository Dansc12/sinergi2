import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Dumbbell, Plus, Trash2, Camera, ChevronDown, ChevronUp, X, Check, Images, Bookmark, Compass, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import ExerciseSearchInput from "@/components/ExerciseSearchInput";
import { CameraCapture, PhotoChoiceDialog } from "@/components/CameraCapture";
import { usePhotoPicker } from "@/hooks/useCamera";
import PhotoGallerySheet from "@/components/PhotoGallerySheet";
import AutofillConfirmDialog from "@/components/workout/AutofillConfirmDialog";
import { SavedRoutine, PastWorkout, CommunityRoutine, CommunityWorkout } from "@/hooks/useSavedWorkouts";
import { usePosts } from "@/hooks/usePosts";
import { supabase } from "@/integrations/supabase/client";
import { useExerciseHistory } from "@/hooks/useExerciseHistory";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
type SetType = "normal" | "warmup" | "failure" | "drop";

interface Set {
  id: string;
  weight: string;
  reps: string;
  distance: string;
  time: string;
  completed: boolean;
  repRangeHint?: string; // Hint from routine for rep range
  setType?: SetType;
}

interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
  notes: string;
  sets: Set[];
  isExpanded: boolean;
  isCardio: boolean;
}

interface RestoredState {
  restored?: boolean;
  contentData?: { title?: string; exercises?: Exercise[] };
  images?: string[];
  prefilled?: boolean;
  routineName?: string;
  exercises?: Exercise[];
  routineInstanceId?: string;
  // From MySavedPage
  selectedRoutine?: SavedRoutine;
  selectedPastWorkout?: PastWorkout;
  // From DiscoverWorkoutsPage
  selectedCommunityRoutine?: CommunityRoutine;
  selectedCommunityWorkout?: CommunityWorkout;
}

const CreateWorkoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const restoredState = location.state as RestoredState | null;
  const { createPost } = usePosts();
  const { getLastExerciseData } = useExerciseHistory();
  
  const [title, setTitle] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isChoiceDialogOpen, setIsChoiceDialogOpen] = useState(false);
  const [isPhotoGalleryOpen, setIsPhotoGalleryOpen] = useState(false);
  const [routineInstanceId, setRoutineInstanceId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for pending autofill confirmation
  const [pendingAutofill, setPendingAutofill] = useState<{
    type: "routine" | "workout" | "communityRoutine" | "communityWorkout";
    data: SavedRoutine | PastWorkout | CommunityRoutine | CommunityWorkout;
    name: string;
  } | null>(null);

  const { inputRef, openPicker, handleFileChange } = usePhotoPicker((urls) => {
    setPhotos([...photos, ...urls]);
    toast({ title: "Photos added!", description: `${urls.length} photo(s) added.` });
  });

  // Restore state if coming back from share screen, prefilled from routine, or returning from My Saved/Discover pages
  useEffect(() => {
    if (restoredState?.restored) {
      if (restoredState.contentData?.title) setTitle(restoredState.contentData.title);
      if (restoredState.contentData?.exercises) setExercises(restoredState.contentData.exercises);
      if (restoredState.images) setPhotos(restoredState.images);
      if (restoredState.routineInstanceId) setRoutineInstanceId(restoredState.routineInstanceId);
      
      // Handle selections from MySavedPage
      if (restoredState.selectedRoutine) {
        const currentExercises = restoredState.contentData?.exercises || [];
        if (currentExercises.length > 0) {
          setPendingAutofill({ 
            type: "routine", 
            data: restoredState.selectedRoutine, 
            name: restoredState.selectedRoutine.routine_name 
          });
        } else {
          const newExercises = convertRoutineToExercises(restoredState.selectedRoutine.routine_data.exercises);
          setExercises(newExercises);
          setTitle(restoredState.selectedRoutine.routine_name);
          toast({ title: "Workout loaded!", description: `${newExercises.length} exercises added.` });
        }
      } else if (restoredState.selectedPastWorkout) {
        const currentExercises = restoredState.contentData?.exercises || [];
        if (currentExercises.length > 0) {
          setPendingAutofill({ 
            type: "workout", 
            data: restoredState.selectedPastWorkout, 
            name: restoredState.selectedPastWorkout.title 
          });
        } else {
          const newExercises = convertWorkoutToExercises(restoredState.selectedPastWorkout.exercises);
          setExercises(newExercises);
          setTitle(restoredState.selectedPastWorkout.title);
          toast({ title: "Workout loaded!", description: `${newExercises.length} exercises added.` });
        }
      }
      // Handle selections from DiscoverWorkoutsPage  
      else if (restoredState.selectedCommunityRoutine) {
        const currentExercises = restoredState.contentData?.exercises || [];
        if (currentExercises.length > 0) {
          setPendingAutofill({ 
            type: "communityRoutine", 
            data: restoredState.selectedCommunityRoutine, 
            name: restoredState.selectedCommunityRoutine.title 
          });
        } else {
          const newExercises = convertRoutineToExercises(restoredState.selectedCommunityRoutine.exercises as unknown as SavedRoutine["routine_data"]["exercises"]);
          setExercises(newExercises);
          setTitle(restoredState.selectedCommunityRoutine.title);
          toast({ title: "Workout loaded!", description: `${newExercises.length} exercises added.` });
        }
      } else if (restoredState.selectedCommunityWorkout) {
        const currentExercises = restoredState.contentData?.exercises || [];
        if (currentExercises.length > 0) {
          setPendingAutofill({ 
            type: "communityWorkout", 
            data: restoredState.selectedCommunityWorkout, 
            name: restoredState.selectedCommunityWorkout.title 
          });
        } else {
          const newExercises = convertWorkoutToExercises(restoredState.selectedCommunityWorkout.exercises);
          setExercises(newExercises);
          setTitle(restoredState.selectedCommunityWorkout.title);
          toast({ title: "Workout loaded!", description: `${newExercises.length} exercises added.` });
        }
      }
      
      window.history.replaceState({}, document.title);
    } else if (restoredState?.prefilled) {
      if (restoredState.routineName) setTitle(restoredState.routineName);
      if (restoredState.exercises) setExercises(restoredState.exercises);
      if (restoredState.routineInstanceId) setRoutineInstanceId(restoredState.routineInstanceId);
      window.history.replaceState({}, document.title);
    }
  }, []);

  const addExercise = async (exercise: { id: string; name: string; category: string; muscleGroup: string; isCardio?: boolean }) => {
    // Fetch historical data for this exercise
    const historicalSets = await getLastExerciseData(exercise.name);
    
    // Build sets based on history or default to one empty set
    const sets: Set[] = historicalSets.length > 0
      ? historicalSets.map((histSet, idx) => ({
          id: (Date.now() + idx).toString(),
          weight: histSet.weight || "",
          reps: histSet.reps || "",
          distance: histSet.distance || "",
          time: histSet.time || "",
          completed: false,
          setType: "normal" as SetType,
        }))
      : [{ id: "1", weight: "", reps: "", distance: "", time: "", completed: false, setType: "normal" as SetType }];

    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: exercise.name,
      category: exercise.category,
      muscleGroup: exercise.muscleGroup,
      notes: "",
      sets,
      isExpanded: true,
      isCardio: exercise.isCardio || false,
    };
    setExercises([...exercises, newExercise]);
    
    if (historicalSets.length > 0) {
      toast({ title: "Previous workout loaded", description: `Loaded ${historicalSets.length} sets from your last session.` });
    }
  };

  const removeExercise = (exerciseId: string) => {
    setExercises(exercises.filter((e) => e.id !== exerciseId));
  };

  const toggleExerciseExpand = (exerciseId: string) => {
    setExercises(
      exercises.map((e) =>
        e.id === exerciseId ? { ...e, isExpanded: !e.isExpanded } : e
      )
    );
  };

  const updateExerciseNotes = (exerciseId: string, notes: string) => {
    setExercises(
      exercises.map((e) =>
        e.id === exerciseId ? { ...e, notes } : e
      )
    );
  };

  const addSet = (exerciseId: string) => {
    setExercises(
      exercises.map((e) => {
        if (e.id === exerciseId) {
          // Get the last set to copy values from
          const lastSet = e.sets[e.sets.length - 1];
          const newSet: Set = {
            id: Date.now().toString(),
            weight: lastSet?.weight || "",
            reps: lastSet?.reps || "",
            distance: lastSet?.distance || "",
            time: lastSet?.time || "",
            completed: false,
            setType: "normal" as SetType,
          };
          return { ...e, sets: [...e.sets, newSet] };
        }
        return e;
      })
    );
  };

  const updateSetType = (exerciseId: string, setId: string, newType: SetType) => {
    setExercises(
      exercises.map((e) => {
        if (e.id === exerciseId) {
          return {
            ...e,
            sets: e.sets.map((s) =>
              s.id === setId ? { ...s, setType: newType } : s
            ),
          };
        }
        return e;
      })
    );
  };

  const getSetLabel = (set: Set, index: number): string => {
    switch (set.setType) {
      case "warmup":
        return "W";
      case "failure":
        return "F";
      case "drop":
        return "D";
      default:
        return String(index + 1);
    }
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setExercises(
      exercises.map((e) => {
        if (e.id === exerciseId && e.sets.length > 1) {
          return { ...e, sets: e.sets.filter((s) => s.id !== setId) };
        }
        return e;
      })
    );
  };

  const updateSet = (exerciseId: string, setId: string, field: keyof Set, value: string | boolean) => {
    setExercises(
      exercises.map((e) => {
        if (e.id === exerciseId) {
          return {
            ...e,
            sets: e.sets.map((s) =>
              s.id === setId ? { ...s, [field]: value } : s
            ),
          };
        }
        return e;
      })
    );
  };

  const toggleSetComplete = (exerciseId: string, setId: string) => {
    setExercises(
      exercises.map((e) => {
        if (e.id === exerciseId) {
          return {
            ...e,
            sets: e.sets.map((s) =>
              s.id === setId ? { ...s, completed: !s.completed } : s
            ),
          };
        }
        return e;
      })
    );
  };

  const handleBack = () => {
    navigate("/");
  };
  const handleCapturePhoto = (imageUrl: string) => {
    setPhotos([...photos, imageUrl]);
    toast({ title: "Photo added!", description: "Photo captured successfully." });
  };

  const handleSelectFromGallery = (imageUrls: string[]) => {
    setPhotos([...photos, ...imageUrls]);
    toast({ title: "Photos added!", description: `${imageUrls.length} photo(s) added.` });
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (exercises.length === 0) {
      toast({ title: "Please add at least one exercise", variant: "destructive" });
      return;
    }
    
    // Validate all sets have weight/distance and reps/time filled in
    for (const exercise of exercises) {
      for (const set of exercise.sets) {
        if (exercise.isCardio) {
          if (!set.distance.trim() || !set.time.trim()) {
            toast({ title: "Please fill in all sets", description: "Each set needs distance and time.", variant: "destructive" });
            return;
          }
        } else {
          if (!set.weight.trim() || !set.reps.trim()) {
            toast({ title: "Please fill in all sets", description: "Each set needs weight and reps.", variant: "destructive" });
            return;
          }
        }
      }
    }
    
    setIsSubmitting(true);
    try {
      await createPost({
        content_type: "workout",
        content_data: { title, exercises },
        images: photos,
        visibility: "private",
      });

      // If this workout was from a routine, mark the instance as completed
      if (routineInstanceId) {
        await supabase
          .from("routine_instances")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", routineInstanceId);
      }

      toast({ title: "Workout logged!", description: "Your workout has been saved." });
      navigate("/");
    } catch (error) {
      console.error("Error saving workout:", error);
      toast({ title: "Error", description: "Failed to save workout. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert routine exercises to workout exercises
  const convertRoutineToExercises = (routineExercises: SavedRoutine["routine_data"]["exercises"]): Exercise[] => {
    return routineExercises.map((ex, idx) => ({
      id: Date.now().toString() + idx,
      name: ex.name,
      category: ex.category,
      muscleGroup: ex.muscleGroup,
      notes: ex.notes || "",
      isExpanded: true,
      isCardio: false,
      sets: ex.sets.length > 0
        ? ex.sets.map((s, sIdx) => ({
            id: (Date.now() + sIdx).toString(),
            weight: "",
            reps: "",
            distance: "",
            time: "",
            completed: false,
            setType: "normal" as SetType,
            repRangeHint: s.minReps && s.maxReps ? `${s.minReps}-${s.maxReps}` : undefined,
          }))
        : [{ id: "1", weight: "", reps: "", distance: "", time: "", completed: false, setType: "normal" as SetType }],
    }));
  };

  // Convert past workout exercises (already in correct format)
  const convertWorkoutToExercises = (workoutExercises: PastWorkout["exercises"]): Exercise[] => {
    return workoutExercises.map((ex, idx) => ({
      ...ex,
      id: Date.now().toString() + idx,
      isExpanded: true,
      sets: ex.sets.map((s, sIdx) => ({
        ...s,
        id: (Date.now() + sIdx).toString(),
        completed: false,
        setType: (s as unknown as Set).setType || ("normal" as SetType),
      })),
    }));
  };

  // Handle autofill with confirmation if exercises exist
  const handleAutofill = (newExercises: Exercise[], name: string, shouldReplace: boolean) => {
    if (shouldReplace) {
      setExercises(newExercises);
      if (name) setTitle(name);
    } else {
      setExercises([...exercises, ...newExercises]);
    }
    toast({ title: "Workout loaded!", description: `${newExercises.length} exercises added.` });
  };

  // Navigation handlers for My Saved and Discover pages
  const handleNavigateToMySaved = () => {
    navigate("/workout/my-saved", {
      state: {
        returnTo: "/create/workout",
        currentExercises: exercises,
        title,
        photos,
        routineInstanceId,
      },
    });
  };

  const handleNavigateToDiscover = () => {
    navigate("/workout/discover", {
      state: {
        returnTo: "/create/workout",
        currentExercises: exercises,
        title,
        photos,
        routineInstanceId,
      },
    });
  };

  // Handle confirmation dialog actions
  const handleConfirmReplace = () => {
    if (!pendingAutofill) return;
    let newExercises: Exercise[] = [];
    
    if (pendingAutofill.type === "routine") {
      newExercises = convertRoutineToExercises((pendingAutofill.data as SavedRoutine).routine_data.exercises);
    } else if (pendingAutofill.type === "workout") {
      newExercises = convertWorkoutToExercises((pendingAutofill.data as PastWorkout).exercises);
    } else if (pendingAutofill.type === "communityRoutine") {
      newExercises = convertRoutineToExercises((pendingAutofill.data as CommunityRoutine).exercises as unknown as SavedRoutine["routine_data"]["exercises"]);
    } else if (pendingAutofill.type === "communityWorkout") {
      newExercises = convertWorkoutToExercises((pendingAutofill.data as CommunityWorkout).exercises);
    }
    
    handleAutofill(newExercises, pendingAutofill.name, true);
    setPendingAutofill(null);
  };

  const handleConfirmAdd = () => {
    if (!pendingAutofill) return;
    let newExercises: Exercise[] = [];
    
    if (pendingAutofill.type === "routine") {
      newExercises = convertRoutineToExercises((pendingAutofill.data as SavedRoutine).routine_data.exercises);
    } else if (pendingAutofill.type === "workout") {
      newExercises = convertWorkoutToExercises((pendingAutofill.data as PastWorkout).exercises);
    } else if (pendingAutofill.type === "communityRoutine") {
      newExercises = convertRoutineToExercises((pendingAutofill.data as CommunityRoutine).exercises as unknown as SavedRoutine["routine_data"]["exercises"]);
    } else if (pendingAutofill.type === "communityWorkout") {
      newExercises = convertWorkoutToExercises((pendingAutofill.data as CommunityWorkout).exercises);
    }
    
    handleAutofill(newExercises, "", false);
    setPendingAutofill(null);
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Dumbbell size={20} className="text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">Log Workout</h1>
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="rounded-full px-6">
            {isSubmitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
            Finish
          </Button>
        </div>

        {/* Workout Title */}
        <div className="mb-6">
          <Input
            placeholder="Workout name (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-semibold bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0"
          />
        </div>

        {/* Exercise Search */}
        <div className="mb-4">
          <ExerciseSearchInput
            onSelect={addExercise}
            placeholder="Add exercise..."
          />
        </div>

        {/* My Saved & Discover Buttons */}
        <div className="flex gap-3 mb-6">
          <Button
            variant="outline"
            className="flex-1 gap-2 h-12 rounded-xl border-border bg-card hover:bg-muted hover:border-primary/30 transition-colors"
            onClick={handleNavigateToMySaved}
          >
            <Bookmark size={18} className="text-primary" />
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

        {/* Exercises List */}
        <div className="space-y-4">
          <AnimatePresence>
            {exercises.map((exercise) => (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="rounded-2xl bg-card border border-border overflow-hidden"
              >
                {/* Exercise Header */}
                <div className="p-4 flex items-center justify-between">
                  <button
                    onClick={() => toggleExerciseExpand(exercise.id)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Dumbbell size={18} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{exercise.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {exercise.category} • {exercise.muscleGroup}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleExerciseExpand(exercise.id)}
                    >
                      {exercise.isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeExercise(exercise.id)}
                    >
                      <Trash2 size={18} className="text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* Exercise Content */}
                <AnimatePresence>
                  {exercise.isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      {/* Notes */}
                      <div className="px-4 pb-3">
                        <Textarea
                          placeholder="Add notes..."
                          value={exercise.notes}
                          onChange={(e) => updateExerciseNotes(exercise.id, e.target.value)}
                          className="min-h-[60px] bg-muted/50 border-0 resize-none text-sm"
                          rows={2}
                        />
                      </div>

                      {/* Sets Header */}
                      <div className="px-4 pb-2">
                        <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium">
                          <div className="col-span-2 text-center">SET</div>
                          <div className="col-span-4 text-center">{exercise.isCardio ? "DISTANCE" : "WEIGHT"}</div>
                          <div className="col-span-4 text-center">{exercise.isCardio ? "TIME" : "REPS"}</div>
                          <div className="col-span-2"></div>
                        </div>
                      </div>

                      {/* Sets List */}
                      <div className="px-4 pb-3 space-y-2">
                        {exercise.sets.map((set, index) => (
                          <motion.div
                            key={set.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg transition-colors ${
                              set.completed ? "bg-primary/20" : "bg-muted/30"
                            }`}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  onClick={() => toggleSetComplete(exercise.id, set.id)}
                                  className={`col-span-2 w-8 h-8 mx-auto rounded-full flex items-center justify-center font-semibold text-sm transition-colors relative ${
                                    set.completed
                                      ? "bg-primary text-primary-foreground"
                                      : set.setType === "warmup"
                                      ? "bg-yellow-500/20 text-yellow-600"
                                      : set.setType === "failure"
                                      ? "bg-red-500/20 text-red-600"
                                      : set.setType === "drop"
                                      ? "bg-blue-500/20 text-blue-600"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  <span className={set.completed ? "opacity-0" : "opacity-100"}>
                                    {getSetLabel(set, index)}
                                  </span>
                                  <AnimatePresence>
                                    {set.completed && (
                                      <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        className="absolute inset-0 flex items-center justify-center"
                                      >
                                        <Check size={16} className="text-primary-foreground" />
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-40">
                                <DropdownMenuItem 
                                  onClick={() => updateSetType(exercise.id, set.id, "normal")}
                                  className={set.setType === "normal" || !set.setType ? "bg-muted" : ""}
                                >
                                  Normal Set
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => updateSetType(exercise.id, set.id, "warmup")}
                                  className={set.setType === "warmup" ? "bg-yellow-500/20" : ""}
                                >
                                  <span className="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-600 flex items-center justify-center text-xs font-semibold mr-2">W</span>
                                  Warmup Set
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => updateSetType(exercise.id, set.id, "failure")}
                                  className={set.setType === "failure" ? "bg-red-500/20" : ""}
                                >
                                  <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-600 flex items-center justify-center text-xs font-semibold mr-2">F</span>
                                  Failure Set
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => updateSetType(exercise.id, set.id, "drop")}
                                  className={set.setType === "drop" ? "bg-blue-500/20" : ""}
                                >
                                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center text-xs font-semibold mr-2">D</span>
                                  Drop Set
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <div className="col-span-4">
                              <Input
                                placeholder={exercise.isCardio ? "miles" : "lbs"}
                                value={exercise.isCardio ? set.distance : set.weight}
                                onChange={(e) => updateSet(exercise.id, set.id, exercise.isCardio ? "distance" : "weight", e.target.value)}
                                className="text-center h-9 bg-background border-border"
                                type={exercise.isCardio ? "text" : "number"}
                              />
                            </div>
                            <div className="col-span-4 relative">
                              <Input
                                placeholder={exercise.isCardio ? "mm:ss" : (set.repRangeHint || "reps")}
                                value={exercise.isCardio ? set.time : set.reps}
                                onChange={(e) => updateSet(exercise.id, set.id, exercise.isCardio ? "time" : "reps", e.target.value)}
                                className={`text-center h-9 bg-background border-border ${set.repRangeHint && !set.reps ? "placeholder:text-primary/60" : ""}`}
                                type={exercise.isCardio ? "text" : "number"}
                              />
                            </div>
                            <div className="col-span-2 flex justify-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => removeSet(exercise.id, set.id)}
                                disabled={exercise.sets.length === 1}
                              >
                                <Trash2 size={14} className={exercise.sets.length === 1 ? "text-muted-foreground/30" : "text-destructive"} />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Add Set Button */}
                      <div className="px-4 pb-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => addSet(exercise.id)}
                        >
                          <Plus size={16} className="mr-1" />
                          Add Set
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {exercises.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Dumbbell size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">No exercises yet</p>
            <p className="text-sm">Search and add exercises above</p>
          </div>
        )}
      </motion.div>


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

      {/* Photo Gallery Sheet */}
      <PhotoGallerySheet
        isOpen={isPhotoGalleryOpen}
        onClose={() => setIsPhotoGalleryOpen(false)}
        photos={photos}
        onDeletePhoto={removePhoto}
      />


      {/* Autofill Confirmation Dialog */}
      <AutofillConfirmDialog
        open={!!pendingAutofill}
        onOpenChange={(open) => !open && setPendingAutofill(null)}
        onReplace={handleConfirmReplace}
        onAdd={handleConfirmAdd}
        onCancel={() => setPendingAutofill(null)}
        itemName={pendingAutofill?.name || ""}
      />
    </div>
  );
};

export default CreateWorkoutPage;
