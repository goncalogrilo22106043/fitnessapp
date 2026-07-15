import { BodyGoal, EatingMode, MealSlot, MealTime, NutritionTargets, Sex } from "./types.js";

export interface OnboardingProfileInput {
  sex: Sex;
  age: number;
  heightCentimeters: number;
  weightKilograms: number;
  bodyGoal: BodyGoal;
  eatingMode: EatingMode;
  trainingDaysPerWeek: number;
  mealTimes: MealTime[];
}

export interface OnboardingNutritionResult {
  bmr: number;
  tdee: number;
  targets: NutritionTargets;
  dailyWaterTargetMl: number;
  mealSlots: MealSlot[];
}

export function calculateOnboardingNutrition(input: OnboardingProfileInput): OnboardingNutritionResult {
  const bmr = calculateBmr(input);
  const tdee = Math.round(bmr * activityMultiplier(input.trainingDaysPerWeek));
  const calorieDelta = input.bodyGoal === "lean_gain" ? 250 : input.bodyGoal === "fat_loss" ? -350 : 0;
  const modeDelta = input.eatingMode === "easy_bulking" ? 150 : input.eatingMode === "balanced" ? 75 : 0;
  const calories = Math.round(tdee + calorieDelta + modeDelta);
  const proteinGrams = Math.round(input.weightKilograms * 2);
  const fatGrams = Math.round(input.weightKilograms * 0.8);
  const carbsGrams = Math.max(Math.round((calories - proteinGrams * 4 - fatGrams * 9) / 4), 0);
  const targets = { calories, proteinGrams, carbsGrams, fatGrams };

  return {
    bmr,
    tdee,
    targets,
    dailyWaterTargetMl: calculateWaterTarget(input.weightKilograms),
    mealSlots: createMealSlots(input.mealTimes, targets)
  };
}

export function calculateWaterTarget(weightKilograms: number): number {
  return Math.round(weightKilograms * 35);
}

function calculateBmr(input: OnboardingProfileInput): number {
  const sexConstant = input.sex === "male" ? 5 : -161;
  return Math.round(10 * input.weightKilograms + 6.25 * input.heightCentimeters - 5 * input.age + sexConstant);
}

function activityMultiplier(trainingDaysPerWeek: number): number {
  if (trainingDaysPerWeek >= 5) {
    return 1.62;
  }

  if (trainingDaysPerWeek >= 3) {
    return 1.45;
  }

  if (trainingDaysPerWeek >= 1) {
    return 1.32;
  }

  return 1.2;
}

function createMealSlots(mealTimes: MealTime[], targets: NutritionTargets): MealSlot[] {
  return mealTimes.map((mealTime, index) => ({
    id: `${mealTime}-${index + 1}`,
    mealTime,
    targetCalories: Math.round(targets.calories / mealTimes.length),
    targetProtein: Math.round(targets.proteinGrams / mealTimes.length)
  }));
}
