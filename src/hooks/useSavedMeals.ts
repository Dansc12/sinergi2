import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface SelectedFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servings?: number;
  servingSize?: string;
}

interface Ingredient {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servings: number;
  servingSize: string;
}

interface RecipeContentData {
  title?: string;
  description?: string;
  prepTime?: string;
  cookTime?: string;
  servings?: string;
  ingredients?: Ingredient[];
  instructions?: string[];
  totalNutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  coverPhoto?: string;
}

interface MealContentData {
  mealType?: string;
  foods?: SelectedFood[];
  totalCalories?: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFats?: number;
  coverPhoto?: string;
}

interface Creator {
  id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
}

export interface SavedRecipe {
  id: string;
  title: string;
  description: string | null;
  prepTime: string | null;
  cookTime: string | null;
  servings: string | null;
  ingredients: Ingredient[];
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  coverPhoto: string | null;
  images: string[];
  created_at: string;
}

export interface SavedMeal {
  id: string;
  title: string;
  mealType: string;
  foods: SelectedFood[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  coverPhoto: string | null;
  images: string[];
  created_at: string;
}

export interface CommunityRecipe {
  id: string;
  title: string;
  description: string | null;
  prepTime: string | null;
  cookTime: string | null;
  servings: string | null;
  ingredients: Ingredient[];
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  coverPhoto: string | null;
  images: string[];
  creator: Creator;
  created_at: string;
}

export interface CommunityMeal {
  id: string;
  title: string;
  mealType: string;
  foods: SelectedFood[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  images: string[];
  creator: Creator;
  created_at: string;
}

export const useSavedMeals = () => {
  const { user } = useAuth();
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [communityRecipes, setCommunityRecipes] = useState<CommunityRecipe[]>([]);
  const [communityMeals, setCommunityMeals] = useState<CommunityMeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSavedRecipes = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("posts")
        .select("id, content_data, images, created_at")
        .eq("user_id", user.id)
        .eq("content_type", "recipe")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const recipes: SavedRecipe[] = (data || []).map((post) => {
        const contentData = post.content_data as unknown as RecipeContentData;
        return {
          id: post.id,
          title: contentData?.title || "Untitled Recipe",
          description: contentData?.description || null,
          prepTime: contentData?.prepTime || null,
          cookTime: contentData?.cookTime || null,
          servings: contentData?.servings || null,
          ingredients: contentData?.ingredients || [],
          totalNutrition: contentData?.totalNutrition || { calories: 0, protein: 0, carbs: 0, fats: 0 },
          coverPhoto: contentData?.coverPhoto || null,
          images: post.images || [],
          created_at: post.created_at,
        };
      });

      setSavedRecipes(recipes);
    } catch (err) {
      console.error("Error fetching saved recipes:", err);
    }
  }, [user]);

  const fetchSavedMeals = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Fetch saved_meal posts (food groups created via CreateSavedMealPage)
      const { data, error } = await supabase
        .from("posts")
        .select("id, content_data, images, created_at")
        .eq("user_id", user.id)
        .eq("content_type", "saved_meal")
        .order("created_at", { ascending: false });

      if (error) throw error;

      interface SavedMealContentData {
        name?: string;
        description?: string;
        tags?: string[];
        foods?: SelectedFood[];
        totalCalories?: number;
        totalProtein?: number;
        totalCarbs?: number;
        totalFats?: number;
        coverPhoto?: string;
      }

      const meals: SavedMeal[] = (data || []).map((post) => {
        const contentData = post.content_data as unknown as SavedMealContentData;
        
        return {
          id: post.id,
          title: contentData?.name || "Untitled Meal",
          mealType: "saved",
          foods: contentData?.foods || [],
          totalCalories: contentData?.totalCalories || 0,
          totalProtein: contentData?.totalProtein || 0,
          totalCarbs: contentData?.totalCarbs || 0,
          totalFats: contentData?.totalFats || 0,
          coverPhoto: contentData?.coverPhoto || (post.images && post.images[0]) || null,
          images: post.images || [],
          created_at: post.created_at,
        };
      });

      setSavedMeals(meals);
    } catch (err) {
      console.error("Error fetching saved meals:", err);
    }
  }, [user]);

  const fetchCommunityContent = useCallback(async () => {
    try {
      // Fetch all visible recipe posts (RLS handles visibility - public + friends posts)
      const { data: recipePosts, error: recipeError } = await supabase
        .from("posts")
        .select("id, description, content_data, images, created_at, user_id, visibility")
        .eq("content_type", "recipe")
        .order("created_at", { ascending: false })
        .limit(100);

      if (recipeError) throw recipeError;

      // Fetch all visible meal posts (RLS handles visibility)
      const { data: mealPosts, error: mealError } = await supabase
        .from("posts")
        .select("id, description, content_data, images, created_at, user_id, visibility")
        .eq("content_type", "meal")
        .order("created_at", { ascending: false })
        .limit(100);

      if (mealError) throw mealError;

      // Get unique user IDs (excluding current user)
      const userIds = [
        ...new Set([
          ...(recipePosts || []).filter(p => p.user_id !== user?.id).map((p) => p.user_id),
          ...(mealPosts || []).filter(p => p.user_id !== user?.id).map((p) => p.user_id),
        ]),
      ];

      // Fetch profiles for these users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, username, avatar_url")
        .in("user_id", userIds.length > 0 ? userIds : ["no-users"]);

      const profileMap = new Map(
        (profiles || []).map((p) => [
          p.user_id,
          {
            id: p.user_id,
            name: [p.first_name, p.last_name].filter(Boolean).join(" ") || "Anonymous",
            username: p.username,
            avatar_url: p.avatar_url,
          },
        ])
      );

      // Map recipe posts to community recipes (exclude current user's posts)
      const communityRcps: CommunityRecipe[] = (recipePosts || [])
        .filter((p) => p.user_id !== user?.id)
        .map((post) => {
          const contentData = post.content_data as unknown as RecipeContentData;
          return {
            id: post.id,
            title: contentData?.title || "Untitled Recipe",
            description: contentData?.description || post.description || null,
            prepTime: contentData?.prepTime || null,
            cookTime: contentData?.cookTime || null,
            servings: contentData?.servings || null,
            ingredients: contentData?.ingredients || [],
            totalNutrition: contentData?.totalNutrition || { calories: 0, protein: 0, carbs: 0, fats: 0 },
            coverPhoto: contentData?.coverPhoto || null,
            images: post.images || [],
            creator: profileMap.get(post.user_id) || {
              id: post.user_id,
              name: "Anonymous",
              username: null,
              avatar_url: null,
            },
            created_at: post.created_at,
          };
        });

      setCommunityRecipes(communityRcps);

      // Map meal posts to community meals (exclude current user's posts)
      const communityMls: CommunityMeal[] = (mealPosts || [])
        .filter((p) => p.user_id !== user?.id)
        .map((post) => {
          const contentData = post.content_data as unknown as MealContentData;
          const mealType = contentData?.mealType || "meal";
          const capitalizedMealType = mealType.charAt(0).toUpperCase() + mealType.slice(1);
          
          return {
            id: post.id,
            title: `${capitalizedMealType}`,
            mealType: contentData?.mealType || "meal",
            foods: contentData?.foods || [],
            totalCalories: contentData?.totalCalories || 0,
            totalProtein: contentData?.totalProtein || 0,
            totalCarbs: contentData?.totalCarbs || 0,
            totalFats: contentData?.totalFats || 0,
            images: post.images || [],
            creator: profileMap.get(post.user_id) || {
              id: post.user_id,
              name: "Anonymous",
              username: null,
              avatar_url: null,
            },
            created_at: post.created_at,
          };
        });

      setCommunityMeals(communityMls);
    } catch (err) {
      console.error("Error fetching community content:", err);
    }
  }, [user]);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchSavedRecipes(), fetchSavedMeals(), fetchCommunityContent()]);
    setIsLoading(false);
  }, [fetchSavedRecipes, fetchSavedMeals, fetchCommunityContent]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    savedRecipes,
    savedMeals,
    communityRecipes,
    communityMeals,
    isLoading,
    refetch: fetchAll,
  };
};
