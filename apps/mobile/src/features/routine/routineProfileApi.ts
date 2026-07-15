import { apiRequest } from "../../api/client";
import { OnboardingInput } from "../onboarding/onboardingApi";

export interface RoutineProfilePayload {
  identity?: {
    name?: string;
    age?: number;
    sex?: "female" | "male";
    heightCm?: number;
    currentWeightKg?: number;
    goalWeightKg?: number;
    bodyGoal?: "lean_gain" | "maintenance" | "fat_loss";
    desiredPace?: "calm" | "normal" | "aggressive";
  };
  work?: {
    wakeTime?: string;
    usualBedTime?: string;
    weekendWakeTime?: string;
    weekendBedTime?: string;
    workType?: "sedentary" | "mixed" | "standing" | "physical" | "irregular";
    workStartTime?: string;
    workEndTime?: string;
    workDays: string[];
    breaksAvailable: string[];
    canEatAtWork?: boolean;
    accessToKitchenAtWork?: boolean;
    activityLevel?: string;
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
    mealTimeFlexibility: Record<string, number>;
    mealsUsuallySkipped: string[];
    mealsHardestToFinish: string[];
    weekendMealTimesDifferent: boolean;
  };
  trainingBlocks?: Array<{
    activityType: string;
    daysOfWeek: string[];
    startTime?: string;
    durationMinutes?: number;
    intensity: "low" | "moderate" | "high";
    location?: string;
    preWorkoutMealLeadMinutes?: number;
    postWorkoutMealWindowMinutes?: number;
    appetiteAfterTraining?: string;
    isFlexibleTime: boolean;
  }>;
  appetite?: {
    appetiteOnWaking?: string;
    appetiteMorning?: string;
    appetiteLunch?: string;
    appetiteAfternoon?: string;
    appetiteDinner?: string;
    appetiteNight?: string;
    bestAppetiteWindow?: string;
    worstAppetiteWindow?: string;
    volumeTolerance?: "low" | "medium" | "high";
    eatingSpeed?: string;
    needsLongMealTime?: boolean;
    preferredMealTemperature?: string;
    platePreference?: string;
  };
  tolerance?: {
    avoidedTextures: string[];
    preferredTextures: string[];
    toleratedTemperatures: string[];
    avoidedTemperatures: string[];
    nauseaFoods: string[];
    temporaryFatigueFoods: string[];
    safeFoods: string[];
    favoriteFoods: string[];
    dislikedFoods: string[];
  };
  lifestyle?: {
    dietType: string;
    allergies: string[];
    intolerances: string[];
    cookingSkill?: string;
    cookingTimeWeekdayMinutes: number;
    cookingTimeWeekendMinutes: number;
    batchCookingAvailable: boolean;
    budgetLevel: "low" | "medium" | "high";
    mealsPerDayPreference: number;
    liquidCaloriesTolerance?: string;
    morningSweetOrSavory?: string;
    planMode: "clean_bulk" | "easy_bulk" | "balanced" | "maintenance" | "fat_loss";
    motivation?: string;
    mainDifficulty?: string;
    typicalReasonForSkippingMeals?: string;
    wantsReminders?: boolean;
    preferredTone?: string;
    hardEatingDays: string[];
  };
}

