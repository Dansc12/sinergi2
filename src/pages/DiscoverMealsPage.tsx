import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Compass, ChefHat, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSavedMeals, CommunityRecipe, CommunityMeal } from "@/hooks/useSavedMeals";
import MealSavedCard from "@/components/meal/MealSavedCard";
import { SavedMealExpansionModal } from "@/components/SavedMealExpansionModal";
import { SavedMealFood } from "@/components/FoodSearchInput";

const DiscoverMealsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnState = location.state as { returnTo?: string; currentFoods?: any[]; mealType?: string; photos?: string[] } | null;
  
  const { communityRecipes, communityMeals, isLoading } = useSavedMeals();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("meals");

  // State for SavedMealExpansionModal
  const [expansionModalOpen, setExpansionModalOpen] = useState(false);
  const [expansionMealName, setExpansionMealName] = useState("");
  const [expansionFoods, setExpansionFoods] = useState<SavedMealFood[]>([]);
  const [expansionCoverPhoto, setExpansionCoverPhoto] = useState<string | undefined>();

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
          m.foods.some((f) => f.name.toLowerCase().includes(query))
      );
    }
    return results;
  }, [communityMeals, searchQuery]);

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
    // Convert recipe ingredients to SavedMealFood format and open expansion modal
    const foods: SavedMealFood[] = recipe.ingredients.map((ing) => ({
      id: ing.id,
      fdcId: ing.id,
      name: ing.name,
      calories: ing.calories,
      protein: ing.protein,
      carbs: ing.carbs,
      fats: ing.fats,
      servings: ing.servings,
      servingSize: ing.servingSize,
    }));

    setExpansionMealName(recipe.title);
    setExpansionFoods(foods);
    setExpansionCoverPhoto(recipe.coverPhoto || undefined);
    setExpansionModalOpen(true);
  };

  const handleUseMeal = (meal: CommunityMeal) => {
    // Convert saved meal foods to SavedMealFood format and open expansion modal
    const foods: SavedMealFood[] = meal.foods.map((f) => ({
      id: f.id,
      fdcId: f.id,
      name: f.name,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fats: f.fats,
      servings: f.servings,
      servingSize: f.servingSize,
    }));

    setExpansionMealName(meal.title);
    setExpansionFoods(foods);
    setExpansionCoverPhoto(meal.coverPhoto || undefined);
    setExpansionModalOpen(true);
  };

  const handleExpansionConfirm = (confirmedFoods: any[]) => {
    // Generate a unique group ID for this saved meal/recipe
    const groupId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const mealName = expansionMealName;
    const coverPhoto = expansionCoverPhoto;

    // Map confirmed foods to the format expected by CreateMealPage
    const foods = confirmedFoods.map((f) => ({
      id: f.fdcId?.toString() || f.name,
      name: f.name,
      calories: Math.round(f.adjustedCalories ?? f.calories),
      protein: Math.round(f.adjustedProtein ?? f.protein),
      carbs: Math.round(f.adjustedCarbs ?? f.carbs),
      fats: Math.round(f.adjustedFats ?? f.fats),
      servings: f.adjustedQuantity ?? f.servings ?? 1,
      servingSize: `${f.adjustedQuantity ?? f.servings ?? 1} ${f.adjustedUnit ?? "g"}`,
      rawQuantity: f.adjustedQuantity ?? f.servings ?? 1,
      rawUnit: f.adjustedUnit ?? "g",
      savedMealGroupId: groupId,
      savedMealName: mealName,
      savedMealCoverPhoto: coverPhoto,
    }));

    setExpansionModalOpen(false);
    setExpansionCoverPhoto(undefined);

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
          <h1 className="text-2xl font-bold">Discover</h1>
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
                <p className="text-muted-foreground font-medium">No meals yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Check back soon for community meals</p>
              </div>
            ) : (
              filteredMeals.map((meal) => (
                <MealSavedCard
                  key={meal.id}
                  title={meal.title}
                  items={meal.foods}
                  creator={{
                    name: meal.creator.name,
                    avatar_url: meal.creator.avatar_url,
                  }}
                  createdAt={meal.created_at}
                  onCopy={() => handleUseMeal(meal)}
                  copyButtonText="Use"
                  totalCalories={meal.totalCalories}
                  totalProtein={meal.totalProtein}
                  totalCarbs={meal.totalCarbs}
                  totalFats={meal.totalFats}
                  coverPhotoUrl={meal.coverPhoto || undefined}
                  tags={meal.tags}
                  description={meal.description || undefined}
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
                <p className="text-muted-foreground font-medium">No recipes yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Check back soon for community recipes</p>
              </div>
            ) : (
              filteredRecipes.map((recipe) => (
                <MealSavedCard
                  key={recipe.id}
                  title={recipe.title}
                  items={recipe.ingredients}
                  creator={{
                    name: recipe.creator.name,
                    avatar_url: recipe.creator.avatar_url,
                  }}
                  createdAt={recipe.created_at}
                  onCopy={() => handleUseRecipe(recipe)}
                  copyButtonText="Use"
                  isRecipe
                  totalCalories={recipe.totalNutrition.calories}
                  totalProtein={recipe.totalNutrition.protein}
                  totalCarbs={recipe.totalNutrition.carbs}
                  totalFats={recipe.totalNutrition.fats}
                  coverPhotoUrl={recipe.coverPhoto || undefined}
                  description={recipe.description || undefined}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Saved Meal Expansion Modal */}
      <SavedMealExpansionModal
        isOpen={expansionModalOpen}
        mealName={expansionMealName}
        foods={expansionFoods}
        onClose={() => setExpansionModalOpen(false)}
        onConfirm={handleExpansionConfirm}
      />
    </div>
  );
};

export default DiscoverMealsPage;