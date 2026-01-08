import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSavedWorkouts, SavedRoutine } from "@/hooks/useSavedWorkouts";
import { useUserData } from "@/hooks/useUserData";
import WorkoutRoutineCard from "@/components/workout/WorkoutRoutineCard";

const MySavedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnState = location.state as { returnTo?: string; currentExercises?: any[]; title?: string; photos?: string[]; routineInstanceId?: string; logDate?: string } | null;
  
  const { savedRoutines, isLoading } = useSavedWorkouts();
  const { profile } = useUserData();
  const [searchQuery, setSearchQuery] = useState("");

  // Build creator object from current user's profile
  const currentUserCreator = {
    name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "You",
    avatar_url: profile?.avatar_url,
  };

  const filteredRoutines = useMemo(() => {
    if (!searchQuery.trim()) return savedRoutines;
    const query = searchQuery.toLowerCase();
    return savedRoutines.filter((r) =>
      r.routine_name.toLowerCase().includes(query)
    );
  }, [savedRoutines, searchQuery]);

  const handleBack = () => {
    navigate(returnState?.returnTo || "/create/workout", {
      state: {
        restored: true,
        contentData: {
          title: returnState?.title || "",
          exercises: returnState?.currentExercises || [],
        },
        images: returnState?.photos || [],
        routineInstanceId: returnState?.routineInstanceId,
        logDate: returnState?.logDate,
      },
    });
  };

  const handleUseRoutine = (routine: SavedRoutine) => {
    navigate(returnState?.returnTo || "/create/workout", {
      state: {
        restored: true,
        contentData: {
          title: returnState?.title || "",
          exercises: returnState?.currentExercises || [],
        },
        images: returnState?.photos || [],
        routineInstanceId: returnState?.routineInstanceId,
        logDate: returnState?.logDate,
        selectedRoutine: routine,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-2xl font-bold">My Saved Routines</h1>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search routines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50 border-border"
          />
        </div>

        {/* Routines List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : filteredRoutines.length === 0 ? (
            <div className="py-12 text-center">
              <Dumbbell size={40} className="mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground font-medium">No saved routines yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Save one from Discover</p>
            </div>
          ) : (
            filteredRoutines.map((routine) => (
              <WorkoutRoutineCard
                key={routine.id}
                title={routine.routine_name}
                exercises={routine.routine_data?.exercises || []}
                creator={currentUserCreator}
                createdAt={routine.created_at}
                onCopy={() => handleUseRoutine(routine)}
                copyButtonText="Copy"
                isRoutine
              />
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default MySavedPage;
