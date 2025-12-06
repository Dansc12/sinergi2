import { Search, ChevronRight, Users, Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface GroupCardProps {
  name: string;
  members: number;
  image: string;
}

const GroupCard = ({ name, members, image }: GroupCardProps) => (
  <div className="min-w-[160px] bg-card border border-border rounded-2xl overflow-hidden">
    <img src={image} alt={name} className="w-full h-24 object-cover" />
    <div className="p-3">
      <h4 className="font-semibold text-sm truncate">{name}</h4>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Users size={12} />
        {members.toLocaleString()} members
      </p>
    </div>
  </div>
);

interface BuddyCardProps {
  name: string;
  avatar?: string;
  interests: string[];
}

const BuddyCard = ({ name, avatar, interests }: BuddyCardProps) => (
  <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
    <Avatar className="w-12 h-12">
      <AvatarImage src={avatar} />
      <AvatarFallback className="bg-primary/20 text-primary">
        {name.charAt(0)}
      </AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <h4 className="font-semibold">{name}</h4>
      <div className="flex gap-1 flex-wrap mt-1">
        {interests.slice(0, 2).map((interest) => (
          <span key={interest} className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
            {interest}
          </span>
        ))}
      </div>
    </div>
    <Button variant="outline" size="sm">Add</Button>
  </div>
);

const DiscoverPage = () => {
  const suggestedGroups = [
    { name: "Weightlifting", members: 2340, image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300" },
    { name: "Morning Yoga", members: 1850, image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300" },
    { name: "Running Club", members: 3200, image: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=300" },
    { name: "HIIT Warriors", members: 1560, image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300" },
  ];

  const suggestedBuddies = [
    { name: "Emma Wilson", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100", interests: ["Yoga", "Hiking"] },
    { name: "James Park", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100", interests: ["Weightlifting", "CrossFit"] },
    { name: "Sofia Garcia", avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100", interests: ["Running", "Swimming"] },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-elevated px-4 py-4">
        <h1 className="text-2xl font-bold mb-4">Discover</h1>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="text"
            placeholder="Search groups, users, coaches..."
            className="w-full bg-muted border-0 rounded-xl py-3 pl-12 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </header>

      <div className="py-4 animate-fade-in">
        {/* Group Coaching Banner */}
        <section className="px-4 mb-6">
          <div className="relative overflow-hidden rounded-2xl gradient-primary p-6 shadow-elevated">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/30 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="text-warning" size={20} />
                <span className="text-sm font-medium text-primary-foreground/80">Featured</span>
              </div>
              <h3 className="text-xl font-bold text-primary-foreground mb-1">
                6-Week Transformation
              </h3>
              <p className="text-sm text-primary-foreground/80 mb-4">
                Join Coach Mike's group coaching program. Limited spots!
              </p>
              <Button variant="glass" size="sm" className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0">
                Join Now
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </section>

        {/* Suggested Groups */}
        <section className="mb-6">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-lg font-semibold">Suggested Groups</h2>
            <button className="text-sm text-primary font-medium">See All</button>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 hide-scrollbar">
            {suggestedGroups.map((group) => (
              <GroupCard key={group.name} {...group} />
            ))}
          </div>
        </section>

        {/* Find Your Buddy */}
        <section className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Find Your Buddy</h2>
            <button className="text-sm text-primary font-medium">See All</button>
          </div>
          <div className="space-y-3">
            {suggestedBuddies.map((buddy) => (
              <BuddyCard key={buddy.name} {...buddy} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DiscoverPage;
