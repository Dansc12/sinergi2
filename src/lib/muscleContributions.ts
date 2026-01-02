import { PrimaryGroup } from "@/hooks/useEnhancedStrengthData";

// Muscle contributions for common exercises
// Each exercise maps to a fraction of contribution per muscle (must sum to 1)
export type MuscleContributions = Record<string, number>;

export interface ExerciseMuscleConfig {
  primaryGroup: PrimaryGroup;
  muscleContributions: MuscleContributions;
}

// Default muscle contributions by exercise name (case-insensitive match)
const EXERCISE_MUSCLE_CONFIGS: Record<string, ExerciseMuscleConfig> = {
  // PUSH - Chest focused
  "bench press": { primaryGroup: "Push", muscleContributions: { chest: 0.6, triceps: 0.25, shoulders: 0.15 } },
  "flat bench press": { primaryGroup: "Push", muscleContributions: { chest: 0.6, triceps: 0.25, shoulders: 0.15 } },
  "incline bench press": { primaryGroup: "Push", muscleContributions: { chest: 0.45, shoulders: 0.35, triceps: 0.2 } },
  "decline bench press": { primaryGroup: "Push", muscleContributions: { chest: 0.7, triceps: 0.2, shoulders: 0.1 } },
  "dumbbell bench press": { primaryGroup: "Push", muscleContributions: { chest: 0.6, triceps: 0.25, shoulders: 0.15 } },
  "dumbbell press": { primaryGroup: "Push", muscleContributions: { chest: 0.6, triceps: 0.25, shoulders: 0.15 } },
  "incline dumbbell press": {
    primaryGroup: "Push",
    muscleContributions: { chest: 0.45, shoulders: 0.35, triceps: 0.2 },
  },
  "chest press": { primaryGroup: "Push", muscleContributions: { chest: 0.6, triceps: 0.25, shoulders: 0.15 } },
  "machine chest press": { primaryGroup: "Push", muscleContributions: { chest: 0.65, triceps: 0.2, shoulders: 0.15 } },
  "push up": { primaryGroup: "Push", muscleContributions: { chest: 0.5, triceps: 0.3, shoulders: 0.2 } },
  "push-up": { primaryGroup: "Push", muscleContributions: { chest: 0.5, triceps: 0.3, shoulders: 0.2 } },
  pushup: { primaryGroup: "Push", muscleContributions: { chest: 0.5, triceps: 0.3, shoulders: 0.2 } },
  dip: { primaryGroup: "Push", muscleContributions: { chest: 0.35, triceps: 0.55, shoulders: 0.1 } },
  "chest dip": { primaryGroup: "Push", muscleContributions: { chest: 0.45, triceps: 0.45, shoulders: 0.1 } },
  fly: { primaryGroup: "Push", muscleContributions: { chest: 0.95, shoulders: 0.05 } },
  "chest fly": { primaryGroup: "Push", muscleContributions: { chest: 0.95, shoulders: 0.05 } },
  "dumbbell fly": { primaryGroup: "Push", muscleContributions: { chest: 0.95, shoulders: 0.05 } },
  "cable fly": { primaryGroup: "Push", muscleContributions: { chest: 0.95, shoulders: 0.05 } },
  "pec deck": { primaryGroup: "Push", muscleContributions: { chest: 0.95, shoulders: 0.05 } },

  // PUSH - Shoulder focused
  "shoulder press": { primaryGroup: "Push", muscleContributions: { shoulders: 0.65, triceps: 0.3, chest: 0.05 } },
  "overhead press": { primaryGroup: "Push", muscleContributions: { shoulders: 0.65, triceps: 0.3, chest: 0.05 } },
  "military press": { primaryGroup: "Push", muscleContributions: { shoulders: 0.7, triceps: 0.28, chest: 0.02 } },
  "dumbbell shoulder press": {
    primaryGroup: "Push",
    muscleContributions: { shoulders: 0.65, triceps: 0.3, chest: 0.05 },
  },
  "arnold press": { primaryGroup: "Push", muscleContributions: { shoulders: 0.7, triceps: 0.25, chest: 0.05 } },
  "lateral raise": { primaryGroup: "Push", muscleContributions: { shoulders: 1.0 } },
  "side lateral raise": { primaryGroup: "Push", muscleContributions: { shoulders: 1.0 } },
  "front raise": { primaryGroup: "Push", muscleContributions: { shoulders: 1.0 } },

  // NOTE: Upright row is better classified as Pull; ratios adjusted accordingly.
  "upright row": { primaryGroup: "Pull", muscleContributions: { shoulders: 0.55, upperBack: 0.45 } },

  // PUSH - Triceps focused
  "tricep extension": { primaryGroup: "Push", muscleContributions: { triceps: 1.0 } },
  "tricep pushdown": { primaryGroup: "Push", muscleContributions: { triceps: 1.0 } },
  "skull crusher": { primaryGroup: "Push", muscleContributions: { triceps: 1.0 } },
  "overhead tricep extension": { primaryGroup: "Push", muscleContributions: { triceps: 1.0 } },
  "tricep kickback": { primaryGroup: "Push", muscleContributions: { triceps: 1.0 } },
  "close grip bench press": { primaryGroup: "Push", muscleContributions: { triceps: 0.5, chest: 0.4, shoulders: 0.1 } },
  "diamond push up": { primaryGroup: "Push", muscleContributions: { triceps: 0.55, chest: 0.35, shoulders: 0.1 } },

  // PULL - Back focused
  "pull up": {
    primaryGroup: "Pull",
    muscleContributions: { lats: 0.5, upperBack: 0.3, biceps: 0.18, rearDelts: 0.02 },
  },
  "pull-up": {
    primaryGroup: "Pull",
    muscleContributions: { lats: 0.5, upperBack: 0.3, biceps: 0.18, rearDelts: 0.02 },
  },
  pullup: { primaryGroup: "Pull", muscleContributions: { lats: 0.5, upperBack: 0.3, biceps: 0.18, rearDelts: 0.02 } },
  "chin up": {
    primaryGroup: "Pull",
    muscleContributions: { lats: 0.38, biceps: 0.4, upperBack: 0.2, rearDelts: 0.02 },
  },
  "chin-up": {
    primaryGroup: "Pull",
    muscleContributions: { lats: 0.38, biceps: 0.4, upperBack: 0.2, rearDelts: 0.02 },
  },
  "lat pulldown": {
    primaryGroup: "Pull",
    muscleContributions: { lats: 0.62, biceps: 0.2, upperBack: 0.16, rearDelts: 0.02 },
  },
  "lat pull down": {
    primaryGroup: "Pull",
    muscleContributions: { lats: 0.62, biceps: 0.2, upperBack: 0.16, rearDelts: 0.02 },
  },
  row: { primaryGroup: "Pull", muscleContributions: { lats: 0.35, upperBack: 0.35, biceps: 0.2, rearDelts: 0.1 } },
  "barbell row": {
    primaryGroup: "Pull",
    muscleContributions: { lats: 0.35, upperBack: 0.35, biceps: 0.2, rearDelts: 0.1 },
  },
  "bent over row": {
    primaryGroup: "Pull",
    muscleContributions: { lats: 0.35, upperBack: 0.35, biceps: 0.2, rearDelts: 0.1 },
  },
  "dumbbell row": {
    primaryGroup: "Pull",
    muscleContributions: { lats: 0.4, upperBack: 0.3, biceps: 0.2, rearDelts: 0.1 },
  },
  "cable row": {
    primaryGroup: "Pull",
    muscleContributions: { lats: 0.35, upperBack: 0.35, biceps: 0.2, rearDelts: 0.1 },
  },
  "seated row": {
    primaryGroup: "Pull",
    muscleContributions: { lats: 0.35, upperBack: 0.35, biceps: 0.2, rearDelts: 0.1 },
  },
  "t-bar row": {
    primaryGroup: "Pull",
    muscleContributions: { lats: 0.4, upperBack: 0.35, biceps: 0.15, rearDelts: 0.1 },
  },

  deadlift: {
    primaryGroup: "Pull",
    muscleContributions: { glutes: 0.3, hamstrings: 0.25, lowerBack: 0.2, upperBack: 0.15, lats: 0.1 },
  },

  "face pull": { primaryGroup: "Pull", muscleContributions: { rearDelts: 0.6, upperBack: 0.38, biceps: 0.02 } },
  "rear delt fly": { primaryGroup: "Pull", muscleContributions: { rearDelts: 0.9, upperBack: 0.1 } },
  "reverse fly": { primaryGroup: "Pull", muscleContributions: { rearDelts: 0.9, upperBack: 0.1 } },
  shrug: { primaryGroup: "Pull", muscleContributions: { upperBack: 1.0 } },

  // PULL - Biceps focused
  "bicep curl": { primaryGroup: "Pull", muscleContributions: { biceps: 1.0 } },
  curl: { primaryGroup: "Pull", muscleContributions: { biceps: 1.0 } },
  "dumbbell curl": { primaryGroup: "Pull", muscleContributions: { biceps: 1.0 } },
  "barbell curl": { primaryGroup: "Pull", muscleContributions: { biceps: 1.0 } },
  "hammer curl": { primaryGroup: "Pull", muscleContributions: { biceps: 0.7, forearms: 0.3 } },
  "preacher curl": { primaryGroup: "Pull", muscleContributions: { biceps: 1.0 } },
  "concentration curl": { primaryGroup: "Pull", muscleContributions: { biceps: 1.0 } },
  "cable curl": { primaryGroup: "Pull", muscleContributions: { biceps: 1.0 } },

  // LEGS - Quad focused
  squat: { primaryGroup: "Legs", muscleContributions: { quads: 0.45, glutes: 0.35, hamstrings: 0.2 } },
  "back squat": { primaryGroup: "Legs", muscleContributions: { quads: 0.45, glutes: 0.35, hamstrings: 0.2 } },
  "front squat": { primaryGroup: "Legs", muscleContributions: { quads: 0.7, glutes: 0.2, hamstrings: 0.1 } },
  "goblet squat": { primaryGroup: "Legs", muscleContributions: { quads: 0.5, glutes: 0.35, hamstrings: 0.15 } },
  "leg press": { primaryGroup: "Legs", muscleContributions: { quads: 0.65, glutes: 0.25, hamstrings: 0.1 } },
  "leg extension": { primaryGroup: "Legs", muscleContributions: { quads: 1.0 } },
  lunge: { primaryGroup: "Legs", muscleContributions: { quads: 0.4, glutes: 0.4, hamstrings: 0.2 } },
  "walking lunge": { primaryGroup: "Legs", muscleContributions: { quads: 0.4, glutes: 0.4, hamstrings: 0.2 } },
  "split squat": { primaryGroup: "Legs", muscleContributions: { quads: 0.45, glutes: 0.4, hamstrings: 0.15 } },
  "bulgarian split squat": {
    primaryGroup: "Legs",
    muscleContributions: { quads: 0.4, glutes: 0.45, hamstrings: 0.15 },
  },
  "hack squat": { primaryGroup: "Legs", muscleContributions: { quads: 0.75, glutes: 0.2, hamstrings: 0.05 } },
  "step up": { primaryGroup: "Legs", muscleContributions: { quads: 0.35, glutes: 0.5, hamstrings: 0.15 } },

  // LEGS - Hamstring/Glute focused
  "romanian deadlift": {
    primaryGroup: "Legs",
    muscleContributions: { hamstrings: 0.5, glutes: 0.35, lowerBack: 0.15 },
  },
  rdl: { primaryGroup: "Legs", muscleContributions: { hamstrings: 0.5, glutes: 0.35, lowerBack: 0.15 } },
  "stiff leg deadlift": {
    primaryGroup: "Legs",
    muscleContributions: { hamstrings: 0.55, glutes: 0.3, lowerBack: 0.15 },
  },
  "leg curl": { primaryGroup: "Legs", muscleContributions: { hamstrings: 1.0 } },
  "lying leg curl": { primaryGroup: "Legs", muscleContributions: { hamstrings: 1.0 } },
  "seated leg curl": { primaryGroup: "Legs", muscleContributions: { hamstrings: 1.0 } },
  "hip thrust": { primaryGroup: "Legs", muscleContributions: { glutes: 0.8, hamstrings: 0.2 } },
  "glute bridge": { primaryGroup: "Legs", muscleContributions: { glutes: 0.8, hamstrings: 0.2 } },
  "good morning": { primaryGroup: "Legs", muscleContributions: { hamstrings: 0.4, glutes: 0.3, lowerBack: 0.3 } },
  "hip extension": { primaryGroup: "Legs", muscleContributions: { glutes: 0.7, hamstrings: 0.3 } },
  "cable pull through": { primaryGroup: "Legs", muscleContributions: { glutes: 0.65, hamstrings: 0.35 } },

  // LEGS - Calves
  "calf raise": { primaryGroup: "Legs", muscleContributions: { calves: 1.0 } },
  "standing calf raise": { primaryGroup: "Legs", muscleContributions: { calves: 1.0 } },
  "seated calf raise": { primaryGroup: "Legs", muscleContributions: { calves: 1.0 } },

  // CORE - Abs focused
  crunch: { primaryGroup: "Core", muscleContributions: { abs: 0.85, obliques: 0.15 } },
  "sit up": { primaryGroup: "Core", muscleContributions: { abs: 0.75, obliques: 0.25 } },
  "leg raise": { primaryGroup: "Core", muscleContributions: { abs: 0.9, obliques: 0.1 } },
  "hanging leg raise": { primaryGroup: "Core", muscleContributions: { abs: 0.9, obliques: 0.1 } },
  "cable crunch": { primaryGroup: "Core", muscleContributions: { abs: 0.9, obliques: 0.1 } },
  "ab rollout": { primaryGroup: "Core", muscleContributions: { abs: 0.85, obliques: 0.15 } },
  plank: { primaryGroup: "Core", muscleContributions: { abs: 0.5, obliques: 0.3, lowerBack: 0.2 } },
  "hollow body": { primaryGroup: "Core", muscleContributions: { abs: 0.85, obliques: 0.15 } },
  "dead bug": { primaryGroup: "Core", muscleContributions: { abs: 0.8, obliques: 0.2 } },
  "v-up": { primaryGroup: "Core", muscleContributions: { abs: 0.85, obliques: 0.15 } },

  // CORE - Obliques focused
  "russian twist": { primaryGroup: "Core", muscleContributions: { obliques: 0.7, abs: 0.3 } },
  "side plank": { primaryGroup: "Core", muscleContributions: { obliques: 0.8, abs: 0.2 } },
  "bicycle crunch": { primaryGroup: "Core", muscleContributions: { obliques: 0.5, abs: 0.5 } },
  woodchop: { primaryGroup: "Core", muscleContributions: { obliques: 0.7, abs: 0.3 } },
  "cable woodchop": { primaryGroup: "Core", muscleContributions: { obliques: 0.7, abs: 0.3 } },

  // CORE - Lower back focused
  "back extension": { primaryGroup: "Core", muscleContributions: { lowerBack: 0.55, glutes: 0.25, hamstrings: 0.2 } },
  hyperextension: { primaryGroup: "Core", muscleContributions: { lowerBack: 0.55, glutes: 0.25, hamstrings: 0.2 } },
  superman: { primaryGroup: "Core", muscleContributions: { lowerBack: 0.6, glutes: 0.25, hamstrings: 0.15 } },
  "bird dog": { primaryGroup: "Core", muscleContributions: { lowerBack: 0.45, abs: 0.35, glutes: 0.2 } },
};

