import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Footprints, Clock, Dumbbell, ChevronRight, ChevronDown, Play, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface RoutineExercise {
  name: string;
  sets: number;
  reps: string;
}

interface ScheduledRoutine {
  id: string;
  name: string;
  time: string;
  exercises: RoutineExercise[];
}

interface FitnessViewProps {
  selectedDate?: Date;
}

export const FitnessView = ({ selectedDate }: FitnessViewProps) => {
  const navigate = useNavigate();
  const [expandedRoutine, setExpandedRoutine] = useState<string | null>(null);
  
  const steps = 0;
  const stepsGoal = 10000;
  const stepsLeft = stepsGoal - steps;

  // Empty scheduled routines - in production, this would come from the database
  const scheduledRoutines: ScheduledRoutine[] = [];

  const toggleRoutine = (routineId: string) => {
    setExpandedRoutine(expandedRoutine === routineId ? null : routineId);
  };

  const handleStartRoutineWorkout = (routine: ScheduledRoutine) => {
    // Convert routine exercises to workout format with pre-filled sets
    const exercises = routine.exercises.map((exercise, index) => {
      const [minReps, maxReps] = exercise.reps.split("-").map(r => r.trim());
      const sets = Array.from({ length: exercise.sets }, (_, i) => ({
        id: `${index}-${i}`,
        weight: "",
        reps: minReps || exercise.reps,
        distance: "",
        time: "",
        completed: false,
      }));

      return {
        id: `${Date.now()}-${index}`,
        name: exercise.name,
        category: "Strength",
        muscleGroup: "Various",
        notes: "",
        sets,
        isExpanded: true,
        isCardio: false,
      };
    });

    navigate("/create/workout", {
      state: {
        prefilled: true,
        routineName: routine.name,
        exercises,
      },
    });
  };

  const handleQuickLogWorkout = () => {
    navigate("/create/workout");
  };

  return (
    <div className="space-y-6">
      {/* Steps Progress - No Frame */}
      <div className="text-center">
        <div className="relative w-40 h-40 mx-auto mb-4">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              strokeWidth="14"
              stroke="hsl(var(--muted))"
              fill="none"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              strokeWidth="14"
              stroke="url(#stepsGradient)"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${(steps / stepsGoal) * 440} 440`}
            />
            <defs>
              <linearGradient id="stepsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(270, 91%, 65%)" />
                <stop offset="100%" stopColor="hsl(320, 100%, 60%)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Footprints className="text-primary mb-1" size={24} />
            <span className="text-3xl font-bold">{steps.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">{stepsLeft.toLocaleString()} to go</span>
          </div>
        </div>
      </div>

      {/* Scheduled Workouts */}
      <div>
        <h3 className="font-semibold mb-3">Scheduled Workouts</h3>
        
        {scheduledRoutines.length > 0 ? (
          <div className="space-y-3">
            {scheduledRoutines.map((routine) => (
              <motion.div
                key={routine.id}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                {/* Routine Header */}
                <button
                  onClick={() => toggleRoutine(routine.id)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Dumbbell size={18} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{routine.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock size={14} />
                        <span>{routine.time}</span>
                        <span>•</span>
                        <span>{routine.exercises.length} exercises</span>
                      </div>
                    </div>
                  </div>
                  {expandedRoutine === routine.id ? (
                    <ChevronDown size={20} className="text-muted-foreground" />
                  ) : (
                    <ChevronRight size={20} className="text-muted-foreground" />
                  )}
                </button>

                {/* Expanded Routine Details */}
                <AnimatePresence>
                  {expandedRoutine === routine.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3">
                        {/* Exercise List */}
                        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                          {routine.exercises.map((exercise, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-foreground">{exercise.name}</span>
                              <span className="text-muted-foreground">
                                {exercise.sets} × {exercise.reps}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Start Workout Button */}
                        <Button
                          className="w-full gap-2"
                          onClick={() => handleStartRoutineWorkout(routine)}
                        >
                          <Play size={16} />
                          Start Workout
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Preview of first 3 exercises when collapsed */}
                {expandedRoutine !== routine.id && (
                  <div className="px-4 pb-4">
                    <div className="text-sm text-muted-foreground space-y-1">
                      {routine.exercises.slice(0, 3).map((exercise, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{exercise.name}</span>
                          <span>{exercise.sets} × {exercise.reps}</span>
                        </div>
                      ))}
                      {routine.exercises.length > 3 && (
                        <span className="text-xs text-primary">
                          +{routine.exercises.length - 3} more exercises
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <Calendar size={32} className="mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-1">No workout routines scheduled for this day</p>
            <p className="text-sm text-muted-foreground/70 mb-4">
              Consider creating or finding a routine to stay on track
            </p>
          </div>
        )}

        {/* Quick Log Workout Button */}
        <Button
          variant="outline"
          className="w-full mt-4 gap-2 border-primary/50 text-primary hover:bg-primary/10"
          onClick={handleQuickLogWorkout}
        >
          <Dumbbell size={18} />
          Log a Workout
        </Button>
      </div>
    </div>
  );
};
