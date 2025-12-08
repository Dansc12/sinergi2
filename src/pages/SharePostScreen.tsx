import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Image, X, Globe, Users, Lock, Check, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { CameraCapture } from "@/components/CameraCapture";
import { usePhotoPicker } from "@/hooks/useCamera";

type Visibility = "public" | "friends" | "private";

interface LocationState {
  contentType: string;
  contentData: Record<string, unknown>;
  images?: string[];
  returnTo?: string;
}

const visibilityOptions = [
  { value: "public" as Visibility, label: "Public", icon: Globe, description: "Anyone can see this" },
  { value: "friends" as Visibility, label: "Friends Only", icon: Users, description: "Only your friends can see" },
  { value: "private" as Visibility, label: "Private", icon: Lock, description: "Only you can see this" },
];

const SharePostScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("friends");
  const [images, setImages] = useState<string[]>(state?.images || []);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const { inputRef, openPicker, handleFileChange } = usePhotoPicker((urls) => {
    setImages([...images, ...urls]);
  });

  useEffect(() => {
    if (!state?.contentType) {
      navigate("/");
    }
  }, [state, navigate]);

  const handleCapturePhoto = (imageUrl: string) => {
    setImages([...images, imageUrl]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const contentTypeLabels: Record<string, string> = {
      workout: "Workout",
      meal: "Meal",
      recipe: "Recipe",
      routine: "Routine",
      group: "Group",
      post: "Post",
    };

    const label = contentTypeLabels[state?.contentType || "post"] || "Post";

    toast({ 
      title: `${label} shared!`, 
      description: visibility === "private" 
        ? `Your ${label.toLowerCase()} has been saved privately.`
        : `Your ${label.toLowerCase()} is now live.` 
    });
    navigate("/");
  };

  const getContentTypeIcon = () => {
    const typeColors: Record<string, string> = {
      workout: "from-primary to-accent",
      meal: "from-success to-emerald-400",
      recipe: "from-rose-500 to-pink-400",
      routine: "from-violet-500 to-purple-400",
      group: "from-amber-500 to-orange-400",
      post: "from-blue-500 to-cyan-400",
    };
    return typeColors[state?.contentType || "post"] || "from-primary to-accent";
  };

  const getContentTypeLabel = () => {
    const labels: Record<string, string> = {
      workout: "Workout",
      meal: "Meal",
      recipe: "Recipe",
      routine: "Routine",
      group: "Group",
      post: "Post",
    };
    return labels[state?.contentType || "post"] || "Post";
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="p-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => {
              // Navigate back to the create page with the current state preserved
              const returnTo = state?.returnTo || "/";
              navigate(returnTo, {
                state: {
                  restored: true,
                  contentData: state?.contentData,
                  images: images,
                },
                replace: true,
              });
            }}>
              <ArrowLeft size={24} />
            </Button>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getContentTypeIcon()} flex items-center justify-center`}>
                <Globe size={20} className="text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">Share {getContentTypeLabel()}</h1>
            </div>
          </div>
        </div>

        {/* Content Summary */}

        {/* Photos Section */}
        <div className="space-y-3 mb-6">
          <Label>Photos</Label>
          
          {/* Hidden file input */}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="grid grid-cols-3 gap-2">
            <AnimatePresence>
              {images.map((img, index) => (
                <motion.div
                  key={img + index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative aspect-square rounded-xl overflow-hidden bg-muted"
                >
                  <img src={img} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 bg-background/80 hover:bg-background"
                    onClick={() => removeImage(index)}
                  >
                    <X size={14} />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Camera button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCameraOpen(true)}
              className="aspect-square rounded-xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              <Camera size={24} />
              <span className="text-xs">Camera</span>
            </motion.button>

            {/* Gallery button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openPicker}
              className="aspect-square rounded-xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              <Image size={24} />
              <span className="text-xs">Gallery</span>
            </motion.button>
          </div>
          <p className="text-xs text-muted-foreground">Photos are optional</p>
        </div>

        {/* Description */}
        <div className="space-y-3 mb-6">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Share your thoughts, celebrate your win, or motivate others..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Visibility Selection */}
        <div className="space-y-3 mb-8">
          <Label>Who can see this?</Label>
          <div className="space-y-2">
            {visibilityOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = visibility === option.value;
              return (
                <motion.button
                  key={option.value}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setVisibility(option.value)}
                  className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${
                    isSelected
                      ? "bg-primary/20 border-2 border-primary"
                      : "bg-card border border-border hover:bg-muted/50"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-medium ${isSelected ? "text-foreground" : "text-foreground"}`}>
                      {option.label}
                    </p>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check size={14} className="text-primary-foreground" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <Button 
          className="w-full glow-primary" 
          size="lg" 
          onClick={handleSubmit}
        >
          {visibility === "private" ? "Save Privately" : "Share Now"}
        </Button>
      </motion.div>

      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapturePhoto}
        onSelectFromGallery={(urls) => setImages([...images, ...urls])}
      />
    </div>
  );
};

export default SharePostScreen;
