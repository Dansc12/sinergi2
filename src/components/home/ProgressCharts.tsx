import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ChartCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  data: { value: number }[];
  color: string;
}

const ChartCard = ({ title, value, change, isPositive, data, color }: ChartCardProps) => (
  <div className="flex-1 bg-card border border-border rounded-2xl p-4 shadow-card">
    <div className="flex items-start justify-between mb-2">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
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
          <div className="w-full h-0.5 bg-border rounded-full" />
        </div>
      )}
    </div>
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
  // Empty data - will be populated from real user logs
  const weightData: { value: number }[] = [];
  const totalLiftedData: { value: number }[] = [];

  const hasData = weightData.length > 0 || totalLiftedData.length > 0;

  return (
    <section className="px-4 py-4">
      <h2 className="text-lg font-semibold mb-3">Your Progress</h2>
      
      {hasData ? (
        <div className="flex gap-3">
          <ChartCard
            title="Weight"
            value={weightData.length > 0 ? `${weightData[weightData.length - 1].value} lbs` : "-- lbs"}
            change=""
            isPositive={true}
            data={weightData}
            color="hsl(270, 91%, 65%)"
          />
          <ChartCard
            title="Total Lifted"
            value={totalLiftedData.length > 0 ? `${Math.round(totalLiftedData[totalLiftedData.length - 1].value / 1000)}K lbs` : "-- lbs"}
            change=""
            isPositive={true}
            data={totalLiftedData}
            color="hsl(142, 76%, 45%)"
          />
        </div>
      ) : (
        <EmptyProgressState />
      )}
    </section>
  );
};