// Default fallback: 100% to a single muscle based on muscle group
const MUSCLE_GROUP_DEFAULTS: Record<string, ExerciseMuscleConfig> = {
  // Push
  Chest: { primaryGroup: "Push", muscleContributions: { chest: 1.0 } },
  Shoulders: { primaryGroup: "Push", muscleContributions: { shoulders: 1.0 } },
  Triceps: { primaryGroup: "Push", muscleContributions: { triceps: 1.0 } },
  // Pull
  Lats: { primaryGroup: "Pull", muscleContributions: { lats: 1.0 } },
  "Upper Back": { primaryGroup: "Pull", muscleContributions: { upperBack: 1.0 } },
  Back: { primaryGroup: "Pull", muscleContributions: { lats: 0.5, upperBack: 0.5 } },
  "Rear Delts": { primaryGroup: "Pull", muscleContributions: { rearDelts: 1.0 } },
  Biceps: { primaryGroup: "Pull", muscleContributions: { biceps: 1.0 } },
  // Legs
  Quads: { primaryGroup: "Legs", muscleContributions: { quads: 1.0 } },
  Hamstrings: { primaryGroup: "Legs", muscleContributions: { hamstrings: 1.0 } },
  Glutes: { primaryGroup: "Legs", muscleContributions: { glutes: 1.0 } },
  Calves: { primaryGroup: "Legs", muscleContributions: { calves: 1.0 } },
  Legs: { primaryGroup: "Legs", muscleContributions: { quads: 0.4, hamstrings: 0.3, glutes: 0.3 } },
  // Core
  Abs: { primaryGroup: "Core", muscleContributions: { abs: 1.0 } },
  Obliques: { primaryGroup: "Core", muscleContributions: { obliques: 1.0 } },
  "Lower Back": { primaryGroup: "Core", muscleContributions: { lowerBack: 1.0 } },
  Core: { primaryGroup: "Core", muscleContributions: { abs: 0.5, obliques: 0.3, lowerBack: 0.2 } },
};

