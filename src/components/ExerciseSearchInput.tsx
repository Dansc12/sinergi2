import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, Dumbbell, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { AddCustomExerciseModal } from "@/components/AddCustomExerciseModal";

export interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
  primaryGroup?: "Push" | "Pull" | "Legs" | "Core";
  isCardio?: boolean;
}

// Category/Subcategory structure:
// Push: Chest, Shoulders, Triceps
// Pull: Lats, Upper Back, Rear Delts, Biceps
// Legs: Quads, Hamstrings, Glutes, Calves
// Core: Abs, Obliques, Lower Back

// Common exercises database
const exerciseDatabase: Exercise[] = [
  // PUSH - Chest
  { id: "1", name: "Bench Press", category: "Barbell", muscleGroup: "Chest", primaryGroup: "Push" },
  { id: "2", name: "Incline Bench Press", category: "Barbell", muscleGroup: "Chest", primaryGroup: "Push" },
  { id: "3", name: "Dumbbell Bench Press", category: "Dumbbell", muscleGroup: "Chest", primaryGroup: "Push" },
  { id: "30", name: "Cable Fly", category: "Cable", muscleGroup: "Chest", primaryGroup: "Push" },
  { id: "31", name: "Dumbbell Fly", category: "Dumbbell", muscleGroup: "Chest", primaryGroup: "Push" },
  { id: "32", name: "Push Up", category: "Bodyweight", muscleGroup: "Chest", primaryGroup: "Push" },
  { id: "56", name: "Incline Dumbbell Press", category: "Dumbbell", muscleGroup: "Chest", primaryGroup: "Push" },
  { id: "57", name: "Decline Bench Press", category: "Barbell", muscleGroup: "Chest", primaryGroup: "Push" },
  { id: "58", name: "Chest Dip", category: "Bodyweight", muscleGroup: "Chest", primaryGroup: "Push" },
  { id: "59", name: "Machine Chest Press", category: "Machine", muscleGroup: "Chest", primaryGroup: "Push" },
  { id: "60", name: "Pec Deck", category: "Machine", muscleGroup: "Chest", primaryGroup: "Push" },

  // PUSH - Shoulders
  { id: "14", name: "Overhead Press", category: "Barbell", muscleGroup: "Shoulders", primaryGroup: "Push" },
  { id: "15", name: "Dumbbell Shoulder Press", category: "Dumbbell", muscleGroup: "Shoulders", primaryGroup: "Push" },
  { id: "16", name: "Lateral Raise", category: "Dumbbell", muscleGroup: "Shoulders", primaryGroup: "Push" },
  { id: "40", name: "Arnold Press", category: "Dumbbell", muscleGroup: "Shoulders", primaryGroup: "Push" },
  { id: "61", name: "Front Raise", category: "Dumbbell", muscleGroup: "Shoulders", primaryGroup: "Push" },
  { id: "62", name: "Machine Shoulder Press", category: "Machine", muscleGroup: "Shoulders", primaryGroup: "Push" },
  { id: "63", name: "Cable Lateral Raise", category: "Cable", muscleGroup: "Shoulders", primaryGroup: "Push" },

  // PUSH - Triceps
  { id: "21", name: "Tricep Pushdown", category: "Cable", muscleGroup: "Triceps", primaryGroup: "Push" },
  { id: "22", name: "Skull Crusher", category: "Barbell", muscleGroup: "Triceps", primaryGroup: "Push" },
  { id: "23", name: "Tricep Dip", category: "Bodyweight", muscleGroup: "Triceps", primaryGroup: "Push" },
  { id: "64", name: "Close Grip Bench Press", category: "Barbell", muscleGroup: "Triceps", primaryGroup: "Push" },
  { id: "65", name: "Overhead Tricep Extension", category: "Dumbbell", muscleGroup: "Triceps", primaryGroup: "Push" },
  { id: "66", name: "Tricep Kickback", category: "Dumbbell", muscleGroup: "Triceps", primaryGroup: "Push" },
  { id: "67", name: "Diamond Push Up", category: "Bodyweight", muscleGroup: "Triceps", primaryGroup: "Push" },
  { id: "68", name: "Rope Pushdown", category: "Cable", muscleGroup: "Triceps", primaryGroup: "Push" },

  // PULL - Lats
  { id: "9", name: "Lat Pulldown", category: "Cable", muscleGroup: "Lats", primaryGroup: "Pull" },
  { id: "12", name: "Pull Up", category: "Bodyweight", muscleGroup: "Lats", primaryGroup: "Pull" },
  { id: "13", name: "Chin Up", category: "Bodyweight", muscleGroup: "Lats", primaryGroup: "Pull" },
  { id: "69", name: "Wide Grip Lat Pulldown", category: "Cable", muscleGroup: "Lats", primaryGroup: "Pull" },
  { id: "70", name: "Close Grip Lat Pulldown", category: "Cable", muscleGroup: "Lats", primaryGroup: "Pull" },
  { id: "71", name: "Straight Arm Pulldown", category: "Cable", muscleGroup: "Lats", primaryGroup: "Pull" },
  { id: "72", name: "Single Arm Lat Pulldown", category: "Cable", muscleGroup: "Lats", primaryGroup: "Pull" },

  // PULL - Upper Back
  { id: "10", name: "Barbell Row", category: "Barbell", muscleGroup: "Upper Back", primaryGroup: "Pull" },
  { id: "11", name: "Dumbbell Row", category: "Dumbbell", muscleGroup: "Upper Back", primaryGroup: "Pull" },
  { id: "38", name: "Shrug", category: "Dumbbell", muscleGroup: "Upper Back", primaryGroup: "Pull" },
  { id: "39", name: "Upright Row", category: "Barbell", muscleGroup: "Upper Back", primaryGroup: "Pull" },
  { id: "73", name: "T-Bar Row", category: "Barbell", muscleGroup: "Upper Back", primaryGroup: "Pull" },
  { id: "74", name: "Seated Cable Row", category: "Cable", muscleGroup: "Upper Back", primaryGroup: "Pull" },
  { id: "75", name: "Chest Supported Row", category: "Dumbbell", muscleGroup: "Upper Back", primaryGroup: "Pull" },
  { id: "76", name: "Pendlay Row", category: "Barbell", muscleGroup: "Upper Back", primaryGroup: "Pull" },
  { id: "77", name: "Machine Row", category: "Machine", muscleGroup: "Upper Back", primaryGroup: "Pull" },
  { id: "78", name: "Barbell Shrug", category: "Barbell", muscleGroup: "Upper Back", primaryGroup: "Pull" },

  // PULL - Rear Delts
  { id: "17", name: "Face Pull", category: "Cable", muscleGroup: "Rear Delts", primaryGroup: "Pull" },
  { id: "79", name: "Rear Delt Fly", category: "Dumbbell", muscleGroup: "Rear Delts", primaryGroup: "Pull" },
  { id: "80", name: "Reverse Pec Deck", category: "Machine", muscleGroup: "Rear Delts", primaryGroup: "Pull" },
  { id: "81", name: "Cable Rear Delt Fly", category: "Cable", muscleGroup: "Rear Delts", primaryGroup: "Pull" },
  { id: "82", name: "Bent Over Rear Delt Raise", category: "Dumbbell", muscleGroup: "Rear Delts", primaryGroup: "Pull" },

  // PULL - Biceps
  { id: "18", name: "Bicep Curl", category: "Dumbbell", muscleGroup: "Biceps", primaryGroup: "Pull" },
  { id: "19", name: "Barbell Curl", category: "Barbell", muscleGroup: "Biceps", primaryGroup: "Pull" },
  { id: "20", name: "Hammer Curl", category: "Dumbbell", muscleGroup: "Biceps", primaryGroup: "Pull" },
  { id: "83", name: "Preacher Curl", category: "Barbell", muscleGroup: "Biceps", primaryGroup: "Pull" },
  { id: "84", name: "Concentration Curl", category: "Dumbbell", muscleGroup: "Biceps", primaryGroup: "Pull" },
  { id: "85", name: "Cable Curl", category: "Cable", muscleGroup: "Biceps", primaryGroup: "Pull" },
  { id: "86", name: "Incline Dumbbell Curl", category: "Dumbbell", muscleGroup: "Biceps", primaryGroup: "Pull" },
  { id: "87", name: "Spider Curl", category: "Dumbbell", muscleGroup: "Biceps", primaryGroup: "Pull" },
  { id: "88", name: "EZ Bar Curl", category: "Barbell", muscleGroup: "Biceps", primaryGroup: "Pull" },

  // LEGS - Quads
  { id: "4", name: "Squat", category: "Barbell", muscleGroup: "Quads", primaryGroup: "Legs" },
  { id: "5", name: "Front Squat", category: "Barbell", muscleGroup: "Quads", primaryGroup: "Legs" },
  { id: "6", name: "Leg Press", category: "Machine", muscleGroup: "Quads", primaryGroup: "Legs" },
  { id: "25", name: "Leg Extension", category: "Machine", muscleGroup: "Quads", primaryGroup: "Legs" },
  { id: "28", name: "Lunges", category: "Dumbbell", muscleGroup: "Quads", primaryGroup: "Legs" },
  { id: "29", name: "Bulgarian Split Squat", category: "Dumbbell", muscleGroup: "Quads", primaryGroup: "Legs" },
  { id: "89", name: "Hack Squat", category: "Machine", muscleGroup: "Quads", primaryGroup: "Legs" },
  { id: "90", name: "Goblet Squat", category: "Dumbbell", muscleGroup: "Quads", primaryGroup: "Legs" },
  { id: "91", name: "Sissy Squat", category: "Bodyweight", muscleGroup: "Quads", primaryGroup: "Legs" },
  { id: "92", name: "Walking Lunges", category: "Dumbbell", muscleGroup: "Quads", primaryGroup: "Legs" },

  // LEGS - Hamstrings
  { id: "7", name: "Deadlift", category: "Barbell", muscleGroup: "Hamstrings", primaryGroup: "Legs" },
  { id: "8", name: "Romanian Deadlift", category: "Barbell", muscleGroup: "Hamstrings", primaryGroup: "Legs" },
  { id: "24", name: "Leg Curl", category: "Machine", muscleGroup: "Hamstrings", primaryGroup: "Legs" },
  { id: "93", name: "Stiff Leg Deadlift", category: "Barbell", muscleGroup: "Hamstrings", primaryGroup: "Legs" },
  { id: "94", name: "Good Morning", category: "Barbell", muscleGroup: "Hamstrings", primaryGroup: "Legs" },
  { id: "95", name: "Nordic Curl", category: "Bodyweight", muscleGroup: "Hamstrings", primaryGroup: "Legs" },
  { id: "96", name: "Seated Leg Curl", category: "Machine", muscleGroup: "Hamstrings", primaryGroup: "Legs" },
  { id: "97", name: "Lying Leg Curl", category: "Machine", muscleGroup: "Hamstrings", primaryGroup: "Legs" },

  // LEGS - Glutes
  { id: "27", name: "Hip Thrust", category: "Barbell", muscleGroup: "Glutes", primaryGroup: "Legs" },
  { id: "98", name: "Glute Bridge", category: "Bodyweight", muscleGroup: "Glutes", primaryGroup: "Legs" },
  { id: "99", name: "Cable Kickback", category: "Cable", muscleGroup: "Glutes", primaryGroup: "Legs" },
  { id: "100", name: "Sumo Deadlift", category: "Barbell", muscleGroup: "Glutes", primaryGroup: "Legs" },
  { id: "101", name: "Glute Kickback Machine", category: "Machine", muscleGroup: "Glutes", primaryGroup: "Legs" },
  { id: "102", name: "Single Leg Hip Thrust", category: "Bodyweight", muscleGroup: "Glutes", primaryGroup: "Legs" },

  // LEGS - Calves
  { id: "26", name: "Calf Raise", category: "Machine", muscleGroup: "Calves", primaryGroup: "Legs" },
  { id: "103", name: "Seated Calf Raise", category: "Machine", muscleGroup: "Calves", primaryGroup: "Legs" },
  { id: "104", name: "Standing Calf Raise", category: "Machine", muscleGroup: "Calves", primaryGroup: "Legs" },
  { id: "105", name: "Donkey Calf Raise", category: "Machine", muscleGroup: "Calves", primaryGroup: "Legs" },
  { id: "106", name: "Single Leg Calf Raise", category: "Bodyweight", muscleGroup: "Calves", primaryGroup: "Legs" },

  // CORE - Abs
  { id: "33", name: "Plank", category: "Bodyweight", muscleGroup: "Abs", primaryGroup: "Core" },
  { id: "34", name: "Crunch", category: "Bodyweight", muscleGroup: "Abs", primaryGroup: "Core" },
  { id: "35", name: "Leg Raise", category: "Bodyweight", muscleGroup: "Abs", primaryGroup: "Core" },
  { id: "36", name: "Cable Crunch", category: "Cable", muscleGroup: "Abs", primaryGroup: "Core" },
  { id: "107", name: "Hanging Leg Raise", category: "Bodyweight", muscleGroup: "Abs", primaryGroup: "Core" },
  { id: "108", name: "Ab Rollout", category: "Bodyweight", muscleGroup: "Abs", primaryGroup: "Core" },
  { id: "109", name: "Dead Bug", category: "Bodyweight", muscleGroup: "Abs", primaryGroup: "Core" },
  { id: "110", name: "Hollow Body Hold", category: "Bodyweight", muscleGroup: "Abs", primaryGroup: "Core" },
  { id: "111", name: "Sit Up", category: "Bodyweight", muscleGroup: "Abs", primaryGroup: "Core" },

  // CORE - Obliques
  { id: "37", name: "Russian Twist", category: "Bodyweight", muscleGroup: "Obliques", primaryGroup: "Core" },
  { id: "112", name: "Side Plank", category: "Bodyweight", muscleGroup: "Obliques", primaryGroup: "Core" },
  { id: "113", name: "Wood Chop", category: "Cable", muscleGroup: "Obliques", primaryGroup: "Core" },
  { id: "114", name: "Bicycle Crunch", category: "Bodyweight", muscleGroup: "Obliques", primaryGroup: "Core" },
  { id: "115", name: "Oblique Crunch", category: "Bodyweight", muscleGroup: "Obliques", primaryGroup: "Core" },
  { id: "116", name: "Pallof Press", category: "Cable", muscleGroup: "Obliques", primaryGroup: "Core" },

  // CORE - Lower Back
  { id: "117", name: "Back Extension", category: "Machine", muscleGroup: "Lower Back", primaryGroup: "Core" },
  { id: "118", name: "Hyperextension", category: "Bodyweight", muscleGroup: "Lower Back", primaryGroup: "Core" },
  { id: "119", name: "Reverse Hyperextension", category: "Machine", muscleGroup: "Lower Back", primaryGroup: "Core" },
  { id: "120", name: "Superman", category: "Bodyweight", muscleGroup: "Lower Back", primaryGroup: "Core" },
  { id: "121", name: "Bird Dog", category: "Bodyweight", muscleGroup: "Lower Back", primaryGroup: "Core" },

  // Cardio exercises
  { id: "41", name: "Treadmill Run", category: "Cardio", muscleGroup: "Cardio", isCardio: true },
  { id: "42", name: "Outdoor Run", category: "Cardio", muscleGroup: "Cardio", isCardio: true },
  { id: "43", name: "Stationary Bike", category: "Cardio", muscleGroup: "Cardio", isCardio: true },
  { id: "44", name: "Outdoor Cycling", category: "Cardio", muscleGroup: "Cardio", isCardio: true },
  { id: "45", name: "Elliptical", category: "Cardio", muscleGroup: "Cardio", isCardio: true },
  { id: "46", name: "Rowing Machine", category: "Cardio", muscleGroup: "Cardio", isCardio: true },
  { id: "47", name: "Stair Climber", category: "Cardio", muscleGroup: "Cardio", isCardio: true },
  { id: "48", name: "Swimming", category: "Cardio", muscleGroup: "Cardio", isCardio: true },
  { id: "49", name: "Jump Rope", category: "Cardio", muscleGroup: "Cardio", isCardio: true },
  { id: "50", name: "Walking", category: "Cardio", muscleGroup: "Cardio", isCardio: true },
  { id: "51", name: "Hiking", category: "Cardio", muscleGroup: "Cardio", isCardio: true },
  { id: "52", name: "Sprints", category: "Cardio", muscleGroup: "Cardio", isCardio: true },
  { id: "53", name: "HIIT", category: "Cardio", muscleGroup: "Cardio", isCardio: true },
  { id: "54", name: "Battle Ropes", category: "Cardio", muscleGroup: "Cardio", isCardio: true },
  { id: "55", name: "Box Jumps", category: "Cardio", muscleGroup: "Cardio", isCardio: true },
];

