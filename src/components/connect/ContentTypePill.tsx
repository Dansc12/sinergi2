import { cn } from "@/lib/utils";
import {
  ClipboardList,
  Dumbbell,
  ChefHat,
  FileText,
  UtensilsCrossed,
  Users,
  type LucideIcon,
} from "lucide-react";

const typeIcons = {
  workout: Dumbbell,
  meal: UtensilsCrossed,
  recipe: ChefHat,
  routine: ClipboardList,
  post: FileText,
  group: Users,
} as const;

export function getContentTypeIcon(type: string): LucideIcon | undefined {
  return (typeIcons as Record<string, LucideIcon | undefined>)[type];
}

export function getContentTypeLabel(type: string): string {
  if (!type) return "Post";

  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ContentTypePill({
  type,
  title,
  className,
  noPill = false,
}: {
  type: string;
  title: string;
  className?: string;
  noPill?: boolean;
}) {
  const Icon = getContentTypeIcon(type);

  if (noPill) {
    return (
      <div className={cn("flex items-center gap-2 min-w-0 w-full", className)}>
        {Icon ? <Icon size={18} className="text-foreground/80 shrink-0" /> : null}
        <span className="min-w-0 flex-1 truncate text-base font-semibold text-foreground">
          {title}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-sm px-3 py-1.5 shadow-lg min-w-0 max-w-full",
        className
      )}
    >
      {Icon ? <Icon size={18} className="text-white/90 drop-shadow-md shrink-0" /> : null}
      <span className="min-w-0 flex-1 truncate text-base font-semibold text-white drop-shadow-md">
        {title}
      </span>
    </div>
  );
}
