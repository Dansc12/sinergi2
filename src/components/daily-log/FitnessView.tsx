import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Footprints, Clock, Dumbbell, ChevronRight, ChevronDown, Calendar, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useDailyLogs } from "@/hooks/useDailyLogs";
import { useScheduledRoutines } from "@/hooks/useScheduledRoutines";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WorkoutExercise {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
  notes: string;
  isCardio: boolean;
  sets: {
    id: string;
    weight: string;
    reps: string;
    distance: string;
    time: string;
    completed: boolean;
  }[];
}

interface WorkoutLog {
  id: string;
  exercises: WorkoutExercise[];
  notes: string | null;
  photos: string[] | null;
  created_at: string;
}

interface RoutineExercise {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
  notes: string;
  sets: { id: string; minReps: string; maxReps: string }[];
}

interface FitnessViewProps {
  selectedDate?: Date;
}

export const FitnessView = ({ selectedDate }: FitnessViewProps) => {
  const navigate = useNavigate();
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const [expandedRoutine, setExpandedRoutine] = useState<string | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutLog | null>(null);
  const [selectedRoutineDetail, setSelectedRoutineDetail] = useState<{
    id: string;
    instanceId: string;
    name: string;
    exercises: RoutineExercise[];
    time: string | null;
  } | null>(null);
  
  // Steps state
  const [steps, setSteps] = useState(0);
  const [showStepsInput, setShowStepsInput] = useState(false);
  const [stepsInputValue, setStepsInputValue] = useState("");
  const [showAddPrompt, setShowAddPrompt] = useState(false);
  
  const { workoutLogs, isLoading } = useDailyLogs(selectedDate || new Date());
  const { routineInstances, isLoading: routinesLoading } = useScheduledRoutines(selectedDate || new Date());
  
  const stepsGoal = 10000;
  const stepsLeft = Math.max(stepsGoal - steps, 0);

  // Periodic "Click to add steps" prompt
  useEffect(() => {
    const interval = setInterval(() => {
      setShowAddPrompt(true);
      setTimeout(() => setShowAddPrompt(false), 2500);
    }, 12000); // Show every 12 seconds
    
    return () => clearInterval(interval);
  }, []);

  const handleStepsSubmit = () => {
    const newSteps = parseInt(stepsInputValue);
    if (!isNaN(newSteps) && newSteps > 0) {
      setSteps(prev => prev + newSteps);
    }
    setStepsInputValue("");
    setShowStepsInput(false);
  };

  const toggleWorkout = (workoutId: string) => {
    setExpandedWorkout(expandedWorkout === workoutId ? null : workoutId);
  };

  const toggleRoutine = (routineId: string) => {
    setExpandedRoutine(expandedRoutine === routineId ? null : routineId);
  };

  const handleQuickLogWorkout = () => {
    navigate("/create/workout");
  };

  const handleStartRoutine = (instance: typeof routineInstances[0]) => {
    if (!instance.scheduled_routine) return;
    
    const routine = instance.scheduled_routine;
    const routineData = routine.routine_data as { exercises: RoutineExercise[]; description?: string };
    
    // Convert routine exercises to workout format with rep range placeholders
    const prefilledExercises = routineData.exercises.map(ex => ({
      id: ex.id,
      name: ex.name,
      category: ex.category,
      muscleGroup: ex.muscleGroup,
      notes: ex.notes || "",
      isCardio: false,
      isExpanded: true,
      sets: ex.sets.map(set => ({
        id: set.id,
        weight: "",
        reps: "",
        distance: "",
        time: "",
        completed: false,
        repRangeHint: `${set.minReps}-${set.maxReps}`, // Hint for rep range
      })),
    }));

    navigate("/create/workout", {
      state: {
        prefilled: true,
        routineName: routine.routine_name,
        exercises: prefilledExercises,
        routineInstanceId: instance.id,
      },
    });
  };

  const getWorkoutSummary = (workout: WorkoutLog) => {
    const exerciseCount = workout.exercises.length;
    const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    return `${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''} • ${totalSets} set${totalSets !== 1 ? 's' : ''}`;
  };

  const formatWorkoutTime = (createdAt: string) => {
    return format(new Date(createdAt), "h:mm a");
  };

  const formatScheduledTime = (time: string | null) => {
    if (!time) return "Anytime";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (isLoading || routinesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Filter pending routine instances only
  const pendingRoutines = routineInstances.filter(r => r.status === "pending");
  const hadRoutinesScheduled = routineInstances.length > 0;

  return (
    <div className="space-y-6">
      {/* Steps Progress - Clickable */}
      <div className="text-center">
        <button
          onClick={() => setShowStepsInput(true)}
          className="relative w-40 h-40 mx-auto mb-4 cursor-pointer transition-transform hover:scale-105 active:scale-95"
        >
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
            <AnimatePresence mode="wait">
              {showAddPrompt ? (
                <motion.div
                  key="prompt"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center"
                >
                  <Plus className="text-primary mb-1" size={28} />
                  <span className="text-sm font-medium text-primary">Click to add</span>
                  <span className="text-sm font-medium text-primary">steps</span>
                </motion.div>
              ) : (
                <motion.div
                  key="steps"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center"
                >
                  <Footprints className="text-primary mb-1" size={24} />
                  <span className="text-3xl font-bold">{steps.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">{stepsLeft.toLocaleString()} to go</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </button>
      </div>

      {/* Steps Input Dialog */}
      <Dialog open={showStepsInput} onOpenChange={setShowStepsInput}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Footprints size={20} className="text-primary" />
              Add Steps
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              placeholder="Enter steps..."
              value={stepsInputValue}
              onChange={(e) => setStepsInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleStepsSubmit()}
              autoFocus
              className="text-center text-lg"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowStepsInput(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleStepsSubmit}
                disabled={!stepsInputValue || parseInt(stepsInputValue) <= 0}
              >
                Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Scheduled Routines Section */}
      <div>
        <h3 className="font-semibold mb-3">Scheduled Workouts</h3>
        
        {pendingRoutines.length > 0 ? (
          <div className="space-y-3">
            {pendingRoutines.map((instance) => {
              const routine = instance.scheduled_routine;
              if (!routine) return null;
              
              const routineData = routine.routine_data as { exercises: RoutineExercise[]; description?: string };
              const exercises = routineData.exercises || [];
              
              return (
                <motion.div
                  key={instance.id}
                  className="bg-card border border-border rounded-xl overflow-hidden"
                >
                  {/* Routine Header */}
                  <button
                    onClick={() => toggleRoutine(instance.id)}
                    className="w-full p-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                        <Dumbbell size={18} className="text-violet-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{routine.routine_name}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock size={14} />
                          <span>{formatScheduledTime(instance.scheduled_time)}</span>
                          <span>•</span>
                          <span>{exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                    {expandedRoutine === instance.id ? (
                      <ChevronDown size={20} className="text-muted-foreground" />
                    ) : (
                      <ChevronRight size={20} className="text-muted-foreground" />
                    )}
                  </button>

                  {/* Preview when collapsed */}
                  {expandedRoutine !== instance.id && (
                    <div className="px-4 pb-4">
                      <div className="text-sm text-muted-foreground space-y-1">
                        {exercises.slice(0, 3).map((exercise, index) => (
                          <div key={index} className="flex justify-between">
                            <span>{exercise.name}</span>
                            <span>{exercise.sets.length} set{exercise.sets.length !== 1 ? 's' : ''}</span>
                          </div>
                        ))}
                        {exercises.length > 3 && (
                          <span className="text-xs text-primary">
                            +{exercises.length - 3} more exercises
                          </span>
                        )}
                      </div>
                      <Button
                        className="w-full mt-3 gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartRoutine(instance);
                        }}
                      >
                        <Play size={16} />
                        Start Workout
                      </Button>
                    </div>
                  )}

                  {/* Expanded Routine Details */}
                  <AnimatePresence>
                    {expandedRoutine === instance.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3">
                          {/* Full Exercise List */}
                          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                            {exercises.map((exercise, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <div>
                                  <span className="text-foreground">{exercise.name}</span>
                                  {exercise.notes && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{exercise.notes}</p>
                                  )}
                                </div>
                                <span className="text-muted-foreground">
                                  {exercise.sets.length} × {exercise.sets[0]?.minReps}-{exercise.sets[0]?.maxReps} reps
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Start Workout Button */}
                          <Button
                            className="w-full gap-2"
                            onClick={() => handleStartRoutine(instance)}
                          >
                            <Play size={16} />
                            Start Workout
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        ) : !hadRoutinesScheduled ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <Calendar size={32} className="mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-1">No workout routines scheduled for this day</p>
            <p className="text-sm text-muted-foreground/70 mb-4">
              Create a routine to schedule recurring workouts
            </p>
          </div>
        ) : null}

        {/* Quick Start Workout Button */}
        <Button
          variant="outline"
          className="w-full mt-4 gap-2 border-primary/50 text-primary hover:bg-primary/10"
          onClick={handleQuickLogWorkout}
        >
          <Dumbbell size={18} />
          Quick Start Workout
        </Button>
      </div>

      {/* Logged Workouts */}
      {workoutLogs.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Logged Workouts</h3>
          <div className="space-y-3">
            {workoutLogs.map((workout) => (
              <motion.div
                key={workout.id}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                {/* Workout Header */}
                <button
                  onClick={() => toggleWorkout(workout.id)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Dumbbell size={18} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Workout</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock size={14} />
                        <span>{formatWorkoutTime(workout.created_at)}</span>
                        <span>•</span>
                        <span>{getWorkoutSummary(workout)}</span>
                      </div>
                    </div>
                  </div>
                  {expandedWorkout === workout.id ? (
                    <ChevronDown size={20} className="text-muted-foreground" />
                  ) : (
                    <ChevronRight size={20} className="text-muted-foreground" />
                  )}
                </button>

                {/* Expanded Workout Details */}
                <AnimatePresence>
                  {expandedWorkout === workout.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3">
                        {/* Exercise List */}
                        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                          {workout.exercises.slice(0, 5).map((exercise, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-foreground">{exercise.name}</span>
                              <span className="text-muted-foreground">
                                {exercise.sets.length} set{exercise.sets.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          ))}
                          {workout.exercises.length > 5 && (
                            <span className="text-xs text-primary">
                              +{workout.exercises.length - 5} more exercises
                            </span>
                          )}
                        </div>

                        {/* View Details Button */}
                        <Button
                          variant="outline"
                          className="w-full gap-2"
                          onClick={() => setSelectedWorkout(workout)}
                        >
                          View Full Details
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Preview when collapsed */}
                {expandedWorkout !== workout.id && (
                  <div className="px-4 pb-4">
                    <div className="text-sm text-muted-foreground space-y-1">
                      {workout.exercises.slice(0, 3).map((exercise, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{exercise.name}</span>
                          <span>{exercise.sets.length} set{exercise.sets.length !== 1 ? 's' : ''}</span>
                        </div>
                      ))}
                      {workout.exercises.length > 3 && (
                        <span className="text-xs text-primary">
                          +{workout.exercises.length - 3} more exercises
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}



      {/* Workout Detail Modal */}
      <Dialog open={!!selectedWorkout} onOpenChange={() => setSelectedWorkout(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dumbbell size={20} className="text-primary" />
              Workout Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedWorkout && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {format(new Date(selectedWorkout.created_at), "MMMM d, yyyy 'at' h:mm a")}
              </p>

              {selectedWorkout.notes && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm">{selectedWorkout.notes}</p>
                </div>
              )}

              <div className="space-y-3">
                {selectedWorkout.exercises.map((exercise, exIndex) => (
                  <div key={exIndex} className="bg-card border border-border rounded-lg p-3">
                    <h4 className="font-semibold mb-2">{exercise.name}</h4>
                    {exercise.notes && (
                      <p className="text-xs text-muted-foreground mb-2">{exercise.notes}</p>
                    )}
                    <div className="space-y-1">
                      {exercise.sets.map((set, setIndex) => (
                        <div key={setIndex} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Set {setIndex + 1}</span>
                          {exercise.isCardio ? (
                            <span>
                              {set.distance && `${set.distance} mi`}
                              {set.distance && set.time && " • "}
                              {set.time && set.time}
                            </span>
                          ) : (
                            <span>
                              {set.weight && `${set.weight} lbs`}
                              {set.weight && set.reps && " × "}
                              {set.reps && `${set.reps} reps`}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {selectedWorkout.photos && selectedWorkout.photos.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Photos</h4>
                  <div className="flex gap-2 overflow-x-auto">
                    {selectedWorkout.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Workout photo ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
