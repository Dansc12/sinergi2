import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface RecentFood {
  fdcId: number;
  description: string;
  // These are the TOTAL values for the logged portion (not per-unit)
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  // The quantity logged (e.g., 50)
  quantity: number;
  // The unit used (e.g., "g", "oz", "cup")
  unit: string;
  loggedAt: string;
}

export const useRecentFoods = (limit: number = 10) => {
  const { user } = useAuth();
  const [recentFoods, setRecentFoods] = useState<RecentFood[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRecentFoods([]);
      setIsLoading(false);
      return;
    }

    fetchRecentFoods();
  }, [user, limit]);

  const fetchRecentFoods = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Fetch recent meal logs ordered by creation date
      const { data: meals, error } = await supabase
        .from("meal_logs")
        .select("foods, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20); // Fetch more to extract individual foods

      if (error) throw error;

      if (meals) {
        // Extract individual foods from meal logs
        const foodsMap = new Map<string, RecentFood>();
        
        meals.forEach((meal) => {
          const foods = meal.foods as Array<{
            name: string;
            calories: number;
            protein: number;
            carbs: number;
            fat: number; // Note: meal_logs uses 'fat' not 'fats'
            servings?: number;
            servingSize?: string;
          }>;
          
          if (Array.isArray(foods)) {
            foods.forEach((food) => {
              const key = food.name.toLowerCase();
              
              // Parse servingSize to extract quantity and unit (format: "50 g" or "100 ml")
              const servingSizeStr = food.servingSize || "1 g";
              const match = servingSizeStr.match(/^([\d.]+)\s*(.+)$/);
              const quantity = match ? parseFloat(match[1]) : 1;
              const unit = match ? match[2].trim() : "g";
              
              // Only keep the most recent entry for each food
              if (!foodsMap.has(key)) {
                foodsMap.set(key, {
                  fdcId: -Math.abs(key.split('').reduce((a, b) => a + b.charCodeAt(0), 0)),
                  description: food.name,
                  // Store the TOTAL logged values (not normalized)
                  calories: food.calories || 0,
                  protein: food.protein || 0,
                  carbs: food.carbs || 0,
                  fats: food.fat || 0, // meal_logs uses 'fat'
                  quantity,
                  unit,
                  loggedAt: meal.created_at,
                });
              }
            });
          }
        });

        // Convert map to array and sort by logged date (most recent first)
        const sortedFoods = Array.from(foodsMap.values())
          .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
          .slice(0, limit);

        setRecentFoods(sortedFoods);
      }
    } catch (error) {
      console.error("Error fetching recent foods:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    recentFoods,
    isLoading,
    refetch: fetchRecentFoods,
  };
};

