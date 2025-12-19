import { Flame, MessageCircleWarning } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationsPanel } from "./NotificationsPanel";
import { useNavigate } from "react-router-dom";

interface HomeHeaderProps {
  userName: string;
  streakCount: number;
  avatarUrl?: string;
  onProfileClick: () => void;
}

export const HomeHeader = ({ userName, streakCount, avatarUrl, onProfileClick }: HomeHeaderProps) => {
  const navigate = useNavigate();
  
  return (
    <header className="sticky top-0 z-40">
      {/* Top Bar */}
      <div className="glass-elevated px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Streak Badge & Feedback Button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-streak text-primary-foreground px-3 py-1.5 rounded-full text-sm font-bold">
              <Flame size={16} />
              <span>{streakCount}</span>
            </div>
            
            <button 
              onClick={() => navigate("/feedback")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 hover:bg-primary/25 border border-primary/30 transition-all animate-pulse"
            >
              <MessageCircleWarning size={16} className="text-primary" />
              <span className="text-xs font-medium text-primary">Feedback</span>
            </button>
          </div>

          {/* Right: Notification Bell & Avatar */}
          <div className="flex items-center gap-3">
            <NotificationsPanel />
            
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