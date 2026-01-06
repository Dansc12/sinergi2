import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingProgress } from './OnboardingProgress';
import { motion } from 'framer-motion';
import { ChevronLeft, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const HOBBY_SUGGESTIONS = [
  'Running', 'Yoga', 'Weightlifting', 'Cycling', 'Swimming',
  'Hiking', 'Basketball', 'Soccer', 'Tennis', 'Dance',
  'Martial Arts', 'Pilates', 'CrossFit', 'Rock Climbing', 'Skiing',
  'Cooking', 'Meal Prep', 'Nutrition', 'Meditation', 'Walking'
];

export function HobbiesScreen() {
  const { data, updateData, goBack, setCurrentStep } = useOnboarding();
  const [selected, setSelected] = useState<string[]>(data.interests || []);
  const [customInput, setCustomInput] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleHobby = (hobby: string) => {
    setSelected(prev => 
      prev.includes(hobby) 
        ? prev.filter(h => h !== hobby)
        : [...prev, hobby]
    );
  };

  const addCustomHobby = () => {
    const trimmed = customInput.trim();
    if (trimmed && !selected.includes(trimmed)) {
      setSelected(prev => [...prev, trimmed]);
      setCustomInput('');
    }
  };

  const removeHobby = (hobby: string) => {
    setSelected(prev => prev.filter(h => h !== hobby));
  };

  const handleContinue = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase
        .from('profiles')
        .update({ hobbies: selected })
        .eq('user_id', user.id);

      updateData({ interests: selected });
      setCurrentStep('join_groups');
    } catch (error) {
      console.error('Error saving hobbies:', error);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    setCurrentStep('join_groups');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-screen"
    >
      <OnboardingProgress />
      
      <div className="flex-1 overflow-y-auto px-6 py-8 pb-36">
        <button 
          onClick={goBack}
          className="flex items-center gap-1 text-muted-foreground mb-6 hover:text-foreground transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>

        <h1 className="text-2xl font-bold mb-2">Your interests</h1>
        <p className="text-muted-foreground mb-6">
          Most people pick 3–5. This helps us personalize your experience.
        </p>

        {/* Selected hobbies */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {selected.map(hobby => (
              <motion.div
                key={hobby}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm"
              >
                <span>{hobby}</span>
                <button onClick={() => removeHobby(hobby)} className="hover:opacity-70">
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Custom input */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomHobby()}
            placeholder="Add your own..."
            className="flex-1 px-4 py-2 rounded-xl border border-border bg-background text-sm"
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={addCustomHobby}
            disabled={!customInput.trim()}
          >
            Add
          </Button>
        </div>

        {/* Suggestions */}
        <div className="flex flex-wrap gap-2">
          {HOBBY_SUGGESTIONS.filter(h => !selected.includes(h)).map((hobby, index) => (
            <motion.button
              key={hobby}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              onClick={() => toggleHobby(hobby)}
              className={cn(
                "px-4 py-2 rounded-full border transition-all text-sm",
                "border-border bg-card hover:border-primary hover:bg-primary/5"
              )}
            >
              {hobby}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Sticky buttons */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="space-y-3">
          <Button 
            size="xl" 
            className="w-full"
            onClick={handleContinue}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Continue'}
          </Button>
          <Button 
            variant="ghost" 
            size="lg" 
            className="w-full"
            onClick={handleSkip}
            disabled={saving}
          >
            Skip for now
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
