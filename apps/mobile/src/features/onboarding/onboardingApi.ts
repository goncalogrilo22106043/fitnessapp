import { apiRequest } from "../../api/client";

export interface OnboardingInput {
  basic: {
    name?: string;
    sex: "female" | "male";
    age: number;
    heightCentimeters: number;
    weightKilograms: number;
    targetWeightKilograms?: number;
    desiredPace: "calm" | "normal" | "aggressive";
  };
  bodyGoal: "lean_gain" | "maintenance" | "fat_loss";
  dailyRoutine?: {
    wakeTime: string;
    sleepTime: string;
    workType: "seated" | "mixed" | "active";
    hardEatingDays: string[];
    weekendWakeTime?: string;
    weekendBedTime?: string;
    workStartTime?: string;
    workEndTime?: string;
    workDays?: string[];
    canEatAtWork?: boolean;
    accessToKitchenAtWork?: boolean;
    commuteDurationMinutes?: number;
    commuteType?: string;
  };
  mealSchedule?: {
    breakfastTime?: string;
    morningSnackTime?: string;
    lunchTime?: string;
    afternoonSnackTime?: string;
    dinnerTime?: string;
    supperTime?: string;
    mealsUsuallySkipped: string[];
    mealsHardestToFinish: string[];
    weekendMealTimesDifferent: boolean;
  };
  trainingRoutine: {
    trainingDaysPerWeek: number;
    trainingType: string;
    preferredTimes: string[];
    trainingDays: string[];
    trainingTime?: string;
    trainingIntensity: "low" | "moderate" | "high";
    restDays: string[];
    durationMinutes?: number;
    location?: string;
    preWorkoutMealLeadMinutes?: number;
    postWorkoutMealWindowMinutes?: number;
    appetiteAfterTraining?: "low" | "medium" | "high";
  };
  appetiteProfile?: {
    bestAppetiteTime?: string;
    worstAppetiteTime?: string;
    appetiteMorning: "low" | "medium" | "high";
    appetiteLunch?: "low" | "medium" | "high";
    appetiteAfternoon?: "low" | "medium" | "high";
    appetiteDinner?: "low" | "medium" | "high";
    appetiteNight: "low" | "medium" | "high";
    volumeTolerance: "low" | "medium" | "high";
    eatingSpeed?: "slow" | "normal" | "fast";
    needsLongMealTime?: boolean;
    preferredMealTemperature?: "cold" | "warm" | "hot" | "varies";
  };
  toleranceProfile: {
    preferredTextures: Record<string, number>;
    preferredVolumes: Record<string, number>;
    avoidedTextures: string[];
    preferredTextureStyle: "separate" | "mixed";
    nauseaFoods: string[];
    safeFoods: string[];
  };
  foodPreferences: {
    preferredFlavors: Record<string, number>;
    avoidedIngredients: string[];
    safeMealIds: string[];
    favoriteMealIds: string[];
    favoriteFoods: string[];
    dislikedFoods: string[];
    allergies: string[];
    intolerances?: string[];
    dietType: "omnivore" | "vegetarian" | "vegan" | "other";
  };
  budgetProfile: {
    level: "low" | "medium" | "high";
    maxCookingMinutes: number;
    weekendCookingMinutes?: number;
    cookingSkill?: "basic" | "normal" | "advanced";
    batchCookingAvailable?: boolean;
  };
  behaviorProfile?: {
    motivation?: string;
    mainDifficulty?: string;
    typicalReasonForSkippingMeals?: string;
    wantsReminders?: boolean;
    preferredTone?: "calm" | "direct" | "encouraging";
  };
  consent?: {
    aiPersonalizationConsent: boolean;
    dataProcessingConsent: boolean;
  };
  eatingMode: "clean_bulking" | "easy_bulking" | "balanced";
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
