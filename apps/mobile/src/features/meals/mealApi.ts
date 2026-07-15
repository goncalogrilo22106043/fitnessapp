import { apiRequest } from "../../api/client";
import { MealDetail } from "../plans/types";

export interface MealOptionListItem extends MealDetail {
  mealTime: "breakfast" | "lunch" | "snack" | "dinner";
  budget: string;
  pausedUntil?: string | null;
  pauseReason?: string | null;
}

export async function getMealOptions(query: Record<string, string | boolean | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const suffix = search.toString() ? `?${search.toString()}` : "";
  return apiRequest<{ meals: MealOptionListItem[] }>(`/meals${suffix}`);
}

export async function getMealDetail(mealId: string) {
  return apiRequest<{ meal: MealDetail }>(`/meals/${mealId}`);
}

export async function setMealFavorite(mealId: string, enabled: boolean) {
  return apiRequest<{ message: string; mealId: string; isFavorite: boolean }>(`/meals/${mealId}/favorite`, {
    method: "PATCH",
    body: JSON.stringify({ enabled })
  });
}

export async function setMealSafe(mealId: string, enabled: boolean) {
  return apiRequest<{ message: string; mealId: string; isSafeMeal: boolean }>(`/meals/${mealId}/safe`, {
    method: "PATCH",
    body: JSON.stringify({ enabled })
  });
}
