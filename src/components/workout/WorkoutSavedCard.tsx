import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Dumbbell } from "lucide-react";
import { getMuscleContributions, getMuscleDisplayName } from "@/lib/muscleContributions";

interface WorkoutSet {
  id?: string;
  weight?: string | number;
  reps?: string | number;
  distance?: string | number;
  time?: string;
  type?: string;
  setType?: string;
}

interface Exercise {
  id?: string;
  name: string;
  notes?: string;
  category?: string;
  muscleGroup?: string;
  sets?: WorkoutSet[];
  isCardio?: boolean;
  supersetGroup?: number;
  supersetGroupId?: string;
}

interface Creator {
  id?: string;
  name: string;
  username?: string | null;
  avatar_url?: string | null;
}

interface WorkoutSavedCardProps {
  title: string;
  exercises: Exercise[];
  creator: Creator;
  createdAt: string;
  onCopy: () => void;
  copyButtonText?: string;
  isRoutine?: boolean;
  tags?: string[];
  description?: string;
}

// Superset colors for workout display
const supersetColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-yellow-500",
];

const WorkoutSavedCard = ({
  title,
  exercises,
  creator,
  createdAt,
  onCopy,
  copyButtonText = "Copy",
  isRoutine = false,
  tags = [],
  description,
}: WorkoutSavedCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  // Helper to get set label matching Log Workout style
  const getSetLabel = (setType: string | undefined, normalSetNumber: number): string => {
    switch (setType) {
      case "warmup": return "W";
      case "failure": return "F";
      case "drop": case "dropset": return "D";
      default: return String(normalSetNumber);
    }
  };

  // Get styling for set type badge matching Log Workout
  const getSetBadgeStyle = (setType: string | undefined): string => {
    switch (setType) {
      case "warmup": return "bg-yellow-500/20 text-yellow-600";
      case "failure": return "bg-red-500/20 text-red-600";
      case "drop": case "dropset": return "bg-blue-500/20 text-blue-600";
      default: return "bg-muted text-muted-foreground";
    }
  };

  // Calculate normal set number (only counts normal sets)
  const getNormalSetNumber = (sets: WorkoutSet[] | undefined, currentIndex: number): number => {
    if (!sets) return currentIndex + 1;
    let count = 0;
    for (let i = 0; i <= currentIndex; i++) {
      const setType = sets[i]?.type || sets[i]?.setType;
      if (!setType || setType === "normal") {
        count++;
      }
    }
    return count;
  };

  // Group exercises by superset for coloring
  const supersetGroups = new Map<string, number>();
  let groupIndex = 0;
  exercises.forEach(ex => {
    const ssGroup = ex.supersetGroupId ?? (ex.supersetGroup !== undefined ? String(ex.supersetGroup) : undefined);
    if (ssGroup !== undefined && !supersetGroups.has(ssGroup)) {
      supersetGroups.set(ssGroup, groupIndex++);
    }
  });

  return (
    <div
      className="rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors cursor-pointer relative overflow-hidden"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-4">
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            /* Collapsed View - matching MealSavedCard style */
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-3"
            >
              {/* Workout Icon */}
              <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-primary/20 flex items-center justify-center">
                <Dumbbell size={18} className="text-primary" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Title */}
                <h4 className="font-semibold text-foreground truncate">{title}</h4>
                
                {/* Date */}
                <span className="text-xs text-muted-foreground -mt-0.5 block">
                  {formatDate(createdAt)}
                </span>

                {/* Exercise Preview */}
                <p className="text-xs text-muted-foreground/80 mt-1.5 truncate">
                  {exercises.map((e) => e.name).join(", ")}
                </p>
              </div>

              {/* Copy Button */}
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy();
                }}
                className="shrink-0"
              >
                {copyButtonText}
              </Button>
            </motion.div>
          ) : (
            /* Expanded View - matching MealSavedCard expanded style */
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Header with Title and Copy Button */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <h4 className="font-bold text-foreground text-xl">{title}</h4>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy();
                  }}
                  className="shrink-0"
                >
                  {copyButtonText}
                </Button>
              </div>

              {/* Profile Photo with Tags and Date */}
              <div className="flex items-start gap-3">
                {/* Profile Avatar - 40px (h-10) */}
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={creator.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-sm">
                    {getInitials(creator.name)}
                  </AvatarFallback>
                </Avatar>

                {/* Tags and Date - combined height matches avatar (40px) */}
                <div className="flex-1 min-w-0 flex flex-col justify-between h-10">
                  {/* Tags */}
                  {tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {tags.map((tag, idx) => (
                        <span 
                          key={idx} 
                          className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div />
                  )}
                  {/* Date */}
                  <span className="text-xs text-muted-foreground">
                    {formatDate(createdAt)}
                  </span>
                </div>
              </div>

              {/* Description */}
              {description && (
                <p className="text-sm text-muted-foreground mt-3">
                  {description}
                </p>
              )}

              {/* Exercises - matching PostDetailModal workout display */}
              <div className="mt-4 space-y-3">
                {exercises.map((exercise, idx) => {
                  const ssGroupKey = exercise.supersetGroupId ?? (exercise.supersetGroup !== undefined ? String(exercise.supersetGroup) : undefined);
                  const supersetGroupIndex = ssGroupKey !== undefined 
                    ? supersetGroups.get(ssGroupKey) 
                    : undefined;
                  const supersetColor = supersetGroupIndex !== undefined 
                    ? supersetColors[supersetGroupIndex % supersetColors.length]
                    : null;

                  return (
                    <div 
                      key={exercise.id || idx} 
                      className="rounded-xl bg-card border border-border overflow-hidden"
                    >
                      <div className="flex">
                        {/* Left color bar for superset exercises */}
                        {supersetColor && (
                          <div className={`w-1 ${supersetColor}`} />
                        )}
                        
                        <div className="flex-1 p-4 space-y-3">
                          {/* Exercise header - icon, name, category, muscles */}
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                              <Dumbbell size={18} className="text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">{exercise.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {exercise.category || "Exercise"} • {(() => {
                                  if (exercise.isCardio) return "Cardio";
                                  const config = getMuscleContributions(exercise.name, exercise.muscleGroup || "");
                                  const sortedMuscles = Object.entries(config.muscleContributions)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([muscle]) => getMuscleDisplayName(muscle));
                                  return sortedMuscles.length > 0 ? sortedMuscles.join(", ") : exercise.muscleGroup || "General";
                                })()}
                              </p>
                            </div>
                          </div>
                          
                          {/* Notes - directly below exercise header */}
                          {exercise.notes && (
                            <p className="text-sm text-foreground italic">
                              {exercise.notes}
                            </p>
                          )}
                          
                          {/* Sets - row format */}
                          {exercise.sets && exercise.sets.length > 0 && (
                            <div className="space-y-1.5">
                              {exercise.sets.map((set, setIdx) => {
                                const normalSetNumber = getNormalSetNumber(exercise.sets, setIdx);
                                const setType = set.type || set.setType;
                                const setLabel = isRoutine 
                                  ? String(setIdx + 1) 
                                  : getSetLabel(setType, normalSetNumber);
                                const badgeStyle = isRoutine 
                                  ? "bg-muted text-muted-foreground" 
                                  : getSetBadgeStyle(setType);
                                const weight = typeof set.weight === 'string' ? parseFloat(set.weight) || 0 : set.weight || 0;
                                const reps = typeof set.reps === 'string' ? parseFloat(set.reps) || 0 : set.reps || 0;
                                const distance = typeof set.distance === 'string' ? parseFloat(set.distance) || 0 : set.distance || 0;
                                
                                // For routines, show rep range
                                const minReps = (set as { minReps?: string }).minReps;
                                const maxReps = (set as { maxReps?: string }).maxReps;
                                
                                return (
                                  <div 
                                    key={setIdx}
                                    className="flex items-center gap-3 py-1"
                                  >
                                    {/* Set type/# badge - circular matching Log Workout style */}
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-sm ${badgeStyle}`}>
                                      {setLabel}
                                    </div>
                                    
                                    {/* Weight/Distance and Reps/Time in boxes */}
                                    {isRoutine ? (
                                      <div className="bg-muted/30 rounded-md px-3 py-1.5 flex items-center gap-1.5">
                                        <span className="text-sm font-medium text-foreground">
                                          {minReps || "0"}-{maxReps || "0"}
                                        </span>
                                        <span className="text-xs text-muted-foreground">reps</span>
                                      </div>
                                    ) : exercise.isCardio ? (
                                      <>
                                        <div className="bg-muted/30 rounded-md px-3 py-1.5 flex items-center gap-1.5">
                                          <span className="text-sm font-medium text-foreground">{distance}</span>
                                          <span className="text-xs text-muted-foreground">mi</span>
                                        </div>
                                        {set.time && (
                                          <div className="bg-muted/30 rounded-md px-3 py-1.5">
                                            <span className="text-sm font-medium text-foreground">{set.time}</span>
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        <div className="bg-muted/30 rounded-md px-3 py-1.5 flex items-center gap-1.5">
                                          <span className="text-sm font-medium text-foreground">{weight}</span>
                                          <span className="text-xs text-muted-foreground">lbs</span>
                                        </div>
                                        <span className="text-muted-foreground">×</span>
                                        <div className="bg-muted/30 rounded-md px-3 py-1.5 flex items-center gap-1.5">
                                          <span className="text-sm font-medium text-foreground">{reps}</span>
                                          <span className="text-xs text-muted-foreground">reps</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WorkoutSavedCard;
