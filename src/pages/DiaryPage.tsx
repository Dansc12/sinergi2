import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Dumbbell, UtensilsCrossed, ChefHat, BookOpen, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, Check } from "lucide-react";
import { format } from "date-fns";

type ContentType = "workout" | "meal" | "recipe" | "saved_meal" | "routine" | "all";

interface ContentItem {
  id: string;
  type: Exclude<ContentType, "all">;
  title: string;
  subtitle: string;
  data: Record<string, unknown>;
  createdAt: string;
}

const contentTypeConfig: Record<Exclude<ContentType, "all">, { icon: typeof Dumbbell; label: string; gradient: string }> = {
  workout: { icon: Dumbbell, label: "Workout", gradient: "from-orange-500 to-red-500" },
  meal: { icon: UtensilsCrossed, label: "Meal", gradient: "from-green-500 to-emerald-500" },
  recipe: { icon: ChefHat, label: "Recipe", gradient: "from-purple-500 to-pink-500" },
  saved_meal: { icon: BookOpen, label: "Saved Meal", gradient: "from-blue-500 to-cyan-500" },
  routine: { icon: Calendar, label: "Routine", gradient: "from-amber-500 to-yellow-500" },
};

const DiaryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState<ContentType>("all");
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchUserContent();
    }
  }, [user]);

  const fetchUserContent = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const items: ContentItem[] = [];

      // Fetch workouts
      const { data: workouts } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (workouts) {
        workouts.forEach((w) => {
          const exercises = (w.exercises as Array<{ name: string }>) || [];
          if (exercises.length > 0) {
            items.push({
              id: w.id,
              type: "workout",
              title: `Workout - ${format(new Date(w.log_date), "MMM d")}`,
              subtitle: exercises.map((e) => e.name).join(", "),
              data: w as unknown as Record<string, unknown>,
              createdAt: w.created_at,
            });
          }
        });
      }

      // Fetch saved meals (from posts with content_type = saved_meal)
      const { data: savedMealPosts } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", user.id)
        .eq("content_type", "saved_meal")
        .order("created_at", { ascending: false });

      if (savedMealPosts) {
        savedMealPosts.forEach((p) => {
          const contentData = p.content_data as Record<string, unknown>;
          const foods = (contentData?.foods as Array<{ name: string }>) || [];
          items.push({
            id: p.id,
            type: "saved_meal",
            title: (contentData?.name as string) || "Saved Meal",
            subtitle: foods.map((f) => f.name).join(", ") || "No foods",
            data: contentData,
            createdAt: p.created_at,
          });
        });
      }

      // Fetch recipes (from posts with content_type = recipe)
      const { data: recipePosts } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", user.id)
        .eq("content_type", "recipe")
        .order("created_at", { ascending: false });

      if (recipePosts) {
        recipePosts.forEach((p) => {
          const contentData = p.content_data as Record<string, unknown>;
          const ingredients = (contentData?.ingredients as Array<{ name: string }>) || [];
          items.push({
            id: p.id,
            type: "recipe",
            title: (contentData?.name as string) || "Recipe",
            subtitle: ingredients.map((i) => i.name).join(", ") || "No ingredients",
            data: contentData,
            createdAt: p.created_at,
          });
        });
      }

      // Fetch routines
      const { data: routines } = await supabase
        .from("scheduled_routines")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (routines) {
        routines.forEach((r) => {
          const routineData = r.routine_data as Record<string, unknown>;
          const exercises = (routineData?.exercises as Array<{ name: string }>) || [];
          items.push({
            id: r.id,
            type: "routine",
            title: r.routine_name,
            subtitle: exercises.map((e) => e.name).join(", ") || r.day_of_week,
            data: routineData,
            createdAt: r.created_at,
          });
        });
      }

      // Fetch meal logs
      const { data: mealLogs } = await supabase
        .from("meal_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (mealLogs) {
        mealLogs.forEach((m) => {
          const foods = (m.foods as Array<{ name: string }>) || [];
          items.push({
            id: m.id,
            type: "meal",
            title: `${m.meal_type} - ${format(new Date(m.log_date), "MMM d")}`,
            subtitle: foods.map((f) => f.name).join(", ") || "No foods",
            data: m as unknown as Record<string, unknown>,
            createdAt: m.created_at,
          });
        });
      }

      // Sort all items by creation date
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setContent(items);
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const filteredContent = useMemo(() => {
    if (filter === "all") return content;
    return content.filter((item) => item.type === filter);
  }, [content, filter]);

  const renderDetailedView = (item: ContentItem) => {
    const data = item.data;

    if (item.type === "workout" || item.type === "routine") {
      const exercises = (data?.exercises as Array<{ name: string; sets?: Array<{ weight?: number; reps?: number }> }>) || [];
      return (
        <div className="mt-3 space-y-2 text-sm">
          {exercises.map((exercise, idx) => (
            <div key={idx} className="bg-muted/50 rounded-lg p-2">
              <p className="font-medium">{exercise.name}</p>
              {exercise.sets && exercise.sets.length > 0 && (
                <p className="text-muted-foreground text-xs">
                  {exercise.sets.length} set{exercise.sets.length > 1 ? "s" : ""}
                </p>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (item.type === "meal" || item.type === "saved_meal") {
      const foods = (data?.foods as Array<{ name: string; calories?: number }>) || [];
      return (
        <div className="mt-3 space-y-2 text-sm">
          {foods.map((food, idx) => (
            <div key={idx} className="bg-muted/50 rounded-lg p-2 flex justify-between">
              <p className="font-medium">{food.name}</p>
              {food.calories && (
                <p className="text-muted-foreground text-xs">{food.calories} cal</p>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (item.type === "recipe") {
      const ingredients = (data?.ingredients as Array<{ name: string; quantity?: number; unit?: string }>) || [];
      return (
        <div className="mt-3 space-y-2 text-sm">
          {ingredients.map((ingredient, idx) => (
            <div key={idx} className="bg-muted/50 rounded-lg p-2">
              <p className="font-medium">
                {ingredient.quantity && `${ingredient.quantity} `}
                {ingredient.unit && `${ingredient.unit} `}
                {ingredient.name}
              </p>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <header className="sticky top-0 z-40 glass-elevated px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </Button>
        <h1 className="font-semibold">My Diary</h1>
        <div className="w-8" />
      </header>

      <div className="p-4 space-y-4">
        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className="rounded-full"
          >
            All
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full flex-1">
                {filter === "all" ? "Select Type" : contentTypeConfig[filter].label}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {Object.entries(contentTypeConfig).map(([type, config]) => (
                <DropdownMenuItem
                  key={type}
                  onClick={() => setFilter(type as ContentType)}
                  className="flex items-center gap-2"
                >
                  <config.icon className="h-4 w-4" />
                  {config.label}
                  {filter === type && <Check className="h-4 w-4 ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No content found</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredContent.map((item) => {
              const config = contentTypeConfig[item.type];
              const Icon = config.icon;
              const isExpanded = expandedItems.has(item.id);

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-card border border-border rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{item.title}</p>
                          <p className="text-sm text-muted-foreground truncate">{item.subtitle}</p>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => toggleExpanded(item.id)}
                        >
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </Button>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(item.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {renderDetailedView(item)}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};

export default DiaryPage;
