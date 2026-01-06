import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Settings, Flame, Camera, Loader2, BookOpen } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ProfilePostsGrid } from "@/components/profile/ProfilePostsGrid";
import { ProfileSettingsSheet } from "@/components/profile/ProfileSettingsSheet";

interface UserProfile {
  display_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  hobbies: string[] | null;
}

const postsEmptyState = { 
  title: "No posts yet", 
  description: "Share your fitness journey with the community", 
  action: "Create Post" 
};


const ProfilePage = () => {
  const navigate = useNavigate();
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
        .select('display_name, first_name, last_name, username, bio, avatar_url, hobbies')
        .eq('user_id', user.id)
        .single();

      // Auto-populate display_name from first/last name if not set
      if (profileData && !profileData.display_name && (profileData.first_name || profileData.last_name)) {
        const autoDisplayName = [profileData.first_name, profileData.last_name].filter(Boolean).join(' ');
        await supabase
          .from('profiles')
          .update({ display_name: autoDisplayName })
          .eq('user_id', user.id);
        profileData.display_name = autoDisplayName;
      }

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch streak data
      const { data: streakData } = await supabase
        .from('user_streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .maybeSingle();

      setStreakCount(streakData?.current_streak || 0);


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

  const handleCreatePost = () => {
    navigate("/share");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = profile?.display_name || "Your Name";
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
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate("/diary")}>
            <BookOpen size={20} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setSettingsOpen(true)}>
            <Settings size={20} />
          </Button>
        </div>
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
              <div className="flex gap-8">
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
          <p className="text-muted-foreground text-sm mb-4 whitespace-pre-line">{userBio}</p>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-2 gap-1">
          <ProfilePostsGrid
            onEmptyAction={handleCreatePost}
            emptyState={postsEmptyState}
          />
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
