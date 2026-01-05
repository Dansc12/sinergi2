import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Dumbbell, Lightbulb, Loader2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const actions = [
  { id: 'meal', label: 'Log a meal', icon: UtensilsCrossed, description: 'What did you eat today?' },
  { id: 'workout', label: 'Log a workout', icon: Dumbbell, description: 'Any movement counts!' },
  { id: 'post', label: 'Share a thought', icon: Lightbulb, description: 'Introduce yourself or share a goal' },
] as const;

export function FirstWinScreen() {
  const { data, updateData } = useOnboarding();
  const navigate = useNavigate();
  const [selectedAction, setSelectedAction] = useState<typeof actions[number]['id'] | ''>('');
  const [postContent, setPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSelectAction = (actionId: typeof actions[number]['id']) => {
    setSelectedAction(actionId);
    updateData({ firstWinType: actionId });
  };

  const handleComplete = async () => {
    if (!selectedAction) return;

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (selectedAction === 'post' && postContent.trim()) {
        // Create a simple text post
        await supabase.from('posts').insert({
          user_id: user.id,
          content_type: 'post',
          content_data: { text: postContent },
          description: postContent,
          visibility: 'friends',
        });
      }

      // Mark onboarding as complete
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('user_id', user.id);

      setIsComplete(true);
      toast.success('Welcome to Sinergi! 🎉');

      // Navigate to appropriate page after short delay
      setTimeout(() => {
        if (selectedAction === 'meal') {
          navigate('/daily-log?tab=nutrition');
        } else if (selectedAction === 'workout') {
          navigate('/daily-log?tab=fitness');
        } else {
          navigate('/');
        }
      }, 1500);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Something went wrong');
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col min-h-screen items-center justify-center px-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-6"
        >
          <Check className="w-12 h-12 text-green-500" />
        </motion.div>
        <h1 className="text-2xl font-bold mb-2">You're all set!</h1>
        <p className="text-muted-foreground">Taking you to the app...</p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col min-h-screen"
    >
      <div className="flex-1 px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">One quick thing to get started</h1>
          <p className="text-muted-foreground">
            Do one action to complete your setup
          </p>
        </div>

        <div className="space-y-4">
          {actions.map((action, index) => {
            const Icon = action.icon;
            const isSelected = selectedAction === action.id;
            
            return (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleSelectAction(action.id)}
                className={cn(
                  "w-full p-5 rounded-2xl border-2 text-left transition-all",
                  isSelected 
                    ? "border-primary bg-primary/10" 
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center",
                    isSelected ? "bg-primary/20" : "bg-muted"
                  )}>
                    <Icon size={28} className={isSelected ? "text-primary" : "text-muted-foreground"} />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{action.label}</p>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Post content input */}
        {selectedAction === 'post' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6"
          >
            <Textarea
              placeholder="What's on your mind? Share a goal, introduce yourself, or anything else..."
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="min-h-[120px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right mt-1">
              {postContent.length}/500
            </p>
          </motion.div>
        )}
      </div>

      <div className="px-6 pb-8">
        <Button 
          size="xl" 
          className="w-full"
          disabled={!selectedAction || isSubmitting || (selectedAction === 'post' && !postContent.trim())}
          onClick={handleComplete}
        >
          {isSubmitting ? (
            <Loader2 size={20} className="animate-spin" />
          ) : selectedAction === 'meal' ? (
            "Go log a meal"
          ) : selectedAction === 'workout' ? (
            "Go log a workout"
          ) : selectedAction === 'post' ? (
            "Share post & finish"
          ) : (
            "Continue"
          )}
        </Button>
      </div>
    </motion.div>
  );
}
