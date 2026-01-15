import { useState } from "react";
import { Check, Utensils, Dumbbell, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";

interface Task {
  id: string;
  title: string;
  icon: React.ReactNode;
  type: "meal" | "workout";
}

const dailyTasks: Task[] = [
  { id: "breakfast", title: "Log Breakfast", icon: <Utensils size={18} />, type: "meal" },
  { id: "lunch", title: "Log Lunch", icon: <Utensils size={18} />, type: "meal" },
  { id: "dinner", title: "Log Dinner", icon: <Utensils size={18} />, type: "meal" },
  { id: "workout", title: "Log a Workout", icon: <Dumbbell size={18} />, type: "workout" },
];

const typeStyles = {
  meal: "bg-primary/20 text-primary",
  workout: "bg-accent/20 text-accent",
};

interface TasksSectionProps {
  completedTasks?: Set<string>;
}

export const TasksSection = ({ completedTasks = new Set() }: TasksSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const completedCount = dailyTasks.filter(task => completedTasks.has(task.id)).length;
  const totalTasks = dailyTasks.length;
  const progressPercentage = (completedCount / totalTasks) * 100;

  return (
    <section className="px-4 py-4">
      {/* Header - Always visible */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Today</h2>
          <span className="text-sm text-muted-foreground">
            {completedCount}/{totalTasks}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={20} className="text-muted-foreground" />
        </motion.div>
      </button>

      {/* Progress Bar - Always visible */}
      <div className="mb-3">
        <Progress value={progressPercentage} className="h-2" />
      </div>
      
      {/* Expandable Task List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-3">
              {dailyTasks.map((task) => {
                const isCompleted = completedTasks.has(task.id);
                
                return (
                  <div
                    key={task.id}
                    className={cn(
                      "w-full bg-card border border-border rounded-2xl p-4 shadow-card flex items-center gap-4 transition-all duration-200",
                      isCompleted && "opacity-60"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      typeStyles[task.type]
                    )}>
                      {task.icon}
                    </div>
                    
                    <p className={cn(
                      "flex-1 text-left font-medium",
                      isCompleted && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </p>

                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                      isCompleted 
                        ? "bg-primary border-primary" 
                        : "border-muted-foreground/40"
                    )}>
                      {isCompleted && <Check size={14} className="text-primary-foreground" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};