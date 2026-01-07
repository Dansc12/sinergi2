import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PostDetailProvider } from "@/contexts/PostDetailContext";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import HomePage from "./pages/HomePage";
import DailyLogPage from "./pages/DailyLogPage";
import DiscoverPage from "./pages/DiscoverPage";
import MessagesPage from "./pages/MessagesPage";
import ProfilePage from "./pages/ProfilePage";
import UserProfilePage from "./pages/UserProfilePage";
import CreateWorkoutPage from "./pages/CreateWorkoutPage";
import CreateMealPage from "./pages/CreateMealPage";
import CreateSavedMealPage from "./pages/CreateSavedMealPage";
import CreatePostPage from "./pages/CreatePostPage";
import CreateGroupPage from "./pages/CreateGroupPage";
import CreateRecipePage from "./pages/CreateRecipePage";
import CreateRoutinePage from "./pages/CreateRoutinePage";
import SharePostScreen from "./pages/SharePostScreen";
import SelectContentPage from "./pages/SelectContentPage";
import MySavedPage from "./pages/MySavedPage";
import DiscoverWorkoutsPage from "./pages/DiscoverWorkoutsPage";
import MyRecipesPage from "./pages/MyRecipesPage";
import DiscoverMealsPage from "./pages/DiscoverMealsPage";
import OnboardingPage from "./pages/OnboardingPage";
import AuthPage from "./pages/AuthPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import DiaryPage from "./pages/DiaryPage";
import DirectShareSelectionPage from "./pages/DirectShareSelectionPage";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) {
        setCheckingOnboarding(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();

      setOnboardingComplete(profile?.onboarding_completed ?? false);
      setCheckingOnboarding(false);
    };

    if (!isLoading) {
      checkOnboarding();
    }
  }, [user, isLoading]);

  if (isLoading || checkingOnboarding) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Don't block the dedicated OAuth callback route while auth is still initializing.
  if (isLoading && location.pathname !== "/auth/callback") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route
        path="/auth"
        element={
          isLoading ? <AuthPage /> : user ? <Navigate to="/" replace /> : <AuthPage />
        }
      />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/daily-log" element={<DailyLogPage />} />
                <Route path="/discover" element={<DiscoverPage />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/user/:userId" element={<UserProfilePage />} />
                <Route path="/create/workout" element={<CreateWorkoutPage />} />
                <Route path="/create/meal" element={<CreateMealPage />} />
                <Route path="/create/saved-meal" element={<CreateSavedMealPage />} />
                <Route path="/create/post" element={<CreatePostPage />} />
                <Route path="/create/group" element={<CreateGroupPage />} />
                <Route path="/create/recipe" element={<CreateRecipePage />} />
                <Route path="/create/routine" element={<CreateRoutinePage />} />
                <Route path="/share" element={<SharePostScreen />} />
                <Route path="/select-content" element={<SelectContentPage />} />
                <Route path="/workout/my-saved" element={<MySavedPage />} />
                <Route path="/workout/discover" element={<DiscoverWorkoutsPage />} />
                <Route path="/meal/my-recipes" element={<MyRecipesPage />} />
                <Route path="/meal/discover" element={<DiscoverMealsPage />} />
                <Route path="/diary" element={<DiaryPage />} />
                <Route path="/direct-share" element={<DirectShareSelectionPage />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PostDetailProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </PostDetailProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
