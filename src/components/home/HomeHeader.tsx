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
  return (
    <header className="sticky top-0 z-40">
      <div className="glass-elevated px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Streak Badge */}
          <div className="flex items-center gap-1.5 bg-streak text-primary-foreground px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
            <Flame size={18} />
            <span>{streakCount}</span>
          </div>

          {/* Right: Notifications & Avatar */}
          <div className="flex items-center gap-3">
            <Button variant="icon" size="icon" className="relative h-10 w-10">
              <Bell size={22} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-destructive rounded-full" />
            </Button>
            
            <button onClick={onProfileClick}>
              <Avatar className="h-10 w-10 border-2 border-primary/50">
                <AvatarImage src={avatarUrl} alt={userName} />
                <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
