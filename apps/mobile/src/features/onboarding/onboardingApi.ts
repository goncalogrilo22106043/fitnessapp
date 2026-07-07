import { apiRequest } from "../../api/client";

export interface OnboardingInput {
  basic: {
    sex: "female" | "male";
    age: number;
    heightCentimeters: number;
    weightKilograms: number;
  };
  bodyGoal: "lean_gain" | "maintenance" | "fat_loss";
  trainingRoutine: {
    trainingDaysPerWeek: number;
    trainingType: string;
    preferredTimes: string[];
  };
  toleranceProfile: {
    preferredTextures: Record<string, number>;
    preferredVolumes: Record<string, number>;
  };
  foodPreferences: {
    preferredFlavors: Record<string, number>;
    avoidedIngredients: string[];
    safeMealIds: string[];
    favoriteMealIds: string[];
  };
  budgetProfile: {
    level: "low" | "medium" | "high";
    maxCookingMinutes: number;
  };
  eatingMode: "clean_bulking" | "easy_bulking";
  mealTimes: Array<"breakfast" | "lunch" | "snack" | "dinner">;
}

export async function saveOnboarding(input: OnboardingInput) {
  return apiRequest<{
    message: string;
    nutrition: {
      bmr: number;
      tdee: number;
      targets: {
        calories: number;
        proteinGrams: number;
        carbsGrams: number;
        fatGrams: number;
      };
    };
  }>("/onboarding", {
    method: "PUT",
    body: JSON.stringify(input)
  });
}
