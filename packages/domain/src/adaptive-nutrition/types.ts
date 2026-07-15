export type MealFeedbackMood = "loved" | "neutral" | "could_not_finish";

export type Texture = "dry" | "creamy" | "liquid" | "crunchy" | "soft" | "mixed";

export type Temperature = "hot" | "cold" | "room";

export type VolumeLevel = "low" | "medium" | "high";

export type MealTime = "breakfast" | "lunch" | "snack" | "dinner";

export type BudgetLevel = "low" | "medium" | "high";

export type CookingTimeLevel = "quick" | "standard" | "slow";

export type EatingMode = "clean_bulking" | "easy_bulking" | "balanced";

export type BodyGoal = "lean_gain" | "maintenance" | "fat_loss";

export type Sex = "female" | "male";

export interface MealDna {
  texture: Texture;
  temperature: Temperature;
  volume: VolumeLevel;
  cookingTime: CookingTimeLevel;
  dominantFlavors: string[];
  proteinSources: string[];
  tags: string[];
}

export interface MealOption {
  id: string;
  name: string;
  mealTime: MealTime;
  caloriesEstimate: number;
  proteinEstimate: number;
  carbsEstimate?: number;
  fatEstimate?: number;
  budget: BudgetLevel;
  dna: MealDna;
  ingredients?: string[];
  recipeSteps?: string[];
  isSafeMeal?: boolean;
  isFavorite?: boolean;
  pausedUntil?: Date;
}

export interface MealFeedback {
  mealId: string;
  mood: MealFeedbackMood;
  eatenPercentage: number;
  occurredAt: Date;
  mealTime: MealTime;
  hydrationLevel?: VolumeLevel;
  trainingDay?: boolean;
  userMood?: "low" | "steady" | "high";
}

export interface UserNutritionProfile {
  userId: string;
  preferredTextures: Partial<Record<Texture, number>>;
  preferredVolumes: Partial<Record<VolumeLevel, number>>;
  preferredFlavors: Record<string, number>;
  avoidedIngredients: string[];
  budgetPreference: BudgetLevel;
  cookingTimePreference: CookingTimeLevel;
  safeMealIds: string[];
  favoriteMealIds?: string[];
  eatingMode?: EatingMode;
  wakeTime?: string | null;
  sleepTime?: string | null;
  workType?: "seated" | "mixed" | "active" | string | null;
  hardEatingDays?: string[];
  trainingDays?: string[];
  trainingTime?: string | null;
  trainingIntensity?: "low" | "moderate" | "high" | string | null;
  appetiteMorning?: "low" | "medium" | "high" | string | null;
  appetiteNight?: "low" | "medium" | "high" | string | null;
  bestAppetiteTime?: string | null;
  worstAppetiteTime?: string | null;
  volumeTolerance?: VolumeLevel | string | null;
  avoidedTextures?: string[];
  preferredTextureStyle?: string | null;
  nauseaFoods?: string[];
  safeFoods?: string[];
  favoriteFoods?: string[];
  dislikedFoods?: string[];
  allergies?: string[];
  dietType?: string | null;
  planMode?: EatingMode | string | null;
  desiredPace?: "calm" | "normal" | "aggressive" | string | null;
  targetWeightKilograms?: number | null;
}

export interface NutritionTargets {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

export interface MealSlot {
  id: string;
  mealTime: MealTime;
  targetCalories: number;
  targetProtein: number;
}

export interface MealScoreBreakdown {
  mealTolerance: number;
  variety: number;
  volumeCompatibility: number;
  textureCompatibility: number;
  recentFeedback: number;
  budgetCompatibility: number;
  cookingTime: number;
}

export interface ScoredMealOption {
  meal: MealOption;
  score: number;
  breakdown: MealScoreBreakdown;
  rationale: string[];
  nauseaRisk: NauseaRisk;
}

export interface PlanMeal {
  date: string;
  mealTime: MealTime;
  selected: ScoredMealOption;
  alternatives: ScoredMealOption[];
}

export interface WeeklyPlan {
  userId: string;
  startsOn: string;
  engineVersion: string;
  scoringWeightsVersion: string;
  meals: PlanMeal[];
}

export interface NauseaRisk {
  level: "low" | "medium" | "high";
  reasons: string[];
}

export interface MealAlternative {
  option: ScoredMealOption;
  reasons: string[];
  macroDistance: number;
}

export interface DailyPlan {
  userId: string;
  date: string;
  version: number;
  engineVersion: string;
  scoringWeightsVersion: string;
  targets: NutritionTargets;
  meals: PlanMeal[];
  consumed: {
    calories: number;
    proteinGrams: number;
    waterMilliliters: number;
  };
}

export interface HydrationSummary {
  targetMilliliters: number;
  consumedMilliliters: number;
  progress: number;
  timeline: Array<{
    amountMilliliters: number;
    occurredAt: Date;
  }>;
}

export interface WeightTrend {
  direction: "up" | "down" | "stable";
  weeklyDeltaKilograms: number;
  averageWeightKilograms: number;
}

export interface DailyDashboard {
  caloriesConsumed: number;
  calorieTarget: number;
  proteinConsumed: number;
  proteinTarget: number;
  hydrationMilliliters: number;
  appetiteScore: number;
  foodVarietyIndex: number;
  consistencyScore: number;
  meals: PlanMeal[];
}
