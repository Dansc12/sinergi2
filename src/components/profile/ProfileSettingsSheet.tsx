import { useState, useRef } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const HOBBY_OPTIONS = [
  "Weightlifting", "Running", "Yoga", "Swimming", "Cycling",
  "Hiking", "CrossFit", "Pilates", "Boxing", "Dance",
  "Basketball", "Soccer", "Tennis", "Golf", "Martial Arts",
  "Meditation", "Stretching", "HIIT", "Calisthenics", "Rock Climbing"
];

interface ProfileSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    first_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    hobbies: string[] | null;
  } | null;
  onSave: () => void;
}

export const ProfileSettingsSheet = ({ 
  open, 
  onOpenChange, 
  profile,
  onSave 
}: ProfileSettingsSheetProps) => {
  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>(profile?.hobbies || []);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when sheet opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setFirstName(profile?.first_name || "");
      setBio(profile?.bio || "");
      setAvatarUrl(profile?.avatar_url || "");
      setSelectedHobbies(profile?.hobbies || []);
    }
    onOpenChange(newOpen);
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);
      toast.success("Photo uploaded!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload photo");
    } finally {
      setIsUploading(false);
    }
  };

  const toggleHobby = (hobby: string) => {
    setSelectedHobbies(prev => 
      prev.includes(hobby)
        ? prev.filter(h => h !== hobby)
        : [...prev, hobby]
    );
  };

  const handleSave = async () => {
    if (!firstName.trim()) {
      toast.error("Name is required");
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          bio: bio.trim() || null,
          avatar_url: avatarUrl || null,
          hobbies: selectedHobbies.length > 0 ? selectedHobbies : null,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success("Profile updated!");
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle>Edit Profile</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-140px)] pb-4">
          {/* Profile Photo */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-primary/30">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="text-2xl bg-muted">
                  <Camera size={32} className="text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handlePhotoClick}
                disabled={isUploading}
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg"
              >
                {isUploading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Camera size={16} />
                )}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground mt-2">Tap to change photo</p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Your name"
              maxLength={50}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about yourself..."
              className="resize-none"
              rows={3}
              maxLength={150}
            />
            <p className="text-xs text-muted-foreground text-right">{bio.length}/150</p>
          </div>

          {/* Hobbies */}
          <div className="space-y-2">
            <Label>Hobbies & Interests</Label>
            <div className="flex flex-wrap gap-2">
              {HOBBY_OPTIONS.map((hobby) => (
                <button
                  key={hobby}
                  onClick={() => toggleHobby(hobby)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                    selectedHobbies.includes(hobby)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {hobby}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-border">
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !firstName.trim()}
            className="w-full"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
