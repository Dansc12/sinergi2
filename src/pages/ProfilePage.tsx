import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Settings, Flame, Camera, Loader2, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { ProfileContentFeed } from "@/components/profile/ProfileContentFeed";
import { ProfileGroupsFeed } from "@/components/profile/ProfileGroupsFeed";
import { ProfileSettingsSheet } from "@/components/profile/ProfileSettingsSheet";

type ContentTab = "posts" | "workouts" | "meals" | "recipes" | "routines" | "groups";

const tabs: { id: ContentTab; label: string }[] = [
  { id: "posts", label: "Posts" },
  { id: "workouts", label: "Workouts" },
  { id: "meals", label: "Meals" },
  { id: "recipes", label: "Recipes" },
  { id: "routines", label: "Routines" },
  { id: "groups", label: "Groups" },
];

interface UserProfile {
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  hobbies: string[] | null;
}

const emptyStateMessages: Record<ContentTab, { title: string; description: string; action: string }> = {
  posts: { 
    title: "No posts yet", 
    description: "Share your fitness journey with the community", 
    action: "Create Post" 
  },
  workouts: { 
    title: "No workouts logged", 
    description: "Start tracking your training progress", 
    action: "Log Workout" 
  },
  meals: { 
    title: "No meals logged", 
    description: "Track your nutrition to reach your goals", 
    action: "Log Meal" 
  },
  recipes: { 
    title: "No recipes created", 
    description: "Save and share your favorite healthy recipes", 
    action: "Create Recipe" 
  },
  routines: { 
    title: "No routines created", 
    description: "Build workout routines to stay consistent", 
    action: "Create Routine" 
  },
  groups: { 
    title: "No groups joined", 
    description: "Join groups to connect with like-minded people", 
    action: "Find Groups" 
  },
};


const ProfilePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ContentTab>("posts");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [streakCount, setStreakCount] = useState(0);
  
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [stats, setStats] = useState({
    meals: 0,
    days: 0,
    workouts: 0
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Fetch profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name, username, bio, avatar_url, hobbies')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch streak data
      const { data: streakData } = await supabase
        .from('user_streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .single();

      if (streakData) {
        setStreakCount(streakData.current_streak);
      }


      // Fetch stats
      const { count: mealsCount } = await supabase
        .from('meal_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: workoutsCount } = await supabase
        .from('workout_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Calculate days since first activity
      const { data: firstMeal } = await supabase
        .from('meal_logs')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      const { data: firstWorkout } = await supabase
        .from('workout_logs')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      let daysActive = 0;
      const dates = [firstMeal?.created_at, firstWorkout?.created_at].filter(Boolean);
      if (dates.length > 0) {
        const earliest = new Date(Math.min(...dates.map(d => new Date(d!).getTime())));
        daysActive = Math.floor((Date.now() - earliest.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }

      setStats({
        meals: mealsCount || 0,
        days: daysActive,
        workouts: workoutsCount || 0
      });

    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabAction = (tab: ContentTab) => {
    const routes: Record<ContentTab, string> = {
      posts: "/share",
      workouts: "/create/workout",
      meals: "/create/meal",
      recipes: "/create/recipe",
      routines: "/create/routine",
      groups: "/discover",
    };
    navigate(routes[tab]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = profile?.last_name 
    ? `${profile.first_name} ${profile.last_name}` 
    : (profile?.first_name || "Your Name");
  const userBio = profile?.bio || "Add a bio to tell others about yourself";
  const avatarUrl = profile?.avatar_url;
  const interests = profile?.hobbies || [];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-elevated px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </Button>
        <h1 className="font-semibold">Profile</h1>
        <Button variant="ghost" size="icon-sm" onClick={() => setSettingsOpen(true)}>
          <Settings size={20} />
        </Button>
      </header>

      <div className="px-4 py-6 animate-fade-in">
        {/* Profile Header - Horizontal Layout */}
        <div className="mb-6">
          {/* Top Row: Avatar + Name/Username/Stats */}
          <div className="flex items-start gap-4 mb-4">
            <Avatar className="w-24 h-24 flex-shrink-0">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-2xl bg-muted">
                <Camera size={32} className="text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col justify-start flex-1">
              <h2 className="text-xl font-bold">{displayName}</h2>
              {profile?.username && (
                <p className="text-muted-foreground text-sm mb-2">@{profile.username}</p>
              )}
              
              {/* Stats - Instagram style */}
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-base font-bold">{stats.meals}</p>
                  <p className="text-xs text-muted-foreground">Meals</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold">{stats.days}</p>
                  <p className="text-xs text-muted-foreground">Days</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold">{stats.workouts}</p>
                  <p className="text-xs text-muted-foreground">Workouts</p>
                </div>
              </div>
            </div>
          </div>

          {/* Streak Badge + Hobbies Row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-24 flex items-center justify-center gap-1 bg-streak text-primary-foreground px-3 py-1 rounded-full text-sm font-bold shadow-md flex-shrink-0">
              <Flame size={14} />
              <span>{streakCount}</span>
            </div>
            
            {interests.length > 0 && (
              <div className="relative flex-1 min-w-0 overflow-hidden h-6">
                <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-1 h-full">
                  {interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bio */}
          <p className="text-muted-foreground text-sm mb-4">{userBio}</p>
        </div>

        {/* Content Type Selector */}
        <div className="mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between text-base font-medium"
              >
                {tabs.find(t => t.id === activeTab)?.label}
                <ChevronDown size={18} className="text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[calc(100vw-2rem)] bg-card border border-border">
              {tabs.map((tab) => (
                <DropdownMenuItem
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "text-base py-3 cursor-pointer",
                    activeTab === tab.id && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  {tab.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content Feed */}
        <div className="grid grid-cols-3 gap-1">
          {activeTab !== "groups" ? (
            <ProfileContentFeed
              contentType={activeTab as "posts" | "workouts" | "meals" | "recipes" | "routines"}
              onEmptyAction={() => handleTabAction(activeTab)}
              emptyState={emptyStateMessages[activeTab]}
            />
          ) : (
            <ProfileGroupsFeed
              onEmptyAction={() => handleTabAction(activeTab)}
              emptyState={emptyStateMessages[activeTab]}
            />
          )}
        </div>
      </div>

      {/* Settings Sheet */}
      <ProfileSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        profile={profile}
        onSave={fetchProfileData}
      />
    </div>
  );
};

export default ProfilePage;
