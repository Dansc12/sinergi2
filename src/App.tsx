import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import HomePage from "./pages/HomePage";
import DailyLogPage from "./pages/DailyLogPage";
import DiscoverPage from "./pages/DiscoverPage";
import MessagesPage from "./pages/MessagesPage";
import ProfilePage from "./pages/ProfilePage";
import CreateWorkoutPage from "./pages/CreateWorkoutPage";
import CreateMealPage from "./pages/CreateMealPage";
import CreatePostPage from "./pages/CreatePostPage";
import CreateGroupPage from "./pages/CreateGroupPage";
import CreateRecipePage from "./pages/CreateRecipePage";
import CreateRoutinePage from "./pages/CreateRoutinePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => (
  <AppLayout>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/daily-log" element={<DailyLogPage />} />
      <Route path="/discover" element={<DiscoverPage />} />
      <Route path="/messages" element={<MessagesPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/create/workout" element={<CreateWorkoutPage />} />
      <Route path="/create/meal" element={<CreateMealPage />} />
      <Route path="/create/post" element={<CreatePostPage />} />
      <Route path="/create/group" element={<CreateGroupPage />} />
      <Route path="/create/recipe" element={<CreateRecipePage />} />
      <Route path="/create/routine" element={<CreateRoutinePage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </AppLayout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
