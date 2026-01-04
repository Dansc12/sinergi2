import { useState, createContext, useContext } from "react";
import { useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { CreateModal } from "./CreateModal";
import { usePostDetail } from "@/contexts/PostDetailContext";

// Context to allow child components to hide nav
interface NavVisibilityContextType {
  hideNav: boolean;
  setHideNav: (hide: boolean) => void;
}

const NavVisibilityContext = createContext<NavVisibilityContextType>({
  hideNav: false,
  setHideNav: () => {},
});

export const useNavVisibility = () => useContext(NavVisibilityContext);

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
  "/create/saved-meal",
  "/share",
  "/select-content",
  "/workout/my-saved",
  "/workout/discover",
  "/meal/my-recipes",
  "/meal/discover",
  "/profile",
  "/user",
  "/diary",
];

export const AppLayout = ({ children }: AppLayoutProps) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [dynamicHideNav, setDynamicHideNav] = useState(false);
  const location = useLocation();
  const { isPostDetailOpen } = usePostDetail();
  
  const hideNavByRoute = HIDDEN_NAV_ROUTES.some(route => location.pathname.startsWith(route));
  const hideNav = hideNavByRoute || isPostDetailOpen || dynamicHideNav;

  const isHome = location.pathname === "/";

  return (
    <NavVisibilityContext.Provider value={{ hideNav: dynamicHideNav, setHideNav: setDynamicHideNav }}>
      <div className={isHome ? "h-[100svh] overflow-hidden bg-background" : "min-h-screen bg-background"}>
        <main className={hideNav ? "" : isHome ? "h-full" : "pb-24"}>
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
    </NavVisibilityContext.Provider>
  );
};
