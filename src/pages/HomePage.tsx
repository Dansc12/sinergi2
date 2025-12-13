import { useNavigate } from "react-router-dom";
import { HomeHeader } from "@/components/home/HomeHeader";
import { ProgressCharts } from "@/components/home/ProgressCharts";
import { TasksSection } from "@/components/home/TasksSection";

const HomePage = () => {
  const navigate = useNavigate();

  // These values will come from real user data
  const userName = "User";
  const streakCount = 0;
  const avatarUrl = undefined;

  return (
    <div className="min-h-screen">
      <HomeHeader 
        userName={userName}
        streakCount={streakCount}
        avatarUrl={avatarUrl}
        onProfileClick={() => navigate("/profile")}
      />
      
      <div className="animate-fade-in">
        <ProgressCharts />
        <TasksSection />
      </div>
    </div>
  );
};

export default HomePage;
