import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, PenSquare, Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const CreatePostPage = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const handleImageUpload = () => {
    // Simulated image upload
    const mockImage = `https://images.unsplash.com/photo-${Date.now()}?w=400`;
    setImages([...images, mockImage]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      toast({ title: "Please write something", variant: "destructive" });
      return;
    }
    toast({ title: "Post shared!", description: "Your update is now live." });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft size={24} />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <PenSquare size={20} className="text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">New Post</h1>
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={!content.trim()}>
            Share
          </Button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="content">What's on your mind?</Label>
            <Textarea
              id="content"
              placeholder="Share your wellness journey, a win, or motivation..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Image Preview */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-1 right-1 bg-background/80"
                    onClick={() => removeImage(index)}
                  >
                    <X size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button variant="outline" className="w-full" onClick={handleImageUpload}>
            <Image size={18} /> Add Photo
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default CreatePostPage;
