import { Home, ListTodo, Users, MessageCircle, Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem = ({ icon, label, isActive, onClick }: NavItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center gap-1 py-2 px-4 transition-all duration-200",
      isActive 
        ? "text-primary" 
        : "text-muted-foreground hover:text-foreground"
    )}
  >
    <div className={cn(
      "relative",
      isActive && "after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary"
    )}>
      {icon}
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

  const navItems = [
    { icon: <Home size={22} />, label: "Home", path: "/" },
    { icon: <ListTodo size={22} />, label: "Log", path: "/daily-log" },
    { icon: <Users size={22} />, label: "Connect", path: "/discover" },
    { icon: <MessageCircle size={22} />, label: "Messages", path: "/messages" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-elevated safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1 max-w-md mx-auto">
        {/* First two nav items */}
        {navItems.slice(0, 2).map((item) => (
          <NavItem
            key={item.path}
            {...item}
            isActive={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          />
        ))}

        {/* Central Create Button */}
        <div className="relative -mt-6">
          <div className="absolute inset-0 gradient-primary rounded-full blur-xl opacity-50" />
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
            {...item}
            isActive={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          />
        ))}
      </div>
    </nav>
  );
};
