import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, HelpCircle, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  showLabel?: boolean;
}

export const TagInput = ({
  tags,
  onTagsChange,
  placeholder = "Add tag...",
  maxTags = 10,
  showLabel = true,
}: TagInputProps) => {
  const [newTag, setNewTag] = useState("");
  const [showTagsInfo, setShowTagsInfo] = useState(false);

  const handleAddTag = () => {
    const processed = newTag.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (processed && !tags.includes(processed) && tags.length < maxTags) {
      onTagsChange([...tags, processed]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      {/* Label Row */}
      {showLabel && (
        <Label className="flex items-center gap-2 text-sm">
          <Tag size={14} />
          <button 
            type="button"
            onClick={() => setShowTagsInfo(true)}
            className="flex items-center gap-1 hover:text-primary transition-colors underline-offset-2 hover:underline"
          >
            Tags
            <HelpCircle size={12} className="text-muted-foreground" />
          </button>
          <span className="text-xs text-muted-foreground ml-1">({tags.length}/{maxTags})</span>
        </Label>
      )}

      {/* Tag Input Row */}
      <Input
        placeholder={placeholder}
        value={newTag}
        onChange={(e) => {
          const value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "");
          setNewTag(value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleAddTag();
          }
        }}
        className="h-9 bg-muted/50 border-0 text-sm"
      />

      {/* Tags Info Dialog */}
      <Dialog open={showTagsInfo} onOpenChange={setShowTagsInfo}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag size={18} />
              What are Tags?
            </DialogTitle>
            <DialogDescription className="text-left space-y-3 pt-2">
              <p>
                Tags help categorize your content and make it easier for others to discover.
              </p>
              <p>
                <strong>Tips for good tags:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Use relevant keywords (e.g., "highprotein", "quickmeal")</li>
                <li>Keep tags short and descriptive</li>
                <li>Add up to {maxTags} tags per item</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Tags Display */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 min-h-[32px]">
          <AnimatePresence>
            {tags.map((tag) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-destructive transition-colors"
                >
                  <X size={14} />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
