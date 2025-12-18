import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Users, Camera, Loader2, MessageCircle, UserPlus, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { ProfileContentFeed } from "@/components/profile/ProfileContentFeed";
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
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-4">
            <Avatar className="w-24 h-24 border-4 border-primary/30">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-2xl bg-muted">
                <Camera size={32} className="text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
          </div>
          
          <h2 className="text-2xl font-bold mb-1">{fullName}</h2>
          {profile.username && (
            <p className="text-muted-foreground text-sm mb-1">@{profile.username}</p>
          )}
          {userBio && <p className="text-muted-foreground text-sm mb-2">{userBio}</p>}
          
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

          {/* Interests */}
          {interests.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {interests.map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-6 w-full justify-center">
            <div className="bg-card border border-border rounded-xl px-6 py-4 text-center">
              <p className="text-2xl font-bold">{stats.meals}</p>
              <p className="text-xs text-muted-foreground">Meals</p>
            </div>
            <div className="bg-card border border-border rounded-xl px-6 py-4 text-center">
              <p className="text-2xl font-bold">{stats.days}</p>
              <p className="text-xs text-muted-foreground">Days</p>
            </div>
            <div className="bg-card border border-border rounded-xl px-6 py-4 text-center">
              <p className="text-2xl font-bold">{stats.workouts}</p>
              <p className="text-xs text-muted-foreground">Workouts</p>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="border-b border-border mb-4">
          <div className="flex overflow-x-auto hide-scrollbar -mx-4 px-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative",
                  activeTab === tab.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Feed - Show based on friendship */}
        <div className="grid grid-cols-3 gap-1">
          <ProfileContentFeed
            contentType={activeTab}
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
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
