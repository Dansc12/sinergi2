import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCcw, Plus, Trash2, Camera, ChevronDown, ChevronUp, MoreHorizontal, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import ExerciseSearchInput from "@/components/ExerciseSearchInput";
import { CameraCapture } from "@/components/CameraCapture";

interface Set {
  id: string;
  weight: string;
  repsMin: string;
  repsMax: string;
  distance: string;
  time: string;
  completed: boolean;
}

interface RoutineExercise {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
  notes: string;
  sets: Set[];
  isExpanded: boolean;
  isCardio: boolean;
}

interface DaySchedule {
  day: string;
  selected: boolean;
  time: string;
  showTimePicker: boolean;
}

interface RestoredState {
  restored?: boolean;
  contentData?: { 
    name?: string; 
    schedule?: DaySchedule[];
    exercises?: RoutineExercise[];
    repeatDuration?: string;
  };
  images?: string[];
}

const repeatDurationOptions = [
  { value: "2-weeks", label: "2 Weeks" },
  { value: "1-month", label: "1 Month" },
  { value: "2-months", label: "2 Months" },
  { value: "3-months", label: "3 Months" },
  { value: "6-months", label: "6 Months" },
  { value: "indefinitely", label: "Indefinitely" },
];

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const CreateRoutinePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const restoredState = location.state as RestoredState | null;
  
  const [name, setName] = useState("");
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    daysOfWeek.map(day => ({ day, selected: false, time: "", showTimePicker: false }))
  );
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [repeatDuration, setRepeatDuration] = useState("indefinitely");

  // Restore state if coming back from share screen
  useEffect(() => {
    if (restoredState?.restored && restoredState.contentData) {
      const data = restoredState.contentData;
      if (data.name) setName(data.name);
      if (data.schedule) setSchedule(data.schedule);
      if (data.exercises) setExercises(data.exercises);
      if (data.repeatDuration) setRepeatDuration(data.repeatDuration);
      if (restoredState.images) setPhotos(restoredState.images);
      window.history.replaceState({}, document.title);
    }
  }, []);

  const handleBack = () => {
    navigate("/");
  };

  const toggleDay = (dayName: string) => {
    setSchedule(prev => 
      prev.map(d => 
        d.day === dayName 
          ? { ...d, selected: !d.selected, showTimePicker: !d.selected ? d.showTimePicker : false, time: !d.selected ? d.time : "" }
          : d
      )
    );
  };

  const toggleTimePicker = (dayName: string) => {
    setSchedule(prev => 
      prev.map(d => 
        d.day === dayName 
          ? { ...d, showTimePicker: !d.showTimePicker }
          : d
      )
    );
  };

  const updateTime = (dayName: string, time: string) => {
    setSchedule(prev => 
      prev.map(d => 
        d.day === dayName 
          ? { ...d, time }
          : d
      )
    );
  };

  const addExercise = (exercise: { id: string; name: string; category: string; muscleGroup: string; isCardio?: boolean }) => {
    const newExercise: RoutineExercise = {
      id: Date.now().toString(),
      name: exercise.name,
      category: exercise.category,
      muscleGroup: exercise.muscleGroup,
      notes: "",
      sets: [{ id: "1", weight: "", repsMin: "", repsMax: "", distance: "", time: "", completed: false }],
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
            repsMin: "",
            repsMax: "",
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

  const validateExercises = (): boolean => {
    for (const exercise of exercises) {
      for (const set of exercise.sets) {
        if (exercise.isCardio) {
          if (!set.distance.trim() || !set.time.trim()) {
            return false;
          }
        } else {
          if (!set.weight.trim() || !set.repsMin.trim() || !set.repsMax.trim()) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({ title: "Please enter a routine name", variant: "destructive" });
      return;
    }
    if (exercises.length > 0 && !validateExercises()) {
      toast({ title: "Please fill in all weights and reps for each set", variant: "destructive" });
      return;
    }
    // Navigate to share screen with routine data (days are optional now)
    navigate("/share", {
      state: {
        contentType: "routine",
        contentData: { name, schedule, exercises, repeatDuration },
        images: photos,
        returnTo: "/create/routine",
      },
    });
  };

  const selectedDaysCount = schedule.filter(d => d.selected).length;

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
          <Button onClick={handleSubmit} className="rounded-full px-6">
            Finish
          </Button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Routine Name */}
          <div className="mb-6">
            <Input
              placeholder="Routine name (e.g., Push Day, Pull Day, etc.)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-lg font-semibold bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0"
            />
          </div>

          {/* Days Selection - Stacked Pills */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Schedule (Optional)</Label>
            <div className="space-y-2">
              {schedule.map((daySchedule) => (
                <div key={daySchedule.day} className="flex items-center gap-3">
                  <button
                    onClick={() => toggleDay(daySchedule.day)}
                    className={`px-5 py-3 rounded-full text-base font-medium transition-all min-w-[100px] text-left ${
                      daySchedule.selected 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" 
                        : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {daySchedule.day.slice(0, 3)}
                  </button>
                  
                  {/* Time Picker - appears to the right when selected */}
                  <AnimatePresence>
                    {daySchedule.selected && (
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "auto", opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="flex items-center gap-2 overflow-hidden"
                      >
                        <Clock size={16} className="text-muted-foreground flex-shrink-0" />
                        <Input
                          type="time"
                          value={daySchedule.time}
                          onChange={(e) => updateTime(daySchedule.day, e.target.value)}
                          className="h-9 bg-background text-sm w-32 [&::-webkit-calendar-picker-indicator]:opacity-50"
                          placeholder="Time"
                        />
                        {daySchedule.time && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={() => updateTime(daySchedule.day, "")}
                          >
                            <X size={14} className="text-muted-foreground" />
                          </Button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
            
            {selectedDaysCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedDaysCount} day{selectedDaysCount > 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          {/* Repeat Duration */}
          {selectedDaysCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <Label className="text-base font-medium">Repeat For</Label>
              <div className="flex flex-wrap gap-2">
                {repeatDurationOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setRepeatDuration(option.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      repeatDuration === option.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Exercise Search */}
          <div>
            <Label className="text-base font-medium mb-3 block">Exercises</Label>
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
                        <RotateCcw size={18} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{exercise.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {exercise.category} • {exercise.muscleGroup}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-1">
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
                        <Trash2 size={20} className="text-destructive" />
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
                          <div className={`grid ${exercise.isCardio ? "grid-cols-12" : "grid-cols-11"} gap-2 text-xs text-muted-foreground font-medium`}>
                            <div className="col-span-2 text-center">SET</div>
                            <div className={`${exercise.isCardio ? "col-span-4" : "col-span-3"} text-center`}>{exercise.isCardio ? "DISTANCE" : "WEIGHT"}</div>
                            <div className={`${exercise.isCardio ? "col-span-4" : "col-span-4"} text-center`}>{exercise.isCardio ? "TIME" : "REP RANGE"}</div>
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
                              className={`grid ${exercise.isCardio ? "grid-cols-12" : "grid-cols-11"} gap-2 items-center p-2 rounded-lg bg-muted/30`}
                            >
                              <div className="col-span-2 w-8 h-8 mx-auto rounded-full flex items-center justify-center font-semibold text-sm bg-muted text-muted-foreground">
                                {index + 1}
                              </div>
                              <div className={`${exercise.isCardio ? "col-span-4" : "col-span-3"}`}>
                                <Input
                                  placeholder={exercise.isCardio ? "miles" : "lbs"}
                                  value={exercise.isCardio ? set.distance : set.weight}
                                  onChange={(e) => updateSet(exercise.id, set.id, exercise.isCardio ? "distance" : "weight", e.target.value)}
                                  className="text-center h-9 bg-background border-border [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  type={exercise.isCardio ? "text" : "number"}
                                />
                              </div>
                              {exercise.isCardio ? (
                                <div className="col-span-4">
                                  <Input
                                    placeholder="mm:ss"
                                    value={set.time}
                                    onChange={(e) => updateSet(exercise.id, set.id, "time", e.target.value)}
                                    className="text-center h-9 bg-background border-border"
                                    type="text"
                                  />
                                </div>
                              ) : (
                                <div className="col-span-4 flex items-center gap-1">
                                  <Input
                                    placeholder="8"
                                    value={set.repsMin}
                                    onChange={(e) => updateSet(exercise.id, set.id, "repsMin", e.target.value)}
                                    className="text-center h-9 bg-background border-border flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    type="number"
                                  />
                                  <span className="text-muted-foreground text-sm">-</span>
                                  <Input
                                    placeholder="12"
                                    value={set.repsMax}
                                    onChange={(e) => updateSet(exercise.id, set.id, "repsMax", e.target.value)}
                                    className="text-center h-9 bg-background border-border flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    type="number"
                                  />
                                </div>
                              )}
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

          {/* Empty State for Exercises */}
          {exercises.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <RotateCcw size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium">No exercises yet</p>
              <p className="text-sm">Search and add exercises above</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Photo Preview */}
      {photos.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-4">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
            {photos.map((photo, index) => (
              <div key={index} className="relative flex-shrink-0">
                <img
                  src={photo}
                  alt={`Routine photo ${index + 1}`}
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
          onClick={() => setIsCameraOpen(true)}
        >
          <Camera size={20} />
          Take a Photo {photos.length > 0 && `(${photos.length})`}
        </Button>
      </div>

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

export default CreateRoutinePage;