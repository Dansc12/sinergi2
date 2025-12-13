import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Settings, Flame, Users, Camera, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ContentTab = "posts" | "workouts" | "meals" | "recipes" | "routines" | "groups";

const tabs: { id: ContentTab; label: string }[] = [
  { id: "posts", label: "Posts" },
  { id: "workouts", label: "Workouts" },
  { id: "meals", label: "Meals" },
  { id: "recipes", label: "Recipes" },
  { id: "routines", label: "Routines" },
  { id: "groups", label: "Groups" },
];

// Empty content - will be populated with real user data
const userContent: Record<ContentTab, string[]> = {
  posts: [],
  workouts: [],
  meals: [],
  recipes: [],
  routines: [],
  groups: [],
};

const EmptyTabState = ({ tab, onAction }: { tab: ContentTab; onAction: () => void }) => {
  const messages: Record<ContentTab, { title: string; description: string; action: string }> = {
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

  const { title, description, action } = messages[tab];

  return (
    <div className="col-span-3 py-12 text-center flex flex-col items-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Plus size={24} className="text-muted-foreground" />
      </div>
      <p className="font-medium mb-1">{title}</p>
      <p className="text-sm text-muted-foreground mb-4 max-w-[200px]">{description}</p>
      <Button size="sm" variant="outline" onClick={onAction}>
        {action}
      </Button>
    </div>
  );
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ContentTab>("posts");

  // These will come from user profile data
  const userName = "Your Name";
  const userBio = "Add a bio to tell others about yourself";
  const avatarUrl = undefined;
  const streakCount = 0;
  const friendsCount = 0;
  const interests: string[] = [];
  
  // Stats will come from real data
  const stats = [
    { value: "0", label: "Meals" },
    { value: "0", label: "Days" },
    { value: "0", label: "Workouts" },
  ];

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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-elevated px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </Button>
        <h1 className="font-semibold">Profile</h1>
        <Button variant="ghost" size="icon-sm">
          <Settings size={20} />
        </Button>
      </header>

      <div className="px-4 py-6 animate-fade-in">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-4">
            <Avatar className="w-24 h-24 border-4 border-primary/30">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-2xl bg-muted">
                <Camera size={32} className="text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            {streakCount > 0 && (
              <div className="absolute -top-1 -right-1 flex items-center gap-0.5 bg-streak text-primary-foreground px-2 py-1 rounded-full text-sm font-bold shadow-lg">
                <Flame size={14} />
                <span>{streakCount}</span>
              </div>
            )}
          </div>
          
          <h2 className="text-2xl font-bold mb-1">{userName}</h2>
          <p className="text-muted-foreground text-sm mb-2">{userBio}</p>
          
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
            <Users size={14} />
            <span>{friendsCount} friends</span>
          </div>

          {/* Interests */}
          {interests.length > 0 ? (
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
          ) : (
            <p className="text-sm text-muted-foreground mb-6">Complete onboarding to add your interests</p>
          )}

          {/* Stats */}
          <div className="flex gap-6 w-full justify-center">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-card border border-border rounded-xl px-6 py-4 text-center">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
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

        {/* Content Grid */}
        <div className="grid grid-cols-3 gap-1">
          {userContent[activeTab].length > 0 ? (
            userContent[activeTab].map((image, index) => (
              <div key={index} className="aspect-square">
                <img
                  src={image}
                  alt={`${activeTab} ${index + 1}`}
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
            ))
          ) : (
            <EmptyTabState tab={activeTab} onAction={() => handleTabAction(activeTab)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
