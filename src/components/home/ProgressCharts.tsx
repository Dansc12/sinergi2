import { useState } from "react";
import { TrendingUp, TrendingDown, BarChart3, Plus } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useWeightLogs } from "@/hooks/useWeightLogs";
import { useStrengthData } from "@/hooks/useStrengthData";
import { WeighInModal } from "./WeighInModal";
import { WeightDetailModal } from "./WeightDetailModal";
import { StrengthDetailModal } from "./StrengthDetailModal";

interface ChartCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  data: { value: number }[];
  color: string;
  onClick?: () => void;
  onAddClick?: (e: React.MouseEvent) => void;
  showAddButton?: boolean;
  subtitle?: string;
}

const ChartCard = ({ 
  title, 
  value, 
  change, 
  isPositive, 
  data, 
  color, 
  onClick,
  onAddClick,
  showAddButton,
  subtitle
}: ChartCardProps) => (
  <div 
    className="flex-1 bg-card border border-border rounded-2xl p-4 shadow-card cursor-pointer hover:bg-card/80 transition-colors"
    onClick={onClick}
  >
    <div className="flex items-start justify-between mb-2">
      <div>
        <div className="flex items-center gap-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          {showAddButton && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddClick?.(e);
              }}
              className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors"
            >
              <Plus size={12} className="text-primary" />
            </button>
          )}
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </div>
      {change && (
        <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{change}</span>
        </div>
      )}
    </div>
    <div className="h-16">
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Tooltip 
              contentStyle={{ 
                background: 'hsl(var(--popover))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              labelStyle={{ display: 'none' }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center">
          {subtitle ? (
            <p className="text-xs text-muted-foreground text-center px-2">{subtitle}</p>
          ) : (
            <div className="w-full h-0.5 bg-border rounded-full" />
          )}
        </div>
      )}
    </div>
    {data.length > 0 && subtitle && (
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    )}
  </div>
);

const EmptyProgressState = () => {
  const navigate = useNavigate();
  
  return (
    <div className="bg-card border border-border rounded-2xl p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
        <BarChart3 size={24} className="text-primary" />
      </div>
      <h3 className="font-semibold mb-1">Track Your Progress</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Log workouts and weigh-ins to see your progress charts
      </p>
      <Button size="sm" onClick={() => navigate("/create/workout")}>
        Log Your First Workout
      </Button>
    </div>
  );
};

export const ProgressCharts = () => {
  const [weighInModalOpen, setWeighInModalOpen] = useState(false);
  const [weightDetailOpen, setWeightDetailOpen] = useState(false);
  const [strengthDetailOpen, setStrengthDetailOpen] = useState(false);

  const {
    chartData: weightChartData,
    latestWeight,
    weightChange,
    goalWeight,
    logWeight,
    isLoading: weightLoading,
    daysUntilNextWeighIn,
    totalWeightEntries
  } = useWeightLogs();

  const {
    chartData: strengthChartData,
    latestValue: latestStrength,
    totalLifted,
    trend: strengthTrend,
    isLoading: strengthLoading,
    workoutsNeededForChart
  } = useStrengthData();

  const hasWeightData = totalWeightEntries >= 2;
  const hasStrengthData = strengthChartData.length >= 2;
  // Always show chart cards - they handle their own empty/partial states
  const isLoading = weightLoading || strengthLoading;

  // Format weight change for display
  const weightChangeDisplay = weightChange !== 0 
    ? `${weightChange > 0 ? "+" : ""}${Math.abs(weightChange).toFixed(1)} lbs`
    : "";

  // Format strength change for display
  const strengthChangeDisplay = strengthTrend !== 0
    ? `${strengthTrend > 0 ? "+" : ""}${Math.round(strengthTrend / 1000)}K lbs`
    : "";

  // Weight subtitle with countdown - always show days until next weigh-in
  const countdownText = `${daysUntilNextWeighIn} day${daysUntilNextWeighIn !== 1 ? 's' : ''} until next weigh-in`;
  const weightSubtitle = hasWeightData 
    ? countdownText
    : `Complete one more weigh-in to see your progress • ${countdownText}`;

  // Strength subtitle
  const strengthSubtitle = hasStrengthData
    ? ""
    : `Log ${workoutsNeededForChart} more workout${workoutsNeededForChart !== 1 ? 's' : ''} to see your progress`;

  if (isLoading) {
    return (
      <section className="px-4 py-4">
        <h2 className="text-lg font-semibold mb-3">Your Progress</h2>
        <div className="flex gap-3">
          <div className="flex-1 bg-card border border-border rounded-2xl p-4 h-32 animate-pulse" />
          <div className="flex-1 bg-card border border-border rounded-2xl p-4 h-32 animate-pulse" />
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-4">
      <h2 className="text-lg font-semibold mb-3">Your Progress</h2>
      
      <div className="flex gap-3">
        <ChartCard
          title="Weight"
          value={latestWeight ? `${latestWeight} lbs` : "-- lbs"}
          change={hasWeightData ? weightChangeDisplay : ""}
          isPositive={weightChange < 0}
          data={hasWeightData ? weightChartData : []}
          color="#3DD6C6"
          onClick={() => setWeightDetailOpen(true)}
          subtitle={weightSubtitle}
        />
        <ChartCard
          title="Overall Strength"
          value={latestStrength ? `${Math.round(latestStrength / 1000)}K lbs` : "-- lbs"}
          change={hasStrengthData ? strengthChangeDisplay : ""}
          isPositive={strengthTrend > 0}
          data={hasStrengthData ? strengthChartData : []}
          color="#B46BFF"
          onClick={() => setStrengthDetailOpen(true)}
          subtitle={strengthSubtitle}
        />
      </div>

      {/* Weigh-In Modal */}
      <WeighInModal
        open={weighInModalOpen}
        onOpenChange={setWeighInModalOpen}
        onSave={logWeight}
        currentWeight={latestWeight}
      />

      {/* Weight Detail Modal */}
      <WeightDetailModal
        open={weightDetailOpen}
        onOpenChange={setWeightDetailOpen}
        chartData={weightChartData}
        latestWeight={latestWeight}
        goalWeight={goalWeight}
        weightChange={weightChange}
        onAddWeighIn={() => {
          setWeightDetailOpen(false);
          setWeighInModalOpen(true);
        }}
      />

      {/* Strength Detail Modal */}
      <StrengthDetailModal
        open={strengthDetailOpen}
        onOpenChange={setStrengthDetailOpen}
      />
    </section>
  );
};
