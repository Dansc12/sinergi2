import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Search, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSavedMeals, SavedRecipe } from "@/hooks/useSavedMeals";
import { useUserData } from "@/hooks/useUserData";
import MealRecipeCard from "@/components/meal/MealRecipeCard";

const MyRecipesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnState = location.state as { returnTo?: string; currentFoods?: any[]; mealType?: string; photos?: string[] } | null;
  
  const { savedRecipes, isLoading } = useSavedMeals();
  const { profile } = useUserData();
  const [searchQuery, setSearchQuery] = useState("");

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
          <h1 className="text-2xl font-bold">My Recipes</h1>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50 border-border"
          />
        </div>

        {/* Recipes List */}
        <div className="space-y-3">
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
              <MealRecipeCard
                key={recipe.id}
                title={recipe.title}
                description={recipe.description}
                calories={recipe.totalNutrition.calories}
                protein={recipe.totalNutrition.protein}
                carbs={recipe.totalNutrition.carbs}
                fats={recipe.totalNutrition.fats}
                itemCount={recipe.ingredients.length}
                creator={currentUserCreator}
                createdAt={recipe.created_at}
                coverPhoto={recipe.coverPhoto}
                prepTime={recipe.prepTime}
                cookTime={recipe.cookTime}
                servings={recipe.servings}
                onCopy={() => handleUseRecipe(recipe)}
                copyButtonText="Use"
                isRecipe
              />
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default MyRecipesPage;
