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
  tags: string[];
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
  tags: string[];
  description: string | null;
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
  coverPhoto: string | null;
  tags: string[];
  description: string | null;
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
      // Fetch user's own recipes
      const { data: ownRecipes, error: ownError } = await supabase
        .from("posts")
        .select("id, content_data, images, created_at")
        .eq("user_id", user.id)
        .eq("content_type", "recipe")
        .order("created_at", { ascending: false });

      if (ownError) throw ownError;

      // Fetch recipes saved from other users via saved_posts
      const { data: savedPostsData, error: savedError } = await supabase
        .from("saved_posts")
        .select("post_id, created_at")
        .eq("user_id", user.id)
        .eq("content_type", "recipe");

      if (savedError) throw savedError;

      // Fetch the actual posts for saved recipes
      const savedPostIds = (savedPostsData || []).map(sp => sp.post_id);
      let savedRecipePosts: typeof ownRecipes = [];
      
      if (savedPostIds.length > 0) {
        const { data: savedPosts, error: fetchError } = await supabase
          .from("posts")
          .select("id, content_data, images, created_at")
          .in("id", savedPostIds);
        
        if (!fetchError && savedPosts) {
          savedRecipePosts = savedPosts;
        }
      }

      // Combine own recipes and saved recipes (deduped by id)
      const allRecipePosts = [...(ownRecipes || []), ...savedRecipePosts];
      const uniqueRecipes = new Map<string, typeof allRecipePosts[0]>();
      allRecipePosts.forEach(post => uniqueRecipes.set(post.id, post));

      const recipes: SavedRecipe[] = Array.from(uniqueRecipes.values()).map((post) => {
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
          tags: (contentData as unknown as { tags?: string[] })?.tags || [],
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
      // Fetch user's own saved_meal posts (food groups created via CreateSavedMealPage)
      const { data: ownMeals, error: ownError } = await supabase
        .from("posts")
        .select("id, content_data, images, created_at")
        .eq("user_id", user.id)
        .eq("content_type", "saved_meal")
        .order("created_at", { ascending: false });

      if (ownError) throw ownError;

      // Fetch meals saved from other users via saved_posts (both "meal" and "saved_meal" types)
      const { data: savedPostsData, error: savedError } = await supabase
        .from("saved_posts")
        .select("post_id, created_at, content_type")
        .eq("user_id", user.id)
        .in("content_type", ["meal", "saved_meal"]);

      if (savedError) throw savedError;

      // Fetch the actual posts for saved meals
      const savedPostIds = (savedPostsData || []).map(sp => sp.post_id);
      let savedMealPosts: typeof ownMeals = [];
      
      if (savedPostIds.length > 0) {
        const { data: savedPosts, error: fetchError } = await supabase
          .from("posts")
          .select("id, content_data, images, created_at, content_type")
          .in("id", savedPostIds);
        
        if (!fetchError && savedPosts) {
          savedMealPosts = savedPosts;
        }
      }

      // Combine own meals and saved meals (deduped by id)
      const allMealPosts = [...(ownMeals || []), ...savedMealPosts];
      const uniqueMeals = new Map<string, typeof allMealPosts[0]>();
      allMealPosts.forEach(post => uniqueMeals.set(post.id, post));

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
        mealType?: string;
      }

      const meals: SavedMeal[] = Array.from(uniqueMeals.values()).map((post) => {
        const contentData = post.content_data as unknown as SavedMealContentData;
        
        return {
          id: post.id,
          title: contentData?.name || "Untitled Meal",
          mealType: contentData?.mealType || "saved",
          foods: contentData?.foods || [],
          totalCalories: contentData?.totalCalories || 0,
          totalProtein: contentData?.totalProtein || 0,
          totalCarbs: contentData?.totalCarbs || 0,
          totalFats: contentData?.totalFats || 0,
          coverPhoto: contentData?.coverPhoto || (post.images && post.images[0]) || null,
          images: post.images || [],
          created_at: post.created_at,
          tags: contentData?.tags || [],
          description: contentData?.description || null,
        };
      });

      setSavedMeals(meals);
    } catch (err) {
      console.error("Error fetching saved meals:", err);
    }
  }, [user]);

  const fetchCommunityContent = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Fetch user's friends list for visibility filtering
      const { data: friendships } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      const friendIds = new Set<string>(
        (friendships || []).map((f) =>
          f.requester_id === user.id ? f.addressee_id : f.requester_id
        )
      );

      // Fetch all visible recipe posts (public + friends only from friends)
      const { data: recipePosts, error: recipeError } = await supabase
        .from("posts")
        .select("id, description, content_data, images, created_at, user_id, visibility")
        .eq("content_type", "recipe")
        .neq("user_id", user.id)
        .in("visibility", ["public", "friends"])
        .order("created_at", { ascending: false })
        .limit(100);

      if (recipeError) throw recipeError;

      // Fetch saved_meal posts (not regular meal logs) - public + friends only from friends
      const { data: savedMealPosts, error: savedMealError } = await supabase
        .from("posts")
        .select("id, description, content_data, images, created_at, user_id, visibility")
        .eq("content_type", "saved_meal")
        .neq("user_id", user.id)
        .in("visibility", ["public", "friends"])
        .order("created_at", { ascending: false })
        .limit(100);

      if (savedMealError) throw savedMealError;

      // Filter by visibility: public posts + friends-only posts from actual friends
      const filterByVisibility = (posts: typeof recipePosts) =>
        (posts || []).filter((p) => {
          if (p.visibility === "public") return true;
          if (p.visibility === "friends" && friendIds.has(p.user_id)) return true;
          return false;
        });

      const visibleRecipes = filterByVisibility(recipePosts);
      const visibleSavedMeals = filterByVisibility(savedMealPosts);

      // Get unique user IDs
      const userIds = [
        ...new Set([
          ...visibleRecipes.map((p) => p.user_id),
          ...visibleSavedMeals.map((p) => p.user_id),
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

      // Map recipe posts to community recipes
      const communityRcps: CommunityRecipe[] = visibleRecipes.map((post) => {
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

      // Map saved_meal posts to community meals
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

      const communityMls: CommunityMeal[] = visibleSavedMeals.map((post) => {
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
          creator: profileMap.get(post.user_id) || {
            id: post.user_id,
            name: "Anonymous",
            username: null,
            avatar_url: null,
          },
          created_at: post.created_at,
          tags: contentData?.tags || [],
          description: contentData?.description || null,
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
