import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { ALL_MUSCLES, MUSCLE_DISPLAY_NAMES, getMuscleDisplayName } from "@/lib/muscleContributions";

export type PrimaryGroup = "Push" | "Pull" | "Legs" | "Core";

interface DailyData {
  date: string;
  dateLabel: string;
  value: number;
}

interface MultiLineData {
  date: string;
  dateLabel: string;
  [key: string]: string | number; // Dynamic keys for each line
}

interface SetMuscleVolumeRow {
  id: string;
  user_id: string;
  log_date: string;
  exercise_name: string;
  set_index: number;
  primary_group: string;
  muscle: string;
  allocated_tonnage: number;
}

// Muscles available for each primary group
const PRIMARY_GROUP_MUSCLES: Record<PrimaryGroup, readonly string[]> = ALL_MUSCLES;

// Colors for secondary lines
const PRIMARY_GROUP_COLORS: Record<PrimaryGroup, string> = {
  Push: "hsl(340, 75%, 55%)",
  Pull: "hsl(200, 75%, 55%)",
  Legs: "hsl(45, 75%, 55%)",
  Core: "hsl(280, 75%, 55%)",
};

const MUSCLE_COLORS: Record<string, string> = {
  // Push
  chest: "hsl(340, 75%, 55%)",
  shoulders: "hsl(20, 75%, 55%)",
  triceps: "hsl(300, 60%, 55%)",
  // Pull
  lats: "hsl(200, 75%, 55%)",
  upper_back: "hsl(180, 60%, 50%)",
  rear_delts: "hsl(220, 70%, 60%)",
  biceps: "hsl(160, 60%, 50%)",
  // Legs
  quads: "hsl(45, 75%, 55%)",
  hamstrings: "hsl(30, 70%, 50%)",
  glutes: "hsl(60, 60%, 50%)",
  calves: "hsl(80, 50%, 50%)",
  // Core
  abs: "hsl(280, 75%, 55%)",
  obliques: "hsl(260, 60%, 55%)",
  lower_back: "hsl(300, 50%, 50%)",
};

