import { apiRequest } from "../../api/client";
import { DailyDashboard, FeedbackMood, MealAlternative, WeeklyPlan } from "./types";

export async function createWeeklyPlan(startsOn: string) {
  return apiRequest<WeeklyPlan>("/plans/weekly", {
    method: "POST",
    body: JSON.stringify({ startsOn })
  });
}

export async function sendMealFeedback(input: {
  mealId: string;
  mealTime: string;
  mood: FeedbackMood;
  eatenPercentage: number;
}) {
  return apiRequest<{ message: string }>("/feedback", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function getDailyDashboard(date: string) {
  return apiRequest<DailyDashboard>(`/plans/daily?date=${date}`);
}

export async function activateHardDay(date: string) {
  return apiRequest<{ message: string; dailyPlan: unknown }>("/plans/daily/hard-day", {
    method: "POST",
    body: JSON.stringify({ date })
  });
}

export async function getSubstitutions(input: { date: string; mealTime: string; referenceMealId: string }) {
  return apiRequest<{ alternatives: MealAlternative[] }>(
    `/plans/substitutions?date=${input.date}&mealTime=${input.mealTime}&referenceMealId=${input.referenceMealId}`
  );
}

export async function swapMeal(input: { date: string; mealTime: string; referenceMealId: string; selectedMealId: string }) {
  return apiRequest<{ message: string }>("/plans/swap", {
    method: "POST",
    body: JSON.stringify(input)
  });
}
