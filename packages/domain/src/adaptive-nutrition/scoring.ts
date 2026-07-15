import {
  BudgetLevel,
  CookingTimeLevel,
  MealFeedback,
  MealOption,
  MealScoreBreakdown,
  ScoredMealOption,
  UserNutritionProfile,
  VolumeLevel
} from "./types.js";

export const ENGINE_VERSION = "adaptive-weighted-v1";
export const SCORING_WEIGHTS_VERSION = "score-weights-v1";

export const scoreWeights: Record<keyof MealScoreBreakdown, number> = {
  mealTolerance: 0.35,
  variety: 0.2,
  volumeCompatibility: 0.15,
  textureCompatibility: 0.1,
  recentFeedback: 0.1,
  budgetCompatibility: 0.05,
  cookingTime: 0.05
};

const orderedLevels = ["low", "medium", "high"] as const;
const orderedCookingTime = ["quick", "standard", "slow"] as const;

export function scoreMeal(
  meal: MealOption,
  profile: UserNutritionProfile,
  feedbackHistory: MealFeedback[]
): ScoredMealOption {
  const mealFeedback = feedbackHistory.filter((feedback) => feedback.mealId === meal.id);
  const recentFeedbackWindow = feedbackHistory.slice(-14);

  const breakdown: MealScoreBreakdown = {
    mealTolerance: calculateMealTolerance(meal, profile, mealFeedback),
    variety: calculateVariety(meal, recentFeedbackWindow),
    volumeCompatibility: applyProfileVolumeContext(
      meal,
      profile,
      calculateLevelCompatibility(meal.dna.volume, profile.preferredVolumes, "medium")
    ),
    textureCompatibility: normalizePreference(profile.preferredTextures[meal.dna.texture], 0.65),
    recentFeedback: calculateRecentFeedback(mealFeedback),
    budgetCompatibility: calculateOrderedCompatibility(meal.budget, profile.budgetPreference, orderedLevels),
    cookingTime: calculateOrderedCompatibility(meal.dna.cookingTime, profile.cookingTimePreference, orderedCookingTime)
  };

  const weightedScore = Object.entries(breakdown).reduce((total, [key, value]) => {
    return total + value * scoreWeights[key as keyof MealScoreBreakdown];
  }, 0);
  const score = applyEatingModeBias(meal, profile, weightedScore);

  return {
    meal,
    score: roundScore(score),
    breakdown,
    rationale: buildRationale(meal, breakdown),
    nauseaRisk: detectNauseaRisk(meal, mealFeedback, feedbackHistory)
  };
}

function applyEatingModeBias(meal: MealOption, profile: UserNutritionProfile, score: number): number {
  const tags = [...meal.dna.tags, ...meal.dna.dominantFlavors, meal.name].join(" ").toLowerCase();
  const mode = profile.planMode ?? profile.eatingMode;

  if (mode === "easy_bulking" && (tags.includes("wrap") || tags.includes("iogurte") || tags.includes("aveia") || meal.dna.volume === "low")) {
    return clamp(score + 0.08);
  }

  if (mode === "clean_bulking" && (tags.includes("arroz") || tags.includes("batata") || tags.includes("ovos") || tags.includes("fruta"))) {
    return clamp(score + 0.06);
  }

  if (mode === "balanced") {
    return clamp(score + (meal.dna.volume === "medium" ? 0.03 : 0));
  }

  return score;
}

export function calculateMealTolerance(
  meal: MealOption,
  profile: UserNutritionProfile,
  mealFeedback: MealFeedback[]
): number {
  const avoidedIngredients = [...profile.avoidedIngredients, ...(profile.dislikedFoods ?? []), ...(profile.nauseaFoods ?? [])]
    .map((ingredient) => ingredient.toLowerCase());
  const mealTags = [...meal.dna.tags, meal.name, ...meal.dna.dominantFlavors].map((tag) => tag.toLowerCase());
  if (avoidedIngredients.some((ingredient) => mealTags.some((tag) => tag.includes(ingredient)))) {
    return 0.05;
  }

  if ((profile.avoidedTextures ?? []).includes(meal.dna.texture)) {
    return 0.18;
  }

  if (meal.isSafeMeal || profile.safeMealIds.includes(meal.id)) {
    return mealFeedback.some((feedback) => feedback.mood === "loved") ? 0.96 : 0.9;
  }

  if ((profile.safeFoods ?? []).some((food) => mealTags.some((tag) => tag.includes(food.toLowerCase())))) {
    return 0.82;
  }

  if (mealFeedback.length === 0) {
    return 0.62;
  }

  const feedbackScore = mealFeedback.reduce((total, feedback) => {
    const moodScore = feedback.mood === "loved" ? 1 : feedback.mood === "neutral" ? 0.68 : 0.25;
    return total + moodScore * (feedback.eatenPercentage / 100);
  }, 0);

  return clamp(feedbackScore / mealFeedback.length);
}

