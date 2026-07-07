import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { scoreMeal } from "./scoring.js";
import { ENGINE_VERSION, SCORING_WEIGHTS_VERSION } from "./scoring.js";
import { shouldPauseMealAutomatically, WeightedAdaptiveNutritionEngine } from "./engine.js";
import { summarizeHydration } from "./progress.js";
import { calculateWaterTarget } from "./onboarding.js";
import { MealFeedback, MealOption, UserNutritionProfile } from "./types.js";

const profile: UserNutritionProfile = {
  userId: "user-1",
  preferredTextures: { creamy: 0.9, dry: 0.35, soft: 0.75 },
  preferredVolumes: { low: 0.9, medium: 0.75, high: 0.3 },
  preferredFlavors: {},
  avoidedIngredients: [],
  budgetPreference: "medium",
  cookingTimePreference: "quick",
  safeMealIds: ["safe"]
};

const safeMeal: MealOption = {
  id: "safe",
  name: "Iogurte proteico",
  mealTime: "breakfast",
  caloriesEstimate: 420,
  proteinEstimate: 35,
  budget: "low",
  isSafeMeal: true,
  dna: {
    texture: "creamy",
    temperature: "cold",
    volume: "low",
    cookingTime: "quick",
    dominantFlavors: ["doce"],
    proteinSources: ["iogurte"],
    tags: []
  }
};

const dryMeal: MealOption = {
  id: "dry",
  name: "Tostas secas com peru",
  mealTime: "breakfast",
  caloriesEstimate: 410,
  proteinEstimate: 34,
  budget: "medium",
  dna: {
    texture: "dry",
    temperature: "room",
    volume: "high",
    cookingTime: "quick",
    dominantFlavors: ["salgado"],
    proteinSources: ["peru"],
    tags: []
  }
};

const favoriteMeal: MealOption = {
  ...dryMeal,
  id: "favorite",
  name: "Wrap favorito",
  isFavorite: true,
  dna: { ...dryMeal.dna, texture: "soft", volume: "medium" }
};

