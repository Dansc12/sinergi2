import { useState } from "react";
import { NutritionView } from "@/components/daily-log/NutritionView";
import { FitnessView } from "@/components/daily-log/FitnessView";
import { cn } from "@/lib/utils";

type TabType = "nutrition" | "fitness";

const DailyLogPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>("nutrition");

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-elevated px-4 py-4">
        <h1 className="text-2xl font-bold mb-4">Daily Log</h1>
        
        {/* Segmented Control */}
        <div className="bg-muted rounded-xl p-1 flex">
          <button
            onClick={() => setActiveTab("nutrition")}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === "nutrition"
                ? "bg-card text-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Nutrition
          </button>
          <button
            onClick={() => setActiveTab("fitness")}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === "fitness"
                ? "bg-card text-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Fitness
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-4 animate-fade-in">
        {activeTab === "nutrition" ? <NutritionView /> : <FitnessView />}
      </div>
    </div>
  );
};

export default DailyLogPage;
