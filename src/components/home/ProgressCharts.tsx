import { TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

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
      <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
        {isPositive ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
        <span>{change}</span>
      </div>
    </div>
    <div className="h-16">
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
    </div>
  </div>
);

export const ProgressCharts = () => {
  const weightData = [
    { value: 185 },
    { value: 183 },
    { value: 182 },
    { value: 181 },
    { value: 180 },
    { value: 178 },
    { value: 177 },
  ];

  const totalWeightData = [
    { value: 2500 },
    { value: 3200 },
    { value: 4100 },
    { value: 4800 },
    { value: 5500 },
    { value: 6200 },
    { value: 7400 },
  ];

  return (
    <section className="px-4 py-4">
      <h2 className="text-lg font-semibold mb-3">Your Progress</h2>
      <div className="flex gap-3">
        <ChartCard
          title="Weight"
          value="177 lbs"
          change="-8 lbs"
          isPositive={true}
          data={weightData}
          color="hsl(270, 91%, 65%)"
        />
        <ChartCard
          title="Total Weight"
          value="7,400 lbs"
          change="+4,900 lbs"
          isPositive={true}
          data={totalWeightData}
          color="hsl(142, 76%, 45%)"
        />
      </div>
    </section>
  );
};
