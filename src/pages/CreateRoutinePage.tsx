import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, Trash2, Camera, Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import ExerciseSearchInput from "@/components/ExerciseSearchInput";
import { CameraCapture } from "@/components/CameraCapture";

interface RoutineExercise {
  id: string;
  name: string;
  sets: string;
  minReps: string;
  maxReps: string;
}

interface DaySchedule {
  selected: boolean;
  time: string;
}

interface RestoredState {
  restored?: boolean;
  contentData?: { 
    name?: string; 
    selectedDays?: Record<string, DaySchedule>;
    exercises?: RoutineExercise[];
    recurring?: string;
  };
  images?: string[];
}

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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
  const [selectedDays, setSelectedDays] = useState<Record<string, DaySchedule>>(
    daysOfWeek.reduce((acc, day) => ({ ...acc, [day]: { selected: false, time: "" } }), {})
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

  const toggleDay = (day: string) => {
    setSelectedDays(prev => ({
      ...prev,
      [day]: { ...prev[day], selected: !prev[day].selected, time: !prev[day].selected ? prev[day].time : "" }
    }));
  };

  const updateDayTime = (day: string, time: string) => {
    setSelectedDays(prev => ({
      ...prev,
      [day]: { ...prev[day], time }
    }));
  };

  const addExercise = (exerciseName: string) => {
    setExercises([...exercises, { 
      id: Date.now().toString(), 
      name: exerciseName, 
      sets: "", 
      minReps: "", 
      maxReps: "" 
    }]);
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(e => e.id !== id));
  };

  const updateExercise = (id: string, field: keyof RoutineExercise, value: string) => {
    setExercises(exercises.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleCapturePhoto = (imageUrl: string) => {
    setPhotos(prev => [...prev, imageUrl]);
    setIsCameraOpen(false);
  };

  const handleSelectFromGallery = (imageUrls: string[]) => {
    setPhotos(prev => [...prev, ...imageUrls]);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Validation check
  const isValid = () => {
    if (!name.trim()) return false;
    if (exercises.length === 0) return false;
    for (const exercise of exercises) {
      if (!exercise.name.trim() || !exercise.sets.trim() || !exercise.minReps.trim() || !exercise.maxReps.trim()) {
        return false;
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
        contentData: { name, selectedDays, exercises, recurring },
        images: photos,
        returnTo: "/create/routine",
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
          <div className="space-y-2">
            <Label htmlFor="name">Routine Name</Label>
            <Input
              id="name"
              placeholder="e.g., Push Pull Legs"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Schedule - Vertical Days */}
          <div className="space-y-3">
            <Label>Schedule</Label>
            <div className="space-y-2">
              {daysOfWeek.map((day) => (
                <div key={day} className="flex items-center gap-3">
                  <div 
                    className="flex items-center gap-2 min-w-[140px] cursor-pointer"
                    onClick={() => toggleDay(day)}
                  >
                    <Checkbox 
                      checked={selectedDays[day]?.selected} 
                      onCheckedChange={() => toggleDay(day)}
                    />
                    <span className={`text-sm ${selectedDays[day]?.selected ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {day}
                    </span>
                  </div>
                  {selectedDays[day]?.selected && (
                    <Input
                      type="time"
                      value={selectedDays[day]?.time || ""}
                      onChange={(e) => updateDayTime(day, e.target.value)}
                      className="w-32"
                      placeholder="Time"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recurring Section */}
          <div className="space-y-3">
            <Label>Repeat For</Label>
            <div className="space-y-2">
              {recurringOptions.map((option) => (
                <div 
                  key={option.value}
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => setRecurring(option.value)}
                >
                  <Checkbox 
                    checked={recurring === option.value}
                    onCheckedChange={() => setRecurring(option.value)}
                  />
                  <span className={`text-sm ${recurring === option.value ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {option.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Exercise Search */}
          <div className="space-y-3">
            <Label>Add Exercises</Label>
            <ExerciseSearchInput 
              onSelect={(exercise) => addExercise(exercise.name)}
              placeholder="Search for an exercise..."
            />
          </div>

          {/* Exercises List */}
          {exercises.length > 0 && (
            <div className="space-y-4">
              <Label>Exercises</Label>
              {exercises.map((exercise, index) => (
                <motion.div
                  key={exercise.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 rounded-2xl bg-card border border-border space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{exercise.name}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeExercise(exercise.id)}>
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Sets</Label>
                      <Input
                        placeholder="4"
                        value={exercise.sets}
                        onChange={(e) => updateExercise(exercise.id, "sets", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Min Reps</Label>
                      <Input
                        placeholder="8"
                        value={exercise.minReps}
                        onChange={(e) => updateExercise(exercise.id, "minReps", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Max Reps</Label>
                      <Input
                        placeholder="12"
                        value={exercise.maxReps}
                        onChange={(e) => updateExercise(exercise.id, "maxReps", e.target.value)}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Photo Preview */}
          {photos.length > 0 && (
            <div className="space-y-2">
              <Label>Photos</Label>
              <div className="flex gap-2 flex-wrap">
                {photos.map((photo, index) => (
                  <div key={index} className="relative w-20 h-20">
                    <img src={photo} alt="" className="w-full h-full object-cover rounded-lg" />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Camera Button - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => setIsCameraOpen(true)}
          >
            <Camera size={18} className="mr-2" />
            Take a Photo
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.multiple = true;
              input.onchange = (e) => {
                const files = (e.target as HTMLInputElement).files;
                if (files) {
                  Array.from(files).forEach(file => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      if (e.target?.result) {
                        setPhotos(prev => [...prev, e.target!.result as string]);
                      }
                    };
                    reader.readAsDataURL(file);
                  });
                }
              };
              input.click();
            }}
          >
            <Image size={18} />
          </Button>
        </div>
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
