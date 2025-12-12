import { Check, Utensils, Dumbbell, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  icon: React.ReactNode;
  type: "meal" | "workout" | "water";
}

const dailyTasks: Task[] = [
  { id: "breakfast", title: "Log Breakfast", icon: <Utensils size={18} />, type: "meal" },
  { id: "lunch", title: "Log Lunch", icon: <Utensils size={18} />, type: "meal" },
  { id: "dinner", title: "Log Dinner", icon: <Utensils size={18} />, type: "meal" },
  { id: "workout", title: "Log a Workout", icon: <Dumbbell size={18} />, type: "workout" },
  { id: "water", title: "Reach Water Goal", icon: <Droplets size={18} />, type: "water" },
];

const typeStyles = {
  meal: "bg-primary/20 text-primary",
  workout: "bg-accent/20 text-accent",
  water: "bg-blue-500/20 text-blue-400",
};

interface TasksSectionProps {
  completedTasks?: Set<string>;
}

export const TasksSection = ({ completedTasks = new Set() }: TasksSectionProps) => {
  return (
    <section className="px-4 py-4">
      <h2 className="text-lg font-semibold mb-3">Today's Tasks</h2>
      
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
    </section>
  );
};