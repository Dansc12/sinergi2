import { Bell, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HomeHeaderProps {
  userName: string;
  streakCount: number;
  avatarUrl?: string;
  onProfileClick: () => void;
}

export const HomeHeader = ({ userName, streakCount, avatarUrl, onProfileClick }: HomeHeaderProps) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <header className="sticky top-0 z-40 glass-elevated px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left: Avatar & Streak */}
        <button onClick={onProfileClick} className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-11 w-11 border-2 border-primary/50">
              <AvatarImage src={avatarUrl} alt={userName} />
              <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* Streak Badge */}
            <div className="absolute -top-1 -right-1 flex items-center gap-0.5 bg-streak text-primary-foreground px-1.5 py-0.5 rounded-full text-xs font-bold shadow-lg">
              <Flame size={10} />
              <span>{streakCount}</span>
            </div>
          </div>
          <div className="text-left">
            <p className="text-sm text-muted-foreground">{getGreeting()}</p>
            <p className="font-semibold">{userName} 💪</p>
          </div>
        </button>

        {/* Right: Notifications */}
        <Button variant="icon" size="icon">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
        </Button>
      </div>
    </header>
  );
};
