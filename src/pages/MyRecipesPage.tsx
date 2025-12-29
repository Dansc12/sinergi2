import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Search, ChefHat, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSavedMeals, SavedRecipe, SavedMeal } from "@/hooks/useSavedMeals";
import { useUserData } from "@/hooks/useUserData";
import MealSavedCard from "@/components/meal/MealSavedCard";

const MyRecipesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnState = location.state as { returnTo?: string; currentFoods?: any[]; mealType?: string; photos?: string[] } | null;
  
  const { savedRecipes, savedMeals, isLoading } = useSavedMeals();
  const { profile } = useUserData();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("meals");

  // Build creator object from current user's profile
  const currentUserCreator = {
    name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "You",
    avatar_url: profile?.avatar_url,
  };

  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return savedRecipes;
    const query = searchQuery.toLowerCase();
    return savedRecipes.filter((r) =>
      r.title.toLowerCase().includes(query) ||
      r.description?.toLowerCase().includes(query) ||
      r.ingredients.some((i) => i.name.toLowerCase().includes(query))
    );
  }, [savedRecipes, searchQuery]);

  const filteredMeals = useMemo(() => {
    if (!searchQuery.trim()) return savedMeals;
    const query = searchQuery.toLowerCase();
    return savedMeals.filter((m) =>
      m.title.toLowerCase().includes(query) ||
      m.foods.some((f) => f.name.toLowerCase().includes(query))
    );
  }, [savedMeals, searchQuery]);

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

  const handleUseRecipe = (recipe: SavedRecipe) => {
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

  const handleUseMeal = (meal: SavedMeal) => {
    // Convert saved meal foods to current meal format
    const foods = meal.foods.map((f) => ({
      id: f.id,
      name: f.name,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fats: f.fats,
      servings: f.servings,
      servingSize: f.servingSize,
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
            <TabsTrigger value="meals" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Meals
            </TabsTrigger>
            <TabsTrigger value="recipes" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Recipes
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

          {/* Meals Tab */}
          <TabsContent value="meals" className="mt-0 space-y-3 flex-1">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading...</div>
            ) : filteredMeals.length === 0 ? (
              <div className="py-12 text-center">
                <Utensils size={40} className="mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground font-medium">No saved meals yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Create one from the meal logging screen</p>
              </div>
            ) : (
              filteredMeals.map((meal) => (
                <MealSavedCard
                  key={meal.id}
                  title={meal.title}
                  items={meal.foods}
                  creator={currentUserCreator}
                  createdAt={meal.created_at}
                  onCopy={() => handleUseMeal(meal)}
                  copyButtonText="Use"
                  totalCalories={meal.totalCalories}
                  totalProtein={meal.totalProtein}
                  totalCarbs={meal.totalCarbs}
                  totalFats={meal.totalFats}
                  coverPhotoUrl={meal.coverPhoto}
                />
              ))
            )}
          </TabsContent>

          {/* Recipes Tab */}
          <TabsContent value="recipes" className="mt-0 space-y-3 flex-1">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading...</div>
            ) : filteredRecipes.length === 0 ? (
              <div className="py-12 text-center">
                <ChefHat size={40} className="mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground font-medium">No saved recipes yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Create one from the main menu</p>
              </div>
            ) : (
              filteredRecipes.map((recipe) => (
                <MealSavedCard
                  key={recipe.id}
                  title={recipe.title}
                  items={recipe.ingredients}
                  creator={currentUserCreator}
                  createdAt={recipe.created_at}
                  onCopy={() => handleUseRecipe(recipe)}
                  copyButtonText="Use"
                  isRecipe
                  totalCalories={recipe.totalNutrition.calories}
                  totalProtein={recipe.totalNutrition.protein}
                  totalCarbs={recipe.totalNutrition.carbs}
                  totalFats={recipe.totalNutrition.fats}
                  coverPhotoUrl={recipe.coverPhoto}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default MyRecipesPage;