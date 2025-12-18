import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Camera, Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { CameraCapture } from "@/components/CameraCapture";
import { usePhotoPicker } from "@/hooks/useCamera";

const interests = ["Weightlifting", "Yoga", "Running", "Cycling", "CrossFit", "Swimming", "Hiking", "Nutrition"];

interface RestoredState {
  restored?: boolean;
  contentData?: { 
    name?: string; 
    description?: string;
    category?: string;
    privacy?: string;
  };
  images?: string[];
}

const CreateGroupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const restoredState = location.state as RestoredState | null;
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [privacy, setPrivacy] = useState("");
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const { inputRef, openPicker, handleFileChange } = usePhotoPicker((urls) => {
    if (urls.length > 0) {
      setCoverPhoto(urls[0]);
    }
  });

  // Restore state if coming back from share screen
  useEffect(() => {
    if (restoredState?.restored && restoredState.contentData) {
      const data = restoredState.contentData;
      if (data.name) setName(data.name);
      if (data.description) setDescription(data.description);
      if (data.category) setCategory(data.category);
      if (data.privacy) setPrivacy(data.privacy);
      if (restoredState.images && restoredState.images.length > 0) {
        setCoverPhoto(restoredState.images[0]);
      }
      window.history.replaceState({}, document.title);
    }
  }, []);

  const handleBack = () => {
    navigate("/");
  };

  const handleCapturePhoto = (imageUrl: string) => {
    setCoverPhoto(imageUrl);
  };

  const removeCoverPhoto = () => {
    setCoverPhoto(null);
  };

  const handleFinish = () => {
    if (!name.trim()) {
      toast({ title: "Please enter a group name", variant: "destructive" });
      return;
    }
    if (!category) {
      toast({ title: "Please select a category", variant: "destructive" });
      return;
    }
    if (!coverPhoto) {
      toast({ title: "Please add a cover photo", variant: "destructive" });
      return;
    }

    // Navigate to share screen with group data
    navigate("/share", {
      state: {
        contentType: "group",
        contentData: {
          name: name.trim(),
          description: description.trim(),
          category,
          privacy: privacy || "public",
        },
        images: coverPhoto ? [coverPhoto] : [],
        returnTo: "/create/group",
      },
    });
  };

  const canFinish = name.trim() && category && coverPhoto;

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
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft size={24} />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center">
                <Users size={20} className="text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">Create Group</h1>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="border-primary text-primary"
            onClick={handleFinish}
            disabled={!canFinish}
          >
            Finish
          </Button>
        </div>

        {/* Cover Photo */}
        <div className="mb-6">
          <Label className="mb-2 block">Cover Photo <span className="text-destructive">*</span></Label>
          
          {/* Hidden file input */}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {coverPhoto ? (
            <div className="relative h-40 rounded-2xl overflow-hidden">
              <img src={coverPhoto} alt="Cover" className="w-full h-full object-cover" />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 bg-background/80 hover:bg-background rounded-full"
                onClick={removeCoverPhoto}
              >
                <X size={16} />
              </Button>
            </div>
          ) : (
            <div className="h-40 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-400/20 border-2 border-dashed border-border flex items-center justify-center gap-4">
              <Button variant="ghost" onClick={() => setIsCameraOpen(true)}>
                <Camera size={20} className="mr-2" /> Camera
              </Button>
              <Button variant="ghost" onClick={openPicker}>
                <Image size={20} className="mr-2" /> Gallery
              </Button>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              placeholder="e.g., Morning Runners Club"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What's your group about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Category <span className="text-destructive">*</span></Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {interests.map((interest) => (
                  <SelectItem key={interest} value={interest.toLowerCase()}>
                    {interest}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Privacy</Label>
            <Select value={privacy} onValueChange={setPrivacy}>
              <SelectTrigger>
                <SelectValue placeholder="Who can join?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public - Anyone can join</SelectItem>
                <SelectItem value="private">Private - Approval required</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapturePhoto}
      />
    </div>
  );
};

export default CreateGroupPage;
