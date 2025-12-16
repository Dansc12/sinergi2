import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingProgress } from './OnboardingProgress';
import { motion } from 'framer-motion';
import { ChevronLeft, Camera, Upload, Loader2, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProfilePhotoScreenProps {
  isAuthenticated?: boolean;
}

export function ProfilePhotoScreen({ isAuthenticated = false }: ProfilePhotoScreenProps) {
  const { data, updateData, setCurrentStep } = useOnboarding();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [firstName, setFirstName] = useState(data.firstName || '');
  const [lastName, setLastName] = useState(data.lastName || '');
  const [bio, setBio] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, bio, avatar_url')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          if (profile.first_name) setFirstName(profile.first_name);
          if (profile.last_name) setLastName(profile.last_name);
          if (profile.bio) setBio(profile.bio);
          if (profile.avatar_url) setPreviewUrl(profile.avatar_url);
        }
      }
    };
    loadProfile();
  }, []);

  // Determine correct step navigation based on auth status and goal
  const getBackStep = () => {
    if (isAuthenticated) {
      return data.primaryGoal === 'weight_loss' ? 10 : 9;
    }
    return data.primaryGoal === 'weight_loss' ? 11 : 10;
  };

  const getNextStep = () => {
    if (isAuthenticated) {
      return data.primaryGoal === 'weight_loss' ? 12 : 11;
    }
    return data.primaryGoal === 'weight_loss' ? 13 : 12;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl;
      updateData({ avatarUrl });

      await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', user.id);

      toast.success('Photo uploaded!');
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleContinue = async () => {
    if (!firstName.trim()) {
      toast.error('Please enter your first name');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({
            first_name: firstName.trim(),
            last_name: lastName.trim() || null,
            bio: bio.trim() || null
          })
          .eq('user_id', user.id);
      }

      updateData({ 
        firstName: firstName.trim(), 
        lastName: lastName.trim() || undefined 
      });
      setCurrentStep(getNextStep());
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    }
  };

  const handleSkip = async () => {
    if (!firstName.trim()) {
      toast.error('First name is required');
      return;
    }
    await handleContinue();
  };

  const canContinue = firstName.trim().length > 0;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col min-h-screen"
    >
      <OnboardingProgress />
      
      <div className="flex-1 px-6 py-8 overflow-y-auto">
        <button 
          onClick={() => setCurrentStep(getBackStep())}
          className="flex items-center gap-1 text-muted-foreground mb-6 hover:text-foreground transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>

        <h1 className="text-2xl font-bold mb-2">Set up your profile</h1>
        <p className="text-muted-foreground mb-6">Add a photo and tell us about yourself.</p>

        <div className="flex flex-col items-center mb-8">
          {/* Photo preview / placeholder */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-32 h-32 mb-4"
          >
            {previewUrl || data.avatarUrl ? (
              <img
                src={previewUrl || data.avatarUrl}
                alt="Profile"
                className="w-full h-full rounded-full object-cover border-4 border-primary"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-muted border-4 border-dashed border-border flex items-center justify-center">
                <User size={48} className="text-muted-foreground" />
              </div>
            )}
            
            {isUploading && (
              <div className="absolute inset-0 rounded-full bg-background/80 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            )}
          </motion.div>

          {/* Upload buttons */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload size={16} className="mr-2" />
              Upload
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.setAttribute('capture', 'user');
                  fileInputRef.current.click();
                  fileInputRef.current.removeAttribute('capture');
                }
              }}
              disabled={isUploading}
            >
              <Camera size={16} className="mr-2" />
              Camera
            </Button>
          </div>
        </div>

        {/* Name Fields */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              First Name <span className="text-destructive">*</span>
            </label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your first name"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground mt-1">
              This is public and visible to everyone on your profile.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Last Name <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter your last name"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Only visible to your friends.
            </p>
          </div>
        </div>

        {/* Bio Field */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Bio <span className="text-muted-foreground">(optional)</span>
          </label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 150))}
            placeholder="Tell us a bit about yourself..."
            className="resize-none"
            rows={3}
          />
          <p className="text-xs text-muted-foreground mt-1 flex justify-between">
            <span>Visible to everyone.</span>
            <span>{bio.length}/150</span>
          </p>
        </div>
      </div>

      <div className="px-6 pb-8 space-y-3">
        <Button 
          size="xl" 
          className="w-full"
          onClick={handleContinue}
          disabled={!canContinue}
        >
          Continue
        </Button>
        <Button 
          variant="ghost" 
          size="lg" 
          className="w-full"
          onClick={handleSkip}
          disabled={!canContinue}
        >
          Skip photo for now
        </Button>
      </div>
    </motion.div>
  );
}
