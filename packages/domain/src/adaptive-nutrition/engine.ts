import {
  DailyDashboard,
  DailyPlan,
  MealAlternative,
  MealFeedback,
  MealOption,
  MealTime,
  PlanMeal,
  UserNutritionProfile,
  WeeklyPlan
} from "./types.js";
import { scoreMeal } from "./scoring.js";
import { ENGINE_VERSION, SCORING_WEIGHTS_VERSION } from "./scoring.js";

export interface AdaptiveNutritionEngine {
  generateWeeklyPlan(input: GenerateWeeklyPlanInput): WeeklyPlan;
  suggestSubstitutions(input: SuggestSubstitutionsInput): PlanMeal;
  adaptHardDay(input: AdaptHardDayInput): DailyPlan;
  getDailyDashboard(input: DailyPlan): DailyDashboard;
}

export interface GenerateWeeklyPlanInput {
  userId: string;
  startsOn: string;
  profile: UserNutritionProfile;
  mealOptions: MealOption[];
  feedbackHistory: MealFeedback[];
}

export interface SuggestSubstitutionsInput {
  date: string;
  mealTime: MealTime;
  profile: UserNutritionProfile;
  mealOptions: MealOption[];
  feedbackHistory: MealFeedback[];
  excludedMealIds?: string[];
  referenceMeal?: MealOption;
  preferLowVolume?: boolean;
}

export interface AdaptHardDayInput {
  dailyPlan: DailyPlan;
  profile: UserNutritionProfile;
  mealOptions: MealOption[];
  feedbackHistory: MealFeedback[];
  currentMealTime: MealTime;
}

const mealOrder: MealTime[] = ["breakfast", "lunch", "snack", "dinner"];

export class WeightedAdaptiveNutritionEngine implements AdaptiveNutritionEngine {
  generateWeeklyPlan(input: GenerateWeeklyPlanInput): WeeklyPlan {
    const meals: PlanMeal[] = [];
    const simulatedFeedback = [...input.feedbackHistory];

    for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
      const date = addDays(input.startsOn, dayOffset);

      for (const mealTime of mealOrder) {
        const plannedMeal = this.suggestSubstitutions({
          date,
          mealTime,
          profile: input.profile,
          mealOptions: input.mealOptions,
          feedbackHistory: simulatedFeedback
        });

        meals.push(plannedMeal);

        simulatedFeedback.push({
          mealId: plannedMeal.selected.meal.id,
          mealTime,
          mood: "neutral",
          eatenPercentage: 80,
          occurredAt: new Date(`${date}T12:00:00.000Z`)
        });
      }
    }

    return {
      userId: input.userId,
      startsOn: input.startsOn,
      engineVersion: ENGINE_VERSION,
      scoringWeightsVersion: SCORING_WEIGHTS_VERSION,
      meals
    };
  }

  suggestSubstitutions(input: SuggestSubstitutionsInput): PlanMeal {
    const excludedMealIds = new Set(input.excludedMealIds ?? []);
    const ranked = input.mealOptions
      .map((meal) => applyProfileMealFlags(meal, input.profile))
      .filter((meal) => meal.mealTime === input.mealTime)
      .filter((meal) => !excludedMealIds.has(meal.id))
      .filter((meal) => !isPaused(meal))
      .map((meal) => scoreMeal(meal, input.profile, input.feedbackHistory))
      .map((option) => ({
        ...option,
        score: input.preferLowVolume ? boostLowVolume(option.score, option.meal) : option.score
      }))
      .sort((left, right) => right.score - left.score);

    const selected = ranked[0];
    if (!selected) {
      throw new Error(`No meal options available for ${input.mealTime}`);
    }

    return {
      date: input.date,
      mealTime: input.mealTime,
      selected,
      alternatives: ranked.slice(1, 4)
    };
  }

  adaptHardDay(input: AdaptHardDayInput): DailyPlan {
    const remainingMeals = input.dailyPlan.meals.map((plannedMeal) => {
      if (mealOrder.indexOf(plannedMeal.mealTime) < mealOrder.indexOf(input.currentMealTime)) {
        return plannedMeal;
      }

      return this.suggestSubstitutions({
        date: input.dailyPlan.date,
        mealTime: plannedMeal.mealTime,
        profile: input.profile,
        mealOptions: prioritizeHardDayOptions(input.mealOptions),
        feedbackHistory: input.feedbackHistory,
        preferLowVolume: true
      });
    });

    return {
      ...input.dailyPlan,
      meals: remainingMeals
    };
  }

  getDailyDashboard(input: DailyPlan): DailyDashboard {
    const distinctMeals = new Set(input.meals.map((meal) => meal.selected.meal.id)).size;
    const averageTolerance =
      input.meals.reduce((total, meal) => total + meal.selected.breakdown.mealTolerance, 0) /
      Math.max(input.meals.length, 1);

    return {
      caloriesConsumed: input.consumed.calories,
      calorieTarget: input.targets.calories,
      proteinConsumed: input.consumed.proteinGrams,
      proteinTarget: input.targets.proteinGrams,
      hydrationMilliliters: input.consumed.waterMilliliters,
      appetiteScore: Math.round(averageTolerance * 100),
      foodVarietyIndex: Math.round((distinctMeals / Math.max(input.meals.length, 1)) * 100),
      consistencyScore: Math.round(Math.min(input.consumed.calories / input.targets.calories, 1) * 100),
      meals: input.meals
    };
  }

  suggestMealAlternatives(input: SuggestSubstitutionsInput): MealAlternative[] {
    const excludedMealIds = input.referenceMeal
      ? Array.from(new Set([...(input.excludedMealIds ?? []), input.referenceMeal.id]))
      : input.excludedMealIds;
    const substitutionInput = excludedMealIds ? { ...input, excludedMealIds } : input;
    const planMeal = this.suggestSubstitutions(substitutionInput);
    const referenceMeal = input.referenceMeal ?? planMeal.selected.meal;

    return [planMeal.selected, ...planMeal.alternatives].map((option) => ({
      option,
      macroDistance: calculateMacroDistance(referenceMeal, option.meal),
      reasons: buildAlternativeReasons(referenceMeal, option.meal, option.breakdown)
    }));
  }
}

