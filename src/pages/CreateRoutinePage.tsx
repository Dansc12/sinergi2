import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCcw, Trash2, Plus, ChevronDown, ChevronUp, Dumbbell, Loader2, MoreVertical, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import ExerciseSearchInput from "@/components/ExerciseSearchInput";
import { usePosts } from "@/hooks/usePosts";
import { TagInput } from "@/components/TagInput";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

interface RoutineSet {
  id: string;
  minReps: string;
  maxReps: string;
}

interface RoutineExercise {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
  notes: string;
  sets: RoutineSet[];
  isExpanded: boolean;
}

interface DaySchedule {
  selected: boolean;
}

interface RestoredState {
  restored?: boolean;
  contentData?: { 
    routineName?: string;
    description?: string;
    tags?: string[];
    selectedDays?: Record<string, DaySchedule>;
    exercises?: RoutineExercise[];
  };
  images?: string[];
}

const daysOfWeek = [
  { short: "M", full: "Monday" },
  { short: "T", full: "Tuesday" },
  { short: "W", full: "Wednesday" },
  { short: "T", full: "Thursday" },
  { short: "F", full: "Friday" },
  { short: "S", full: "Saturday" },
  { short: "S", full: "Sunday" },
];

const CreateRoutinePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const restoredState = location.state as RestoredState | null;
  const { createPost } = usePosts();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<Record<string, DaySchedule>>(
    daysOfWeek.reduce((acc, day) => ({ ...acc, [day.full]: { selected: false } }), {})
  );
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [isHeaderSectionOpen, setIsHeaderSectionOpen] = useState(true);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderingExerciseId, setReorderingExerciseId] = useState<string | null>(null);
  const [pendingReorderIndex, setPendingReorderIndex] = useState<number | null>(null);

  // Get the currently selected exercise
  const selectedExercise = exercises.find(e => e.id === selectedExerciseId);

  // Restore state if coming back from share screen
  useEffect(() => {
    if (restoredState?.restored && restoredState.contentData) {
      const data = restoredState.contentData;
      if (data.routineName) setName(data.routineName);
      if (data.description) setDescription(data.description);
      if (data.tags) setTags(data.tags);
      if (data.selectedDays) setSelectedDays(data.selectedDays);
      if (data.exercises) {
        setExercises(data.exercises);
        if (data.exercises.length > 0) {
          setSelectedExerciseId(data.exercises[0].id);
        }
      }
      if (restoredState.images) setPhotos(restoredState.images);
      window.history.replaceState({}, document.title);
    }
  }, []);

  const handleBack = () => {
    if (exercises.length > 0 || name.trim()) {
      setShowBackConfirm(true);
    } else {
      navigate("/");
    }
  };

  const confirmBack = () => {
    setShowBackConfirm(false);
    navigate("/");
  };

  const toggleDay = (dayFull: string) => {
    setSelectedDays(prev => ({
      ...prev,
      [dayFull]: { selected: !prev[dayFull].selected }
    }));
  };

  const addExercise = (exercise: { id: string; name: string; category: string; muscleGroup: string }) => {
    const newExerciseId = Date.now().toString();
    const newExercise: RoutineExercise = {
      id: newExerciseId,
      name: exercise.name,
      category: exercise.category,
      muscleGroup: exercise.muscleGroup,
      notes: "",
      sets: [{ id: Date.now().toString(), minReps: "", maxReps: "" }],
      isExpanded: true
    };
    setExercises([...exercises, newExercise]);
    setSelectedExerciseId(newExerciseId);
  };

  const removeExercise = (id: string) => {
    const newExercises = exercises.filter(e => e.id !== id);
    setExercises(newExercises);
    if (selectedExerciseId === id) {
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
    setExercises(exercises.map(e => 
      e.id === exerciseId 
        ? { ...e, sets: [...e.sets, { id: Date.now().toString(), minReps: "", maxReps: "" }] }
        : e
    ));
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setExercises(exercises.map(e => 
      e.id === exerciseId 
        ? { ...e, sets: e.sets.filter(s => s.id !== setId) }
        : e
    ));
  };

  const updateSet = (exerciseId: string, setId: string, field: "minReps" | "maxReps", value: string) => {
    setExercises(exercises.map(e => 
      e.id === exerciseId 
        ? { ...e, sets: e.sets.map(s => s.id === setId ? { ...s, [field]: value } : s) }
        : e
    ));
  };

  const moveExercise = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= exercises.length) return;
    const newExercises = [...exercises];
    const [removed] = newExercises.splice(fromIndex, 1);
    newExercises.splice(toIndex, 0, removed);
    setExercises(newExercises);
    setPendingReorderIndex(toIndex);
  };

  // Validation check
  const isValid = () => {
    if (!name.trim()) return false;
    if (exercises.length === 0) return false;
    for (const exercise of exercises) {
      if (!exercise.name.trim()) return false;
      if (exercise.sets.length === 0) return false;
      for (const set of exercise.sets) {
        if (!set.minReps.trim() || !set.maxReps.trim()) return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!isValid()) {
      toast({ title: "Please complete all required fields", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createPost({
        content_type: "routine",
        content_data: { routineName: name, description, tags, selectedDays, exercises },
        images: photos,
        visibility: "private",
      });

      navigate("/", {
        state: {
          showCongrats: true,
          contentType: "routine",
          contentData: { routineName: name, description, tags, selectedDays, exercises },
          images: photos,
        },
      });
    } catch (error) {
      console.error("Error saving routine:", error);
      toast({ title: "Error", description: "Failed to save routine. Please try again.", variant: "destructive" });
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
        {/* Header - Matching Workout Page */}
        <div className="flex items-center mb-6 relative">
          <Button variant="ghost" size="icon" onClick={handleBack} className="z-10">
            <ArrowLeft size={24} />
          </Button>
          <div className="absolute left-0 right-0 flex flex-col items-center pointer-events-none">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center">
              <RotateCcw size={20} className="text-primary-foreground" />
            </div>
            <span className="text-sm font-medium mt-1">Build Routine</span>
          </div>
          <Button onClick={handleSubmit} disabled={!isValid() || isSubmitting} className="rounded-full px-6 ml-auto z-10">
            {isSubmitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
            Finish
          </Button>
        </div>

        {/* Routine Name with Collapsible Toggle */}
        <Collapsible open={isHeaderSectionOpen} onOpenChange={setIsHeaderSectionOpen} className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Input
              placeholder="Routine name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 text-2xl font-semibold bg-transparent border-0 rounded-none px-0 focus-visible:ring-0"
            />
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                {isHeaderSectionOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
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
            <div className="space-y-2">
              <Textarea
                placeholder="Description (optional)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[60px] bg-muted/50 border-0 resize-none text-sm"
                rows={2}
              />
            </div>

            {/* Schedule - Pill Style Days */}
            <div className="space-y-3">
              <span className="text-sm text-muted-foreground">Schedule</span>
              <div className="flex gap-2 flex-wrap">
                {daysOfWeek.map((day) => (
                  <button
                    key={day.full}
                    onClick={() => toggleDay(day.full)}
                    className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${
                      selectedDays[day.full]?.selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {day.short}
                  </button>
                ))}
              </div>
            </div>

            {/* Exercise Search */}
            <ExerciseSearchInput
              onSelect={addExercise}
              placeholder="Add exercise..."
            />
          </CollapsibleContent>
        </Collapsible>
        
        {/* Divider */}
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
                <div className="col-span-8 text-center">REP RANGE</div>
                <div className="col-span-2"></div>
              </div>
            </div>

            {/* Sets List */}
            <div className="space-y-2 mb-4">
              {selectedExercise.sets.map((set, index) => (
                <motion.div
                  key={set.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-muted/30"
                >
                  <div className="col-span-2 flex justify-center">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-semibold text-sm text-muted-foreground">
                      {index + 1}
                    </div>
                  </div>
                  <div className="col-span-8 flex items-center justify-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={set.minReps}
                      onChange={(e) => updateSet(selectedExercise.id, set.id, "minReps", e.target.value)}
                      className="w-16 text-center h-9 bg-background border-border [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-muted-foreground font-medium">-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={set.maxReps}
                      onChange={(e) => updateSet(selectedExercise.id, set.id, "maxReps", e.target.value)}
                      className="w-16 text-center h-9 bg-background border-border [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeSet(selectedExercise.id, set.id)}
                      disabled={selectedExercise.sets.length === 1}
                    >
                      <Trash2 size={14} className={selectedExercise.sets.length === 1 ? "text-muted-foreground/30" : "text-destructive"} />
                    </Button>
                  </div>
                </motion.div>
              ))}
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
            <RotateCcw size={48} className="mb-4 opacity-50" />
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
                const totalSets = exercise.sets.length;
                const filledSets = exercise.sets.filter(s => s.minReps && s.maxReps).length;
                
                return (
                  <div
                    key={exercise.id}
                    className={`flex-shrink-0 rounded-xl transition-colors relative overflow-hidden ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                        : "bg-card border border-border text-foreground hover:border-primary/50"
                    }`}
                  >
                    <button
                      onClick={() => setSelectedExerciseId(exercise.id)}
                      className="px-4 py-3 pr-10 text-left"
                    >
                      <div className="flex flex-col items-start gap-1 min-w-[100px]">
                        <span className={`text-xs ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {filledSets}/{totalSets} sets
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

      {/* Back Confirmation Dialog */}
      <AlertDialog open={showBackConfirm} onOpenChange={setShowBackConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard routine?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to go back? Your routine will be lost.
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

      {/* Reorder Modal */}
      <AlertDialog open={showReorderModal} onOpenChange={setShowReorderModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reorder Exercise</AlertDialogTitle>
            <AlertDialogDescription>
              Move this exercise up or down in your routine.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-2">
            {exercises.map((ex, idx) => {
              const isReordering = ex.id === reorderingExerciseId;
              const isAtPendingPosition = idx === pendingReorderIndex;
              
              return (
                <div
                  key={ex.id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    isReordering && isAtPendingPosition
                      ? "bg-primary/20 border border-primary"
                      : isReordering
                      ? "bg-muted/50"
                      : "bg-muted/30"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-semibold text-sm">
                    {idx + 1}
                  </div>
                  <span className="flex-1 font-medium">{ex.name}</span>
                  {isReordering && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveExercise(pendingReorderIndex!, pendingReorderIndex! - 1)}
                        disabled={pendingReorderIndex === 0}
                      >
                        <ChevronUp size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveExercise(pendingReorderIndex!, pendingReorderIndex! + 1)}
                        disabled={pendingReorderIndex === exercises.length - 1}
                      >
                        <ChevronDown size={16} />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => {
              setShowReorderModal(false);
              setReorderingExerciseId(null);
              setPendingReorderIndex(null);
            }}>
              Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CreateRoutinePage;
