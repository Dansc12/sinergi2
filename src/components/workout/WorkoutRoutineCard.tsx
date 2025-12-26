import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

interface Exercise {
  id: string;
  name: string;
  notes?: string;
  sets: Array<{
    id: string;
    weight?: string;
    reps?: string;
    distance?: string;
    time?: string;
    minReps?: string;
    maxReps?: string;
  }>;
  isCardio?: boolean;
}

interface Creator {
  id?: string;
  name: string;
  username?: string | null;
  avatar_url?: string | null;
}

interface WorkoutRoutineCardProps {
  title: string;
  exercises: Exercise[];
  creator: Creator;
  createdAt: string;
  onCopy: () => void;
  copyButtonText?: string;
  isRoutine?: boolean;
}

const WorkoutRoutineCard = ({
  title,
  exercises,
  creator,
  createdAt,
  onCopy,
  copyButtonText = "Copy",
  isRoutine = false,
}: WorkoutRoutineCardProps) => {
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

  const exerciseNames = exercises.map((e) => e.name).slice(0, 5);
  const hasMore = exercises.length > 5;

  return (
    <div
      className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
    >
      {/* Main Row */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={creator.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary text-sm">
            {getInitials(creator.name)}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div 
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Title and Date Row */}
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-foreground truncate flex-1">{title}</h4>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatDate(createdAt)}
            </span>
          </div>

          {/* Exercise Preview */}
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {exerciseNames.join(", ")}
            {hasMore && ` +${exercises.length - 5} more`}
          </p>

          {/* Expand Indicator */}
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground/70">
            {isExpanded ? (
              <>
                <ChevronUp size={14} />
                <span>Hide details</span>
              </>
            ) : (
              <>
                <ChevronDown size={14} />
                <span>View details</span>
              </>
            )}
          </div>
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
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
              {exercises.map((exercise, idx) => (
                <div key={exercise.id || idx} className="space-y-1">
                  <h5 className="font-medium text-foreground text-sm">{exercise.name}</h5>
                  {exercise.notes && (
                    <p className="text-xs text-muted-foreground italic">{exercise.notes}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {exercise.sets.map((set, setIdx) => (
                      <span
                        key={set.id || setIdx}
                        className="text-xs bg-muted/50 px-2 py-1 rounded"
                      >
                        {isRoutine ? (
                          // Routine format: rep range
                          `Set ${setIdx + 1}: ${set.minReps || "0"}-${set.maxReps || "0"} reps`
                        ) : exercise.isCardio ? (
                          // Cardio format: distance/time
                          `${set.distance || "0"} mi / ${set.time || "0:00"}`
                        ) : (
                          // Strength format: weight x reps
                          `${set.weight || "0"} lbs × ${set.reps || "0"}`
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkoutRoutineCard;
