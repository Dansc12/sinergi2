import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Dumbbell, TrendingUp, TrendingDown, Calendar, Info } from "lucide-react";
import { format } from "date-fns";
import { useEnhancedStrengthData, PrimaryGroup, MetricType } from "@/hooks/useEnhancedStrengthData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StrengthDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRIMARY_GROUPS: (PrimaryGroup | "Overall")[] = ["Overall", "Push", "Pull", "Legs", "Core"];

export const StrengthDetailModal = ({
  open,
  onOpenChange
}: StrengthDetailModalProps) => {
  const {
    chartData,
    totalVolume,
    latestValue,
    trend,
    isLoading,
    selectedPrimaryGroup,
    setSelectedPrimaryGroup,
    selectedSubGroup,
    setSelectedSubGroup,
    availableSubGroups,
    metricType,
    setMetricType,
    selectedExercise,
    setSelectedExercise,
    exerciseFrequency,
    isCoreTimeBasedOnly
  } = useEnhancedStrengthData();

  const isTrendingUp = trend > 0;

  // Handle primary group selection
  const handlePrimaryGroupSelect = (group: PrimaryGroup | "Overall") => {
    if (group === "Overall") {
      setSelectedPrimaryGroup(null);
      setSelectedSubGroup(null);
    } else {
      setSelectedPrimaryGroup(group);
      setSelectedSubGroup("All");
    }
  };

  // Handle subgroup selection
  const handleSubGroupSelect = (subGroup: string) => {
    setSelectedSubGroup(subGroup);
  };

  // Handle metric toggle
  const handleMetricToggle = (metric: MetricType) => {
    // If Core is time-based only, don't allow switching to strength
    if (metric === "strength" && isCoreTimeBasedOnly) return;
    setMetricType(metric);
  };

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
      trend: Math.round(intercept + slope * i)
    }));
  })() : chartData;

  const formatVolume = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return Math.round(value).toString();
  };

  const getTitle = () => {
    if (selectedPrimaryGroup) {
      if (selectedSubGroup && selectedSubGroup !== "All") {
        return `${selectedSubGroup} Strength`;
      }
      return `${selectedPrimaryGroup} Strength`;
    }
    return "Overall Strength";
  };

  const getMetricLabel = () => {
    return metricType === "volume" ? "Volume" : `Strength (e1RM)`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell size={20} className="text-success" />
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Primary Group Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {PRIMARY_GROUPS.map((group) => {
              const isSelected = group === "Overall" 
                ? !selectedPrimaryGroup 
                : selectedPrimaryGroup === group;
              return (
                <button
                  key={group}
                  onClick={() => handlePrimaryGroupSelect(group)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                  }`}
                >
                  {group}
                </button>
              );
            })}
          </div>

          {/* SubGroup Filter Chips */}
          {selectedPrimaryGroup && availableSubGroups.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSubGroupSelect("All")}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedSubGroup === "All" || !selectedSubGroup
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-card/50 border border-border/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              {availableSubGroups.map((subGroup) => (
                <button
                  key={subGroup}
                  onClick={() => handleSubGroupSelect(subGroup)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedSubGroup === subGroup
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-card/50 border border-border/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {subGroup}
                </button>
              ))}
            </div>
          )}

          {/* Volume / Strength Toggle */}
          <div className="space-y-2">
            <div className="flex bg-card border border-border rounded-lg p-1">
              <button
                onClick={() => handleMetricToggle("volume")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  metricType === "volume"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Volume
              </button>
              <button
                onClick={() => handleMetricToggle("strength")}
                disabled={isCoreTimeBasedOnly}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  metricType === "strength"
                    ? "bg-primary text-primary-foreground"
                    : isCoreTimeBasedOnly
                      ? "text-muted-foreground/50 cursor-not-allowed"
                      : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Strength
              </button>
            </div>

            {/* Core time-based message */}
            {isCoreTimeBasedOnly && selectedPrimaryGroup === "Core" && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card/50 rounded-lg px-3 py-2">
                <Info size={14} />
                <span>Core strength tracked by volume/time only</span>
              </div>
            )}
          </div>

          {/* Strength Exercise Dropdown */}
          {metricType === "strength" && exerciseFrequency.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Strength exercise</label>
              <Select
                value={selectedExercise || ""}
                onValueChange={setSelectedExercise}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select exercise" />
                </SelectTrigger>
                <SelectContent>
                  {exerciseFrequency.map((ex) => (
                    <SelectItem key={ex.name} value={ex.name}>
                      {ex.name} ({ex.count}x)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">
                {metricType === "volume" ? "Total Volume" : "Latest e1RM"}
              </p>
              <p className="text-xl font-bold">
                {formatVolume(metricType === "volume" ? totalVolume : latestValue)}
              </p>
              <p className="text-xs text-muted-foreground">lbs</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Last Week</p>
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
                  {isTrendingUp ? "Getting stronger!" : metricType === "volume" ? "Volume decreased" : "Strength plateaued"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isTrendingUp 
                    ? metricType === "volume" 
                      ? "Your weekly volume is trending upward" 
                      : "Your estimated 1RM is improving"
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
                    dataKey="weekLabel" 
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
                    labelFormatter={(label) => `Week of ${label}`}
                    formatter={(value: number) => [
                      `${Math.round(value).toLocaleString()} lbs`,
                      getMetricLabel()
                    ]}
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
                <p className="text-muted-foreground">
                  {metricType === "strength" && !selectedExercise
                    ? "Select an exercise to view strength data"
                    : "No workouts logged yet"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {metricType === "strength" && !selectedExercise
                    ? "Choose from the dropdown above"
                    : "Log your first workout to see strength data"}
                </p>
              </div>
            </div>
          )}

          {/* Recent Weeks */}
          {chartData.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Calendar size={16} />
                Recent Weeks
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {[...chartData].reverse().slice(0, 5).map((entry, i) => (
                  <div key={i} className="flex justify-between items-center text-sm bg-card/50 rounded-lg px-3 py-2">
                    <span className="text-muted-foreground">
                      Week of {entry.weekLabel}
                    </span>
                    <span className="font-medium">{Math.round(entry.value).toLocaleString()} lbs</span>
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
