import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, Trash2, Camera, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import ExerciseSearchInput from "@/components/ExerciseSearchInput";
import { CameraCapture } from "@/components/CameraCapture";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RoutineSet {
  id: string;
  minReps: string;
  maxReps: string;
}

interface RoutineExercise {
  id: string;
  name: string;
  sets: RoutineSet[];
}

interface DaySchedule {
  selected: boolean;
  time: string;
}

interface RestoredState {
  restored?: boolean;
  contentData?: { 
    name?: string;
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
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDays, setSelectedDays] = useState<Record<string, DaySchedule>>(
    daysOfWeek.reduce((acc, day) => ({ ...acc, [day.full]: { selected: false, time: "" } }), {})
  );
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [recurring, setRecurring] = useState("none");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Restore state if coming back from share screen
  useEffect(() => {
    if (restoredState?.restored && restoredState.contentData) {
      const data = restoredState.contentData;
      if (data.name) setName(data.name);
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

  const addExercise = (exerciseName: string) => {
    setExercises([...exercises, { 
      id: Date.now().toString(), 
      name: exerciseName, 
      sets: [{ id: Date.now().toString(), minReps: "", maxReps: "" }]
    }]);
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(e => e.id !== id));
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

  const handleSubmit = () => {
    if (!isValid()) {
      toast({ title: "Please complete all required fields", variant: "destructive" });
      return;
    }
    // Navigate to share screen with routine data
    navigate("/share", {
      state: {
        contentType: "routine",
        contentData: { name, description, selectedDays, exercises, recurring },
        images: photos,
        returnTo: "/create/routine",
      },
    });
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
            disabled={!isValid()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
          >
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
              {daysOfWeek.map((day, index) => (
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
            {daysOfWeek.filter(d => selectedDays[d.full]?.selected).length > 0 && (
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

          {/* Recurring Section - Dropdown */}
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

          {/* Exercise Search */}
          <div className="space-y-3">
            <Label>Add Exercises</Label>
            <ExerciseSearchInput 
              onSelect={(exercise) => addExercise(exercise.name)}
              placeholder="Search for an exercise..."
            />
          </div>

          {/* Exercises List - Workout Style */}
          {exercises.map((exercise) => (
            <motion.div
              key={exercise.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card rounded-2xl border border-border overflow-hidden"
            >
              {/* Exercise Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <span className="font-semibold text-lg">{exercise.name}</span>
                <Button variant="ghost" size="icon" onClick={() => removeExercise(exercise.id)}>
                  <Trash2 size={18} className="text-destructive" />
                </Button>
              </div>

              {/* Sets Header */}
              <div className="px-4 py-2 border-b border-border/50 bg-muted/30">
                <div className="flex items-center gap-4">
                  <span className="w-12 text-xs text-muted-foreground text-center">SET</span>
                  <span className="flex-1 text-xs text-muted-foreground text-center">REP RANGE</span>
                  <span className="w-10"></span>
                </div>
              </div>

              {/* Sets */}
              <div className="p-4 space-y-3">
                {exercise.sets.map((set, setIndex) => (
                  <div key={set.id} className="flex items-center gap-4">
                    <div className="w-12 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <span className="text-sm font-medium">{setIndex + 1}</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center gap-2">
                      <Input
                        type="number"
                        placeholder="8"
                        value={set.minReps}
                        onChange={(e) => updateSet(exercise.id, set.id, "minReps", e.target.value)}
                        className="w-16 text-center"
                      />
                      <span className="text-muted-foreground">-</span>
                      <Input
                        type="number"
                        placeholder="12"
                        value={set.maxReps}
                        onChange={(e) => updateSet(exercise.id, set.id, "maxReps", e.target.value)}
                        className="w-16 text-center"
                      />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="w-10"
                      onClick={() => removeSet(exercise.id, set.id)}
                      disabled={exercise.sets.length === 1}
                    >
                      <Trash2 size={16} className="text-muted-foreground" />
                    </Button>
                  </div>
                ))}

                {/* Add Set Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addSet(exercise.id)}
                  className="w-full text-primary hover:text-primary/80"
                >
                  <Plus size={16} className="mr-1" />
                  Add Set
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Camera Button - Fixed at bottom right */}
      <div className="fixed bottom-6 right-6">
        <Button 
          size="icon"
          className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
          onClick={() => setIsCameraOpen(true)}
        >
          <Camera size={24} />
        </Button>
      </div>

      {/* Camera Modal */}
      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapturePhoto}
        onSelectFromGallery={handleSelectFromGallery}
      />
    </div>
  );
};

export default CreateRoutinePage;
