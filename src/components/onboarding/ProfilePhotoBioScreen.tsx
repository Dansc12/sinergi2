import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingProgress } from './OnboardingProgress';
import { motion } from 'framer-motion';
import { ChevronLeft, Camera, User, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function ProfilePhotoBioScreen() {
  const { data, updateData, goBack, setCurrentStep } = useOnboarding();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      updateData({ avatarUrl: urlData.publicUrl });
      toast.success('Photo uploaded!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleContinue = async () => {
    // Save progress
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({
          avatar_url: data.avatarUrl || null,
          bio: data.bio || null,
        })
        .eq('user_id', user.id);
    }
    setCurrentStep('units_age');
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
          onClick={goBack}
          className="flex items-center gap-1 text-muted-foreground mb-6 hover:text-foreground transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>

        <h1 className="text-2xl font-bold mb-2">Add a photo & bio</h1>
        <p className="text-muted-foreground mb-8">Optional, but it helps others recognize you</p>

        <div className="space-y-8">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={cn(
                "relative w-32 h-32 rounded-full overflow-hidden",
                "border-2 border-dashed border-border hover:border-primary transition-colors",
                "flex items-center justify-center bg-muted"
              )}
            >
              {isUploading ? (
                <Loader2 size={32} className="animate-spin text-muted-foreground" />
              ) : data.avatarUrl ? (
                <img 
                  src={data.avatarUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={48} className="text-muted-foreground" />
              )}
              <div className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Camera size={18} className="text-primary-foreground" />
              </div>
            </button>
            <p className="text-sm text-muted-foreground mt-3">Tap to add a photo</p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us a bit about yourself..."
              value={data.bio}
              onChange={(e) => updateData({ bio: e.target.value })}
              className="min-h-[100px] resize-none"
              maxLength={160}
            />
            <p className="text-xs text-muted-foreground text-right">
              {data.bio.length}/160
            </p>
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
          onClick={handleContinue}
        >
          Skip for now
        </Button>
      </div>
    </motion.div>
  );
}
