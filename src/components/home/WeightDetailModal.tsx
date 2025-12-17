import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Scale, TrendingDown, TrendingUp, Target, Calendar, Plus } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface WeightDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chartData: { date: string; value: number }[];
  latestWeight: number | null;
  goalWeight: number | null;
  weightChange: number;
  onAddWeighIn: () => void;
}

export const WeightDetailModal = ({
  open,
  onOpenChange,
  chartData,
  latestWeight,
  goalWeight,
  weightChange,
  onAddWeighIn
}: WeightDetailModalProps) => {
  // Calculate estimated days to goal
  const calculateDaysToGoal = () => {
    if (!latestWeight || !goalWeight || chartData.length < 2) return null;
    
    const firstEntry = chartData[0];
    const lastEntry = chartData[chartData.length - 1];
    const daysBetween = differenceInDays(new Date(lastEntry.date), new Date(firstEntry.date));
    
    if (daysBetween <= 0) return null;
    
    const weightChangeTotal = lastEntry.value - firstEntry.value;
    const ratePerDay = weightChangeTotal / daysBetween;
    
    if (ratePerDay >= 0 && goalWeight < latestWeight) {
      // Trying to lose weight but gaining - can't estimate
      return null;
    }
    if (ratePerDay <= 0 && goalWeight > latestWeight) {
      // Trying to gain weight but losing - can't estimate
      return null;
    }
    
    const weightToGo = goalWeight - latestWeight;
    const daysToGoal = Math.abs(weightToGo / ratePerDay);
    
    return Math.round(daysToGoal);
  };

  const daysToGoal = calculateDaysToGoal();
  const isLosingWeight = weightChange < 0;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Scale size={20} className="text-primary" />
              Weight Progress
            </span>
            <Button size="sm" variant="outline" onClick={onAddWeighIn}>
              <Plus size={16} className="mr-1" />
              Log Weigh-In
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Current</p>
              <p className="text-xl font-bold">
                {latestWeight ? `${latestWeight}` : "--"}
              </p>
              <p className="text-xs text-muted-foreground">lbs</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Goal</p>
              <p className="text-xl font-bold">
                {goalWeight ? `${goalWeight}` : "--"}
              </p>
              <p className="text-xs text-muted-foreground">lbs</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Change</p>
              <p className={`text-xl font-bold flex items-center justify-center ${isLosingWeight ? 'text-success' : weightChange > 0 ? 'text-destructive' : ''}`}>
                {isLosingWeight ? <TrendingDown size={16} className="mr-1" /> : weightChange > 0 ? <TrendingUp size={16} className="mr-1" /> : null}
                {weightChange > 0 ? "+" : ""}{weightChange.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">lbs</p>
            </div>
          </div>

          {/* Days to Goal */}
          {daysToGoal !== null && goalWeight && latestWeight && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Target size={20} className="text-primary" />
              </div>
              <div>
                <p className="font-semibold">~{daysToGoal} days to goal</p>
                <p className="text-sm text-muted-foreground">
                  Based on your current progress of {Math.abs(weightChange).toFixed(1)} lbs {isLosingWeight ? "lost" : "gained"}
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
                    domain={['dataMin - 2', 'dataMax + 2']}
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
                    formatter={(value: number) => [`${value.toFixed(1)} lbs`, "Weight"]}
                  />
                  {goalWeight && (
                    <ReferenceLine 
                      y={goalWeight} 
                      stroke="hsl(var(--primary))" 
                      strokeDasharray="5 5"
                      label={{ value: "Goal", fill: "hsl(var(--primary))", fontSize: 11 }}
                    />
                  )}
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
                    stroke="hsl(270, 91%, 65%)"
                    strokeWidth={2.5}
                    dot={{ fill: "hsl(270, 91%, 65%)", strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-card border border-border rounded-xl">
              <div className="text-center">
                <Scale size={32} className="mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-muted-foreground">No weigh-ins logged yet</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={onAddWeighIn}>
                  Log Your First Weigh-In
                </Button>
              </div>
            </div>
          )}

          {/* Logged Points */}
          {chartData.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Calendar size={16} />
                Recent Weigh-Ins
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {[...chartData].reverse().slice(0, 5).map((entry, i) => (
                  <div key={i} className="flex justify-between items-center text-sm bg-card/50 rounded-lg px-3 py-2">
                    <span className="text-muted-foreground">
                      {format(new Date(entry.date), "MMM d, yyyy")}
                    </span>
                    <span className="font-medium">{entry.value.toFixed(1)} lbs</span>
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
