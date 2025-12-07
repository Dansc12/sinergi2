import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, Dumbbell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
}

// Common exercises database
const exerciseDatabase: Exercise[] = [
  { id: "1", name: "Bench Press", category: "Barbell", muscleGroup: "Chest" },
  { id: "2", name: "Incline Bench Press", category: "Barbell", muscleGroup: "Chest" },
  { id: "3", name: "Dumbbell Bench Press", category: "Dumbbell", muscleGroup: "Chest" },
  { id: "4", name: "Squat", category: "Barbell", muscleGroup: "Legs" },
  { id: "5", name: "Front Squat", category: "Barbell", muscleGroup: "Legs" },
  { id: "6", name: "Leg Press", category: "Machine", muscleGroup: "Legs" },
  { id: "7", name: "Deadlift", category: "Barbell", muscleGroup: "Back" },
  { id: "8", name: "Romanian Deadlift", category: "Barbell", muscleGroup: "Back" },
  { id: "9", name: "Lat Pulldown", category: "Cable", muscleGroup: "Back" },
  { id: "10", name: "Barbell Row", category: "Barbell", muscleGroup: "Back" },
  { id: "11", name: "Dumbbell Row", category: "Dumbbell", muscleGroup: "Back" },
  { id: "12", name: "Pull Up", category: "Bodyweight", muscleGroup: "Back" },
  { id: "13", name: "Chin Up", category: "Bodyweight", muscleGroup: "Back" },
  { id: "14", name: "Overhead Press", category: "Barbell", muscleGroup: "Shoulders" },
  { id: "15", name: "Dumbbell Shoulder Press", category: "Dumbbell", muscleGroup: "Shoulders" },
  { id: "16", name: "Lateral Raise", category: "Dumbbell", muscleGroup: "Shoulders" },
  { id: "17", name: "Face Pull", category: "Cable", muscleGroup: "Shoulders" },
  { id: "18", name: "Bicep Curl", category: "Dumbbell", muscleGroup: "Arms" },
  { id: "19", name: "Barbell Curl", category: "Barbell", muscleGroup: "Arms" },
  { id: "20", name: "Hammer Curl", category: "Dumbbell", muscleGroup: "Arms" },
  { id: "21", name: "Tricep Pushdown", category: "Cable", muscleGroup: "Arms" },
  { id: "22", name: "Skull Crusher", category: "Barbell", muscleGroup: "Arms" },
  { id: "23", name: "Tricep Dip", category: "Bodyweight", muscleGroup: "Arms" },
  { id: "24", name: "Leg Curl", category: "Machine", muscleGroup: "Legs" },
  { id: "25", name: "Leg Extension", category: "Machine", muscleGroup: "Legs" },
  { id: "26", name: "Calf Raise", category: "Machine", muscleGroup: "Legs" },
  { id: "27", name: "Hip Thrust", category: "Barbell", muscleGroup: "Legs" },
  { id: "28", name: "Lunges", category: "Dumbbell", muscleGroup: "Legs" },
  { id: "29", name: "Bulgarian Split Squat", category: "Dumbbell", muscleGroup: "Legs" },
  { id: "30", name: "Cable Fly", category: "Cable", muscleGroup: "Chest" },
  { id: "31", name: "Dumbbell Fly", category: "Dumbbell", muscleGroup: "Chest" },
  { id: "32", name: "Push Up", category: "Bodyweight", muscleGroup: "Chest" },
  { id: "33", name: "Plank", category: "Bodyweight", muscleGroup: "Core" },
  { id: "34", name: "Crunch", category: "Bodyweight", muscleGroup: "Core" },
  { id: "35", name: "Leg Raise", category: "Bodyweight", muscleGroup: "Core" },
  { id: "36", name: "Cable Crunch", category: "Cable", muscleGroup: "Core" },
  { id: "37", name: "Russian Twist", category: "Bodyweight", muscleGroup: "Core" },
  { id: "38", name: "Shrug", category: "Dumbbell", muscleGroup: "Back" },
  { id: "39", name: "Upright Row", category: "Barbell", muscleGroup: "Shoulders" },
  { id: "40", name: "Arnold Press", category: "Dumbbell", muscleGroup: "Shoulders" },
];

interface ExerciseSearchInputProps {
  onSelect: (exercise: Exercise) => void;
  placeholder?: string;
}

const ExerciseSearchInput = ({ onSelect, placeholder = "Search exercises..." }: ExerciseSearchInputProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Exercise[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const filtered = exerciseDatabase.filter(
      (exercise) =>
        exercise.name.toLowerCase().includes(query.toLowerCase()) ||
        exercise.muscleGroup.toLowerCase().includes(query.toLowerCase()) ||
        exercise.category.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered.slice(0, 8));
    setIsOpen(true);
  }, [query]);

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

  return (
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
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
          >
            {results.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => handleSelect(exercise)}
                className="w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Dumbbell size={18} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{exercise.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {exercise.category} • {exercise.muscleGroup}
                  </p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExerciseSearchInput;
