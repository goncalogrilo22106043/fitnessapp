export type FeedbackMood = "loved" | "neutral" | "could_not_finish";

export interface PlanMeal {
  date: string;
  mealTime: "breakfast" | "lunch" | "snack" | "dinner";
  selected: {
    score: number;
    meal: {
      id: string;
      name: string;
      caloriesEstimate: number;
      proteinEstimate: number;
      carbsEstimate?: number;
      fatEstimate?: number;
      ingredients?: string[];
      recipeSteps?: string[];
      isFavorite?: boolean;
      isSafeMeal?: boolean;
      dna: {
        volume: "low" | "medium" | "high";
        texture: string;
        cookingTime: string;
        dominantFlavors: string[];
      };
    };
    rationale: string[];
  };
  alternatives: PlanMeal["selected"][];
}

export interface WeeklyPlan {
  id: string;
  userId: string;
  startsOn: string;
  meals: PlanMeal[];
}

export interface DailyDashboard {
  caloriesConsumed: number;
  calorieTarget: number;
  proteinConsumed: number;
  proteinTarget: number;
  hydrationMilliliters: number;
  appetiteScore: number;
  foodVarietyIndex: number;
  consistencyScore: number;
  meals: PlanMeal[];
}

export interface MealAlternative {
  option: PlanMeal["selected"];
  reasons: string[];
  macroDistance: number;
}

export interface MealDetail {
  id: string;
  name: string;
  caloriesEstimate: number;
  proteinEstimate: number;
  carbsEstimate?: number | null;
  fatEstimate?: number | null;
  ingredients: string[];
  recipeSteps: string[];
  isFavorite: boolean;
  isSafeMeal: boolean;
  dna: PlanMeal["selected"]["meal"]["dna"];
  lastFeedback: {
    mood: FeedbackMood;
    eatenPercentage: number;
    occurredAt: string;
  } | null;
  feedbackHistory: Array<{
    id: string;
    mood: FeedbackMood;
    eatenPercentage: number;
    occurredAt: string;
  }>;
}
