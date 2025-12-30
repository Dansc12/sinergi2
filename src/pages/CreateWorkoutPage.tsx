import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Dumbbell, Plus, Trash2, Check, Bookmark, Compass, Loader2, ChevronDown, ChevronUp, X, MoreVertical, ArrowUpDown } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TagInput } from "@/components/TagInput";
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
  supersetGroupId?: string; // Optional: groups exercises into supersets
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
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [isExerciseSectionOpen, setIsExerciseSectionOpen] = useState(true);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showSupersetModal, setShowSupersetModal] = useState(false);
  const [supersetSourceExerciseId, setSupersetSourceExerciseId] = useState<string | null>(null);
  const [selectedSupersetExercises, setSelectedSupersetExercises] = useState<string[]>([]);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderingExerciseId, setReorderingExerciseId] = useState<string | null>(null);
  const [pendingReorderIndex, setPendingReorderIndex] = useState<number | null>(null);
  const [showIncompleteConfirm, setShowIncompleteConfirm] = useState(false);
  const [completedExerciseIds, setCompletedExerciseIds] = useState<string[]>([]);

  // Get the currently selected exercise
  const selectedExercise = exercises.find(e => e.id === selectedExerciseId);

  // Timer effect
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Format elapsed time
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
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

    const newExerciseId = Date.now().toString();
    const newExercise: Exercise = {
      id: newExerciseId,
      name: exercise.name,
      category: exercise.category,
      muscleGroup: exercise.muscleGroup,
      notes: "",
      sets,
      isExpanded: true,
      isCardio: exercise.isCardio || false,
    };
    setExercises([...exercises, newExercise]);
    setSelectedExerciseId(newExerciseId); // Auto-select the new exercise
    
    // Removed toast notification for adding exercise
  };

  const removeExercise = (exerciseId: string) => {
    const exerciseToRemove = exercises.find(e => e.id === exerciseId);
    let newExercises = exercises.filter((e) => e.id !== exerciseId);
    
    // Check if the removed exercise was in a superset
    if (exerciseToRemove?.supersetGroupId) {
      const groupId = exerciseToRemove.supersetGroupId;
      const remainingInSuperset = newExercises.filter(e => e.supersetGroupId === groupId);
      
      // If only 1 or 0 exercises remain in the superset, dissolve it
      if (remainingInSuperset.length <= 1) {
        newExercises = newExercises.map(e => 
          e.supersetGroupId === groupId ? { ...e, supersetGroupId: undefined } : e
        );
      }
    }
    
    setExercises(newExercises);
    // If we removed the selected exercise, select another one
    if (selectedExerciseId === exerciseId) {
      setSelectedExerciseId(newExercises.length > 0 ? newExercises[0].id : null);
    }
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

  const getSetLabel = (set: Set, normalSetIndex: number): string => {
    switch (set.setType) {
      case "warmup":
        return "W";
      case "failure":
        return "F";
      case "drop":
        return "D";
      default:
        return String(normalSetIndex);
    }
  };

  // Calculate the normal set number for a given set (only counts normal sets)
  const getNormalSetNumber = (sets: Set[], currentIndex: number): number => {
    let count = 0;
    for (let i = 0; i <= currentIndex; i++) {
      if (!sets[i].setType || sets[i].setType === "normal") {
        count++;
      }
    }
    return count;
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
            sets: e.sets.map((s) => {
              if (s.id === setId) {
                const updatedSet = { ...s, [field]: value };
                // If weight/reps/distance/time is cleared and set is complete, unmark it
                if (field === "weight" || field === "reps" || field === "distance" || field === "time") {
                  const strValue = value as string;
                  if (!strValue.trim() && s.completed) {
                    updatedSet.completed = false;
                  }
                }
                return updatedSet;
              }
              return s;
            }),
          };
        }
        return e;
      })
    );
  };

  const toggleSetComplete = (exerciseId: string, setId: string) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return;
    
    const set = exercise.sets.find(s => s.id === setId);
    if (!set) return;
    
    // If trying to mark as complete, validate that weight/reps (or distance/time for cardio) are filled
    if (!set.completed) {
      if (exercise.isCardio) {
        if (!set.distance.trim() || !set.time.trim()) {
          toast({ title: "Fill in distance and time", description: "Please enter values before marking complete.", variant: "destructive" });
          return;
        }
      } else {
        if (!set.weight.trim() || !set.reps.trim()) {
          toast({ title: "Fill in weight and reps", description: "Please enter values before marking complete.", variant: "destructive" });
          return;
        }
      }
    }
    
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
    if (exercises.length > 0) {
      setShowBackConfirm(true);
    } else {
      navigate("/");
    }
  };

  const confirmBack = () => {
    setShowBackConfirm(false);
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

  // Check if all sets are completed
  const areAllSetsCompleted = () => {
    return exercises.every(exercise => 
      exercise.sets.every(set => set.completed)
    );
  };

  const handleSubmit = async (forceSubmit = false) => {
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
    
    // Check if all sets are marked complete
    if (!forceSubmit && !areAllSetsCompleted()) {
      setShowIncompleteConfirm(true);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createPost({
        content_type: "workout",
        content_data: { title, exercises, tags },
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

      // Navigate home and show congrats popup
      navigate("/", {
        state: {
          showCongrats: true,
          contentType: "workout",
          contentData: { title, exercises, tags },
          images: photos,
        },
      });
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
      // Set title from routine/workout if no title exists yet
      if (name && !title) setTitle(name);
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
    
    // Pass the name so it can be used if no title exists
    handleAutofill(newExercises, pendingAutofill.name, false);
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
        <div className="flex items-center mb-6 relative">
          <Button variant="ghost" size="icon" onClick={handleBack} className="z-10">
            <ArrowLeft size={24} />
          </Button>
          <div className="absolute left-0 right-0 flex flex-col items-center pointer-events-none">
            <span className="text-xs text-muted-foreground">Time</span>
            <span className="text-2xl font-bold font-mono">{formatTime(elapsedSeconds)}</span>
          </div>
          <Button onClick={() => handleSubmit()} disabled={isSubmitting} className="rounded-full px-6 ml-auto z-10">
            {isSubmitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
            Finish
          </Button>
        </div>

        {/* Workout Title with Collapsible Toggle */}
        <Collapsible open={isExerciseSectionOpen} onOpenChange={setIsExerciseSectionOpen} className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Input
              placeholder="Workout name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 text-2xl font-semibold bg-transparent border-0 rounded-none px-0 focus-visible:ring-0"
            />
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                {isExerciseSectionOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
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

            {/* Exercise Search */}
            <ExerciseSearchInput
              onSelect={addExercise}
              placeholder="Add exercise..."
            />

            {/* My Saved & Discover Buttons */}
            <div className="flex gap-3">
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
          </CollapsibleContent>
        </Collapsible>
        
        {/* Divider after Add Exercises section */}
        <div className="border-b border-border mb-6" />

        {/* Selected Exercise Details */}
        {selectedExercise && (
          <motion.div
            key={selectedExercise.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            {/* Exercise Title & Actions */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Dumbbell size={18} className="text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">{selectedExercise.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedExercise.category} • {selectedExercise.muscleGroup}
                </p>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <Textarea
                placeholder="Add notes..."
                value={selectedExercise.notes}
                onChange={(e) => updateExerciseNotes(selectedExercise.id, e.target.value)}
                className="min-h-[60px] bg-muted/50 border-0 resize-none text-sm"
                rows={2}
              />
            </div>

            {/* Sets Header */}
            <div className="mb-2">
              <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium">
                <div className="col-span-2 text-center">SET</div>
                <div className="col-span-4 text-center">{selectedExercise.isCardio ? "DISTANCE" : "WEIGHT"}</div>
                <div className="col-span-4 text-center">{selectedExercise.isCardio ? "TIME" : "REPS"}</div>
                <div className="col-span-2"></div>
              </div>
            </div>

            {/* Sets List */}
            <div className="space-y-2 mb-4">
              {selectedExercise.sets.map((set, index) => {
                const normalSetNumber = getNormalSetNumber(selectedExercise.sets, index);

                return (
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
                          className={`col-span-2 w-8 h-8 mx-auto rounded-full flex items-center justify-center font-semibold text-sm transition-colors relative select-none ${
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
                            {getSetLabel(set, normalSetNumber)}
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
                      <DropdownMenuContent align="start" className="w-44">
                        <DropdownMenuItem 
                          onClick={() => updateSetType(selectedExercise.id, set.id, "normal")}
                          className={set.setType === "normal" || !set.setType ? "bg-muted" : ""}
                        >
                          Normal Set
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updateSetType(selectedExercise.id, set.id, "warmup")}
                          className={set.setType === "warmup" ? "bg-yellow-500/20" : ""}
                        >
                          <span className="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-600 flex items-center justify-center text-xs font-semibold mr-2">W</span>
                          Warmup Set
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updateSetType(selectedExercise.id, set.id, "failure")}
                          className={set.setType === "failure" ? "bg-red-500/20" : ""}
                        >
                          <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-600 flex items-center justify-center text-xs font-semibold mr-2">F</span>
                          Failure Set
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updateSetType(selectedExercise.id, set.id, "drop")}
                          className={set.setType === "drop" ? "bg-blue-500/20" : ""}
                        >
                          <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center text-xs font-semibold mr-2">D</span>
                          Drop Set
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => removeSet(selectedExercise.id, set.id)}
                          disabled={selectedExercise.sets.length === 1}
                          className={`text-destructive focus:text-destructive ${selectedExercise.sets.length === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <Trash2 size={14} className="mr-2" />
                          Delete Set
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="col-span-4 flex justify-center">
                      <Input
                        placeholder={selectedExercise.isCardio ? "miles" : "lbs"}
                        value={selectedExercise.isCardio ? set.distance : set.weight}
                        onChange={(e) => updateSet(selectedExercise.id, set.id, selectedExercise.isCardio ? "distance" : "weight", e.target.value)}
                        className="text-center h-9 bg-background border-border [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        type={selectedExercise.isCardio ? "text" : "number"}
                      />
                    </div>
                    <div className="col-span-4 flex justify-center relative">
                      <Input
                        placeholder={selectedExercise.isCardio ? "mm:ss" : (set.repRangeHint || "reps")}
                        value={selectedExercise.isCardio ? set.time : set.reps}
                        onChange={(e) => updateSet(selectedExercise.id, set.id, selectedExercise.isCardio ? "time" : "reps", e.target.value)}
                        className={`text-center h-9 bg-background border-border [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${set.repRangeHint && !set.reps ? "placeholder:text-primary/60" : ""}`}
                        type={selectedExercise.isCardio ? "text" : "number"}
                      />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleSetComplete(selectedExercise.id, set.id)}
                      >
                        <Check size={14} className={set.completed ? "text-primary" : "text-muted-foreground"} />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Add Set Button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-primary hover:text-primary hover:bg-primary/10"
              onClick={() => addSet(selectedExercise.id)}
            >
              <Plus size={16} className="mr-1" />
              Add Set
            </Button>
          </motion.div>
        )}

        {/* Empty State */}
        {exercises.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Dumbbell size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">No exercises yet</p>
            <p className="text-sm">Search and add exercises above</p>
          </div>
        )}
      </motion.div>

      {/* Exercise Cards Row - Fixed at Bottom */}
      {exercises.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-3 pb-6">
          <div className="relative">
            {/* Fade effect on left */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10" />
            {/* Fade effect on right */}
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10" />
            
            <div className="flex gap-3 overflow-x-auto no-scrollbar px-2">
              {exercises.map((exercise, index) => {
                const isSelected = selectedExerciseId === exercise.id;
                const completedSets = exercise.sets.filter(s => s.completed).length;
                const totalSets = exercise.sets.length;
                const supersetBarColor = exercise.supersetGroupId ? getSupersetBarColor(exercise.supersetGroupId) : null;
                const isAllSetsComplete = completedSets === totalSets && totalSets > 0;
                const justCompleted = isAllSetsComplete && completedExerciseIds.includes(exercise.id);
                
                // Check if exercise just completed all sets and trigger animation
                if (isAllSetsComplete && !completedExerciseIds.includes(exercise.id)) {
                  // Add to completed list after a microtask to avoid state update during render
                  setTimeout(() => {
                    setCompletedExerciseIds(prev => [...prev, exercise.id]);
                    // Remove from animation after 2 seconds
                    setTimeout(() => {
                      setCompletedExerciseIds(prev => prev.filter(id => id !== exercise.id));
                    }, 2000);
                  }, 0);
                }
                
                return (
                  <div
                    key={exercise.id}
                    className={`flex-shrink-0 rounded-xl transition-colors relative overflow-hidden ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                        : "bg-card border border-border text-foreground hover:border-primary/50"
                    }`}
                  >
                    {/* Completion animation overlay */}
                    <AnimatePresence>
                      {justCompleted && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ duration: 0.3 }}
                          className="absolute inset-0 bg-emerald-500/90 flex items-center justify-center z-20 rounded-xl"
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: [0, 1.3, 1] }}
                            transition={{ duration: 0.4, times: [0, 0.5, 1] }}
                          >
                            <Check size={32} className="text-white" strokeWidth={3} />
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {/* Superset colored bar on top */}
                    {supersetBarColor && (
                      <div className={`absolute left-0 right-0 top-0 h-1 ${supersetBarColor}`} />
                    )}
                    <button
                      onClick={() => setSelectedExerciseId(exercise.id)}
                      className={`px-4 py-3 pr-10 text-left ${supersetBarColor ? 'pt-4' : ''}`}
                    >
                      <div className="flex flex-col items-start gap-1 min-w-[100px]">
                        <span className={`text-xs ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {completedSets}/{totalSets} sets
                        </span>
                        <span className="font-medium text-sm truncate max-w-[120px]">{exercise.name}</span>
                      </div>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="absolute top-2 right-2 p-1 rounded-md hover:bg-muted/50">
                          <MoreVertical size={14} className={isSelected ? "text-primary-foreground" : "text-muted-foreground"} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-popover">
                        <DropdownMenuItem 
                          onClick={() => {
                            setReorderingExerciseId(exercise.id);
                            setPendingReorderIndex(index);
                            setShowReorderModal(true);
                          }}
                          disabled={exercises.length <= 1}
                          className={exercises.length <= 1 ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          <ArrowUpDown size={14} className="mr-2" />
                          Reorder Exercise
                        </DropdownMenuItem>
                        {exercise.supersetGroupId ? (
                          <DropdownMenuItem 
                            onClick={() => {
                              const groupId = exercise.supersetGroupId;
                              const remainingInSuperset = exercises.filter(
                                e => e.supersetGroupId === groupId && e.id !== exercise.id
                              );
                              
                              if (remainingInSuperset.length <= 1) {
                                setExercises(exercises.map(e => 
                                  e.supersetGroupId === groupId ? { ...e, supersetGroupId: undefined } : e
                                ));
                                toast({ title: "Superset dissolved", description: "A superset requires at least 2 exercises." });
                              } else {
                                setExercises(exercises.map(e => 
                                  e.id === exercise.id ? { ...e, supersetGroupId: undefined } : e
                                ));
                                toast({ title: "Removed from superset" });
                              }
                            }}
                          >
                            <X size={14} className="mr-2" />
                            Remove from Superset
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            onClick={() => {
                              if (exercises.length > 1) {
                                setSupersetSourceExerciseId(exercise.id);
                                setSelectedSupersetExercises([]);
                                setShowSupersetModal(true);
                              }
                            }}
                            disabled={exercises.length <= 1}
                            className={exercises.length <= 1 ? "opacity-50 cursor-not-allowed" : ""}
                          >
                            <Plus size={14} className="mr-2" />
                            Add to Superset
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => removeExercise(exercise.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 size={14} className="mr-2" />
                          Delete Exercise
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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

      {/* Back Confirmation Dialog */}
      <AlertDialog open={showBackConfirm} onOpenChange={setShowBackConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard workout?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to go back? Your workout data will be lost.
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

      {/* Superset Selection Modal */}
      <AlertDialog open={showSupersetModal} onOpenChange={setShowSupersetModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add to Superset</AlertDialogTitle>
            <AlertDialogDescription>
              Select which exercises to superset with {exercises.find(e => e.id === supersetSourceExerciseId)?.name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-2 max-h-60 overflow-y-auto">
            {exercises
              .filter(e => e.id !== supersetSourceExerciseId)
              .map((exercise) => {
                const supersetColor = exercise.supersetGroupId ? getSupersetBarColor(exercise.supersetGroupId) : null;
                return (
                  <button
                    key={exercise.id}
                    onClick={() => {
                      setSelectedSupersetExercises(prev => 
                        prev.includes(exercise.id) 
                          ? prev.filter(id => id !== exercise.id)
                          : [...prev, exercise.id]
                      );
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors relative overflow-hidden ${
                      selectedSupersetExercises.includes(exercise.id)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {supersetColor && (
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${supersetColor}`} />
                    )}
                    <div className={`flex items-center justify-between ${supersetColor ? "pl-3" : ""}`}>
                      <span className="font-medium">{exercise.name}</span>
                      {selectedSupersetExercises.includes(exercise.id) && (
                        <Check size={16} className="text-primary" />
                      )}
                    </div>
                  </button>
                );
              })}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowSupersetModal(false);
              setSupersetSourceExerciseId(null);
              setSelectedSupersetExercises([]);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (supersetSourceExerciseId && selectedSupersetExercises.length > 0) {
                  // Check if the source exercise is already in a superset
                  const sourceExercise = exercises.find(e => e.id === supersetSourceExerciseId);
                  const sourceGroupId = sourceExercise?.supersetGroupId;
                  
                  // Check if any selected exercise is already in a superset
                  const selectedExistingGroupId = selectedSupersetExercises
                    .map(id => exercises.find(e => e.id === id)?.supersetGroupId)
                    .find(gid => gid !== undefined);
                  
                  // Priority: source exercise's group > selected exercise's group > new group
                  const groupId = sourceGroupId || selectedExistingGroupId || Date.now().toString();
                  const isJoiningExisting = sourceGroupId !== undefined || selectedExistingGroupId !== undefined;
                  
                  setExercises(exercises.map(e => {
                    if (e.id === supersetSourceExerciseId || selectedSupersetExercises.includes(e.id)) {
                      return { ...e, supersetGroupId: groupId };
                    }
                    return e;
                  }));
                  
                  toast({ 
                    title: isJoiningExisting ? "Added to superset!" : "Superset created!", 
                    description: isJoiningExisting 
                      ? `Exercise added to existing superset.`
                      : `${selectedSupersetExercises.length + 1} exercises grouped together.`
                  });
                }
                setShowSupersetModal(false);
                setSupersetSourceExerciseId(null);
                setSelectedSupersetExercises([]);
              }}
              disabled={selectedSupersetExercises.length === 0}
            >
              Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reorder Exercise Modal */}
      <AlertDialog open={showReorderModal} onOpenChange={(open) => {
        if (!open) {
          setShowReorderModal(false);
          setReorderingExerciseId(null);
          setPendingReorderIndex(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reorder Exercise</AlertDialogTitle>
            <AlertDialogDescription>
              Drag the highlighted exercise up or down to reorder
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-1 max-h-72 overflow-y-auto overflow-x-hidden">
            {(() => {
              // Create a working list based on pendingReorderIndex
              const currentIdx = exercises.findIndex(e => e.id === reorderingExerciseId);
              const reorderedList = [...exercises];
              if (currentIdx !== -1 && pendingReorderIndex !== null && currentIdx !== pendingReorderIndex) {
                const [removed] = reorderedList.splice(currentIdx, 1);
                reorderedList.splice(pendingReorderIndex, 0, removed);
              }
              
              return reorderedList.map((exercise, idx) => {
                const isMovingExercise = exercise.id === reorderingExerciseId;
                
                return (
                  <motion.div
                    key={exercise.id}
                    layout
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    drag={isMovingExercise ? "y" : false}
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={0.3}
                    whileDrag={{ scale: 1.02, zIndex: 10 }}
                    onDragEnd={(e, info) => {
                      if (!isMovingExercise) return;
                      const threshold = 30;
                      const currentPosition = pendingReorderIndex ?? currentIdx;
                      
                      if (info.offset.y < -threshold && currentPosition > 0) {
                        // Swipe up - move up by one
                        setPendingReorderIndex(currentPosition - 1);
                        if (navigator.vibrate) navigator.vibrate(15);
                      } else if (info.offset.y > threshold && currentPosition < exercises.length - 1) {
                        // Swipe down - move down by one
                        setPendingReorderIndex(currentPosition + 1);
                        if (navigator.vibrate) navigator.vibrate(15);
                      }
                    }}
                    className={`p-3 rounded-lg border transition-colors relative overflow-hidden ${
                      isMovingExercise
                        ? "border-primary bg-primary/10 shadow-lg cursor-grab active:cursor-grabbing"
                        : "border-border bg-card"
                    }`}
                  >
                    {exercise.supersetGroupId && (
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${getSupersetBarColor(exercise.supersetGroupId)}`} />
                    )}
                    <div className={`flex items-center justify-between ${exercise.supersetGroupId ? "pl-3" : ""}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
                        <span className={`font-medium ${isMovingExercise ? "text-primary" : ""}`}>
                          {exercise.name}
                        </span>
                      </div>
                      {isMovingExercise && (
                        <ArrowUpDown size={16} className="text-primary" />
                      )}
                    </div>
                  </motion.div>
                );
              });
            })()}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowReorderModal(false);
              setReorderingExerciseId(null);
              setPendingReorderIndex(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (reorderingExerciseId && pendingReorderIndex !== null) {
                  const currentIndex = exercises.findIndex(e => e.id === reorderingExerciseId);
                  if (currentIndex !== -1 && currentIndex !== pendingReorderIndex) {
                    const newExercises = [...exercises];
                    const [removed] = newExercises.splice(currentIndex, 1);
                    newExercises.splice(pendingReorderIndex, 0, removed);
                    setExercises(newExercises);
                    toast({ 
                      title: "Exercise reordered", 
                      description: `Moved to position ${pendingReorderIndex + 1}` 
                    });
                  }
                }
                setShowReorderModal(false);
                setReorderingExerciseId(null);
                setPendingReorderIndex(null);
              }}
            >
              Finish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Incomplete Sets Confirmation Dialog */}
      <AlertDialog open={showIncompleteConfirm} onOpenChange={setShowIncompleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Incomplete Sets</AlertDialogTitle>
            <AlertDialogDescription>
              Not all sets have been marked as complete. Are you sure you want to finish this workout?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Workout</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowIncompleteConfirm(false);
                handleSubmit(true);
              }}
            >
              Finish Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

// Helper function to get consistent bar colors for superset groups (no purple to avoid blending with selected state)
const getSupersetBarColor = (groupId: string): string => {
  const colors = [
    "bg-cyan-500",
    "bg-amber-500", 
    "bg-emerald-500",
    "bg-rose-500",
    "bg-sky-500",
  ];
  const hash = groupId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export default CreateWorkoutPage;