export const useEnhancedStrengthData = () => {
  const [volumeData, setVolumeData] = useState<SetMuscleVolumeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPrimaryGroup, setSelectedPrimaryGroup] = useState<PrimaryGroup | null>(null);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  const fetchVolumeData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("set_muscle_volume")
        .select("*")
        .eq("user_id", user.id)
        .order("log_date", { ascending: true });

      if (error) throw error;
      setVolumeData((data as SetMuscleVolumeRow[]) || []);
    } catch (error) {
      console.error("Error fetching volume data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVolumeData();
  }, [fetchVolumeData]);

  // Get available muscles for the selected primary group
  const availableMuscles = useMemo(() => {
    if (!selectedPrimaryGroup) return [];
    return [...PRIMARY_GROUP_MUSCLES[selectedPrimaryGroup]];
  }, [selectedPrimaryGroup]);

  // Reset selected muscle when primary group changes
  useEffect(() => {
    setSelectedMuscle(null);
  }, [selectedPrimaryGroup]);

  // Calculate daily volume data based on filters (single line for main value)
  const dailyVolumeData = useMemo((): DailyData[] => {
    const dailyVolumes: Record<string, number> = {};

    volumeData.forEach(row => {
      if (selectedPrimaryGroup && row.primary_group !== selectedPrimaryGroup) return;
      if (selectedMuscle && row.muscle !== selectedMuscle) return;

      const dateKey = row.log_date;
      dailyVolumes[dateKey] = (dailyVolumes[dateKey] || 0) + Number(row.allocated_tonnage);
    });

    return Object.entries(dailyVolumes)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, value]) => ({
        date,
        dateLabel: format(parseISO(date), "MMM d"),
        value: Math.round(value)
      }));
  }, [volumeData, selectedPrimaryGroup, selectedMuscle]);

  // Calculate multi-line chart data with secondary lines
  const multiLineChartData = useMemo((): MultiLineData[] => {
    // Aggregate by date
    const dailyAggregates: Record<string, Record<string, number>> = {};
    
    volumeData.forEach(row => {
      const dateKey = row.log_date;
      if (!dailyAggregates[dateKey]) {
        dailyAggregates[dateKey] = { total: 0 };
      }
      
      const tonnage = Number(row.allocated_tonnage);
      dailyAggregates[dateKey].total = (dailyAggregates[dateKey].total || 0) + tonnage;
      
      // Track by primary group
      const group = row.primary_group;
      dailyAggregates[dateKey][group] = (dailyAggregates[dateKey][group] || 0) + tonnage;
      
      // Track by muscle
      dailyAggregates[dateKey][row.muscle] = (dailyAggregates[dateKey][row.muscle] || 0) + tonnage;
    });

    return Object.entries(dailyAggregates)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, values]) => ({
        date,
        dateLabel: format(parseISO(date), "MMM d"),
        ...Object.fromEntries(
          Object.entries(values).map(([key, val]) => [key, Math.round(val)])
        )
      }));
  }, [volumeData]);

  // Get secondary line keys based on current filter
  const secondaryLineKeys = useMemo((): string[] => {
    if (selectedMuscle) {
      // When a specific muscle is selected, no secondary lines
      return [];
    }
    if (selectedPrimaryGroup) {
      // Show muscles within the selected group
      return [...PRIMARY_GROUP_MUSCLES[selectedPrimaryGroup]];
    }
    // Overall - show primary groups
    return ["Push", "Pull", "Legs", "Core"];
  }, [selectedPrimaryGroup, selectedMuscle]);

  // Get color for a line key
  const getLineColor = useCallback((key: string): string => {
    if (key in PRIMARY_GROUP_COLORS) {
      return PRIMARY_GROUP_COLORS[key as PrimaryGroup];
    }
    return MUSCLE_COLORS[key] || "hsl(var(--muted-foreground))";
  }, []);

  // Get display name for a line key
  const getLineDisplayName = useCallback((key: string): string => {
    if (["Push", "Pull", "Legs", "Core"].includes(key)) {
      return key;
    }
    return getMuscleDisplayName(key);
  }, []);

  // Calculate totals and trends
  const totalVolume = useMemo(() => {
    return dailyVolumeData.reduce((sum, d) => sum + d.value, 0);
  }, [dailyVolumeData]);

  const latestValue = dailyVolumeData.length > 0 ? dailyVolumeData[dailyVolumeData.length - 1].value : 0;
  
  const trend = dailyVolumeData.length >= 2
    ? dailyVolumeData[dailyVolumeData.length - 1].value - dailyVolumeData[dailyVolumeData.length - 2].value
    : 0;

  // Get display name for current filter
  const getFilterLabel = useCallback(() => {
    if (selectedMuscle) {
      return getMuscleDisplayName(selectedMuscle);
    }
    if (selectedPrimaryGroup) {
      return selectedPrimaryGroup;
    }
    return "Overall";
  }, [selectedPrimaryGroup, selectedMuscle]);

  // Get the main data key for the chart
  const mainDataKey = useMemo(() => {
    if (selectedMuscle) return selectedMuscle;
    if (selectedPrimaryGroup) return selectedPrimaryGroup;
    return "total";
  }, [selectedPrimaryGroup, selectedMuscle]);

  return {
    chartData: dailyVolumeData,
    dailyVolumeData,
    multiLineChartData,
    secondaryLineKeys,
    mainDataKey,
    getLineColor,
    getLineDisplayName,
    totalVolume,
    latestValue,
    trend,
    isLoading,
    refetch: fetchVolumeData,
    // Filters
    selectedPrimaryGroup,
    setSelectedPrimaryGroup,
    selectedMuscle,
    setSelectedMuscle,
    availableMuscles,
    getFilterLabel,
    // For backward compat
    selectedSubGroup: selectedMuscle,
    setSelectedSubGroup: setSelectedMuscle,
    availableSubGroups: availableMuscles.map(m => getMuscleDisplayName(m)),
    // Constants for UI
    PRIMARY_GROUP_MUSCLES,
    MUSCLE_DISPLAY_NAMES,
    getMuscleDisplayName,
  };
};
