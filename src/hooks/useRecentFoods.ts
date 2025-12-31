import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface RecentFood {
  fdcId: number;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servings: number;
  servingSize: string;
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
            fats: number;
            servings?: number;
            servingSize?: string;
          }>;
          
          if (Array.isArray(foods)) {
            foods.forEach((food) => {
              const key = food.name.toLowerCase();
              // Parse servingSize to extract quantity and unit (format: "50 ml" or "100 g")
              const servingSizeStr = food.servingSize || "1 g";
              const match = servingSizeStr.match(/^([\d.]+)\s*(.+)$/);
              const baseQuantity = match ? parseFloat(match[1]) : 1;
              const rawUnit = match ? match[2].trim() : "g";
              
              // Calculate total quantity: baseQuantity * servings
              // e.g., "100 g" with servings: 2 = 200g total
              const foodServings = food.servings ?? 1;
              const totalQuantity = baseQuantity * foodServings;
              
              // Only keep the most recent entry for each food
              // Store per-1-unit values for proper recalculation when re-logging
              if (!foodsMap.has(key)) {
                const divisor = totalQuantity > 0 ? totalQuantity : 1;
                foodsMap.set(key, {
                  fdcId: -Math.abs(key.split('').reduce((a, b) => a + b.charCodeAt(0), 0)),
                  description: food.name,
                  // Store per-1-unit values (e.g., calories per 1g)
                  calories: (food.calories || 0) / divisor,
                  protein: (food.protein || 0) / divisor,
                  carbs: (food.carbs || 0) / divisor,
                  fats: (food.fats || 0) / divisor,
                  // Store the total quantity logged for display
                  servings: totalQuantity,
                  servingSize: rawUnit,
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

