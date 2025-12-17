import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Dumbbell, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { format } from "date-fns";

interface StrengthDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chartData: { date: string; value: number }[];
  totalLifted: number;
  latestValue: number;
  trend: number;
}

export const StrengthDetailModal = ({
  open,
  onOpenChange,
  chartData,
  totalLifted,
  latestValue,
  trend
}: StrengthDetailModalProps) => {
  const isTrendingUp = trend > 0;

  // Calculate trendline
  const trendlineData = chartData.length >= 2 ? (() => {
    const n = chartData.length;
    const sumX = chartData.reduce((acc, _, i) => acc + i, 0);
    const sumY = chartData.reduce((acc, d) => acc + d.value, 0);
    const sumXY = chartData.reduce((acc, d, i) => acc + i * d.value, 0);
    const sumX2 = chartData.reduce((acc, _, i) => acc + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return chartData.map((d, i) => ({
      ...d,
      trend: intercept + slope * i
    }));
  })() : chartData;

  const formatVolume = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell size={20} className="text-success" />
            Strength Progress
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Lifted</p>
              <p className="text-xl font-bold">
                {formatVolume(totalLifted)}
              </p>
              <p className="text-xs text-muted-foreground">lbs all time</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Last Session</p>
              <p className="text-xl font-bold">
                {formatVolume(latestValue)}
              </p>
              <p className="text-xs text-muted-foreground">lbs</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Trend</p>
              <p className={`text-xl font-bold flex items-center justify-center ${isTrendingUp ? 'text-success' : trend < 0 ? 'text-destructive' : ''}`}>
                {isTrendingUp ? <TrendingUp size={16} className="mr-1" /> : trend < 0 ? <TrendingDown size={16} className="mr-1" /> : null}
                {trend > 0 ? "+" : ""}{formatVolume(Math.abs(trend))}
              </p>
              <p className="text-xs text-muted-foreground">vs last</p>
            </div>
          </div>

          {/* Trend Indicator */}
          {chartData.length >= 2 && (
            <div className={`${isTrendingUp ? 'bg-success/10 border-success/20' : 'bg-card border-border'} border rounded-xl p-4 flex items-center gap-3`}>
              <div className={`w-10 h-10 rounded-full ${isTrendingUp ? 'bg-success/20' : 'bg-muted'} flex items-center justify-center`}>
                {isTrendingUp ? (
                  <TrendingUp size={20} className="text-success" />
                ) : (
                  <TrendingDown size={20} className="text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-semibold">
                  {isTrendingUp ? "Getting stronger!" : "Volume decreased"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isTrendingUp 
                    ? "Your lifting volume is trending upward" 
                    : "Focus on progressive overload to increase strength"}
                </p>
              </div>
            </div>
          )}

          {/* Chart */}
          {chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendlineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => format(new Date(date), "M/d")}
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    tickFormatter={(val) => formatVolume(val)}
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    labelFormatter={(date) => format(new Date(date as string), "MMM d, yyyy")}
                    formatter={(value: number) => [`${value.toLocaleString()} lbs`, "Volume"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="trend"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(142, 76%, 45%)"
                    strokeWidth={2.5}
                    dot={{ fill: "hsl(142, 76%, 45%)", strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-card border border-border rounded-xl">
              <div className="text-center">
                <Dumbbell size={32} className="mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-muted-foreground">No workouts logged yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Log your first workout to see strength data
                </p>
              </div>
            </div>
          )}

          {/* Recent Sessions */}
          {chartData.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Calendar size={16} />
                Recent Sessions
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {[...chartData].reverse().slice(0, 5).map((entry, i) => (
                  <div key={i} className="flex justify-between items-center text-sm bg-card/50 rounded-lg px-3 py-2">
                    <span className="text-muted-foreground">
                      {format(new Date(entry.date), "MMM d, yyyy")}
                    </span>
                    <span className="font-medium">{entry.value.toLocaleString()} lbs</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
