import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Dumbbell, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSavedWorkouts, SavedRoutine } from "@/hooks/useSavedWorkouts";
import { useSavedWorkoutsNew, SavedWorkout } from "@/hooks/useSavedWorkoutsNew";
import { useUserData } from "@/hooks/useUserData";
import WorkoutSavedCard from "@/components/workout/WorkoutSavedCard";

const MySavedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnState = location.state as { returnTo?: string; currentExercises?: any[]; title?: string; photos?: string[]; routineInstanceId?: string; logDate?: string } | null;
  
  const { savedRoutines, isLoading: isLoadingRoutines } = useSavedWorkouts();
  const { savedWorkouts, isLoading: isLoadingWorkouts } = useSavedWorkoutsNew();
  const { profile } = useUserData();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("routines");
  
  const isLoading = isLoadingRoutines || isLoadingWorkouts;

  // Build creator object from current user's profile
  const currentUserCreator = {
    id: "",
    name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "You",
    username: null as string | null,
    avatar_url: profile?.avatar_url || null,
  };

  const filteredRoutines = useMemo(() => {
    if (!searchQuery.trim()) return savedRoutines;
    const query = searchQuery.toLowerCase();
    return savedRoutines.filter((r) =>
      r.routine_name.toLowerCase().includes(query)
    );
  }, [savedRoutines, searchQuery]);

  const filteredWorkouts = useMemo(() => {
    if (!searchQuery.trim()) return savedWorkouts;
    const query = searchQuery.toLowerCase();
    return savedWorkouts.filter(
      (w) =>
        w.title.toLowerCase().includes(query) ||
        w.exercises.some((e) => e.name.toLowerCase().includes(query))
    );
  }, [savedWorkouts, searchQuery]);

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
        selectedTags: routine.tags || [],
      },
    });
  };

  const handleCopyWorkout = (workout: SavedWorkout) => {
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
        selectedPastWorkout: {
          id: workout.id,
          title: workout.title,
          exercises: workout.exercises,
          log_date: workout.created_at.split('T')[0],
          created_at: workout.created_at,
          exerciseCount: workout.exercises.length,
          totalSets: workout.exercises.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0),
          tags: workout.tags,
          description: workout.description,
          post_id: workout.post_id, // Pass post_id for original creator tracking
          creator: workout.creator, // Pass creator info
        },
        selectedTags: workout.tags || [],
        savedWorkoutId: workout.id, // Track that this workout is already saved
        sourcePostId: workout.post_id, // Pass post_id for original creator
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
          <h1 className="text-2xl font-bold">My Saved</h1>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="w-full bg-muted/50 mb-4">
            <TabsTrigger value="routines" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Routines
            </TabsTrigger>
            <TabsTrigger value="workouts" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Saved Workouts
            </TabsTrigger>
          </TabsList>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Search saved..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-border"
            />
          </div>

          {/* Routines Tab */}
          <TabsContent value="routines" className="mt-0 space-y-3 flex-1">
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
                <WorkoutSavedCard
                  key={routine.id}
                  title={routine.routine_name}
                  exercises={routine.routine_data?.exercises || []}
                  creator={routine.creator || currentUserCreator}
                  createdAt={routine.created_at}
                  onCopy={() => handleUseRoutine(routine)}
                  copyButtonText="Copy"
                  isRoutine
                  tags={routine.tags}
                  description={routine.description}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="workouts" className="mt-0 space-y-3 flex-1">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading...</div>
            ) : filteredWorkouts.length === 0 ? (
              <div className="py-12 text-center">
                <Bookmark size={40} className="mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground font-medium">No saved workouts yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Save a workout using the bookmark icon</p>
              </div>
            ) : (
              filteredWorkouts.map((workout) => (
                <WorkoutSavedCard
                  key={workout.id}
                  title={workout.title}
                  exercises={workout.exercises}
                  creator={workout.creator || currentUserCreator}
                  createdAt={workout.created_at}
                  onCopy={() => handleCopyWorkout(workout)}
                  copyButtonText="Copy"
                  isRoutine={false}
                  tags={workout.tags}
                  description={workout.description || undefined}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default MySavedPage;
