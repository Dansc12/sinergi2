import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Settings, Flame, Users } from "lucide-react";
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

const mockContent = {
  posts: [
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
    "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=400",
    "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400",
  ],
  workouts: [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400",
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400",
  ],
  meals: [
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400",
  ],
  recipes: [
    "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=400",
  ],
  routines: [
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
    "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=400",
  ],
  groups: [],
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ContentTab>("posts");

  const interests = ["Weightlifting", "Yoga", "Hiking", "Nutrition", "CrossFit"];
  const stats = [
    { value: "342", label: "Meals" },
    { value: "87", label: "Days" },
    { value: "156", label: "Workouts" },
  ];

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
              <AvatarImage src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200" />
              <AvatarFallback className="text-2xl">A</AvatarFallback>
            </Avatar>
            {/* Streak Badge */}
            <div className="absolute -top-1 -right-1 flex items-center gap-0.5 bg-streak text-primary-foreground px-2 py-1 rounded-full text-sm font-bold shadow-lg">
              <Flame size={14} />
              <span>12</span>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-1">Alex Thompson</h2>
          <p className="text-muted-foreground text-sm mb-2">Fitness enthusiast | NYC 🏙️</p>
          
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
            <Users size={14} />
            <span>248 friends</span>
          </div>

          {/* Interests */}
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
          {mockContent[activeTab].length > 0 ? (
            mockContent[activeTab].map((image, index) => (
              <div key={index} className="aspect-square">
                <img
                  src={image}
                  alt={`${activeTab} ${index + 1}`}
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
            ))
          ) : (
            <div className="col-span-3 py-12 text-center text-muted-foreground">
              <p>No {activeTab} yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
