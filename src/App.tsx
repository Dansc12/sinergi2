import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PostDetailProvider } from "@/contexts/PostDetailContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ensureProfile } from "@/lib/ensureProfile";
import { useEffect, useState, lazy, Suspense } from "react";

// Critical pages loaded eagerly
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import NotFound from "./pages/NotFound";

// Lazy load non-critical pages
const DailyLogPage = lazy(() => import("./pages/DailyLogPage"));
const DiscoverPage = lazy(() => import("./pages/DiscoverPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const CreateWorkoutPage = lazy(() => import("./pages/CreateWorkoutPage"));
const CreateMealPage = lazy(() => import("./pages/CreateMealPage"));
const CreateSavedMealPage = lazy(() => import("./pages/CreateSavedMealPage"));
const CreatePostPage = lazy(() => import("./pages/CreatePostPage"));
const CreateGroupPage = lazy(() => import("./pages/CreateGroupPage"));
const CreateRecipePage = lazy(() => import("./pages/CreateRecipePage"));
const CreateRoutinePage = lazy(() => import("./pages/CreateRoutinePage"));
const SharePostScreen = lazy(() => import("./pages/SharePostScreen"));
const SelectContentPage = lazy(() => import("./pages/SelectContentPage"));
const MySavedPage = lazy(() => import("./pages/MySavedPage"));
const DiscoverWorkoutsPage = lazy(() => import("./pages/DiscoverWorkoutsPage"));
const MyRecipesPage = lazy(() => import("./pages/MyRecipesPage"));
const DiscoverMealsPage = lazy(() => import("./pages/DiscoverMealsPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const DiaryPage = lazy(() => import("./pages/DiaryPage"));
const DirectShareSelectionPage = lazy(() => import("./pages/DirectShareSelectionPage"));

const queryClient = new QueryClient();

// Loading spinner for lazy-loaded pages
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

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

      const profile = await ensureProfile(user);
      setOnboardingComplete(profile.onboarding_completed);
      setCheckingOnboarding(false);
    };

    if (!isLoading) {
      checkOnboarding();
    }
  }, [user, isLoading]);

  if (isLoading || checkingOnboarding) {
    return <PageLoader />;
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
    return <PageLoader />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
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
                <Suspense fallback={<PageLoader />}>
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
                </Suspense>
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <PostDetailProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </PostDetailProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
