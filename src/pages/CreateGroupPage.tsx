import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

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

  // Restore state if coming back from share screen
  useEffect(() => {
    if (restoredState?.restored && restoredState.contentData) {
      const data = restoredState.contentData;
      if (data.name) setName(data.name);
      if (data.description) setDescription(data.description);
      if (data.category) setCategory(data.category);
      if (data.privacy) setPrivacy(data.privacy);
      window.history.replaceState({}, document.title);
    }
  }, []);

  const handleBack = () => {
    navigate("/");
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({ title: "Please enter a group name", variant: "destructive" });
      return;
    }
    if (!category) {
      toast({ title: "Please select a category", variant: "destructive" });
      return;
    }
    // Directly create the group without going to share screen
    toast({ 
      title: "Group created!", 
      description: "Your group is now live." 
    });
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
        <div className="flex items-center gap-4 mb-6">
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

        {/* Cover Photo */}
        <div className="mb-6">
          <div className="h-32 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-400/20 border-2 border-dashed border-border flex items-center justify-center">
            <Button variant="ghost">
              <Image size={20} className="mr-2" /> Add Cover Photo
            </Button>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
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
            <Label>Category</Label>
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
                <SelectItem value="invite">Invite Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full" size="lg" onClick={handleSubmit}>
            Create Group
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateGroupPage;
