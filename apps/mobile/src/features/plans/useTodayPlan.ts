import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createWeeklyPlan, sendMealFeedback } from "./planApi";

export function useCreatePlan() {
  return useMutation({
    mutationFn: () => createWeeklyPlan(new Date().toISOString().slice(0, 10))
  });
}

export function useFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendMealFeedback,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["daily-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["meal-history"] }),
        queryClient.invalidateQueries({ queryKey: ["weekly-insights"] }),
        queryClient.invalidateQueries({ queryKey: ["profile-lite"] }),
        queryClient.invalidateQueries({ queryKey: ["meal-detail"] })
      ]);
    }
  });
}