export function calculateVariety(meal: MealOption, recentFeedback: MealFeedback[]): number {
  const repetitions = recentFeedback.filter((feedback) => feedback.mealId === meal.id).length;
  if (repetitions === 0) {
    return 1;
  }

  const repetitionPenalty = meal.isFavorite || meal.isSafeMeal ? 0.08 : 0.18;
  return clamp(1 - repetitions * repetitionPenalty);
}

function calculateRecentFeedback(mealFeedback: MealFeedback[]): number {
  const last = mealFeedback.at(-1);
  if (!last) {
    return 0.65;
  }

  if (last.mood === "loved") {
    return 0.95;
  }

  if (last.mood === "neutral") {
    return 0.68;
  }

  return last.eatenPercentage >= 70 ? 0.5 : 0.22;
}

function calculateLevelCompatibility(
  level: VolumeLevel,
  preferences: Partial<Record<VolumeLevel, number>>,
  fallback: VolumeLevel
): number {
  return normalizePreference(preferences[level] ?? preferences[fallback], 0.65);
}

function calculateOrderedCompatibility<T extends BudgetLevel | CookingTimeLevel>(
  current: T,
  preferred: T,
  ordered: readonly T[]
): number {
  const distance = Math.abs(ordered.indexOf(current) - ordered.indexOf(preferred));
  return clamp(1 - distance * 0.28);
}

function normalizePreference(value: number | undefined, fallback: number): number {
  return clamp(value ?? fallback);
}

function buildRationale(meal: MealOption, breakdown: MealScoreBreakdown): string[] {
  const rationale: string[] = [];

  if (breakdown.mealTolerance >= 0.85) {
    rationale.push("Boa tolerancia prevista para hoje.");
  }

  if (breakdown.variety <= 0.55) {
    rationale.push("Parece que esta refeicao ja apareceu muitas vezes recentemente.");
  }

  if (breakdown.volumeCompatibility >= 0.8) {
    rationale.push(`Escolhi esta opcao porque tem volume ${meal.dna.volume} ajustado ao teu padrao recente.`);
  }

  if (meal.isSafeMeal) {
    rationale.push("E uma Safe Meal, por isso tende a ser mais facil de manter.");
  }

  if (meal.dna.texture === "creamy" || meal.dna.texture === "liquid") {
    rationale.push("A textura tende a ser mais facil em dias de menor apetite.");
  }

  return rationale.length > 0 ? rationale : ["Vamos adaptar com uma opcao equilibrada."];
}

function applyProfileVolumeContext(meal: MealOption, profile: UserNutritionProfile, base: number): number {
  const lowAppetiteMorning = profile.appetiteMorning === "low" && meal.mealTime === "breakfast";
  const lowVolumeTolerance = profile.volumeTolerance === "low";
  const hardDayBias = (profile.hardEatingDays ?? []).length > 0;

  if ((lowAppetiteMorning || lowVolumeTolerance || hardDayBias) && meal.dna.volume === "low") {
    return clamp(base + 0.18);
  }

  if ((lowAppetiteMorning || lowVolumeTolerance) && meal.dna.volume === "high") {
    return clamp(base - 0.25);
  }

  return base;
}

export function detectNauseaRisk(
  meal: MealOption,
  mealFeedback: MealFeedback[],
  recentFeedback: MealFeedback[]
): { level: "low" | "medium" | "high"; reasons: string[] } {
  const reasons: string[] = [];
  const recentMealFeedback = mealFeedback.slice(-3);
  const couldNotFinishCount = recentMealFeedback.filter((feedback) => feedback.mood === "could_not_finish").length;
  const weeklyRepetitions = recentFeedback.slice(-14).filter((feedback) => feedback.mealId === meal.id).length;

  if (couldNotFinishCount >= 2) {
    reasons.push("teve sinais recentes de baixa tolerancia");
  }

  if (weeklyRepetitions >= 4 && !meal.isFavorite && !meal.isSafeMeal) {
    reasons.push("apareceu muitas vezes recentemente");
  }

  if (meal.dna.volume === "high") {
    reasons.push("tem volume alto");
  }

  if (reasons.length >= 2) {
    return { level: "high", reasons };
  }

  if (reasons.length === 1) {
    return { level: "medium", reasons };
  }

  return { level: "low", reasons: ["boa tolerancia prevista"] };
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function roundScore(value: number): number {
  return Math.round(value * 1000) / 1000;
}
