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
      await queryClient.invalidateQueries({ queryKey: ["plan"] });
    }
  });
}
