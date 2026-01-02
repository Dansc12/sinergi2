import { useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Dumbbell, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { useEnhancedStrengthData, PrimaryGroup } from "@/hooks/useEnhancedStrengthData";

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
    dailyVolumeData,
    multiLineChartData,
    secondaryLineKeys,
    mainDataKey,
    getLineColor,
    getLineDisplayName,
    totalVolume,
    selectedPrimaryGroup,
    setSelectedPrimaryGroup,
    selectedMuscle,
    setSelectedMuscle,
    availableMuscles,
    getMuscleDisplayName,
    getFilterLabel,
    refetch
  } = useEnhancedStrengthData();

  // Refetch data when modal opens
  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  const chartData = dailyVolumeData;
  const latestValue = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;
  const trend = chartData.length >= 2
    ? chartData[chartData.length - 1].value - chartData[chartData.length - 2].value
    : 0;
  const isTrendingUp = trend > 0;

  // Handle primary group selection
  const handlePrimaryGroupSelect = (group: PrimaryGroup | "Overall") => {
    if (group === "Overall") {
      setSelectedPrimaryGroup(null);
      setSelectedMuscle(null);
    } else {
      setSelectedPrimaryGroup(group);
      setSelectedMuscle(null);
    }
  };

  // Handle muscle selection
  const handleMuscleSelect = (muscle: string | null) => {
    setSelectedMuscle(muscle);
  };

  // Calculate trendline for multi-line data
  const trendlineData = useMemo(() => {
    if (multiLineChartData.length < 2) return multiLineChartData;
    
    const n = multiLineChartData.length;
    const values = multiLineChartData.map(d => Number(d[mainDataKey]) || 0);
    const sumX = multiLineChartData.reduce((acc, _, i) => acc + i, 0);
    const sumY = values.reduce((acc, v) => acc + v, 0);
    const sumXY = values.reduce((acc, v, i) => acc + i * v, 0);
    const sumX2 = multiLineChartData.reduce((acc, _, i) => acc + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return multiLineChartData.map((d, i) => ({
      ...d,
      trend: Math.round(intercept + slope * i)
    }));
  }, [multiLineChartData, mainDataKey]);

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
    return `${getFilterLabel()} Volume`;
  };

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    // Sort by value descending, filter out trend line
    const sortedPayload = [...payload]
      .filter((p: any) => p.dataKey !== "trend")
      .sort((a: any, b: any) => (b.value || 0) - (a.value || 0));
    
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-sm mb-2">{label}</p>
        {sortedPayload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.stroke }}
            />
            <span className="text-muted-foreground">{getLineDisplayName(entry.dataKey)}:</span>
            <span className="font-medium">{Math.round(entry.value || 0).toLocaleString()} lbs</span>
          </div>
        ))}
      </div>
    );
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

          {/* Muscle Filter Chips */}
          {selectedPrimaryGroup && availableMuscles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleMuscleSelect(null)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  !selectedMuscle
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-card/50 border border-border/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                All {selectedPrimaryGroup}
              </button>
              {availableMuscles.map((muscle) => (
                <button
                  key={muscle}
                  onClick={() => handleMuscleSelect(muscle)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedMuscle === muscle
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-card/50 border border-border/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {getMuscleDisplayName(muscle)}
                </button>
              ))}
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Volume</p>
              <p className="text-xl font-bold">
                {formatVolume(totalVolume)}
              </p>
              <p className="text-xs text-muted-foreground">lbs</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Last Day</p>
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
                    ? "Your daily volume is trending upward" 
                    : "Focus on progressive overload to increase strength"}
                </p>
              </div>
            </div>
          )}

          {/* Chart */}
          {multiLineChartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendlineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis 
                    dataKey="dateLabel" 
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    tickFormatter={(val) => formatVolume(val)}
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  
                  {/* Trendline */}
                  <Line
                    type="monotone"
                    dataKey="trend"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    dot={false}
                    name="Trend"
                  />
                  
                  {/* Secondary lines (behind main line) */}
                  {secondaryLineKeys.map((key) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={getLineColor(key)}
                      strokeWidth={1.5}
                      strokeOpacity={0.6}
                      dot={false}
                      name={getLineDisplayName(key)}
                    />
                  ))}
                  
                  {/* Main line */}
                  <Line
                    type="monotone"
                    dataKey={mainDataKey}
                    stroke="hsl(142, 76%, 45%)"
                    strokeWidth={2.5}
                    dot={{ fill: "hsl(142, 76%, 45%)", strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6 }}
                    name={getFilterLabel()}
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
                  Log your first workout to see volume data
                </p>
              </div>
            </div>
          )}

          {/* Legend for secondary lines */}
          {secondaryLineKeys.length > 0 && multiLineChartData.length > 0 && (
            <div className="flex flex-wrap gap-3 justify-center">
              <div className="flex items-center gap-1.5 text-xs">
                <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: "hsl(142, 76%, 45%)" }} />
                <span className="text-muted-foreground">{getFilterLabel()}</span>
              </div>
              {secondaryLineKeys.map((key) => (
                <div key={key} className="flex items-center gap-1.5 text-xs">
                  <div 
                    className="w-3 h-0.5 rounded-full opacity-60" 
                    style={{ backgroundColor: getLineColor(key) }} 
                  />
                  <span className="text-muted-foreground">{getLineDisplayName(key)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Recent Days */}
          {chartData.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Calendar size={16} />
                Recent Days
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {[...chartData].reverse().slice(0, 5).map((entry, i) => (
                  <div key={i} className="flex justify-between items-center text-sm bg-card/50 rounded-lg px-3 py-2">
                    <span className="text-muted-foreground">
                      {entry.dateLabel}
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
