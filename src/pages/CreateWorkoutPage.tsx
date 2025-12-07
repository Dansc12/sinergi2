import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Dumbbell, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface Exercise {
  id: string;
  name: string;
  sets: string;
  reps: string;
  weight: string;
}

const CreateWorkoutPage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([
    { id: "1", name: "", sets: "", reps: "", weight: "" }
  ]);

  const addExercise = () => {
    setExercises([...exercises, { id: Date.now().toString(), name: "", sets: "", reps: "", weight: "" }]);
  };

  const removeExercise = (id: string) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter(e => e.id !== id));
    }
  };

  const updateExercise = (id: string, field: keyof Exercise, value: string) => {
    setExercises(exercises.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast({ title: "Please enter a workout title", variant: "destructive" });
      return;
    }
    toast({ title: "Workout logged!", description: "Your workout has been saved." });
    navigate("/");
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
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Dumbbell size={20} className="text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Log Workout</h1>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Workout Title</Label>
            <Input
              id="title"
              placeholder="e.g., Morning Push Day"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

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
                  <span className="text-sm text-muted-foreground">Exercise {index + 1}</span>
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
                      placeholder="3"
                      value={exercise.sets}
                      onChange={(e) => updateExercise(exercise.id, "sets", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Reps</Label>
                    <Input
                      placeholder="10"
                      value={exercise.reps}
                      onChange={(e) => updateExercise(exercise.id, "reps", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Weight</Label>
                    <Input
                      placeholder="135 lbs"
                      value={exercise.weight}
                      onChange={(e) => updateExercise(exercise.id, "weight", e.target.value)}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
            <Button variant="outline" className="w-full" onClick={addExercise}>
              <Plus size={18} /> Add Exercise
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="How did it feel? Any PRs?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <Button className="w-full" size="lg" onClick={handleSubmit}>
            Save Workout
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateWorkoutPage;