// Primary group defaults when no match found
const PRIMARY_GROUP_DEFAULTS: Record<PrimaryGroup, MuscleContributions> = {
  Push: { chest: 0.4, shoulders: 0.3, triceps: 0.3 },
  Pull: { lats: 0.4, upperBack: 0.3, biceps: 0.3 },
  Legs: { quads: 0.35, hamstrings: 0.25, glutes: 0.25, calves: 0.15 },
  Core: { abs: 0.5, obliques: 0.3, lowerBack: 0.2 },
};

/**
 * Get muscle contributions for an exercise
 * Priority:
 * 1. Exact exercise name match
 * 2. Partial exercise name match (contains)
 * 3. Muscle group default
 * 4. Primary group default
 */
export function getMuscleContributions(
  exerciseName: string,
  muscleGroup?: string,
  primaryGroup?: string, // Accept any string to be flexible
): ExerciseMuscleConfig {
  const lowerName = exerciseName.toLowerCase().trim();

  // 1. Exact match
  if (EXERCISE_MUSCLE_CONFIGS[lowerName]) {
    return EXERCISE_MUSCLE_CONFIGS[lowerName];
  }

  // 2. Partial match (check if any key is contained in the exercise name)
  for (const [key, config] of Object.entries(EXERCISE_MUSCLE_CONFIGS)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return config;
    }
  }

  // 3. Muscle group fallback
  if (muscleGroup && MUSCLE_GROUP_DEFAULTS[muscleGroup]) {
    return MUSCLE_GROUP_DEFAULTS[muscleGroup];
  }

  // 4. Primary group fallback
  const validPrimaryGroups: PrimaryGroup[] = ["Push", "Pull", "Legs", "Core"];
  if (primaryGroup && validPrimaryGroups.includes(primaryGroup as PrimaryGroup)) {
    const typedGroup = primaryGroup as PrimaryGroup;
    return {
      primaryGroup: typedGroup,
      muscleContributions: PRIMARY_GROUP_DEFAULTS[typedGroup],
    };
  }

  // Ultimate fallback - generic distribution
  return {
    primaryGroup: "Push",
    muscleContributions: { other: 1.0 },
  };
}

