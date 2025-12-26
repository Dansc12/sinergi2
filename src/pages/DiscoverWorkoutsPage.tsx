import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Dumbbell, Compass, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSavedWorkouts, CommunityRoutine, CommunityWorkout } from "@/hooks/useSavedWorkouts";
import { format } from "date-fns";

const FILTER_CHIPS = ["Beginner", "Full Body", "Upper", "Lower", "Push", "Pull", "Legs"];

const DiscoverWorkoutsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnState = location.state as { returnTo?: string; currentExercises?: any[]; title?: string; photos?: string[]; routineInstanceId?: string } | null;
  
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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
                <div
                  key={routine.id}
                  className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={routine.creator.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-sm">
                        {getInitials(routine.creator.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">{routine.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {routine.creator.name}
                        {routine.creator.username && (
                          <span className="text-muted-foreground/60"> @{routine.creator.username}</span>
                        )}
                      </p>
                      {routine.description && (
                        <p className="text-sm text-muted-foreground/80 mt-1 line-clamp-2">{routine.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Dumbbell size={12} />
                          {routine.exerciseCount} exercises
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => handleUseRoutine(routine)}
                      className="flex-1"
                    >
                      Use
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                    >
                      <Bookmark size={16} />
                    </Button>
                  </div>
                </div>
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
                <div
                  key={workout.id}
                  className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={workout.creator.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-sm">
                        {getInitials(workout.creator.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">{workout.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {workout.creator.name}
                        {workout.creator.username && (
                          <span className="text-muted-foreground/60"> @{workout.creator.username}</span>
                        )}
                      </p>
                      {workout.description && (
                        <p className="text-sm text-muted-foreground/80 mt-1 line-clamp-2">{workout.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Dumbbell size={12} />
                          {workout.exerciseCount} exercises
                        </span>
                        <span>{format(new Date(workout.created_at), "MMM d")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => handleUseWorkout(workout)}
                      className="flex-1"
                    >
                      Copy to Today
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                    >
                      <Bookmark size={16} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default DiscoverWorkoutsPage;
