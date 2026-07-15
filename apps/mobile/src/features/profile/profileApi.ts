import { apiRequest } from "../../api/client";

export interface ProfileResponse {
  user: { id: string; email: string; name: string };
  profile: {
    preferredTextures: Record<string, number>;
    preferredVolumes: Record<string, number>;
    preferredFlavors: Record<string, number>;
    avoidedIngredients: string[];
    wakeTime?: string | null;
    sleepTime?: string | null;
    workType?: string | null;
    hardEatingDays: string[];
    targetWeightKilograms?: number | null;
    desiredPace: string;
    appetiteMorning?: string | null;
    appetiteNight?: string | null;
    bestAppetiteTime?: string | null;
    worstAppetiteTime?: string | null;
    volumeTolerance?: string | null;
    avoidedTextures: string[];
    preferredTextureStyle?: string | null;
    nauseaFoods: string[];
    safeFoods: string[];
    favoriteFoods: string[];
    dislikedFoods: string[];
    allergies: string[];
    dietType: string;
    budgetPreference: string;
    eatingMode: "clean_bulking" | "easy_bulking" | "balanced";
    planMode: string;
    bodyGoal: string;
    dailyWaterTargetMl: number;
  } | null;
  targets: {
    bmr: number;
    tdee: number;
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
  } | null;
  routine: {
    trainingDaysPerWeek: number;
    trainingType: string;
    preferredTimes: string[];
    trainingDays: string[];
    trainingTime?: string | null;
    trainingIntensity: string;
    restDays: string[];
  } | null;
  budget: { level: string; maxCookingMinutes: number } | null;
  mealSlots: Array<{ mealTime: string; targetCalories: number; targetProtein: number }>;
}

export async function getProfile() {
  return apiRequest<ProfileResponse>("/profile");
}

export async function updateWaterTarget(dailyWaterTargetMl: number) {
  return apiRequest<{ message: string; profile: ProfileResponse["profile"] }>("/profile/water-target", {
    method: "PATCH",
    body: JSON.stringify({ dailyWaterTargetMl })
  });
}

export async function recalculateTargets() {
  return apiRequest<{ message: string }>("/profile/recalculate-targets", {
    method: "POST",
    body: JSON.stringify({
      sex: "male",
      age: 21,
      heightCentimeters: 171,
      weightKilograms: 64,
      bodyGoal: "lean_gain",
      eatingMode: "easy_bulking",
      trainingDaysPerWeek: 6,
      mealTimes: ["breakfast", "lunch", "snack", "dinner"]
    })
  });
}