describe("Adaptive Nutrition Engine", () => {
  it("calculates Meal Tolerance Score from feedback", () => {
    const scored = scoreMeal(dryMeal, profile, [
      feedback("dry", "could_not_finish", 30),
      feedback("dry", "neutral", 80)
    ]);

    assert.ok(scored.breakdown.mealTolerance < 0.5);
  });

  it("calculates weighted Meal Score", () => {
    const scored = scoreMeal(safeMeal, profile, []);
    const expected =
      scored.breakdown.mealTolerance * 0.35 +
      scored.breakdown.variety * 0.2 +
      scored.breakdown.volumeCompatibility * 0.15 +
      scored.breakdown.textureCompatibility * 0.1 +
      scored.breakdown.recentFeedback * 0.1 +
      scored.breakdown.budgetCompatibility * 0.05 +
      scored.breakdown.cookingTime * 0.05;

    assert.equal(scored.score, Math.round(expected * 1000) / 1000);
  });

  it("does not automatically pause Safe Meals", () => {
    assert.equal(
      shouldPauseMealAutomatically(safeMeal, [
        feedback("safe", "could_not_finish", 10),
        feedback("safe", "could_not_finish", 20)
      ]),
      false
    );
  });

  it("negative feedback reduces meal priority", () => {
    const neutral = scoreMeal(dryMeal, profile, []);
    const negative = scoreMeal(dryMeal, profile, [feedback("dry", "could_not_finish", 25)]);

    assert.ok(negative.score < neutral.score);
  });

  it("positive feedback increases meal priority", () => {
    const neutral = scoreMeal(dryMeal, profile, []);
    const positive = scoreMeal(dryMeal, profile, [feedback("dry", "loved", 100)]);

    assert.ok(positive.score > neutral.score);
  });

  it("repeated meals lose Variety Score", () => {
    const scored = scoreMeal(dryMeal, profile, [
      feedback("dry", "neutral", 80),
      feedback("dry", "neutral", 80),
      feedback("dry", "neutral", 80)
    ]);

    assert.ok(scored.breakdown.variety < 0.5);
  });

  it("paused meals do not enter the plan", () => {
    const engine = new WeightedAdaptiveNutritionEngine();
    const pausedMeal = { ...safeMeal, id: "paused", isSafeMeal: false, pausedUntil: tomorrow() };
    const planMeal = engine.suggestSubstitutions({
      date: "2026-07-07",
      mealTime: "breakfast",
      profile,
      mealOptions: [pausedMeal, dryMeal],
      feedbackHistory: []
    });

    assert.notEqual(planMeal.selected.meal.id, "paused");
  });

  it("favorite meals can repeat more before losing variety", () => {
    const repeatedFavorite = scoreMeal(favoriteMeal, profile, [
      feedback("favorite", "neutral", 80),
      feedback("favorite", "neutral", 80),
      feedback("favorite", "neutral", 80)
    ]);
    const repeatedRegular = scoreMeal(dryMeal, profile, [
      feedback("dry", "neutral", 80),
      feedback("dry", "neutral", 80),
      feedback("dry", "neutral", 80)
    ]);

    assert.ok(repeatedFavorite.breakdown.variety > repeatedRegular.breakdown.variety);
  });

  it("detects nausea risk", () => {
    const scored = scoreMeal(dryMeal, profile, [
      feedback("dry", "could_not_finish", 20),
      feedback("dry", "could_not_finish", 20),
      feedback("dry", "neutral", 70),
      feedback("dry", "neutral", 70)
    ]);

    assert.equal(scored.nauseaRisk.level, "high");
  });

  it("generates nutritionally similar alternatives", () => {
    const engine = new WeightedAdaptiveNutritionEngine();
    const alternatives = engine.suggestMealAlternatives({
      date: "2026-07-07",
      mealTime: "breakfast",
      profile,
      referenceMeal: safeMeal,
      mealOptions: [safeMeal, dryMeal, favoriteMeal],
      feedbackHistory: []
    });

    assert.ok(alternatives.some((alternative) => alternative.reasons.includes("macros semelhantes")));
  });

  it("stores algorithm versions in generated plans", () => {
    const engine = new WeightedAdaptiveNutritionEngine();
    const plan = engine.generateWeeklyPlan({
      userId: "user-1",
      startsOn: "2026-07-07",
      profile,
      mealOptions: [safeMeal, dryMeal, { ...safeMeal, id: "lunch", mealTime: "lunch" }, { ...safeMeal, id: "snack", mealTime: "snack" }, { ...safeMeal, id: "dinner", mealTime: "dinner" }],
      feedbackHistory: []
    });

    assert.equal(plan.engineVersion, ENGINE_VERSION);
    assert.equal(plan.scoringWeightsVersion, SCORING_WEIGHTS_VERSION);
  });

  it("hard-day adaptation creates a changed daily plan without mutating original", () => {
    const engine = new WeightedAdaptiveNutritionEngine();
    const original = {
      userId: "user-1",
      date: "2026-07-07",
      version: 1,
      engineVersion: ENGINE_VERSION,
      scoringWeightsVersion: SCORING_WEIGHTS_VERSION,
      targets: { calories: 2600, proteinGrams: 160, carbsGrams: 300, fatGrams: 70 },
      consumed: { calories: 0, proteinGrams: 0, waterMilliliters: 0 },
      meals: [
        engine.suggestSubstitutions({
          date: "2026-07-07",
          mealTime: "breakfast",
          profile,
          mealOptions: [dryMeal, safeMeal],
          feedbackHistory: []
        })
      ]
    };

    const adapted = engine.adaptHardDay({
      dailyPlan: original,
      currentMealTime: "breakfast",
      profile,
      mealOptions: [dryMeal, safeMeal],
      feedbackHistory: []
    });

    assert.notEqual(adapted, original);
    assert.equal(original.version, 1);
  });

  it("summarizes hydration progress and timeline", () => {
    const summary = summarizeHydration({
      targetMilliliters: 2500,
      logs: [
        { amountMilliliters: 300, occurredAt: new Date("2026-07-07T12:00:00.000Z") },
        { amountMilliliters: 200, occurredAt: new Date("2026-07-07T08:00:00.000Z") }
      ]
    });

    assert.equal(summary.consumedMilliliters, 500);
    assert.equal(summary.progress, 20);
    assert.equal(summary.timeline[0]?.amountMilliliters, 200);
  });

  it("suggests daily water target from body weight", () => {
    assert.equal(calculateWaterTarget(64), 2240);
  });
});

function feedback(mealId: string, mood: MealFeedback["mood"], eatenPercentage: number): MealFeedback {
  return {
    mealId,
    mood,
    eatenPercentage,
    mealTime: "breakfast",
    occurredAt: new Date("2026-07-07T12:00:00.000Z")
  };
}

function tomorrow(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date;
}
