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
}

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

    const response = await fetch(
      `${USDA_API_URL}?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=10&dataType=Foundation,SR Legacy,Branded`,
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
    
    const foods: FoodResult[] = (data.foods || []).map((food: any) => {
      // Extract nutrients from the food data
      const nutrients = food.foodNutrients || [];
      
      const getnutrient = (name: string): number => {
        const nutrient = nutrients.find((n: any) => 
          n.nutrientName?.toLowerCase().includes(name.toLowerCase()) ||
          n.nutrientNumber === name
        );
        return Math.round(nutrient?.value || 0);
      };

      return {
        fdcId: food.fdcId,
        description: food.description,
        brandName: food.brandName || food.brandOwner,
        calories: getnutrient('energy') || getnutrient('1008'),
        protein: getnutrient('protein') || getnutrient('1003'),
        carbs: getnutrient('carbohydrate') || getnutrient('1005'),
        fats: getnutrient('fat') || getnutrient('1004'),
        servingSize: food.servingSize ? `${food.servingSize}${food.servingSizeUnit || 'g'}` : '100g',
      };
    });

    console.log(`Found ${foods.length} foods`);

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
