import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// USDA FoodData Central API (free, no API key required for basic usage)
const USDA_API_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";
const USDA_API_KEY = "DEMO_KEY"; // Free demo key with rate limits

interface FoodInMeal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servings?: number;
  servingSize?: string;
  rawQuantity?: number;
  rawUnit?: string;
}

interface FoodResult {
  fdcId: number;
  description: string;
  brandName?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize?: string;
  servingSizeValue?: number;
  servingSizeUnit?: string;
  isCustom?: boolean;
  baseUnit?: string;
  isSavedMeal?: boolean;
  isRecipe?: boolean;
  savedMealFoods?: FoodInMeal[];
}

// Rank foods based on search term relevance
const rankFoods = (foods: FoodResult[], searchTerm: string): FoodResult[] => {
  const lowerSearch = searchTerm.toLowerCase().trim();
  
  return foods.sort((a, b) => {
    const aDesc = a.description.toLowerCase();
    const bDesc = b.description.toLowerCase();
    
    // Priority 0: Custom foods first
    if (a.isCustom && !b.isCustom) return -1;
    if (b.isCustom && !a.isCustom) return 1;
    
    // Priority 1: Exact match
    const aExact = aDesc === lowerSearch;
    const bExact = bDesc === lowerSearch;
    if (aExact && !bExact) return -1;
    if (bExact && !aExact) return 1;
    
    // Priority 2: Starts with search term
    const aStarts = aDesc.startsWith(lowerSearch);
    const bStarts = bDesc.startsWith(lowerSearch);
    if (aStarts && !bStarts) return -1;
    if (bStarts && !aStarts) return 1;
    
    // Priority 3: Contains search term (already filtered)
    // Sort by description length (shorter = more relevant)
    return aDesc.length - bDesc.length;
  });
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ foods: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching foods for: ${query}`);

    // Get the authorization header to fetch custom foods for the user
    const authHeader = req.headers.get('Authorization');
    let customFoods: FoodResult[] = [];
    let savedMealsAndRecipes: FoodResult[] = [];

    if (authHeader) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } }
      });

      // Get user's custom foods that match the query
      const { data: userCustomFoods, error } = await supabase
        .from('custom_foods')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(10);

      if (!error && userCustomFoods) {
        customFoods = userCustomFoods.map((cf: any) => ({
          fdcId: -cf.id.hashCode?.() || Math.random() * -1000000, // Negative ID for custom foods
          description: cf.name,
          brandName: 'Custom',
          calories: Number(cf.calories),
          protein: Number(cf.protein),
          carbs: Number(cf.carbs),
          fats: Number(cf.fat),
          servingSize: cf.base_unit === 'g' ? '1 g' : '1 oz',
          servingSizeValue: 1,
          servingSizeUnit: cf.base_unit,
          isCustom: true,
          baseUnit: cf.base_unit,
        }));
        console.log(`Found ${customFoods.length} custom foods`);
      }

      // Get user's saved meals and recipes that match the query
      const { data: userPosts, error: postsError } = await supabase
        .from('posts')
        .select('id, content_type, content_data')
        .in('content_type', ['saved_meal', 'recipe'])
        .limit(20);

      if (!postsError && userPosts) {
        const lowerQuery = query.toLowerCase().trim();
        
        savedMealsAndRecipes = userPosts
          .filter((post: any) => {
            const contentData = post.content_data || {};
            const name = (contentData.name || contentData.title || '').toLowerCase();
            return name.includes(lowerQuery);
          })
          .map((post: any) => {
            const contentData = post.content_data || {};
            const name = contentData.name || contentData.title || 'Unnamed';
            const foods = contentData.foods || contentData.ingredients || [];
            
            // Calculate total macros from foods/ingredients
            let totalCalories = 0;
            let totalProtein = 0;
            let totalCarbs = 0;
            let totalFats = 0;
            
            foods.forEach((food: any) => {
              totalCalories += Number(food.calories) || 0;
              totalProtein += Number(food.protein) || 0;
              totalCarbs += Number(food.carbs) || 0;
              totalFats += Number(food.fats) || 0;
            });
            
            const isMeal = post.content_type === 'saved_meal';
            const label = isMeal ? 'Saved Meal' : 'Recipe';
            
            // Map foods to the expected format for saved meals
            const savedMealFoods: FoodInMeal[] = foods.map((food: any, idx: number) => ({
              id: food.id || `${post.id}-food-${idx}`,
              name: food.name || food.description || 'Unknown',
              calories: Number(food.calories) || 0,
              protein: Number(food.protein) || 0,
              carbs: Number(food.carbs) || 0,
              fats: Number(food.fats) || Number(food.fat) || 0,
              servings: Number(food.servings) || Number(food.rawQuantity) || 1,
              servingSize: food.servingSize || food.rawUnit || 'g',
              rawQuantity: Number(food.rawQuantity) || Number(food.servings) || 1,
              rawUnit: food.rawUnit || 'g',
            }));
            
            return {
              fdcId: -Math.abs(post.id.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0)),
              description: name,
              brandName: label,
              calories: Math.round(totalCalories),
              protein: Math.round(totalProtein),
              carbs: Math.round(totalCarbs),
              fats: Math.round(totalFats),
              servingSize: '1 serving',
              servingSizeValue: 1,
              servingSizeUnit: 'serving',
              isCustom: true,
              baseUnit: 'serving',
              isSavedMeal: isMeal,
              isRecipe: !isMeal,
              savedMealFoods: isMeal ? savedMealFoods : undefined,
            };
          });
        
        console.log(`Found ${savedMealsAndRecipes.length} saved meals/recipes`);
      }
    }

    // Only search Foundation and SR Legacy data types (exclude Branded)
    const response = await fetch(
      `${USDA_API_URL}?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=50&dataType=Foundation,SR Legacy`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      console.error('USDA API error:', response.status, await response.text());
      throw new Error('Failed to search foods');
    }

    const data = await response.json();
    const lowerQuery = query.toLowerCase().trim();
    
    let usdaFoods: FoodResult[] = (data.foods || [])
      // Filter: description must contain the search term
      .filter((food: any) => 
        food.description?.toLowerCase().includes(lowerQuery)
      )
      .map((food: any) => {
        // Extract nutrients from the food data
        const nutrients = food.foodNutrients || [];
        
        const getnutrient = (name: string): number => {
          const nutrient = nutrients.find((n: any) => 
            n.nutrientName?.toLowerCase().includes(name.toLowerCase()) ||
            n.nutrientNumber === name
          );
          return Math.round(nutrient?.value || 0);
        };

        // Parse serving size into value and unit
        const servingSizeValue = food.servingSize ? parseFloat(food.servingSize) : 100;
        const servingSizeUnit = food.servingSizeUnit || 'g';
        const servingDescription = food.householdServingFullText || 
          (food.servingSize ? `${food.servingSize} ${servingSizeUnit}` : '100 g');

        return {
          fdcId: food.fdcId,
          description: food.description,
          brandName: food.brandName || food.brandOwner,
          calories: getnutrient('energy') || getnutrient('1008'),
          protein: getnutrient('protein') || getnutrient('1003'),
          carbs: getnutrient('carbohydrate') || getnutrient('1005'),
          fats: getnutrient('fat') || getnutrient('1004'),
          servingSize: servingDescription,
          servingSizeValue: servingSizeValue,
          servingSizeUnit: servingSizeUnit,
          isCustom: false,
          baseUnit: 'g', // USDA is always per 100g
        };
      });

    // Combine saved meals/recipes, custom foods, and USDA foods (saved meals first)
    let foods = [...savedMealsAndRecipes, ...customFoods, ...usdaFoods];

    // Rank results by relevance
    foods = rankFoods(foods, query);
    
    // Limit to 15 results
    foods = foods.slice(0, 15);

    console.log(`Found ${foods.length} foods after filtering and ranking (${savedMealsAndRecipes.length} saved meals/recipes, ${customFoods.length} custom, ${usdaFoods.length} USDA)`);

    return new Response(
      JSON.stringify({ foods }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in search-foods function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message, foods: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
