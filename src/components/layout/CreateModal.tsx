import { useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X, Dumbbell, Utensils, PenSquare, Users, ChefHat, RotateCcw, UtensilsCrossed } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface CreateOption {
  icon: React.ReactNode;
  label: string;
  description: string;
  gradient: string;
  path: string;
}

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateModal = ({ isOpen, onClose }: CreateModalProps) => {
  const navigate = useNavigate();
  const [currentScreen, setCurrentScreen] = useState(0);
  const totalScreens = 3;

  const handleOptionClick = (path: string) => {
    onClose();
    setCurrentScreen(0);
    navigate(path);
  };

  const handleClose = () => {
    onClose();
    setCurrentScreen(0);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold && currentScreen < totalScreens - 1) {
      setCurrentScreen(currentScreen + 1);
    } else if (info.offset.x > threshold && currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    }
  };

  const OptionButton = ({ option, size = "normal" }: { option: CreateOption; size?: "normal" | "small" }) => (
    <motion.button
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-200 group ${size === "small" ? "p-3" : ""}`}
      onClick={() => handleOptionClick(option.path)}
    >
      <div className={`${size === "small" ? "w-10 h-10" : "w-12 h-12"} rounded-xl bg-gradient-to-br ${option.gradient} flex items-center justify-center text-primary-foreground shadow-lg group-hover:scale-110 transition-transform duration-200`}>
        {option.icon}
      </div>
      <div className="text-center">
        <p className={`font-semibold text-foreground ${size === "small" ? "text-xs" : "text-sm"}`}>{option.label}</p>
        <p className={`text-muted-foreground line-clamp-2 ${size === "small" ? "text-[10px]" : "text-xs"}`}>{option.description}</p>
      </div>
    </motion.button>
  );

  // Screen 1: Post (full width), Workout and Meal side by side
  const Screen1 = () => (
    <div className="space-y-3">
      <motion.button
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-200 group"
        onClick={() => handleOptionClick("/create/post")}
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-primary-foreground shadow-lg group-hover:scale-110 transition-transform duration-200">
          <PenSquare size={24} />
        </div>
        <div className="text-left">
          <p className="font-semibold text-foreground">Post</p>
          <p className="text-sm text-muted-foreground">Share a wellness update</p>
        </div>
      </motion.button>

      <div className="grid grid-cols-2 gap-3">
        <OptionButton option={{ icon: <Dumbbell size={24} />, label: "Workout", description: "Log your exercise session", gradient: "from-primary to-accent", path: "/create/workout" }} />
        <OptionButton option={{ icon: <Utensils size={24} />, label: "Meal", description: "Track your nutrition", gradient: "from-success to-emerald-400", path: "/create/meal" }} />
      </div>
    </div>
  );

  // Screen 2: Routine (left, vertically centered), Recipe and Saved Meal stacked (right)
  const Screen2 = () => (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex items-center">
        <OptionButton option={{ icon: <RotateCcw size={24} />, label: "Routine", description: "Build a workout routine", gradient: "from-violet-500 to-purple-400", path: "/create/routine" }} />
      </div>
      <div className="flex flex-col gap-3">
        <OptionButton option={{ icon: <ChefHat size={20} />, label: "Recipe", description: "Share a healthy recipe", gradient: "from-rose-500 to-pink-400", path: "/create/recipe" }} size="small" />
        <OptionButton option={{ icon: <UtensilsCrossed size={20} />, label: "Saved Meal", description: "Save a meal combo", gradient: "from-amber-500 to-yellow-400", path: "/create/saved-meal" }} size="small" />
      </div>
    </div>
  );

  // Screen 3: Groups only (full height)
  const Screen3 = () => (
    <div className="flex items-center justify-center h-full">
      <motion.button
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex flex-col items-center justify-center gap-4 p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-200 group h-full"
        onClick={() => handleOptionClick("/create/group")}
      >
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center text-primary-foreground shadow-lg group-hover:scale-110 transition-transform duration-200">
          <Users size={28} />
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground text-lg">Group</p>
          <p className="text-sm text-muted-foreground">Create a fitness group</p>
        </div>
      </motion.button>
    </div>
  );

  const screens = [Screen1, Screen2, Screen3];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
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
                <Button variant="ghost" size="icon-sm" onClick={handleClose}>
                  <X size={20} />
                </Button>
              </div>

              {/* Swipeable Content */}
              <div className="overflow-hidden">
                <motion.div
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentScreen}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.2 }}
                      className="h-[180px]"
                    >
                      {screens[currentScreen]()}
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Dot pagination */}
              <div className="flex justify-center gap-2 mt-4 py-2">
                {Array.from({ length: totalScreens }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentScreen(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      currentScreen === index 
                        ? "bg-primary w-4" 
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
