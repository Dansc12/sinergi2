import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCcw, Trash2, Camera, Plus, ChevronDown, ChevronUp, Dumbbell, Images, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import ExerciseSearchInput from "@/components/ExerciseSearchInput";
import { CameraCapture, PhotoChoiceDialog } from "@/components/CameraCapture";
import { usePhotoPicker } from "@/hooks/useCamera";
import PhotoGallerySheet from "@/components/PhotoGallerySheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePosts } from "@/hooks/usePosts";

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
  time: string;
}

interface RestoredState {
  restored?: boolean;
  contentData?: { 
    routineName?: string;
    description?: string;
    selectedDays?: Record<string, DaySchedule>;
    exercises?: RoutineExercise[];
    recurring?: string;
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

const recurringOptions = [
  { value: "none", label: "Currently not recurring" },
  { value: "2-weeks", label: "Two weeks" },
  { value: "1-month", label: "One month" },
  { value: "2-months", label: "Two months" },
  { value: "3-months", label: "Three months" },
  { value: "6-months", label: "Six months" },
  { value: "indefinitely", label: "Indefinitely" },
];

const CreateRoutinePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const restoredState = location.state as RestoredState | null;
  const { createPost } = usePosts();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDays, setSelectedDays] = useState<Record<string, DaySchedule>>(
    daysOfWeek.reduce((acc, day) => ({ ...acc, [day.full]: { selected: false, time: "" } }), {})
  );
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [recurring, setRecurring] = useState("none");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isChoiceDialogOpen, setIsChoiceDialogOpen] = useState(false);
  const [isPhotoGalleryOpen, setIsPhotoGalleryOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { inputRef, openPicker, handleFileChange } = usePhotoPicker((urls) => {
    setPhotos([...photos, ...urls]);
    toast({ title: "Photos added!", description: `${urls.length} photo(s) added.` });
  });
  // Check if any day is selected
  const hasSelectedDays = Object.values(selectedDays).some(d => d.selected);

  // Restore state if coming back from share screen
  useEffect(() => {
    if (restoredState?.restored && restoredState.contentData) {
      const data = restoredState.contentData;
      if (data.routineName) setName(data.routineName);
      if (data.description) setDescription(data.description);
      if (data.selectedDays) setSelectedDays(data.selectedDays);
      if (data.exercises) setExercises(data.exercises);
      if (data.recurring) setRecurring(data.recurring);
      if (restoredState.images) setPhotos(restoredState.images);
      window.history.replaceState({}, document.title);
    }
  }, []);

  const handleBack = () => {
    navigate("/");
  };

  const toggleDay = (dayFull: string) => {
    setSelectedDays(prev => ({
      ...prev,
      [dayFull]: { ...prev[dayFull], selected: !prev[dayFull].selected, time: !prev[dayFull].selected ? prev[dayFull].time : "" }
    }));
  };

  const updateDayTime = (dayFull: string, time: string) => {
    setSelectedDays(prev => ({
      ...prev,
      [dayFull]: { ...prev[dayFull], time }
    }));
  };

  const addExercise = (exercise: { id: string; name: string; category: string; muscleGroup: string }) => {
    setExercises([...exercises, { 
      id: Date.now().toString(), 
      name: exercise.name,
      category: exercise.category,
      muscleGroup: exercise.muscleGroup,
      notes: "",
      sets: [{ id: Date.now().toString(), minReps: "", maxReps: "" }],
      isExpanded: true
    }]);
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(e => e.id !== id));
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
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

  const handleCapturePhoto = (imageUrl: string) => {
    setPhotos(prev => [...prev, imageUrl]);
    setIsCameraOpen(false);
  };

  const handleSelectFromGallery = (imageUrls: string[]) => {
    setPhotos(prev => [...prev, ...imageUrls]);
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
        content_data: { routineName: name, description, selectedDays, exercises, recurring },
        images: photos,
        visibility: "private",
      });

      toast({ title: "Routine saved!", description: "Your routine has been saved." });
      navigate("/");
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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft size={24} />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center">
                <RotateCcw size={20} className="text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">Build Routine</h1>
            </div>
          </div>
          <Button 
            onClick={handleSubmit}
            disabled={!isValid() || isSubmitting}
            className="rounded-full px-6"
          >
            {isSubmitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
            Finish
          </Button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Routine Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Routine Name</Label>
            <Input
              id="name"
              placeholder="e.g., Push Day, Leg Day, etc."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Description (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe your routine..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Schedule - Pill Style Days */}
          <div className="space-y-3">
            <Label>Schedule</Label>
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
            {/* Time inputs for selected days */}
            {hasSelectedDays && (
              <div className="space-y-2 mt-3">
                {daysOfWeek.filter(d => selectedDays[d.full]?.selected).map((day) => (
                  <div key={day.full} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-24">{day.full}</span>
                    <Input
                      type="time"
                      value={selectedDays[day.full]?.time || ""}
                      onChange={(e) => updateDayTime(day.full, e.target.value)}
                      className="w-32"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recurring Section - Only visible if days are selected */}
          {hasSelectedDays && (
            <div className="space-y-2">
              <Label>Repeat For</Label>
              <Select value={recurring} onValueChange={setRecurring}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {recurringOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Exercise Search */}
          <div className="space-y-3">
            <Label>Add Exercises</Label>
            <ExerciseSearchInput 
              onSelect={addExercise}
              placeholder="Search for an exercise..."
            />
          </div>

          {/* Exercises List - Workout Style */}
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
                            <div className="col-span-8 text-center">REP RANGE</div>
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
                                  onChange={(e) => updateSet(exercise.id, set.id, "minReps", e.target.value)}
                                  className="w-16 text-center h-9 bg-background border-border"
                                />
                                <span className="text-muted-foreground font-medium">-</span>
                                <Input
                                  type="number"
                                  placeholder="Max"
                                  value={set.maxReps}
                                  onChange={(e) => updateSet(exercise.id, set.id, "maxReps", e.target.value)}
                                  className="w-16 text-center h-9 bg-background border-border"
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
              <RotateCcw size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium">No exercises yet</p>
              <p className="text-sm">Search and add exercises above</p>
            </div>
          )}
        </div>
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

      {/* Camera Modal */}
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
    </div>
  );
};

export default CreateRoutinePage;