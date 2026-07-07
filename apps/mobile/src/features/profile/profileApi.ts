import { apiRequest } from "../../api/client";

export interface ProfileResponse {
  user: { id: string; email: string; name: string };
  profile: {
    preferredTextures: Record<string, number>;
    preferredVolumes: Record<string, number>;
    avoidedIngredients: string[];
    budgetPreference: string;
    eatingMode: "clean_bulking" | "easy_bulking";
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
  routine: { trainingDaysPerWeek: number; trainingType: string } | null;
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
