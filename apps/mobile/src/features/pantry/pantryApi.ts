import { apiRequest } from "../../api/client";

export interface PantryItem {
  id: string;
  name: string;
  category: string;
  quantity?: string | null;
  available: boolean;
}

export interface AiMealIdea {
  title: string;
  mealTime: "breakfast" | "lunch" | "snack" | "dinner";
  why: string;
  ingredientsToUse: string[];
  missingIngredients: string[];
  estimatedCalories: number;
  estimatedProteinGrams: number;
  prepSteps: string[];
  texture: string;
  volume: "low" | "medium" | "high";
}

export async function getPantry() {
  return apiRequest<{ items: PantryItem[] }>("/pantry");
}

export async function savePantryItems(items: Array<{ name: string; category: string; quantity?: string; available: boolean }>) {
  return apiRequest<{ message: string; items: PantryItem[] }>("/pantry", {
    method: "PUT",
    body: JSON.stringify({ items })
  });
}

export async function generateMealIdeas(input: { mealTime: AiMealIdea["mealTime"]; notes?: string }) {
  return apiRequest<{ message: string; model: string; usedAi: boolean; ideas: AiMealIdea[] }>("/ai/meal-ideas", {
    method: "POST",
    body: JSON.stringify(input)
  });
}
