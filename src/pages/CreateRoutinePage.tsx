import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";

interface RoutineExercise {
  id: string;
  name: string;
  sets: string;
  reps: string;
  restTime: string;
}

interface RestoredState {
  restored?: boolean;
  contentData?: { 
    name?: string; 
    description?: string;
    difficulty?: string;
    selectedDays?: string[];
    exercises?: RoutineExercise[];
  };
  images?: string[];
}

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const CreateRoutinePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const restoredState = location.state as RestoredState | null;
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [exercises, setExercises] = useState<RoutineExercise[]>([
    { id: "1", name: "", sets: "", reps: "", restTime: "" }
  ]);

  // Restore state if coming back from share screen
  useEffect(() => {
    if (restoredState?.restored && restoredState.contentData) {
      const data = restoredState.contentData;
      if (data.name) setName(data.name);
      if (data.description) setDescription(data.description);
      if (data.difficulty) setDifficulty(data.difficulty);
      if (data.selectedDays) setSelectedDays(data.selectedDays);
      if (data.exercises) setExercises(data.exercises);
      window.history.replaceState({}, document.title);
    }
  }, []);

  const handleBack = () => {
    navigate("/");
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const addExercise = () => {
    setExercises([...exercises, { id: Date.now().toString(), name: "", sets: "", reps: "", restTime: "" }]);
  };

  const removeExercise = (id: string) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter(e => e.id !== id));
    }
  };

  const updateExercise = (id: string, field: keyof RoutineExercise, value: string) => {
    setExercises(exercises.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({ title: "Please enter a routine name", variant: "destructive" });
      return;
    }
    if (selectedDays.length === 0) {
      toast({ title: "Please select at least one day", variant: "destructive" });
      return;
    }
    // Navigate to share screen with routine data
    navigate("/share", {
      state: {
        contentType: "routine",
        contentData: { name, description, difficulty, selectedDays, exercises },
        images: [],
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
        <div className="flex items-center gap-4 mb-6">
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

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What's the goal of this routine?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Difficulty Level</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Days Selection */}
          <div className="space-y-3">
            <Label>Schedule</Label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map((day) => (
                <Button
                  key={day}
                  variant={selectedDays.includes(day) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleDay(day)}
                  className="rounded-full"
                >
                  {day.slice(0, 3)}
                </Button>
              ))}
            </div>
          </div>

          {/* Exercises */}
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
                  <div className="flex items-center gap-2">
                    <GripVertical size={16} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Exercise {index + 1}</span>
                  </div>
                  {exercises.length > 1 && (
                    <Button variant="ghost" size="icon-sm" onClick={() => removeExercise(exercise.id)}>
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                  )}
                </div>
                <Input
                  placeholder="Exercise name"
                  value={exercise.name}
                  onChange={(e) => updateExercise(exercise.id, "name", e.target.value)}
                />
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
                    <Label className="text-xs">Reps</Label>
                    <Input
                      placeholder="8-12"
                      value={exercise.reps}
                      onChange={(e) => updateExercise(exercise.id, "reps", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Rest</Label>
                    <Input
                      placeholder="90s"
                      value={exercise.restTime}
                      onChange={(e) => updateExercise(exercise.id, "restTime", e.target.value)}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
            <Button variant="outline" className="w-full" onClick={addExercise}>
              <Plus size={18} /> Add Exercise
            </Button>
          </div>

          <Button className="w-full" size="lg" onClick={handleSubmit}>
            Save Routine
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateRoutinePage;
