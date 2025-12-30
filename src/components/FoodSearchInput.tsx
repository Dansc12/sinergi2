import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
        const { data, error } = await supabase.functions.invoke('search-foods', {
          body: { query: value },
        });

        if (error) throw error;

        setResults(data?.foods || []);
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
              results.map((food) => (
                <button
                  key={`${food.fdcId}-${food.isCustom ? 'custom' : 'usda'}`}
                  type="button"
                  onClick={() => handleSelect(food)}
                  className="w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors border-b border-border last:border-0"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{food.description}</div>
                      {(food.isSavedMeal || food.isRecipe) && (
                        <div className="text-xs text-muted-foreground">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            food.isSavedMeal 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {food.isSavedMeal ? 'Saved Meal' : 'Recipe'}
                          </span>
                        </div>
                      )}
                      {food.isCustom && !food.isSavedMeal && !food.isRecipe && (
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
                    <span>P: {food.protein}g</span>
                    <span>C: {food.carbs}g</span>
                    <span>F: {food.fats}g</span>
                    {food.isCustom && !food.isSavedMeal && !food.isRecipe && (
                      <span className="text-muted-foreground/70">per 1{food.baseUnit}</span>
                    )}
                    {(food.isSavedMeal || food.isRecipe) && (
                      <span className="text-muted-foreground/70">per serving</span>
                    )}
                  </div>
                </button>
              ))
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
