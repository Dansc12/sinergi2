import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Exercise } from "@/components/ExerciseSearchInput";

interface AddCustomExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (exercise: Exercise) => void;
  initialName?: string;
}

const EXERCISE_TYPES = [
  "Barbell",
  "Dumbbell",
  "Machine",
  "Cable",
  "Bodyweight",
  "Cardio",
  "Resistance Band",
  "Kettlebell",
  "Other"
];

const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Legs",
  "Core",
  "Full Body",
  "Cardio"
];

export const AddCustomExerciseModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialName = "",
}: AddCustomExerciseModalProps) => {
  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Sync name when modal opens with a new initialName
  useEffect(() => {
    if (isOpen) {
      setName(initialName);
    }
  }, [isOpen, initialName]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter an exercise name");
      return;
    }
    if (!category) {
      toast.error("Please select an exercise type");
      return;
    }
    if (!muscleGroup) {
      toast.error("Please select a muscle group");
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to add custom exercises");
        return;
      }

      const isCardio = category === "Cardio" || muscleGroup === "Cardio";

      const { data, error } = await supabase
        .from('custom_exercises')
        .insert({
          user_id: user.id,
          name: name.trim(),
          category,
          muscle_group: muscleGroup,
          is_cardio: isCardio,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Custom exercise added!");

      onSuccess({
        id: `custom-${data.id}`,
        name: data.name,
        category: data.category,
        muscleGroup: data.muscle_group,
        isCardio: data.is_cardio,
      });

      // Reset form
      setName("");
      setCategory("");
      setMuscleGroup("");
      onClose();
    } catch (error) {
      console.error("Error saving custom exercise:", error);
      toast.error("Failed to save custom exercise");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setName("");
    setCategory("");
    setMuscleGroup("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background z-50"
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="h-full flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <ArrowLeft size={24} />
              </Button>
              <h2 className="text-lg font-semibold">Add Custom Exercise</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Check size={24} className="text-primary" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {/* Exercise Name */}
              <div className="space-y-2">
                <Label htmlFor="exercise-name">Exercise Name</Label>
                <Input
                  id="exercise-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Cable Crossover"
                  autoFocus
                />
              </div>

              {/* Exercise Type */}
              <div className="space-y-2">
                <Label>Exercise Type</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {EXERCISE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Muscle Group */}
              <div className="space-y-2">
                <Label>Muscle Being Targeted</Label>
                <Select value={muscleGroup} onValueChange={setMuscleGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select muscle group..." />
                  </SelectTrigger>
                  <SelectContent>
                    {MUSCLE_GROUPS.map((muscle) => (
                      <SelectItem key={muscle} value={muscle}>
                        {muscle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Info */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Plus size={18} className="text-primary mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Your Custom Exercise</p>
                    <p>
                      This exercise will only be visible to you. When you search for exercises,
                      your custom entries will appear alongside the default exercise list.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="p-4 border-t border-border">
              <Button
                className="w-full"
                onClick={handleSave}
                disabled={isSaving || !name.trim() || !category || !muscleGroup}
              >
                {isSaving ? "Saving..." : "Save Custom Exercise"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};