function applyProfileMealFlags(meal: MealOption, profile: UserNutritionProfile): MealOption {
  return {
    ...meal,
    isFavorite: Boolean(meal.isFavorite || profile.favoriteMealIds?.includes(meal.id)),
    isSafeMeal: Boolean(meal.isSafeMeal || profile.safeMealIds.includes(meal.id))
  };
}

function addDays(isoDate: string, dayOffset: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return date.toISOString().slice(0, 10);
}

export function shouldPauseMealAutomatically(meal: MealOption, feedbackHistory: MealFeedback[]): boolean {
  if (meal.isSafeMeal) {
    return false;
  }

  const recent = feedbackHistory.filter((feedback) => feedback.mealId === meal.id).slice(-3);
  return recent.length >= 2 && recent.every((feedback) => feedback.mood === "could_not_finish");
}

function isPaused(meal: MealOption): boolean {
  return Boolean(meal.pausedUntil && meal.pausedUntil.getTime() > Date.now() && !meal.isSafeMeal);
}

function boostLowVolume(score: number, meal: MealOption): number {
  const boost = meal.isSafeMeal ? 0.08 : meal.dna.volume === "low" ? 0.07 : meal.dna.volume === "medium" ? 0.03 : -0.06;
  return Math.round((score + boost) * 1000) / 1000;
}

function prioritizeHardDayOptions(meals: MealOption[]): MealOption[] {
  return meals.map((meal) => ({
    ...meal,
    isFavorite: Boolean(meal.isFavorite || meal.isSafeMeal)
  }));
}

function calculateMacroDistance(reference: MealOption, option: MealOption): number {
  const calorieDistance = Math.abs(reference.caloriesEstimate - option.caloriesEstimate) / 700;
  const proteinDistance = Math.abs(reference.proteinEstimate - option.proteinEstimate) / 60;
  return Math.round(Math.min(calorieDistance + proteinDistance, 1) * 100) / 100;
}

function buildAlternativeReasons(
  reference: MealOption,
  option: MealOption,
  breakdown: PlanMeal["selected"]["breakdown"]
): string[] {
  const reasons: string[] = [];

  if (calculateMacroDistance(reference, option) <= 0.25) {
    reasons.push("macros semelhantes");
  }

  if (option.dna.volume === "low") {
    reasons.push("menor volume");
  }

  if (breakdown.textureCompatibility >= 0.75) {
    reasons.push("textura mais toleravel");
  }

  if (breakdown.variety >= 0.75) {
    reasons.push("menos repetida");
  }

  if (option.isSafeMeal) {
    reasons.push("Safe Meal");
  }

  return reasons.length > 0 ? reasons : ["opcao equilibrada para adaptar o dia"];
}
