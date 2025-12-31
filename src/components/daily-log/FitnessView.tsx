import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Dumbbell, ChevronRight, ChevronDown, Calendar, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useDailyLogs } from "@/hooks/useDailyLogs";
import { useScheduledRoutines } from "@/hooks/useScheduledRoutines";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  duration_seconds: number | null;
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
  const [workoutToDelete, setWorkoutToDelete] = useState<string | null>(null);
  const [isDeletingWorkout, setIsDeletingWorkout] = useState(false);
  
  const { workoutLogs, isLoading, refetch } = useDailyLogs(selectedDate || new Date());
  const { routineInstances, isLoading: routinesLoading } = useScheduledRoutines(selectedDate || new Date());

  // Delete workout handler
  const handleDeleteWorkout = async () => {
    if (!workoutToDelete) return;
    
    setIsDeletingWorkout(true);
    try {
      const { error } = await supabase
        .from("workout_logs")
        .delete()
        .eq("id", workoutToDelete);
      
      if (error) throw error;
      
      toast({ title: "Workout deleted", description: "The workout has been removed." });
      refetch();
    } catch (error) {
      console.error("Error deleting workout:", error);
      toast({ title: "Error", description: "Failed to delete workout.", variant: "destructive" });
    } finally {
      setIsDeletingWorkout(false);
      setWorkoutToDelete(null);
    }
  };

  // Calculate workout summary stats
  const getWorkoutStats = () => {
    if (workoutLogs.length === 0) {
      return { totalTime: 0, totalVolume: 0, primaryMuscle: "—" };
    }

    let totalVolume = 0;
    const muscleGroupCounts: Record<string, number> = {};

    workoutLogs.forEach(workout => {
      const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
      exercises.forEach(ex => {
        // Count muscle groups
        if (ex.muscleGroup) {
          muscleGroupCounts[ex.muscleGroup] = (muscleGroupCounts[ex.muscleGroup] || 0) + 1;
        }
        // Sum volume for strength exercises
        if (!ex.isCardio && Array.isArray(ex.sets)) {
          ex.sets.forEach(set => {
            const weight = parseFloat(set.weight) || 0;
            const reps = parseFloat(set.reps) || 0;
            totalVolume += weight * reps;
          });
        }
      });
    });

    // Find primary muscle group
    let primaryMuscle = "—";
    let maxCount = 0;
    Object.entries(muscleGroupCounts).forEach(([muscle, count]) => {
      if (count > maxCount) {
        maxCount = count;
        primaryMuscle = muscle;
      }
    });

    // Calculate total time from logged duration_seconds
    let totalTimeSeconds = 0;
    workoutLogs.forEach(workout => {
      if (workout.duration_seconds) {
        totalTimeSeconds += workout.duration_seconds;
      }
    });
    const totalTime = Math.round(totalTimeSeconds / 60); // Convert to minutes

    return { totalTime, totalVolume, primaryMuscle };
  };

  const workoutStats = getWorkoutStats();

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toLocaleString();
  };

  const toggleWorkout = (workoutId: string) => {
    setExpandedWorkout(expandedWorkout === workoutId ? null : workoutId);
  };

  const toggleRoutine = (routineId: string) => {
    setExpandedRoutine(expandedRoutine === routineId ? null : routineId);
  };

  const handleQuickLogWorkout = () => {
    navigate("/create/workout", {
      state: {
        logDate: selectedDate ? selectedDate.toISOString() : undefined,
      }
    });
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
        logDate: selectedDate ? selectedDate.toISOString() : undefined,
      },
    });
  };

  const getWorkoutSummary = (workout: WorkoutLog) => {
    const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
    const exerciseCount = exercises.length;
    const totalSets = exercises.reduce((sum, ex) => sum + (Array.isArray(ex.sets) ? ex.sets.length : 0), 0);
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
      {/* Workout Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        {/* Time Elapsed */}
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
            <Clock size={20} className="text-primary" />
          </div>
          <p className="text-xl font-bold">{workoutLogs.length > 0 ? formatDuration(workoutStats.totalTime) : "—"}</p>
          <p className="text-xs text-muted-foreground">Time</p>
        </div>

        {/* Total Volume */}
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
            <Dumbbell size={20} className="text-primary" />
          </div>
          <p className="text-xl font-bold">{workoutLogs.length > 0 ? formatVolume(workoutStats.totalVolume) : "—"}</p>
          <p className="text-xs text-muted-foreground">Volume (lbs)</p>
        </div>

        {/* Primary Muscle */}
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
            <Calendar size={20} className="text-primary" />
          </div>
          <p className="text-lg font-bold truncate">{workoutStats.primaryMuscle}</p>
          <p className="text-xs text-muted-foreground">Focus</p>
        </div>
      </div>

      {/* Scheduled Routines Section */}
      {pendingRoutines.length > 0 && (
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
      )}

      {/* Quick Start Workout Button */}
      <Button
        variant="outline"
        className="w-full gap-2 border-primary/50 text-primary hover:bg-primary/10"
        onClick={handleQuickLogWorkout}
      >
        <Dumbbell size={18} />
        Quick Start Workout
      </Button>

      {/* Logged Workouts - Full inline display matching SharePostScreen style */}
      {workoutLogs.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Logged Workouts</h3>
          <div className="space-y-4">
            {workoutLogs.map((workout) => {
              const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
              
              // Superset handling
              type SetType = "normal" | "warmup" | "failure" | "drop";
              const supersetColors = ["bg-cyan-500", "bg-amber-500", "bg-emerald-500", "bg-rose-500", "bg-sky-500"];
              
              const getSetLabel = (setType: SetType | undefined, normalSetNumber: number): string => {
                switch (setType) {
                  case "warmup": return "W";
                  case "failure": return "F";
                  case "drop": return "D";
                  default: return String(normalSetNumber);
                }
              };

              const getSetBadgeStyle = (setType: SetType | undefined): string => {
                switch (setType) {
                  case "warmup": return "bg-yellow-500/20 text-yellow-600";
                  case "failure": return "bg-red-500/20 text-red-600";
                  case "drop": return "bg-blue-500/20 text-blue-600";
                  default: return "bg-muted text-muted-foreground";
                }
              };

              const getNormalSetNumber = (sets: Array<{ setType?: SetType }>, currentIndex: number): number => {
                let count = 0;
                const setsArr = Array.isArray(sets) ? sets : [];
                for (let i = 0; i <= currentIndex; i++) {
                  const set = setsArr[i];
                  if (!set?.setType || set.setType === "normal") {
                    count++;
                  }
                }
                return count;
              };

              // Group exercises by superset
              const supersetGroups = new Map<string, number>();
              let groupIndex = 0;
              exercises.forEach(ex => {
                const exercise = ex as { supersetGroupId?: string };
                if (exercise.supersetGroupId && !supersetGroups.has(exercise.supersetGroupId)) {
                  supersetGroups.set(exercise.supersetGroupId, groupIndex++);
                }
              });

              return (
                <div key={workout.id} className="bg-card border border-border rounded-xl p-4 space-y-4 relative">
                  {/* Delete button - top right */}
                  <button
                    onClick={() => setWorkoutToDelete(workout.id)}
                    className="absolute top-3 right-3 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  
                  {/* Workout Header */}
                  <div className="flex items-center gap-3 pr-10">
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

                  {/* Notes */}
                  {workout.notes && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">{workout.notes}</p>
                    </div>
                  )}

                  {/* Exercises - SharePostScreen style */}
                  <div className="space-y-3">
                    {exercises.map((exercise, exIdx) => {
                      const ex = exercise as { 
                        name: string; 
                        notes?: string; 
                        isCardio?: boolean;
                        supersetGroupId?: string;
                        sets: Array<{ weight?: string; reps?: string; distance?: string; time?: string; setType?: SetType }>;
                      };
                      const sets = Array.isArray(ex.sets) ? ex.sets : [];
                      
                      const supersetGroupIndex = ex.supersetGroupId ? supersetGroups.get(ex.supersetGroupId) : undefined;
                      const supersetColor = supersetGroupIndex !== undefined 
                        ? supersetColors[supersetGroupIndex % supersetColors.length]
                        : null;

                      return (
                        <div 
                          key={exIdx} 
                          className="rounded-xl bg-muted/30 border border-border overflow-hidden"
                        >
                          <div className="flex">
                            {/* Left color bar for superset exercises */}
                            {supersetColor && (
                              <div className={`w-1 ${supersetColor}`} />
                            )}
                            
                            <div className="flex-1 p-3 space-y-2">
                              {/* Exercise name */}
                              <div>
                                <h4 className="font-semibold text-foreground">{ex.name}</h4>
                                {ex.isCardio && (
                                  <span className="text-xs text-muted-foreground">Cardio</span>
                                )}
                                {/* Notes - directly below exercise name */}
                                {ex.notes && (
                                  <p className="text-sm text-foreground italic mt-1">
                                    {ex.notes}
                                  </p>
                                )}
                              </div>
                              
                              {/* Sets - row format */}
                              <div className="space-y-1.5">
                                {sets.map((set, setIdx) => {
                                  const normalSetNumber = getNormalSetNumber(sets, setIdx);
                                  const setLabel = getSetLabel(set.setType, normalSetNumber);
                                  const badgeStyle = getSetBadgeStyle(set.setType);
                                  
                                  return (
                                    <div 
                                      key={setIdx}
                                      className="flex items-center gap-3 py-1"
                                    >
                                      {/* Set type/# badge */}
                                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-sm ${badgeStyle}`}>
                                        {setLabel}
                                      </div>
                                      
                                      {/* Weight/Distance and Reps/Time in boxes */}
                                      {ex.isCardio ? (
                                        <>
                                          <div className="bg-muted/50 rounded-md px-3 py-1.5 flex items-center gap-1.5">
                                            <span className="text-sm font-medium text-foreground">{set.distance || '0'}</span>
                                            <span className="text-xs text-muted-foreground">mi</span>
                                          </div>
                                          <div className="bg-muted/50 rounded-md px-3 py-1.5">
                                            <span className="text-sm font-medium text-foreground">{set.time || '0:00'}</span>
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          <div className="bg-muted/50 rounded-md px-3 py-1.5 flex items-center gap-1.5">
                                            <span className="text-sm font-medium text-foreground">{set.weight || 0}</span>
                                            <span className="text-xs text-muted-foreground">lbs</span>
                                          </div>
                                          <span className="text-muted-foreground">×</span>
                                          <div className="bg-muted/50 rounded-md px-3 py-1.5 flex items-center gap-1.5">
                                            <span className="text-sm font-medium text-foreground">{set.reps || 0}</span>
                                            <span className="text-xs text-muted-foreground">reps</span>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
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

      {/* Delete Workout Confirmation Dialog */}
      <AlertDialog open={!!workoutToDelete} onOpenChange={(open) => !open && setWorkoutToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workout?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Are you sure you want to permanently delete this workout?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingWorkout}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorkout}
              disabled={isDeletingWorkout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingWorkout ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
