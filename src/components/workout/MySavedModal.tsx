import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Dumbbell, Calendar, Clock } from "lucide-react";
import { SavedRoutine, PastWorkout } from "@/hooks/useSavedWorkouts";
import { format } from "date-fns";

interface MySavedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  savedRoutines: SavedRoutine[];
  pastWorkouts: PastWorkout[];
  isLoading: boolean;
  onUseRoutine: (routine: SavedRoutine) => void;
  onCopyWorkout: (workout: PastWorkout) => void;
}

const MySavedModal = ({
  open,
  onOpenChange,
  savedRoutines,
  pastWorkouts,
  isLoading,
  onUseRoutine,
  onCopyWorkout,
}: MySavedModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("routines");

  const filteredRoutines = useMemo(() => {
    if (!searchQuery.trim()) return savedRoutines;
    const query = searchQuery.toLowerCase();
    return savedRoutines.filter((r) =>
      r.routine_name.toLowerCase().includes(query)
    );
  }, [savedRoutines, searchQuery]);

  const filteredWorkouts = useMemo(() => {
    if (!searchQuery.trim()) return pastWorkouts;
    const query = searchQuery.toLowerCase();
    return pastWorkouts.filter(
      (w) =>
        w.title.toLowerCase().includes(query) ||
        w.exercises.some((e) => e.name.toLowerCase().includes(query))
    );
  }, [pastWorkouts, searchQuery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-bold text-foreground">My Saved</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6">
            <TabsList className="w-full bg-muted/50">
              <TabsTrigger value="routines" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Routines
              </TabsTrigger>
              <TabsTrigger value="workouts" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Past Workouts
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="px-6 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search saved..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-border"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 px-6 pb-6">
            <TabsContent value="routines" className="mt-0 space-y-3">
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
                  <div
                    key={routine.id}
                    className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate">{routine.routine_name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">Creator: You</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Dumbbell size={12} />
                            {routine.exerciseCount} exercises
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {routine.day_of_week}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => onUseRoutine(routine)}
                        className="shrink-0"
                      >
                        Use
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="workouts" className="mt-0 space-y-3">
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">Loading...</div>
              ) : filteredWorkouts.length === 0 ? (
                <div className="py-12 text-center">
                  <Clock size={40} className="mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground font-medium">No past workouts yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Complete a workout to see it here</p>
                </div>
              ) : (
                filteredWorkouts.map((workout) => (
                  <div
                    key={workout.id}
                    className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate">{workout.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(workout.log_date), "MMM d, yyyy")}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Dumbbell size={12} />
                            {workout.exerciseCount} exercises
                          </span>
                          <span>{workout.totalSets} sets</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => onCopyWorkout(workout)}
                        className="shrink-0"
                      >
                        Copy to Today
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default MySavedModal;