/**
 * Calculate allocated tonnage for a set based on muscle contributions
 */
export function calculateAllocatedTonnage(
  weight: number,
  reps: number,
  muscleContributions: MuscleContributions,
): Record<string, number> {
  const totalTonnage = weight * reps;
  const allocated: Record<string, number> = {};

  for (const [muscle, fraction] of Object.entries(muscleContributions)) {
    allocated[muscle] = Math.round(totalTonnage * fraction * 100) / 100; // Round to 2 decimals
  }

  return allocated;
}

// All muscle names used in the system
export const ALL_MUSCLES = {
  Push: ["chest", "shoulders", "triceps"],
  Pull: ["lats", "upperBack", "rearDelts", "biceps"],
  Legs: ["quads", "hamstrings", "glutes", "calves"],
  Core: ["abs", "obliques", "lowerBack"],
} as const;

// Display names for muscles
export const MUSCLE_DISPLAY_NAMES: Record<string, string> = {
  chest: "Chest",
  shoulders: "Shoulders",
  triceps: "Triceps",
  lats: "Lats",
  upperBack: "Upper Back",
  rearDelts: "Rear Delts",
  biceps: "Biceps",
  quads: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
  abs: "Abs",
  obliques: "Obliques",
  lowerBack: "Lower Back",
  forearms: "Forearms",
  other: "Other",
};

export function getMuscleDisplayName(muscle: string): string {
  return MUSCLE_DISPLAY_NAMES[muscle] || muscle.charAt(0).toUpperCase() + muscle.slice(1);
}
