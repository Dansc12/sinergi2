import { useState } from "react";
import { BottomNav } from "./BottomNav";
import { CreateModal } from "./CreateModal";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-24">
        {children}
      </main>
      <BottomNav onCreateClick={() => setIsCreateModalOpen(true)} />
      <CreateModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
};
