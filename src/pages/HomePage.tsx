import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { HomeHeader } from "@/components/home/HomeHeader";
import { ProgressCharts } from "@/components/home/ProgressCharts";
import { TasksSection } from "@/components/home/TasksSection";
import { useUserData } from "@/hooks/useUserData";
import CreationCongratsPopup from "@/components/CreationCongratsPopup";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LocationState {
  showCongrats?: boolean;
  contentType?: "workout" | "meal" | "recipe" | "routine";
  contentData?: Record<string, unknown>;
  images?: string[];
  canShare?: boolean;
}

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const { profile, streakCount, todaysTasks, isLoading } = useUserData();

  const [showCongratsPopup, setShowCongratsPopup] = useState(false);
  const [congratsContentType, setCongratsContentType] = useState<"workout" | "meal" | "recipe" | "routine">("workout");
  const [congratsData, setCongratsData] = useState<{ contentData?: Record<string, unknown>; images?: string[] }>({});
  const [canShareContent, setCanShareContent] = useState(true);
  const [showSaveAsMealDialog, setShowSaveAsMealDialog] = useState(false);
  const [hasMixedContent, setHasMixedContent] = useState(false);
  const [savedMealData, setSavedMealData] = useState<{ name: string; foods: unknown[] } | null>(null);

  useEffect(() => {
    if (state?.showCongrats && state?.contentType) {
      setCongratsContentType(state.contentType);
      setCongratsData({ contentData: state.contentData, images: state.images });
      setCanShareContent(state.canShare !== false);
      setShowCongratsPopup(true);
      // Clear the state so refresh doesn't show popup again
      window.history.replaceState({}, document.title);
    }
  }, [state]);

  const userName = profile?.first_name || "User";
  const avatarUrl = profile?.avatar_url || undefined;

  // Convert todaysTasks to a Set of completed task IDs
  const completedTasks = new Set<string>();
  if (todaysTasks.breakfast) completedTasks.add("breakfast");
  if (todaysTasks.lunch) completedTasks.add("lunch");
  if (todaysTasks.dinner) completedTasks.add("dinner");
  if (todaysTasks.workout) completedTasks.add("workout");
  if (todaysTasks.water) completedTasks.add("water");

  const handleCongratsPost = () => {
    setShowCongratsPopup(false);
    
    // Check if it's a meal and analyze the content
    if (congratsContentType === "meal") {
      const foods = (congratsData.contentData as { foods?: Array<{ savedMealGroupId?: string; savedMealName?: string }> })?.foods || [];
      const savedMealFoods = foods.filter(f => f.savedMealGroupId);
      const individualFoods = foods.filter(f => !f.savedMealGroupId);
      
      // Case 1: Only individual foods - can't share
      if (savedMealFoods.length === 0 && individualFoods.length > 0) {
        setHasMixedContent(false);
        setSavedMealData(null);
        setShowSaveAsMealDialog(true);
        return;
      }
      
      // Case 2: Mix of saved meal and individual foods
      if (savedMealFoods.length > 0 && individualFoods.length > 0) {
        setHasMixedContent(true);
        // Get the saved meal name from the first saved meal food
        const savedMealName = savedMealFoods[0]?.savedMealName || "Saved Meal";
        setSavedMealData({ name: savedMealName, foods: savedMealFoods });
        setShowSaveAsMealDialog(true);
        return;
      }
      
      // Case 3: Only saved meal foods - can share directly
    }
    
    navigate("/share", {
      state: {
        contentType: congratsContentType,
        contentData: congratsData.contentData || {},
        images: congratsData.images || [],
        returnTo: "/",
        fromSelection: true,
      },
    });
  };

  const handleShareSavedMealOnly = () => {
    setShowSaveAsMealDialog(false);
    
    if (savedMealData) {
      navigate("/share", {
        state: {
          contentType: congratsContentType,
          contentData: { 
            ...(congratsData.contentData || {}),
            foods: savedMealData.foods 
          },
          images: congratsData.images || [],
          returnTo: "/",
          fromSelection: true,
        },
      });
    }
  };

  const handleCongratsDismiss = () => {
    setShowCongratsPopup(false);
  };

  const handleSaveAsMeal = () => {
    setShowSaveAsMealDialog(false);
    // Navigate to create saved meal with the current foods
    navigate("/create/saved-meal", {
      state: {
        foods: (congratsData.contentData as { foods?: unknown[] })?.foods || [],
        mealType: (congratsData.contentData as { mealType?: string })?.mealType,
        photos: congratsData.images || [],
      },
    });
  };

  return (
    <div className="h-full overflow-y-auto overscroll-contain pb-24">
      <HomeHeader
        userName={userName}
        streakCount={streakCount}
        avatarUrl={avatarUrl}
        onProfileClick={() => navigate("/profile")}
      />

      <main className="animate-fade-in">
        <section aria-label="Your Progress">
          <ProgressCharts />
        </section>
        <section aria-label="Today's Tasks">
          <TasksSection completedTasks={completedTasks} />
        </section>
      </main>

      <CreationCongratsPopup
        isVisible={showCongratsPopup}
        contentType={congratsContentType}
        onDismiss={handleCongratsDismiss}
        onPost={handleCongratsPost}
      />

      {/* Save as Meal Dialog - handles both individual foods only and mixed content */}
      <Dialog open={showSaveAsMealDialog} onOpenChange={setShowSaveAsMealDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {hasMixedContent ? "Mixed Content Detected" : "Save as a Meal to Share"}
            </DialogTitle>
            <DialogDescription>
              {hasMixedContent 
                ? "You've logged items that are not part of a Saved Meal or Recipe. To share, you can create a new Saved Meal with all items, share only your Saved Meal/Recipe, or cancel."
                : "To share your meal with friends, you need to save it as a Meal first. Would you like to create a Saved Meal with these foods?"
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            {hasMixedContent ? (
              <>
                <Button onClick={handleSaveAsMeal} className="w-full">
                  Create New Saved Meal with All Items
                </Button>
                <Button variant="secondary" onClick={handleShareSavedMealOnly} className="w-full">
                  Share Only Saved Meal/Recipe
                </Button>
                <Button variant="outline" onClick={() => setShowSaveAsMealDialog(false)} className="w-full">
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleSaveAsMeal} className="w-full">
                  Save as Meal
                </Button>
                <Button variant="outline" onClick={() => setShowSaveAsMealDialog(false)} className="w-full">
                  Cancel
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HomePage;
