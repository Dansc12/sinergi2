import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PROXY_TOKEN_URL = "https://lovable.proxy.mooo.com/connect/token";
const FATSECRET_API_URL = "https://platform.fatsecret.com/rest/server.api";

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Cache for access token
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiry - 60000) {
    return cachedToken;
  }

  const clientId = Deno.env.get('FATSECRET_CLIENT_ID');
  const clientSecret = Deno.env.get('FATSECRET_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('FatSecret credentials not configured');
  }

  // Send credentials in body (URL encoded), NOT as Basic Auth header
  const body = `grant_type=client_credentials&scope=basic&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}`;
  
  const response = await fetch(PROXY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Token request failed:', response.status, errorText);
    throw new Error('Failed to obtain FatSecret access token');
  }

  const data: TokenResponse = await response.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 1000);
  
  const tokenPreview = cachedToken.substring(0, 10) + '...';
  console.log(`Proxy Token Exchange Successful: ${tokenPreview}`);
  return cachedToken;
}

// FatSecret response interfaces
interface FatSecretSearchFood {
  food_id: string;
  food_name: string;
  food_description: string;
  food_type: string;
  brand_name?: string;
}

interface FatSecretSearchResponse {
  foods?: {
    food?: FatSecretSearchFood | FatSecretSearchFood[];
    max_results?: string;
    page_number?: string;
    total_results?: string;
  };
  error?: { code: number; message: string };
}

interface FatSecretServing {
  serving_id: string;
  serving_description: string;
  metric_serving_amount?: string;
  metric_serving_unit?: string;
  calories: string;
  carbohydrate: string;
  protein: string;
  fat: string;
}

interface FatSecretFoodGetResponse {
  food?: {
    food_id: string;
    food_name: string;
    brand_name?: string;
    servings: {
      serving: FatSecretServing | FatSecretServing[];
    };
  };
  error?: { code: number; message: string };
}

// Parse nutrition from food_description string (e.g., "Per 100g - Calories: 89kcal | Fat: 0.33g | Carbs: 22.84g | Protein: 1.09g")
function parseNutritionFromDescription(description: string): { 
  calories: number; 
  protein: number; 
  carbs: number; 
  fats: number;
  servingSize: string;
} {
  const result = { calories: 0, protein: 0, carbs: 0, fats: 0, servingSize: '100g' };
  
  // Extract serving size (e.g., "Per 100g" or "Per 1 cup")
  const servingMatch = description.match(/Per\s+([^-]+)/i);
  if (servingMatch) {
    result.servingSize = servingMatch[1].trim();
  }
  
  // Extract calories
  const caloriesMatch = description.match(/Calories:\s*([\d.]+)/i);
  if (caloriesMatch) result.calories = Math.round(parseFloat(caloriesMatch[1]));
  
  // Extract fat
  const fatMatch = description.match(/Fat:\s*([\d.]+)/i);
  if (fatMatch) result.fats = parseFloat(fatMatch[1]);
  
  // Extract carbs
  const carbsMatch = description.match(/Carbs:\s*([\d.]+)/i);
  if (carbsMatch) result.carbs = parseFloat(carbsMatch[1]);
  
  // Extract protein
  const proteinMatch = description.match(/Protein:\s*([\d.]+)/i);
  if (proteinMatch) result.protein = parseFloat(proteinMatch[1]);
  
  return result;
}

// Transform FatSecret search results to our format
function transformSearchResults(data: FatSecretSearchResponse): any[] {
  if (!data.foods?.food) return [];
  
  // FatSecret returns single item as object, multiple as array
  const foods = Array.isArray(data.foods.food) ? data.foods.food : [data.foods.food];
  
  return foods.map((food) => {
    const nutrition = parseNutritionFromDescription(food.food_description);
    
    return {
      fdcId: parseInt(food.food_id, 10),
      description: food.food_name,
      brandName: food.brand_name || (food.food_type === 'Brand' ? 'Branded' : undefined),
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fats: nutrition.fats,
      servingSize: nutrition.servingSize,
    };
  });
}

// Transform FatSecret food details to our format
function transformFoodDetails(data: FatSecretFoodGetResponse): any | null {
  if (!data.food) return null;
  
  const food = data.food;
  const servings = Array.isArray(food.servings.serving) 
    ? food.servings.serving 
    : [food.servings.serving];
  
  // Use the first serving (usually the default/100g)
  const serving = servings[0];
  
  const servingSize = serving.metric_serving_amount && serving.metric_serving_unit
    ? `${serving.metric_serving_amount}${serving.metric_serving_unit}`
    : serving.serving_description || '100g';
  
  return {
    fdcId: parseInt(food.food_id, 10),
    description: food.food_name,
    brandName: food.brand_name,
    calories: Math.round(parseFloat(serving.calories) || 0),
    protein: parseFloat(serving.protein) || 0,
    carbs: parseFloat(serving.carbohydrate) || 0,
    fats: parseFloat(serving.fat) || 0,
    servingSize,
    servingSizeValue: serving.metric_serving_amount ? parseFloat(serving.metric_serving_amount) : 100,
    servingSizeUnit: serving.metric_serving_unit || 'g',
    allServings: servings.map(s => ({
      servingId: s.serving_id,
      description: s.serving_description,
      calories: Math.round(parseFloat(s.calories) || 0),
      protein: parseFloat(s.protein) || 0,
      carbs: parseFloat(s.carbohydrate) || 0,
      fats: parseFloat(s.fat) || 0,
      metricAmount: s.metric_serving_amount ? parseFloat(s.metric_serving_amount) : undefined,
      metricUnit: s.metric_serving_unit,
    })),
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, action = 'search', foodId } = await req.json();

    // Validate inputs
    if (action === 'search' && (!query || query.trim().length < 2)) {
      return new Response(
        JSON.stringify({ foods: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_details' && !foodId) {
      return new Response(
        JSON.stringify({ error: 'foodId is required for get_details action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`FatSecret API - Action: ${action}, Query: ${query || foodId}`);

    const accessToken = await getAccessToken();

    let apiUrl: string;
    if (action === 'search') {
      apiUrl = `${FATSECRET_API_URL}?method=foods.search&search_expression=${encodeURIComponent(query)}&max_results=15&format=json`;
    } else {
      apiUrl = `${FATSECRET_API_URL}?method=food.get.v2&food_id=${foodId}&format=json`;
    }

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FatSecret API error:', response.status, errorText);
      throw new Error('Failed to fetch from FatSecret API');
    }

    const data = await response.json();
    
    if (data.error) {
      console.error('FatSecret API returned error:', data.error);
      throw new Error(data.error.message || 'FatSecret API error');
    }

    if (action === 'search') {
      const foods = transformSearchResults(data as FatSecretSearchResponse);
      console.log(`Found ${foods.length} foods`);
      return new Response(
        JSON.stringify({ foods }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const food = transformFoodDetails(data as FatSecretFoodGetResponse);
      return new Response(
        JSON.stringify({ food }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in search-foods function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message, foods: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
