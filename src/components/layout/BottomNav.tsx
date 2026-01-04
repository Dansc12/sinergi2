import { Home, ListTodo, Users, MessageCircle, Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useGroupChats } from "@/hooks/useGroupChats";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  isActive: boolean;
  onClick: () => void;
  showBadge?: boolean;
}

const NavItem = ({ icon, label, isActive, onClick, showBadge }: NavItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 transition-all duration-200 min-w-[60px]",
      isActive 
        ? "text-primary" 
        : "text-muted-foreground hover:text-foreground"
    )}
  >
    <div className={cn(
      "relative h-6 flex items-center justify-center",
      isActive && "after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary"
    )}>
      {icon}
      {showBadge && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full" />
      )}
    </div>
    <span className="text-xs font-medium">{label}</span>
  </button>
);

interface BottomNavProps {
  onCreateClick: () => void;
}

export const BottomNav = ({ onCreateClick }: BottomNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalUnreadCount } = useGroupChats();

  const navItems = [
    { icon: <Home size={22} />, label: "Home", path: "/", showBadge: false },
    { icon: <ListTodo size={22} />, label: "Journal", path: "/daily-log", showBadge: false },
    { icon: <Users size={22} />, label: "Connect", path: "/discover", showBadge: false },
    { icon: <MessageCircle size={22} />, label: "Messages", path: "/messages", showBadge: totalUnreadCount > 0 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border/30 safe-area-bottom">
      <div className="grid grid-cols-5 items-center max-w-md mx-auto">
        {/* First two nav items */}
        {navItems.slice(0, 2).map((item) => (
          <NavItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
            isActive={location.pathname === item.path}
            onClick={() => navigate(item.path)}
            showBadge={item.showBadge}
          />
        ))}

        {/* Central Create Button */}
        <div className="flex justify-center -mt-6">
          <Button
            variant="create"
            size="create"
            onClick={onCreateClick}
            className="relative z-10"
          >
            <Plus size={28} strokeWidth={2.5} />
          </Button>
        </div>

        {/* Last two nav items */}
        {navItems.slice(2).map((item) => (
          <NavItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
            isActive={location.pathname === item.path}
            onClick={() => navigate(item.path)}
            showBadge={item.showBadge}
          />
        ))}
      </div>
    </nav>
  );
};