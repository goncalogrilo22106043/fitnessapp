import { MealFeedback, MealOption, UserNutritionProfile } from "../../../../../packages/domain/src/index.js";
import { MealFeedback as PrismaFeedback, MealOption as PrismaMealOption, UserProfile } from "@prisma/client";

export function toDomainMeal(meal: PrismaMealOption): MealOption {
  const domainMeal: MealOption = {
    id: meal.id,
    name: meal.name,
    mealTime: meal.mealTime,
    caloriesEstimate: meal.caloriesEstimate,
    proteinEstimate: meal.proteinEstimate,
    budget: meal.budget as MealOption["budget"],
    dna: meal.dna as unknown as MealOption["dna"],
    ingredients: meal.ingredients,
    recipeSteps: meal.recipeSteps,
    isSafeMeal: meal.isSafeMeal,
    isFavorite: meal.isFavorite
  };

  if (meal.carbsEstimate !== null) {
    domainMeal.carbsEstimate = meal.carbsEstimate;
  }

  if (meal.fatEstimate !== null) {
    domainMeal.fatEstimate = meal.fatEstimate;
  }

  if (meal.pausedUntil) {
    domainMeal.pausedUntil = meal.pausedUntil;
  }

  return domainMeal;
}

export function toDomainFeedback(feedback: PrismaFeedback): MealFeedback {
  const domainFeedback: MealFeedback = {
    mealId: feedback.mealId,
    mealTime: feedback.mealTime,
    mood: feedback.mood,
    eatenPercentage: feedback.eatenPercentage,
    occurredAt: feedback.occurredAt
  };

  if (feedback.hydrationLevel) {
    domainFeedback.hydrationLevel = feedback.hydrationLevel;
  }

  if (feedback.trainingDay !== null) {
    domainFeedback.trainingDay = feedback.trainingDay;
  }

  if (isUserMood(feedback.userMood)) {
    domainFeedback.userMood = feedback.userMood;
  }

  return domainFeedback;
}

function isUserMood(value: string | null): value is NonNullable<MealFeedback["userMood"]> {
  return value === "low" || value === "steady" || value === "high";
}

export function toDomainProfile(profile: UserProfile): UserNutritionProfile {
  const domainProfile: UserNutritionProfile = {
    userId: profile.userId,
    preferredTextures: profile.preferredTextures as unknown as UserNutritionProfile["preferredTextures"],
    preferredVolumes: profile.preferredVolumes as unknown as UserNutritionProfile["preferredVolumes"],
    preferredFlavors: profile.preferredFlavors as unknown as UserNutritionProfile["preferredFlavors"],
    avoidedIngredients: profile.avoidedIngredients,
    budgetPreference: profile.budgetPreference as UserNutritionProfile["budgetPreference"],
    cookingTimePreference: profile.cookingTimePreference as UserNutritionProfile["cookingTimePreference"],
    safeMealIds: profile.safeMealIds,
    favoriteMealIds: profile.favoriteMealIds,
    wakeTime: profile.wakeTime,
    sleepTime: profile.sleepTime,
    workType: profile.workType,
    hardEatingDays: profile.hardEatingDays,
    trainingDays: [],
    trainingTime: null,
    trainingIntensity: null,
    appetiteMorning: profile.appetiteMorning,
    appetiteNight: profile.appetiteNight,
    bestAppetiteTime: profile.bestAppetiteTime,
    worstAppetiteTime: profile.worstAppetiteTime,
    volumeTolerance: profile.volumeTolerance,
    avoidedTextures: profile.avoidedTextures,
    preferredTextureStyle: profile.preferredTextureStyle,
    nauseaFoods: profile.nauseaFoods,
    safeFoods: profile.safeFoods,
    favoriteFoods: profile.favoriteFoods,
    dislikedFoods: profile.dislikedFoods,
    allergies: profile.allergies,
    dietType: profile.dietType,
    planMode: profile.planMode,
    desiredPace: profile.desiredPace,
    targetWeightKilograms: profile.targetWeightKilograms
  };

  if (profile.eatingMode === "clean_bulking" || profile.eatingMode === "easy_bulking" || profile.eatingMode === "balanced") {
    domainProfile.eatingMode = profile.eatingMode;
  }

  return domainProfile;
}
