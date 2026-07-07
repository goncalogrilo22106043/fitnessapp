import { apiRequest } from "../../api/client";

export type MealMoodFilter = "loved" | "neutral" | "could_not_finish";

export interface WaterSummary {
  targetMilliliters: number;
  consumedMilliliters: number;
  progress: number;
  timeline: Array<{ amountMilliliters: number; occurredAt: string }>;
}

export interface WeightLog {
  id: string;
  weightKilograms: number;
  occurredAt: string;
}

export interface WeightTrend {
  direction: "up" | "down" | "stable";
  weeklyDeltaKilograms: number;
  averageWeightKilograms: number;
}

export interface MealHistoryItem {
  id: string;
  mealId: string;
  mealName: string;
  mood: MealMoodFilter;
  eatenPercentage: number;
  occurredAt: string;
}

export async function addWater(amountMilliliters: number) {
  return apiRequest<{ message: string }>("/progress/water", {
    method: "POST",
    body: JSON.stringify({ amountMilliliters })
  });
}

export async function getWater(date: string) {
  return apiRequest<WaterSummary>(`/progress/water?date=${date}`);
}

export async function addWeight(weightKilograms: number) {
  return apiRequest<{ message: string }>("/progress/weight", {
    method: "POST",
    body: JSON.stringify({ weightKilograms })
  });
}

export async function getWeight() {
  return apiRequest<{ logs: WeightLog[]; trend: WeightTrend }>("/progress/weight");
}

export async function getMealHistory(mood?: MealMoodFilter) {
  const query = mood ? `?mood=${mood}` : "";
  return apiRequest<{ meals: MealHistoryItem[] }>(`/progress/meal-history${query}`);
}

export async function getWeeklyInsights() {
  return apiRequest<{
    bestToleratedMeals: Array<{ name: string; loved: number; hard: number; total: number }>;
    nauseaRiskMeals: Array<{ name: string; loved: number; hard: number; total: number }>;
    foodVarietyIndex: number;
    consistencyScore: number;
    weightTrend: WeightTrend;
    hydrationAverage: number;
    suggestions: string[];
  }>("/progress/weekly-insights");
}
