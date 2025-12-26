import { useState } from "react";
import { useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { CreateModal } from "./CreateModal";

interface AppLayoutProps {
  children: React.ReactNode;
}

const HIDDEN_NAV_ROUTES = [
  "/create/workout",
  "/create/meal",
  "/create/post",
  "/create/group",
  "/create/recipe",
  "/create/routine",
  "/share",
  "/select-content",
  "/profile",
  "/user",
];

export const AppLayout = ({ children }: AppLayoutProps) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const location = useLocation();
  
  const hideNav = HIDDEN_NAV_ROUTES.some(route => location.pathname.startsWith(route));

  return (
    <div className="min-h-screen bg-background">
      <main className={hideNav ? "" : "pb-24"}>
        {children}
      </main>
      {!hideNav && (
        <>
          <BottomNav onCreateClick={() => setIsCreateModalOpen(true)} />
          <CreateModal 
            isOpen={isCreateModalOpen} 
            onClose={() => setIsCreateModalOpen(false)} 
          />
        </>
      )}
    </div>
  );
};
