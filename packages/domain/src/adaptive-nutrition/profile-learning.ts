import { MealFeedback, MealOption, UserNutritionProfile } from "./types.js";

export function learnFromFeedback(
  profile: UserNutritionProfile,
  meal: MealOption,
  feedback: MealFeedback
): UserNutritionProfile {
  const delta = feedback.mood === "loved" ? 0.08 : feedback.mood === "neutral" ? 0.01 : -0.1;
  const eatenAdjustment = (feedback.eatenPercentage - 75) / 500;

  const nextTextureScore = clamp((profile.preferredTextures[meal.dna.texture] ?? 0.6) + delta + eatenAdjustment);
  const nextVolumeScore = clamp((profile.preferredVolumes[meal.dna.volume] ?? 0.6) + delta + eatenAdjustment);

  const preferredFlavors = { ...profile.preferredFlavors };
  for (const flavor of meal.dna.dominantFlavors) {
    preferredFlavors[flavor] = clamp((preferredFlavors[flavor] ?? 0.55) + delta / 2);
  }

  const safeMealIds =
    feedback.mood === "loved" && feedback.eatenPercentage >= 90
      ? Array.from(new Set([...profile.safeMealIds, meal.id]))
      : profile.safeMealIds;

  return {
    ...profile,
    preferredTextures: {
      ...profile.preferredTextures,
      [meal.dna.texture]: nextTextureScore
    },
    preferredVolumes: {
      ...profile.preferredVolumes,
      [meal.dna.volume]: nextVolumeScore
    },
    preferredFlavors,
    safeMealIds
  };
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}
