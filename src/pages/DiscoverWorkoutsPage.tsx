import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useSavedWorkouts, CommunityRoutine, CommunityWorkout } from "@/hooks/useSavedWorkouts";
import WorkoutRoutineCard from "@/components/workout/WorkoutRoutineCard";

const FILTER_CHIPS = ["Beginner", "Full Body", "Upper", "Lower", "Push", "Pull", "Legs"];

const DiscoverWorkoutsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnState = location.state as { returnTo?: string; currentExercises?: any[]; title?: string; photos?: string[]; routineInstanceId?: string; logDate?: string } | null;
  
  const { communityRoutines, communityWorkouts, isLoading } = useSavedWorkouts();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("routines");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  };

  const filteredRoutines = useMemo(() => {
    let results = communityRoutines;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.description?.toLowerCase().includes(query) ||
          r.exercises.some((e) => e.name.toLowerCase().includes(query))
      );
    }
    return results;
  }, [communityRoutines, searchQuery]);

  const filteredWorkouts = useMemo(() => {
    let results = communityWorkouts;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (w) =>
          w.title.toLowerCase().includes(query) ||
          w.description?.toLowerCase().includes(query) ||
          w.exercises.some((e) => e.name.toLowerCase().includes(query))
      );
    }
    return results;
  }, [communityWorkouts, searchQuery]);

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

  const handleUseRoutine = (routine: CommunityRoutine) => {
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
        selectedCommunityRoutine: routine,
      },
    });
  };

  const handleUseWorkout = (workout: CommunityWorkout) => {
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
        selectedCommunityWorkout: workout,
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
          <h1 className="text-2xl font-bold">Discover</h1>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="w-full bg-muted/50 mb-4">
            <TabsTrigger value="routines" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Routines
            </TabsTrigger>
            <TabsTrigger value="workouts" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Workouts
            </TabsTrigger>
          </TabsList>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Search workouts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-border"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {FILTER_CHIPS.map((filter) => (
              <Badge
                key={filter}
                variant={activeFilters.includes(filter) ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  activeFilters.includes(filter)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border-border/50"
                }`}
                onClick={() => toggleFilter(filter)}
              >
                {filter}
              </Badge>
            ))}
          </div>

          {/* Routines Tab */}
          <TabsContent value="routines" className="mt-0 space-y-3 flex-1">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading...</div>
            ) : filteredRoutines.length === 0 ? (
              <div className="py-12 text-center">
                <Compass size={40} className="mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground font-medium">No routines yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Check back soon</p>
              </div>
            ) : (
              filteredRoutines.map((routine) => (
                <WorkoutRoutineCard
                  key={routine.id}
                  title={routine.title}
                  exercises={routine.exercises}
                  creator={routine.creator}
                  createdAt={routine.created_at}
                  onCopy={() => handleUseRoutine(routine)}
                  copyButtonText="Copy"
                  isRoutine
                />
              ))
            )}
          </TabsContent>

          {/* Workouts Tab */}
          <TabsContent value="workouts" className="mt-0 space-y-3 flex-1">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading...</div>
            ) : filteredWorkouts.length === 0 ? (
              <div className="py-12 text-center">
                <Compass size={40} className="mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground font-medium">No workouts yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Check back soon</p>
              </div>
            ) : (
              filteredWorkouts.map((workout) => (
                <WorkoutRoutineCard
                  key={workout.id}
                  title={workout.title}
                  exercises={workout.exercises}
                  creator={workout.creator}
                  createdAt={workout.created_at}
                  onCopy={() => handleUseWorkout(workout)}
                  copyButtonText="Copy"
                  isRoutine={false}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default DiscoverWorkoutsPage;
