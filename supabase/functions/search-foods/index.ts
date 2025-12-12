import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// USDA FoodData Central API (free, no API key required for basic usage)
const USDA_API_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";
const USDA_API_KEY = "DEMO_KEY"; // Free demo key with rate limits

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
}

// Rank foods based on search term relevance
const rankFoods = (foods: FoodResult[], searchTerm: string): FoodResult[] => {
  const lowerSearch = searchTerm.toLowerCase().trim();
  
  return foods.sort((a, b) => {
    const aDesc = a.description.toLowerCase();
    const bDesc = b.description.toLowerCase();
    
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
    
    let foods: FoodResult[] = (data.foods || [])
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
        };
      });

    // Rank results by relevance
    foods = rankFoods(foods, query);
    
    // Limit to 15 results
    foods = foods.slice(0, 15);

    console.log(`Found ${foods.length} foods after filtering and ranking`);

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
