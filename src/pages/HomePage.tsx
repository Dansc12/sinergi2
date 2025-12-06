import { useNavigate } from "react-router-dom";
import { HomeHeader } from "@/components/home/HomeHeader";
import { ProgressCharts } from "@/components/home/ProgressCharts";
import { AgendaSection } from "@/components/home/AgendaSection";
import { FriendFeed } from "@/components/home/FriendFeed";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <HomeHeader 
        userName="Alex"
        streakCount={12}
        avatarUrl="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200"
        onProfileClick={() => navigate("/profile")}
      />
      
      <div className="animate-fade-in">
        <ProgressCharts />
        <AgendaSection />
        <FriendFeed />
      </div>
    </div>
  );
};

export default HomePage;
