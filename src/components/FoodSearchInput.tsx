import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Plus, Utensils } from "lucide-react";

// USDA FoodData Central API
const USDA_API_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";
// DEMO_KEY is a free public API key provided by USDA for demo/testing purposes
// For production, consider using environment variables or a proper API key
const USDA_API_KEY = "DEMO_KEY";

// USDA API response types
interface USDANutrient {
  nutrientNumber?: string;
  nutrientName?: string;
  value?: number;
  unitName?: string;
}

interface USDAFood {
  fdcId: number;
  description: string;
  brandName?: string;
  brandOwner?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients?: USDANutrient[];
}

interface USDASearchResponse {
  foods?: USDAFood[];
}

export interface SavedMealFood {
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

export interface FoodItem {
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
  savedMealFoods?: SavedMealFood[];
  savedMealCoverPhoto?: string;
}

interface FoodSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (food: FoodItem) => void;
  onAddCustom?: (searchTerm: string) => void;
  placeholder?: string;
}

export const FoodSearchInput = ({
  value,
  onChange,
  onSelect,
  onAddCustom,
  placeholder = "Search for a food...",
}: FoodSearchInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<FoodItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Rank foods based on search term relevance
  const rankFoods = (foods: FoodItem[], searchTerm: string): FoodItem[] => {
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
      
      // Priority 3: Sort by description length (shorter = more relevant)
      return aDesc.length - bDesc.length;
    });
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${USDA_API_URL}?api_key=${USDA_API_KEY}&query=${encodeURIComponent(value)}&pageSize=50&dataType=Foundation,SR Legacy`,
          {
            method: 'GET',
          }
        );

        if (!response.ok) {
          console.error('USDA API error:', response.status);
          throw new Error('Failed to search foods');
        }

        const data: USDASearchResponse = await response.json();
        const lowerQuery = value.toLowerCase().trim();
        
        let foods: FoodItem[] = (data.foods || [])
          // Filter: description must contain the search term
          .filter((food: USDAFood) => 
            food.description?.toLowerCase().includes(lowerQuery)
          )
          .map((food: USDAFood) => {
            // Extract nutrients from the food data
            const nutrients = food.foodNutrients || [];
            
            const getNutrient = (nameOrNumber: string): number | null => {
              const needle = nameOrNumber.toLowerCase();
              const nutrient = nutrients.find((n: USDANutrient) =>
                String(n.nutrientNumber) === nameOrNumber ||
                n.nutrientName?.toLowerCase().includes(needle)
              );
              if (nutrient?.value == null) return null;
              return Math.round(Number(nutrient.value));
            };

            // Get energy in kcal (prefer nutrientNumber 1008)
            const getEnergyKcal = (): number => {
              const kcal = nutrients.find((n: USDANutrient) =>
                String(n.nutrientNumber) === "1008" ||
                (n.nutrientName?.toLowerCase() === "energy" && String(n.unitName).toLowerCase() === "kcal")
              );
              if (kcal?.value != null) return Math.round(Number(kcal.value));

              const kj = nutrients.find((n: USDANutrient) =>
                String(n.nutrientNumber) === "1062" ||
                (n.nutrientName?.toLowerCase() === "energy" && String(n.unitName).toLowerCase() === "kj")
              );
              if (kj?.value != null) return Math.round(Number(kj.value) / 4.184);

              const anyEnergyKcal = nutrients.find((n: USDANutrient) =>
                n.nutrientName?.toLowerCase().includes("energy") && String(n.unitName).toLowerCase() === "kcal"
              );
              if (anyEnergyKcal?.value != null) return Math.round(Number(anyEnergyKcal.value));
              
              return 0;
            };

            // Parse serving size into value and unit
            const servingSizeValue = food.servingSize || 100;
            const servingSizeUnit = food.servingSizeUnit || 'g';
            const servingDescription = food.householdServingFullText || 
              (food.servingSize ? `${food.servingSize} ${servingSizeUnit}` : '100 g');

            return {
              fdcId: food.fdcId,
              description: food.description,
              brandName: food.brandName || food.brandOwner,
              calories: getEnergyKcal(),
              protein: getNutrient('protein') ?? getNutrient('1003') ?? 0,
              carbs: getNutrient('carbohydrate') ?? getNutrient('1005') ?? 0,
              fats: getNutrient('fat') ?? getNutrient('1004') ?? 0,
              servingSize: servingDescription,
              servingSizeValue: servingSizeValue,
              servingSizeUnit: servingSizeUnit,
              isCustom: false,
              baseUnit: 'g',
            };
          });

        // Rank results by relevance
        foods = rankFoods(foods, value);
        
        // Limit to 15 results
        foods = foods.slice(0, 15);

        setResults(foods);
        setIsOpen(true);
      } catch (err) {
        console.error('Food search error:', err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value]);

  const handleSelect = (food: FoodItem) => {
    onSelect(food);
    onChange(food.description);
    setIsOpen(false);
  };

  const handleAddCustomClick = () => {
    if (onAddCustom) {
      onAddCustom(value);
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Search size={16} />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden max-h-80 overflow-y-auto"
          >
            {/* Add Custom Food CTA - Always shown at top */}
            {onAddCustom && (
              <button
                type="button"
                onClick={handleAddCustomClick}
                className="w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors border-b border-border flex items-center gap-3 bg-primary/5"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus size={16} className="text-primary" />
                </div>
                <div>
                  <div className="font-medium text-sm text-primary">Can't find it? Add a custom food</div>
                  <div className="text-xs text-muted-foreground">
                    {value.trim() ? `Create "${value.trim()}"` : "Enter your own food with macros"}
                  </div>
                </div>
              </button>
            )}

            {results.length > 0 ? (
              results.map((food) => {
                const isSavedMealOrRecipe = food.isSavedMeal || food.isRecipe;
                
                return (
                  <button
                    key={`${food.fdcId}-${food.isCustom ? 'custom' : 'usda'}`}
                    type="button"
                    onClick={() => handleSelect(food)}
                    className="w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors border-b border-border last:border-0"
                  >
                    {isSavedMealOrRecipe ? (
                      /* Saved Meal / Recipe display with circular cover photo */
                      <div className="flex items-center gap-3">
                        {/* Circular cover photo - 40px diameter */}
                        <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden bg-primary/20">
                          {food.savedMealCoverPhoto ? (
                            <img 
                              src={food.savedMealCoverPhoto} 
                              alt={food.description}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Utensils size={18} className="text-primary" />
                            </div>
                          )}
                        </div>
                        {/* Name on top, cals/macros on bottom - total height matches circle */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center h-10">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-sm truncate">{food.description}</span>
                            <span className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              food.isSavedMeal 
                                ? 'bg-emerald-500/20 text-emerald-400' 
                                : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {food.isSavedMeal ? 'Saved Meal' : 'Recipe'}
                            </span>
                          </div>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span>{food.calories} cal</span>
                            <span style={{ color: '#3DD6C6' }}>P: {food.protein}g</span>
                            <span style={{ color: '#5B8CFF' }}>C: {food.carbs}g</span>
                            <span style={{ color: '#B46BFF' }}>F: {food.fats}g</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Regular food / custom food display */
                      <>
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{food.description}</div>
                            {food.isCustom && (
                              <div className="text-xs text-muted-foreground">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                                  Custom
                                </span>
                              </div>
                            )}
                            {!food.isCustom && food.brandName && (
                              <div className="text-xs text-muted-foreground truncate">
                                {food.brandName}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{food.calories} cal</span>
                          <span style={{ color: '#3DD6C6' }}>P: {food.protein}g</span>
                          <span style={{ color: '#5B8CFF' }}>C: {food.carbs}g</span>
                          <span style={{ color: '#B46BFF' }}>F: {food.fats}g</span>
                          {food.isCustom && (
                            <span className="text-muted-foreground/70">per 1{food.baseUnit}</span>
                          )}
                        </div>
                      </>
                    )}
                  </button>
                );
              })
            ) : (
              !onAddCustom && value.trim().length >= 2 && !isLoading && (
                <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                  No foods found
                </div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
