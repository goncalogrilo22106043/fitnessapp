import { apiRequest } from "../../api/client";
import { MealDetail } from "../plans/types";

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
