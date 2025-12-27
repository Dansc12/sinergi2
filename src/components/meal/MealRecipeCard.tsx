import { motion } from "framer-motion";
import { ChefHat, Utensils, Clock, Users, Copy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface Creator {
  name: string;
  username?: string | null;
  avatar_url?: string | null;
}

interface MealRecipeCardProps {
  title: string;
  description?: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  itemCount: number;
  creator: Creator;
  createdAt: string;
  coverPhoto?: string | null;
  onCopy?: () => void;
  copyButtonText?: string;
  isRecipe?: boolean;
  prepTime?: string | null;
  cookTime?: string | null;
  servings?: string | null;
}

const MealRecipeCard = ({
  title,
  description,
  calories,
  protein,
  carbs,
  fats,
  itemCount,
  creator,
  createdAt,
  coverPhoto,
  onCopy,
  copyButtonText = "Copy",
  isRecipe = true,
  prepTime,
  cookTime,
  servings,
}: MealRecipeCardProps) => {
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  const Icon = isRecipe ? ChefHat : Utensils;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden"
    >
      {/* Cover Photo */}
      {coverPhoto && (
        <div className="h-32 w-full overflow-hidden">
          <img
            src={coverPhoto}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isRecipe 
              ? "bg-gradient-to-br from-rose-500 to-pink-400" 
              : "bg-gradient-to-br from-success to-emerald-400"
          }`}>
            <Icon size={18} className="text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{title}</h3>
            <p className="text-xs text-muted-foreground">
              {itemCount} {isRecipe ? "ingredient" : "food"}{itemCount !== 1 ? "s" : ""}
            </p>
          </div>
          {onCopy && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCopy}
              className="shrink-0 gap-1.5"
            >
              <Copy size={14} />
              {copyButtonText}
            </Button>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {description}
          </p>
        )}

        {/* Time info for recipes */}
        {isRecipe && (prepTime || cookTime || servings) && (
          <div className="flex flex-wrap gap-3 mb-3 text-xs text-muted-foreground">
            {prepTime && (
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>Prep: {prepTime}</span>
              </div>
            )}
            {cookTime && (
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>Cook: {cookTime}</span>
              </div>
            )}
            {servings && (
              <div className="flex items-center gap-1">
                <Users size={12} />
                <span>{servings} servings</span>
              </div>
            )}
          </div>
        )}

        {/* Nutrition */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
          <div className="p-2 rounded-lg bg-muted/50">
            <div className="font-semibold text-foreground">{Math.round(calories)}</div>
            <div className="text-muted-foreground">Cal</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <div className="font-semibold text-foreground">{Math.round(protein)}g</div>
            <div className="text-muted-foreground">Protein</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <div className="font-semibold text-foreground">{Math.round(carbs)}g</div>
            <div className="text-muted-foreground">Carbs</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <div className="font-semibold text-foreground">{Math.round(fats)}g</div>
            <div className="text-muted-foreground">Fats</div>
          </div>
        </div>

        {/* Creator */}
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Avatar className="w-6 h-6">
            <AvatarImage src={creator.avatar_url || undefined} />
            <AvatarFallback className="text-xs bg-muted">
              {creator.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">
            {creator.name} · {timeAgo}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default MealRecipeCard;
