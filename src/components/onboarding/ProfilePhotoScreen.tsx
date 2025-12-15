import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine correct step navigation based on auth status and goal
  // Profile Photo comes after FriendSuggestions, before Completion
  const getBackStep = () => {
    if (isAuthenticated) {
      return data.primaryGoal === 'weight_loss' ? 10 : 9; // FriendSuggestions step
    }
    return data.primaryGoal === 'weight_loss' ? 11 : 10; // FriendSuggestions step
  };

  const getNextStep = () => {
    if (isAuthenticated) {
      return data.primaryGoal === 'weight_loss' ? 12 : 11; // Completion step
    }
    return data.primaryGoal === 'weight_loss' ? 13 : 12; // Completion step
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to Supabase Storage
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

      // Update profile with avatar URL
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

  const handleContinue = () => {
    setCurrentStep(getNextStep());
  };

  const handleSkip = () => {
    setCurrentStep(getNextStep());
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col min-h-screen"
    >
      <OnboardingProgress />
      
      <div className="flex-1 px-6 py-8">
        <button 
          onClick={() => setCurrentStep(getBackStep())}
          className="flex items-center gap-1 text-muted-foreground mb-6 hover:text-foreground transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>

        <h1 className="text-2xl font-bold mb-2">Add a profile photo</h1>
        <p className="text-muted-foreground mb-8">Help your friends recognize you in the community.</p>

        <div className="flex flex-col items-center">
          {/* Photo preview / placeholder */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-40 h-40 mb-8"
          >
            {previewUrl || data.avatarUrl ? (
              <img
                src={previewUrl || data.avatarUrl}
                alt="Profile"
                className="w-full h-full rounded-full object-cover border-4 border-primary"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-muted border-4 border-dashed border-border flex items-center justify-center">
                <User size={64} className="text-muted-foreground" />
              </div>
            )}
            
            {isUploading && (
              <div className="absolute inset-0 rounded-full bg-background/80 flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-primary" />
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

          <div className="flex gap-3 w-full max-w-xs">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload size={20} className="mr-2" />
              Upload
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => {
                // For mobile camera
                if (fileInputRef.current) {
                  fileInputRef.current.setAttribute('capture', 'user');
                  fileInputRef.current.click();
                  fileInputRef.current.removeAttribute('capture');
                }
              }}
              disabled={isUploading}
            >
              <Camera size={20} className="mr-2" />
              Camera
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-8 space-y-3">
        <Button 
          size="xl" 
          className="w-full"
          onClick={handleContinue}
        >
          Continue
        </Button>
        <Button 
          variant="ghost" 
          size="lg" 
          className="w-full"
          onClick={handleSkip}
        >
          Skip for now
        </Button>
      </div>
    </motion.div>
  );
}
