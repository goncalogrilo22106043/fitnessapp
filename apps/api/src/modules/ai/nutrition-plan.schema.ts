import { z } from "zod";

export const routineAnalysisSchema = z.object({
  routineAnalysis: z.object({
    summary: z.string(),
    strongestConstraints: z.array(z.string()),
    appetiteWindows: z.array(z.object({
      label: z.string(),
      timeRange: z.string(),
      appetite: z.enum(["low", "medium", "high", "unknown"]),
      rationale: z.string()
    })),
    difficultWindows: z.array(z.object({
      label: z.string(),
      timeRange: z.string(),
      reason: z.string()
    })),
    trainingNutritionWindows: z.array(z.object({
      dayPattern: z.string(),
      timeRange: z.string(),
      recommendation: z.string()
    })),
    practicalConstraints: z.array(z.string()),
    personalizationSignals: z.array(z.string())
  }),
  dailyStructure: z.object({
    wakeTime: z.string().nullable(),
    bedtime: z.string().nullable(),
    mealSlots: z.array(z.object({
      name: z.string(),
      suggestedTime: z.string(),
      flexibilityMinutes: z.number().int().min(0).max(240),
      targetCalories: z.number().int().min(0),
      targetProtein: z.number().int().min(0),
      targetCarbs: z.number().int().min(0),
      targetFat: z.number().int().min(0),
      desiredVolume: z.enum(["low", "medium", "high"]),
      desiredTextures: z.array(z.string()),
      avoidedTextures: z.array(z.string()),
      preparationTimeLimit: z.number().int().min(0).max(300),
      rationale: z.string()
    }))
  }),
  planRecommendations: z.object({
    trainingDayStrategy: z.string(),
    restDayStrategy: z.string(),
    hardDayStrategy: z.string(),
    hydrationTimeline: z.array(z.object({
      time: z.string(),
      amountMilliliters: z.number().int().min(0),
      rationale: z.string()
    })),
    reminderRecommendations: z.array(z.string()),
    adaptationRules: z.array(z.string())
  }),
  clarifyingQuestions: z.array(z.object({
    id: z.string(),
    question: z.string(),
    reason: z.string(),
    required: z.boolean(),
    answerType: z.enum(["text", "number", "time", "single_choice", "multi_choice", "boolean"])
  }))
});

export type RoutineAnalysisOutput = z.infer<typeof routineAnalysisSchema>;
