import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Users, Camera, Loader2, MessageCircle, UserPlus, Check, Flame, ChevronDown } from "lucide-react";
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
import { ProfilePostsGrid } from "@/components/profile/ProfilePostsGrid";
import { useFriendship } from "@/hooks/useFriendship";

type ContentTab = "posts" | "workouts" | "meals" | "recipes" | "routines";

const tabs: { id: ContentTab; label: string }[] = [
  { id: "posts", label: "Posts" },
  { id: "workouts", label: "Workouts" },
  { id: "meals", label: "Meals" },
  { id: "recipes", label: "Recipes" },
  { id: "routines", label: "Routines" },
];

interface UserProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  hobbies: string[] | null;
}

const UserProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ContentTab>("posts");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friendsCount, setFriendsCount] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [stats, setStats] = useState({ meals: 0, days: 0, workouts: 0 });
  
  const { status, isFriend, sendFriendRequest, acceptFriendRequest, currentUserId } = useFriendship(userId || null);
  const isOwnProfile = currentUserId === userId;

  useEffect(() => {
    if (isOwnProfile) {
      navigate('/profile', { replace: true });
      return;
    }
    fetchProfileData();
  }, [userId, isOwnProfile]);

  const fetchProfileData = async () => {
    if (!userId) return;

    try {
      // Fetch profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, username, bio, avatar_url, hobbies')
        .eq('user_id', userId)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch streak data
      const { data: streakData } = await supabase
        .from('user_streaks')
        .select('current_streak')
        .eq('user_id', userId)
        .single();

      if (streakData) {
        setStreakCount(streakData.current_streak);
      }

      // Fetch friends count
      const { count: friendsAccepted } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq('status', 'accepted');

      setFriendsCount(friendsAccepted || 0);

      // Fetch stats using database function that bypasses RLS for counting
      const { data: statsData } = await supabase
        .rpc('get_user_stats', { target_user_id: userId });

      if (statsData) {
        const stats = statsData as { meals: number; days: number; workouts: number };
        setStats({
          meals: stats.meals || 0,
          days: stats.days || 0,
          workouts: stats.workouts || 0
        });
      }

    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = () => {
    navigate(`/messages?dm=${userId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">User not found</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const displayName = profile.first_name || "User";
  const fullName = isFriend && profile.last_name 
    ? `${profile.first_name} ${profile.last_name}` 
    : displayName;
  const userBio = profile.bio || "";
  const avatarUrl = profile.avatar_url;
  const interests = profile.hobbies || [];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-elevated px-4 py-3 flex items-center">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </Button>
        <h1 className="font-semibold ml-2">
          {profile.username ? `@${profile.username}` : 'Profile'}
        </h1>
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
              <h2 className="text-xl font-bold">{fullName}</h2>
              {profile.username && (
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
          {userBio && <p className="text-muted-foreground text-sm mb-4">{userBio}</p>}
          
          {/* Friend Status / Actions */}
          <div className="flex items-center gap-3 mb-4">
            {isFriend ? (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users size={14} />
                <span>{friendsCount} friends</span>
              </div>
            ) : status === 'none' ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={sendFriendRequest}
                className="gap-1"
              >
                <UserPlus size={16} />
                Send Friend Request
              </Button>
            ) : status === 'pending_sent' ? (
              <Button variant="outline" size="sm" disabled className="gap-1">
                <Check size={16} />
                Request Sent
              </Button>
            ) : status === 'pending_received' ? (
              <Button 
                size="sm" 
                onClick={acceptFriendRequest}
                className="gap-1"
              >
                <Check size={16} />
                Accept Request
              </Button>
            ) : null}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleMessage}
              className="gap-1"
            >
              <MessageCircle size={16} />
              Message
            </Button>
          </div>
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

        {/* Content Feed - Show based on friendship */}
        <div className="grid grid-cols-2 gap-1">
          {activeTab === "posts" ? (
            <ProfilePostsGrid
              userId={userId}
              emptyState={{
                title: "No posts yet",
                description: isFriend 
                  ? `${displayName} hasn't shared any posts yet`
                  : `${displayName} hasn't shared any public posts yet`,
                action: ""
              }}
            />
          ) : (
            <ProfileContentFeed
              contentType={activeTab as "workouts" | "meals" | "recipes" | "routines"}
              userId={userId}
              visibility={isFriend ? 'friends' : 'public'}
              emptyState={{
                title: `No ${activeTab} yet`,
                description: isFriend 
                  ? `${displayName} hasn't shared any ${activeTab} yet`
                  : `${displayName} hasn't shared any public ${activeTab} yet`,
                action: ""
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
