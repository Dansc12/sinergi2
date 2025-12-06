import { motion, AnimatePresence } from "framer-motion";
import { X, Dumbbell, Utensils, PenSquare, Users, ChefHat, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CreateOption {
  icon: React.ReactNode;
  label: string;
  description: string;
  gradient: string;
}

const createOptions: CreateOption[] = [
  { 
    icon: <Dumbbell size={24} />, 
    label: "Workout", 
    description: "Log your exercise session",
    gradient: "from-primary to-accent"
  },
  { 
    icon: <Utensils size={24} />, 
    label: "Meal", 
    description: "Track your nutrition",
    gradient: "from-success to-emerald-400"
  },
  { 
    icon: <PenSquare size={24} />, 
    label: "Post", 
    description: "Share a wellness update",
    gradient: "from-blue-500 to-cyan-400"
  },
  { 
    icon: <Users size={24} />, 
    label: "Group", 
    description: "Create a fitness group",
    gradient: "from-amber-500 to-orange-400"
  },
  { 
    icon: <ChefHat size={24} />, 
    label: "Recipe", 
    description: "Share a healthy recipe",
    gradient: "from-rose-500 to-pink-400"
  },
  { 
    icon: <RotateCcw size={24} />, 
    label: "Routine", 
    description: "Build a workout routine",
    gradient: "from-violet-500 to-purple-400"
  },
];

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateModal = ({ isOpen, onClose }: CreateModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[70] max-h-[85vh] overflow-hidden"
          >
            <div className="glass-elevated rounded-t-3xl p-6 pb-safe-bottom">
              {/* Handle */}
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Create</h2>
                <Button variant="ghost" size="icon-sm" onClick={onClose}>
                  <X size={20} />
                </Button>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {createOptions.map((option, index) => (
                  <motion.button
                    key={option.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-200 group"
                    onClick={onClose}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.gradient} flex items-center justify-center text-primary-foreground shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                      {option.icon}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-foreground">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