interface ExerciseSearchInputProps {
  onSelect: (exercise: Exercise) => void;
  placeholder?: string;
}

const ExerciseSearchInput = ({ onSelect, placeholder = "Search exercises..." }: ExerciseSearchInputProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Exercise[]>([]);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch custom exercises on mount
  useEffect(() => {
    const fetchCustomExercises = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.from("custom_exercises").select("*").eq("user_id", user.id);

      if (error) {
        console.error("Error fetching custom exercises:", error);
        return;
      }

      const formatted: Exercise[] = (data || []).map((ex) => ({
        id: `custom-${ex.id}`,
        name: ex.name,
        category: ex.category,
        muscleGroup: ex.muscle_group,
        isCardio: ex.is_cardio,
      }));

      setCustomExercises(formatted);
    };

    fetchCustomExercises();
  }, []);

  // Combine and filter exercises
  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const allExercises = [...customExercises, ...exerciseDatabase];
    const filtered = allExercises.filter(
      (exercise) =>
        exercise.name.toLowerCase().includes(query.toLowerCase()) ||
        exercise.muscleGroup.toLowerCase().includes(query.toLowerCase()) ||
        exercise.category.toLowerCase().includes(query.toLowerCase()),
    );
    setResults(filtered.slice(0, 8));
    setIsOpen(true);
  }, [query, customExercises]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise);
    setQuery("");
    setIsOpen(false);
  };

  const handleAddCustom = () => {
    setIsOpen(false);
    setShowAddModal(true);
  };

  const handleCustomExerciseAdded = (exercise: Exercise) => {
    setCustomExercises((prev) => [exercise, ...prev]);
    onSelect(exercise);
    setQuery("");
  };

  return (
    <>
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="pl-10 bg-card border-border"
          />
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
            >
              {results.length > 0 ? (
                <>
                  {results.map((exercise) => (
                    <button
                      key={exercise.id}
                      onClick={() => handleSelect(exercise)}
                      className="w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${exercise.isCardio ? "bg-accent/20" : "bg-primary/20"}`}
                      >
                        <Dumbbell size={18} className={exercise.isCardio ? "text-accent" : "text-primary"} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {exercise.name}
                          {exercise.id.startsWith("custom-") && (
                            <span className="ml-2 text-xs text-primary">(Custom)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {exercise.category} • {exercise.muscleGroup}
                        </p>
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={handleAddCustom}
                    className="w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left border-t border-border"
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted">
                      <Plus size={18} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Add Custom Exercise</p>
                      <p className="text-xs text-muted-foreground">Create your own exercise</p>
                    </div>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAddCustom}
                  className="w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/20">
                    <Plus size={18} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Add "{query}" as Custom Exercise</p>
                    <p className="text-xs text-muted-foreground">Create your own exercise</p>
                  </div>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AddCustomExerciseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleCustomExerciseAdded}
        initialName={query}
      />
    </>
  );
};

export default ExerciseSearchInput;
