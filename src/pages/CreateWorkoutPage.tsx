import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Dumbbell, Plus, Trash2, Camera, ChevronDown, ChevronUp, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import ExerciseSearchInput from "@/components/ExerciseSearchInput";
import { CameraCapture, PhotoChoiceDialog } from "@/components/CameraCapture";
import { usePhotoPicker } from "@/hooks/useCamera";
interface Set {
  id: string;
  weight: string;
  reps: string;
  distance: string;
  time: string;
  completed: boolean;
  repRangeHint?: string; // Hint from routine for rep range
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
}

const CreateWorkoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const restoredState = location.state as RestoredState | null;
  
  const [title, setTitle] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isChoiceDialogOpen, setIsChoiceDialogOpen] = useState(false);
  const [routineInstanceId, setRoutineInstanceId] = useState<string | null>(null);

  const { inputRef, openPicker, handleFileChange } = usePhotoPicker((urls) => {
    setPhotos([...photos, ...urls]);
    toast({ title: "Photos added!", description: `${urls.length} photo(s) added.` });
  });

  // Restore state if coming back from share screen or prefilled from routine
  useEffect(() => {
    if (restoredState?.restored) {
      if (restoredState.contentData?.title) setTitle(restoredState.contentData.title);
      if (restoredState.contentData?.exercises) setExercises(restoredState.contentData.exercises);
      if (restoredState.images) setPhotos(restoredState.images);
      if (restoredState.routineInstanceId) setRoutineInstanceId(restoredState.routineInstanceId);
      window.history.replaceState({}, document.title);
    } else if (restoredState?.prefilled) {
      if (restoredState.routineName) setTitle(restoredState.routineName);
      if (restoredState.exercises) setExercises(restoredState.exercises);
      if (restoredState.routineInstanceId) setRoutineInstanceId(restoredState.routineInstanceId);
      window.history.replaceState({}, document.title);
    }
  }, []);

  const addExercise = (exercise: { id: string; name: string; category: string; muscleGroup: string; isCardio?: boolean }) => {
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: exercise.name,
      category: exercise.category,
      muscleGroup: exercise.muscleGroup,
      notes: "",
      sets: [{ id: "1", weight: "", reps: "", distance: "", time: "", completed: false }],
      isExpanded: true,
      isCardio: exercise.isCardio || false,
    };
    setExercises([...exercises, newExercise]);
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
          const newSet: Set = {
            id: Date.now().toString(),
            weight: "",
            reps: "",
            distance: "",
            time: "",
            completed: false,
          };
          return { ...e, sets: [...e.sets, newSet] };
        }
        return e;
      })
    );
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

  const handleSubmit = () => {
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
    
    // Navigate to share screen with workout data
    navigate("/share", {
      state: {
        contentType: "workout",
        contentData: { title, exercises },
        images: photos,
        returnTo: "/create/workout",
        routineInstanceId: routineInstanceId,
      },
    });
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
          <Button onClick={handleSubmit} className="rounded-full px-6">
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
        <div className="mb-6">
          <ExerciseSearchInput
            onSelect={addExercise}
            placeholder="Add exercise..."
          />
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
                            <button
                              onClick={() => toggleSetComplete(exercise.id, set.id)}
                              className={`col-span-2 w-8 h-8 mx-auto rounded-full flex items-center justify-center font-semibold text-sm transition-colors relative ${
                                set.completed
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              <span className={set.completed ? "opacity-0" : "opacity-100"}>{index + 1}</span>
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

      {/* Photo Preview */}
      {photos.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-4">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
            {photos.map((photo, index) => (
              <div key={index} className="relative flex-shrink-0">
                <img
                  src={photo}
                  alt={`Workout photo ${index + 1}`}
                  className="w-16 h-16 rounded-lg object-cover border border-border"
                />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center"
                >
                  <X size={12} className="text-destructive-foreground" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Camera Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8">
        <Button
          variant="outline"
          size="lg"
          className="w-full gap-2 rounded-xl border-border bg-card hover:bg-muted"
          onClick={() => setIsChoiceDialogOpen(true)}
        >
          <Camera size={20} />
          Take a Photo {photos.length > 0 && `(${photos.length})`}
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

      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapturePhoto}
        onSelectFromGallery={handleSelectFromGallery}
      />
    </div>
  );
};

export default CreateWorkoutPage;
