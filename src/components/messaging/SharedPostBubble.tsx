import { motion } from "framer-motion";
import { Dumbbell, Utensils, BookOpen, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface SharedPostData {
  content_type: string;
  content_data: unknown;
  images: string[] | null;
  description: string | null;
}

interface SharedPostBubbleProps {
  senderName: string;
  senderAvatar: string | null;
  postData?: SharedPostData;
  message: string | null;
  createdAt: string;
  isOwnMessage: boolean;
  onTap?: () => void;
}

const getContentTypeIcon = (contentType: string) => {
  switch (contentType) {
    case "workout":
      return <Dumbbell size={14} className="text-primary" />;
    case "meal":
      return <Utensils size={14} className="text-success" />;
    case "recipe":
      return <BookOpen size={14} className="text-rose-500" />;
    case "routine":
      return <Calendar size={14} className="text-violet-500" />;
    default:
      return null;
  }
};

const getContentTypeLabel = (contentType: string) => {
  const labels: Record<string, string> = {
    workout: "Workout",
    meal: "Meal",
    recipe: "Recipe",
    routine: "Routine",
    post: "Post",
  };
  return labels[contentType] || "Post";
};

const getContentTitle = (contentType: string, contentData: unknown): string => {
  const data = contentData as Record<string, unknown>;
  switch (contentType) {
    case "workout":
      return (data?.title as string) || "Workout";
    case "meal":
      return (data?.name as string) || "Meal";
    case "recipe":
      return (data?.title as string) || "Recipe";
    case "routine":
      return (data?.routineName as string) || "Routine";
    default:
      return "Post";
  }
};

export const SharedPostBubble = ({
  senderName,
  senderAvatar,
  postData,
  message,
  createdAt,
  isOwnMessage,
  onTap,
}: SharedPostBubbleProps) => {
  if (!postData) return null;

  const firstImage = postData.images?.[0];
  const contentTitle = getContentTitle(postData.content_type, postData.content_data);
  const contentLabel = getContentTypeLabel(postData.content_type);
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  return (
    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`flex items-end gap-2 max-w-[85%] ${isOwnMessage ? "flex-row-reverse" : ""}`}>
        {!isOwnMessage && (
          <Avatar className="w-6 h-6 flex-shrink-0">
            <AvatarImage src={senderAvatar || undefined} />
            <AvatarFallback className="text-xs bg-muted">
              {senderName?.slice(0, 1).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        )}
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={`rounded-2xl overflow-hidden ${
            isOwnMessage 
              ? "bg-primary text-primary-foreground" 
              : "bg-card border border-border"
          }`}
          onClick={onTap}
        >
          {/* Shared post card - Instagram style */}
          <div className="p-1">
            <div className={`rounded-xl overflow-hidden ${
              isOwnMessage ? "bg-primary-foreground/10" : "bg-muted/50"
            }`}>
              {/* Image */}
              {firstImage && (
                <div className="relative aspect-square max-w-[200px]">
                  <img 
                    src={firstImage} 
                    alt={contentTitle}
                    className="w-full h-full object-cover"
                  />
                  {/* Content type badge */}
                  <div className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                    isOwnMessage ? "bg-background/80 text-foreground" : "bg-background/80 text-foreground"
                  }`}>
                    {getContentTypeIcon(postData.content_type)}
                    <span>{contentLabel}</span>
                  </div>
                </div>
              )}
              
              {/* Content info */}
              <div className="p-3">
                <p className={`font-medium text-sm ${isOwnMessage ? "text-primary-foreground" : "text-foreground"}`}>
                  {contentTitle}
                </p>
                {postData.description && (
                  <p className={`text-xs mt-1 line-clamp-2 ${
                    isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}>
                    {postData.description}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Optional message */}
          {message && (
            <div className="px-3 pb-2">
              <p className={`text-sm ${isOwnMessage ? "text-primary-foreground" : "text-foreground"}`}>
                {message}
              </p>
            </div>
          )}
          
          {/* Timestamp */}
          <div className={`px-3 pb-2 ${isOwnMessage ? "text-right" : ""}`}>
            <span className={`text-[10px] ${
              isOwnMessage ? "text-primary-foreground/50" : "text-muted-foreground"
            }`}>
              {timeAgo}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
