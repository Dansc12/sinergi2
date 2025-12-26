import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Dumbbell, Utensils, ChefHat, Calendar, Loader2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { Json } from "@/integrations/supabase/types";

type ContentType = "all" | "workout" | "meal" | "recipe" | "routine";

interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  subtitle: string;
  data: Record<string, unknown>;
  created_at: string;
}

const contentTypeConfig = {
  workout: { icon: Dumbbell, label: "Workouts", gradient: "from-primary to-accent" },
  meal: { icon: Utensils, label: "Meals", gradient: "from-success to-emerald-400" },
  recipe: { icon: ChefHat, label: "Recipes", gradient: "from-rose-500 to-pink-400" },
  routine: { icon: Calendar, label: "Routines", gradient: "from-violet-500 to-purple-400" },
};

const SelectContentPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState<ContentType>("all");
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchUserContent = async () => {
      setIsLoading(true);
      try {
        const items: ContentItem[] = [];

        // Fetch workouts
        const { data: workouts } = await supabase
          .from("workout_logs")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        workouts?.forEach((w) => {
          const exercises = w.exercises as Array<{ name: string }>;
          items.push({
            id: w.id,
            type: "workout",
            title: exercises?.[0]?.name || "Workout",
            subtitle: `${exercises?.length || 0} exercises • ${format(new Date(w.created_at), "MMM d")}`,
            data: { exercises: w.exercises, notes: w.notes, photos: w.photos },
            created_at: w.created_at,
          });
        });

        // Fetch meals
        const { data: meals } = await supabase
          .from("meal_logs")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        meals?.forEach((m) => {
          const foods = m.foods as Array<{ name: string }>;
          items.push({
            id: m.id,
            type: "meal",
            title: `${m.meal_type.charAt(0).toUpperCase() + m.meal_type.slice(1)}`,
            subtitle: `${m.total_calories} cal • ${format(new Date(m.created_at), "MMM d")}`,
            data: {
              mealType: m.meal_type,
              foods: m.foods,
              totalCalories: m.total_calories,
              totalProtein: m.total_protein,
              totalCarbs: m.total_carbs,
              totalFats: m.total_fat,
            },
            created_at: m.created_at,
          });
        });

        // Fetch recipes from posts
        const { data: recipes } = await supabase
          .from("posts")
          .select("*")
          .eq("user_id", user.id)
          .eq("content_type", "recipe")
          .order("created_at", { ascending: false });

        recipes?.forEach((r) => {
          const data = r.content_data as Record<string, unknown>;
          items.push({
            id: r.id,
            type: "recipe",
            title: (data.title as string) || "Recipe",
            subtitle: `${(data.ingredients as Array<unknown>)?.length || 0} ingredients • ${format(new Date(r.created_at), "MMM d")}`,
            data: data,
            created_at: r.created_at,
          });
        });

        // Fetch routines from scheduled_routines
        const { data: routines } = await supabase
          .from("scheduled_routines")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        // Group routines by post_id to avoid duplicates
        const routineMap = new Map<string, typeof routines[0]>();
        routines?.forEach((r) => {
          if (!routineMap.has(r.routine_name)) {
            routineMap.set(r.routine_name, r);
          }
        });

        routineMap.forEach((r) => {
          const data = r.routine_data as { exercises?: Array<unknown> };
          items.push({
            id: r.id,
            type: "routine",
            title: r.routine_name,
            subtitle: `${data.exercises?.length || 0} exercises • ${r.day_of_week}`,
            data: {
              routineName: r.routine_name,
              exercises: data.exercises,
              scheduleDays: [r.day_of_week],
              recurring: r.recurring,
            },
            created_at: r.created_at,
          });
        });

        // Sort by date
        items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setContent(items);
      } catch (error) {
        console.error("Error fetching content:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserContent();
  }, [user]);

  const filteredContent = useMemo(() => {
    if (filter === "all") return content;
    return content.filter((item) => item.type === filter);
  }, [content, filter]);

  const handleNext = () => {
    if (!selectedItem) return;
    navigate("/share", {
      state: {
        contentType: selectedItem.type,
        contentData: selectedItem.data,
        images: [],
        returnTo: "/select-content",
        fromSelection: true,
      },
      replace: true,
    });
  };

  const handleSkip = () => {
    navigate("/share", {
      state: {
        contentType: "post",
        contentData: {},
        images: [],
        returnTo: "/select-content",
        fromSelection: true,
      },
      replace: true,
    });
  };

  const typeFilters: { value: ContentType; label: string }[] = [
    { value: "workout", label: "Workouts" },
    { value: "meal", label: "Meals" },
    { value: "recipe", label: "Recipes" },
    { value: "routine", label: "Routines" },
  ];

  const selectedTypeLabel = filter === "all" 
    ? null 
    : typeFilters.find(f => f.value === filter)?.label;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="p-4 flex-1 pb-28"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-2xl font-bold">Select Content</h1>
        </div>

        {/* Filter Options */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant={filter !== "all" ? "default" : "outline"} 
                size="sm" 
                className="gap-2"
              >
                {selectedTypeLabel || "Select Type"}
                <ChevronDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover">
              {typeFilters.map((f) => (
                <DropdownMenuItem
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={filter === f.value ? "bg-accent" : ""}
                >
                  {f.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-muted-foreground" size={32} />
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>No content found</p>
            <p className="text-sm mt-2">Create some workouts, meals, or recipes first!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredContent.map((item) => {
                const config = contentTypeConfig[item.type as keyof typeof contentTypeConfig];
                const Icon = config?.icon || Dumbbell;
                const isSelected = selectedItem?.id === item.id;

                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedItem(isSelected ? null : item)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config?.gradient} flex items-center justify-center shrink-0`}>
                        <Icon size={24} className="text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{item.title}</p>
                        <p className="text-sm text-muted-foreground truncate">{item.subtitle}</p>
                      </div>
                      {isSelected && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <Check size={18} className="text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-14 text-lg"
            onClick={handleSkip}
          >
            Skip
          </Button>
          <Button
            className="flex-1 h-14 text-lg glow-primary"
            onClick={handleNext}
            disabled={!selectedItem}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectContentPage;