export function buildRoutineProfilePayload(input: OnboardingInput): RoutineProfilePayload {
  const hardEatingDays = input.dailyRoutine?.hardEatingDays ?? [];
  const trainingDays = input.trainingRoutine.trainingDays;

  return {
    identity: omitUndefined({
      name: input.basic.name,
      age: input.basic.age,
      sex: input.basic.sex,
      heightCm: input.basic.heightCentimeters,
      currentWeightKg: input.basic.weightKilograms,
      goalWeightKg: input.basic.targetWeightKilograms,
      bodyGoal: input.bodyGoal,
      desiredPace: input.basic.desiredPace
    }),
    work: omitUndefined({
      wakeTime: input.dailyRoutine?.wakeTime,
      usualBedTime: input.dailyRoutine?.sleepTime,
      weekendWakeTime: input.dailyRoutine?.weekendWakeTime,
      weekendBedTime: input.dailyRoutine?.weekendBedTime,
      workType: mapWorkType(input.dailyRoutine?.workType),
      workStartTime: input.dailyRoutine?.workStartTime,
      workEndTime: input.dailyRoutine?.workEndTime,
      workDays: input.dailyRoutine?.workDays ?? ["monday", "tuesday", "wednesday", "thursday", "friday"],
      breaksAvailable: [],
      canEatAtWork: input.dailyRoutine?.canEatAtWork ?? true,
      accessToKitchenAtWork: input.dailyRoutine?.accessToKitchenAtWork ?? false,
      activityLevel: input.dailyRoutine?.workType ?? "mixed",
      commuteDurationMinutes: input.dailyRoutine?.commuteDurationMinutes,
      commuteType: input.dailyRoutine?.commuteType
    }),
    mealSchedule: omitUndefined({
      breakfastTime: input.mealSchedule?.breakfastTime || undefined,
      morningSnackTime: input.mealSchedule?.morningSnackTime || undefined,
      lunchTime: input.mealSchedule?.lunchTime || undefined,
      afternoonSnackTime: input.mealSchedule?.afternoonSnackTime || undefined,
      dinnerTime: input.mealSchedule?.dinnerTime || undefined,
      supperTime: input.mealSchedule?.supperTime || undefined,
      mealTimeFlexibility: {
        breakfast: input.appetiteProfile?.appetiteMorning === "low" ? 90 : 45,
        lunch: 45,
        snack: 60,
        dinner: 60
      },
      mealsUsuallySkipped: input.mealSchedule?.mealsUsuallySkipped ?? [],
      mealsHardestToFinish: input.mealSchedule?.mealsHardestToFinish ?? [],
      weekendMealTimesDifferent: input.mealSchedule?.weekendMealTimesDifferent ?? false
    }),
    trainingBlocks: [
      omitUndefined({
        activityType: input.trainingRoutine.trainingType,
        daysOfWeek: trainingDays,
        startTime: input.trainingRoutine.trainingTime,
        durationMinutes: input.trainingRoutine.durationMinutes,
        intensity: input.trainingRoutine.trainingIntensity,
        location: input.trainingRoutine.location,
        preWorkoutMealLeadMinutes: input.trainingRoutine.preWorkoutMealLeadMinutes,
        postWorkoutMealWindowMinutes: input.trainingRoutine.postWorkoutMealWindowMinutes,
        appetiteAfterTraining: input.trainingRoutine.appetiteAfterTraining,
        isFlexibleTime: false
      })
    ],
    appetite: omitUndefined({
      appetiteOnWaking: input.appetiteProfile?.appetiteMorning,
      appetiteMorning: input.appetiteProfile?.appetiteMorning,
      appetiteLunch: input.appetiteProfile?.appetiteLunch,
      appetiteAfternoon: input.appetiteProfile?.appetiteAfternoon,
      appetiteDinner: input.appetiteProfile?.appetiteDinner,
      appetiteNight: input.appetiteProfile?.appetiteNight,
      bestAppetiteWindow: input.appetiteProfile?.bestAppetiteTime,
      worstAppetiteWindow: input.appetiteProfile?.worstAppetiteTime,
      volumeTolerance: input.appetiteProfile?.volumeTolerance,
      eatingSpeed: input.appetiteProfile?.eatingSpeed,
      needsLongMealTime: input.appetiteProfile?.needsLongMealTime,
      preferredMealTemperature: input.appetiteProfile?.preferredMealTemperature,
      platePreference: input.toleranceProfile.preferredTextureStyle
    }),
    tolerance: {
      avoidedTextures: input.toleranceProfile.avoidedTextures,
      preferredTextures: Object.entries(input.toleranceProfile.preferredTextures)
        .filter(([, score]) => score >= 0.7)
        .map(([texture]) => texture),
      toleratedTemperatures: [],
      avoidedTemperatures: [],
      nauseaFoods: input.toleranceProfile.nauseaFoods,
      temporaryFatigueFoods: [],
      safeFoods: input.toleranceProfile.safeFoods,
      favoriteFoods: input.foodPreferences.favoriteFoods,
      dislikedFoods: input.foodPreferences.dislikedFoods
    },
    lifestyle: omitUndefined({
      dietType: input.foodPreferences.dietType,
      allergies: input.foodPreferences.allergies,
      intolerances: input.foodPreferences.intolerances ?? [],
      cookingSkill: input.budgetProfile.cookingSkill,
      cookingTimeWeekdayMinutes: input.budgetProfile.maxCookingMinutes,
      cookingTimeWeekendMinutes: input.budgetProfile.weekendCookingMinutes ?? Math.max(input.budgetProfile.maxCookingMinutes, 30),
      batchCookingAvailable: input.budgetProfile.batchCookingAvailable ?? false,
      budgetLevel: input.budgetProfile.level,
      mealsPerDayPreference: input.mealTimes.length,
      liquidCaloriesTolerance: input.toleranceProfile.avoidedTextures.includes("liquid") ? "low" : "medium",
      morningSweetOrSavory: Object.keys(input.foodPreferences.preferredFlavors)[0] ?? "suave",
      planMode: mapPlanMode(input.eatingMode),
      motivation: input.behaviorProfile?.motivation,
      mainDifficulty: input.behaviorProfile?.mainDifficulty,
      typicalReasonForSkippingMeals: input.behaviorProfile?.typicalReasonForSkippingMeals,
      wantsReminders: input.behaviorProfile?.wantsReminders,
      preferredTone: input.behaviorProfile?.preferredTone,
      hardEatingDays
    })
  };
}

export async function saveRoutineProfile(input: OnboardingInput) {
  return apiRequest<{ message: string; profile: unknown }>("/routine-profile", {
    method: "PUT",
    body: JSON.stringify(buildRoutineProfilePayload(input))
  });
}

export async function saveOnboardingProgress(input: { currentStep: string; completedSteps: string[]; draftData: OnboardingInput }) {
  return apiRequest<{ message: string }>("/routine-profile/progress", {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function completeRoutineProfile() {
  return apiRequest<{ message: string; completedAt: string }>("/routine-profile/complete", {
    method: "POST"
  });
}

export async function saveRoutineConsent(input: { aiPersonalizationConsent: boolean; dataProcessingConsent: boolean }) {
  return apiRequest<{ message: string }>("/routine-profile/consent", {
    method: "PATCH",
    body: JSON.stringify({
      ...input,
      aiConsentVersion: "routine-ai-v1"
    })
  });
}

function mapWorkType(workType?: NonNullable<OnboardingInput["dailyRoutine"]>["workType"]): NonNullable<RoutineProfilePayload["work"]>["workType"] {
  if (workType === "seated") return "sedentary";
  if (workType === "active") return "physical";
  return "mixed";
}

function mapPlanMode(mode: OnboardingInput["eatingMode"]): NonNullable<RoutineProfilePayload["lifestyle"]>["planMode"] {
  if (mode === "clean_bulking") return "clean_bulk";
  if (mode === "easy_bulking") return "easy_bulk";
  return "balanced";
}

function omitUndefined<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as {
    [K in keyof T as undefined extends T[K] ? K : K]: Exclude<T[K], undefined>;
  };
}
