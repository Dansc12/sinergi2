import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCcw, Trash2, Plus, ChevronDown, ChevronUp, Dumbbell, Loader2, MoreVertical, ArrowUpDown, X, Check } from "lucide-react";
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

type SetType = "normal" | "warmup" | "failure" | "drop";

interface RoutineSet {
  id: string;
  minReps: string;
  maxReps: string;
  setType?: SetType;
}

interface RoutineExercise {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
  notes: string;
  sets: RoutineSet[];
  isExpanded: boolean;
  supersetGroupId?: string;
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
    estimatedMinutes?: number;
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

// Helper function to get consistent bar colors for superset groups
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

const CreateRoutinePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const restoredState = location.state as RestoredState | null;
  const { createPost } = usePosts();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>("");
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
  const [showSupersetModal, setShowSupersetModal] = useState(false);
  const [supersetSourceExerciseId, setSupersetSourceExerciseId] = useState<string | null>(null);
  const [selectedSupersetExercises, setSelectedSupersetExercises] = useState<string[]>([]);

  // Get the currently selected exercise
  const selectedExercise = exercises.find(e => e.id === selectedExerciseId);

  // Format time display
  const formatTimeDisplay = (minutes: string): string => {
    const mins = parseInt(minutes) || 0;
    if (mins === 0) return "0:00";
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hrs > 0) {
      return `${hrs}:${remainingMins.toString().padStart(2, '0')}`;
    }
    return `${mins}:00`;
  };

  // Restore state if coming back from share screen
  useEffect(() => {
    if (restoredState?.restored && restoredState.contentData) {
      const data = restoredState.contentData;
      if (data.routineName) setName(data.routineName);
      if (data.description) setDescription(data.description);
      if (data.tags) setTags(data.tags);
      if (data.selectedDays) setSelectedDays(data.selectedDays);
      if (data.estimatedMinutes) setEstimatedMinutes(data.estimatedMinutes.toString());
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
      sets: [{ id: Date.now().toString(), minReps: "", maxReps: "", setType: "normal" }],
      isExpanded: true
    };
    setExercises([...exercises, newExercise]);
    setSelectedExerciseId(newExerciseId);
  };

  const removeExercise = (id: string) => {
    const exerciseToRemove = exercises.find(e => e.id === id);
    let newExercises = exercises.filter(e => e.id !== id);
    
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
        ? { ...e, sets: [...e.sets, { id: Date.now().toString(), minReps: "", maxReps: "", setType: "normal" as SetType }] }
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

  const getSetLabel = (set: RoutineSet, normalSetIndex: number): string => {
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
  const getNormalSetNumber = (sets: RoutineSet[], currentIndex: number): number => {
    let count = 0;
    for (let i = 0; i <= currentIndex; i++) {
      if (!sets[i].setType || sets[i].setType === "normal") {
        count++;
      }
    }
    return count;
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
        content_data: { 
          routineName: name, 
          description, 
          tags, 
          selectedDays, 
          exercises,
          estimatedMinutes: parseInt(estimatedMinutes) || 0
        },
        images: photos,
        visibility: "private",
      });

      navigate("/", {
        state: {
          showCongrats: true,
          contentType: "routine",
          contentData: { routineName: name, description, tags, selectedDays, exercises, estimatedMinutes: parseInt(estimatedMinutes) || 0 },
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
        {/* Header - Timer Style with Editable Time */}
        <div className="flex items-center mb-6 relative">
          <Button variant="ghost" size="icon" onClick={handleBack} className="z-10">
            <ArrowLeft size={24} />
          </Button>
          <div className="absolute left-0 right-0 flex flex-col items-center pointer-events-none">
            <span className="text-xs text-muted-foreground">Est. Time</span>
            <div className="pointer-events-auto flex items-center gap-1">
              <Input
                type="number"
                placeholder="0"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                className="w-16 text-center text-2xl font-bold font-mono h-auto py-0 bg-transparent border-0 focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-lg text-muted-foreground font-mono">min</span>
            </div>
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
              {selectedExercise.sets.map((set, index) => {
                const normalSetNumber = getNormalSetNumber(selectedExercise.sets, index);

                return (
                  <motion.div
                    key={set.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-muted/30"
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={`col-span-2 w-8 h-8 mx-auto rounded-full flex items-center justify-center font-semibold text-sm transition-colors select-none ${
                            set.setType === "warmup"
                              ? "bg-yellow-500/20 text-yellow-600"
                              : set.setType === "failure"
                              ? "bg-red-500/20 text-red-600"
                              : set.setType === "drop"
                              ? "bg-blue-500/20 text-blue-600"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {getSetLabel(set, normalSetNumber)}
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
                    <div className="col-span-2" />
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
                const supersetBarColor = exercise.supersetGroupId ? getSupersetBarColor(exercise.supersetGroupId) : null;
                
                return (
                  <div
                    key={exercise.id}
                    className={`flex-shrink-0 rounded-xl transition-colors relative overflow-hidden ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                        : "bg-card border border-border text-foreground hover:border-primary/50"
                    }`}
                  >
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
                const supersetColor = exercise.supersetGroupId ? getSupersetBarColor(exercise.supersetGroupId) : null;
                
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
                    {supersetColor && (
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${supersetColor}`} />
                    )}
                    <div className={`flex items-center justify-between ${supersetColor ? "pl-3" : ""}`}>
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
    </div>
  );
};

export default CreateRoutinePage;
