import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useSavedMeals, CommunityRecipe, CommunityMeal } from "@/hooks/useSavedMeals";
import MealRecipeCard from "@/components/meal/MealRecipeCard";

const FILTER_CHIPS = ["Breakfast", "Lunch", "Dinner", "Snack", "High Protein", "Low Carb"];

const DiscoverMealsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnState = location.state as { returnTo?: string; currentFoods?: any[]; mealType?: string; photos?: string[] } | null;
  
  const { communityRecipes, communityMeals, isLoading } = useSavedMeals();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("recipes");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  };

  const filteredRecipes = useMemo(() => {
    let results = communityRecipes;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.description?.toLowerCase().includes(query) ||
          r.ingredients.some((i) => i.name.toLowerCase().includes(query))
      );
    }
    return results;
  }, [communityRecipes, searchQuery]);

  const filteredMeals = useMemo(() => {
    let results = communityMeals;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (m) =>
          m.title.toLowerCase().includes(query) ||
          m.mealType.toLowerCase().includes(query) ||
          m.foods.some((f) => f.name.toLowerCase().includes(query))
      );
    }
    // Filter by meal type if any filter chips are active
    const mealTypeFilters = activeFilters.filter(f => 
      ["Breakfast", "Lunch", "Dinner", "Snack"].includes(f)
    );
    if (mealTypeFilters.length > 0) {
      results = results.filter(m => 
        mealTypeFilters.some(f => f.toLowerCase() === m.mealType.toLowerCase())
      );
    }
    return results;
  }, [communityMeals, searchQuery, activeFilters]);

  const handleBack = () => {
    navigate(returnState?.returnTo || "/create/meal", {
      state: {
        restored: true,
        contentData: {
          mealType: returnState?.mealType || "",
          foods: returnState?.currentFoods || [],
        },
        images: returnState?.photos || [],
      },
    });
  };

  const handleUseRecipe = (recipe: CommunityRecipe) => {
    // Convert recipe ingredients to meal foods format
    const foods = recipe.ingredients.map((ing) => ({
      id: ing.id,
      name: ing.name,
      calories: ing.calories,
      protein: ing.protein,
      carbs: ing.carbs,
      fats: ing.fats,
      servings: ing.servings,
      servingSize: ing.servingSize,
    }));

    navigate(returnState?.returnTo || "/create/meal", {
      state: {
        restored: true,
        contentData: {
          mealType: returnState?.mealType || "",
          foods: [...(returnState?.currentFoods || []), ...foods],
        },
        images: returnState?.photos || [],
      },
    });
  };

  const handleUseMeal = (meal: CommunityMeal) => {
    navigate(returnState?.returnTo || "/create/meal", {
      state: {
        restored: true,
        contentData: {
          mealType: returnState?.mealType || meal.mealType,
          foods: [...(returnState?.currentFoods || []), ...meal.foods],
        },
        images: returnState?.photos || [],
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
            <TabsTrigger value="recipes" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Recipes
            </TabsTrigger>
            <TabsTrigger value="meals" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Meals
            </TabsTrigger>
          </TabsList>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder={`Search ${activeTab}...`}
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

          {/* Recipes Tab */}
          <TabsContent value="recipes" className="mt-0 space-y-3 flex-1">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading...</div>
            ) : filteredRecipes.length === 0 ? (
              <div className="py-12 text-center">
                <Compass size={40} className="mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground font-medium">No recipes yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Check back soon</p>
              </div>
            ) : (
              filteredRecipes.map((recipe) => (
                <MealRecipeCard
                  key={recipe.id}
                  title={recipe.title}
                  description={recipe.description}
                  calories={recipe.totalNutrition.calories}
                  protein={recipe.totalNutrition.protein}
                  carbs={recipe.totalNutrition.carbs}
                  fats={recipe.totalNutrition.fats}
                  itemCount={recipe.ingredients.length}
                  creator={recipe.creator}
                  createdAt={recipe.created_at}
                  coverPhoto={recipe.coverPhoto}
                  prepTime={recipe.prepTime}
                  cookTime={recipe.cookTime}
                  servings={recipe.servings}
                  onCopy={() => handleUseRecipe(recipe)}
                  copyButtonText="Copy"
                  isRecipe
                />
              ))
            )}
          </TabsContent>

          {/* Meals Tab */}
          <TabsContent value="meals" className="mt-0 space-y-3 flex-1">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading...</div>
            ) : filteredMeals.length === 0 ? (
              <div className="py-12 text-center">
                <Compass size={40} className="mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground font-medium">No meals yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Check back soon</p>
              </div>
            ) : (
              filteredMeals.map((meal) => (
                <MealRecipeCard
                  key={meal.id}
                  title={meal.title}
                  calories={meal.totalCalories}
                  protein={meal.totalProtein}
                  carbs={meal.totalCarbs}
                  fats={meal.totalFats}
                  itemCount={meal.foods.length}
                  creator={meal.creator}
                  createdAt={meal.created_at}
                  onCopy={() => handleUseMeal(meal)}
                  copyButtonText="Copy"
                  isRecipe={false}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default DiscoverMealsPage;
