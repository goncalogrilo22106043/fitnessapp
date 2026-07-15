import { learnFromFeedback } from "@rotina/domain";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { AuthenticatedRequest, authenticate } from "../../http/authenticate.js";
import { analyzeMealFeedback } from "../../integrations/ai/feedback-ai.gateway.js";
import { toDomainFeedback, toDomainMeal, toDomainProfile } from "../meals/meal.mapper.js";

export const feedbackRouter = Router();

const feedbackSchema = z.object({
  mealId: z.string().uuid(),
  mealTime: z.enum(["breakfast", "lunch", "snack", "dinner"]),
  mood: z.enum(["loved", "neutral", "could_not_finish"]),
  eatenPercentage: z.number().int().min(0).max(100),
  hydrationLevel: z.enum(["low", "medium", "high"]).optional(),
  trainingDay: z.boolean().optional(),
  userMood: z.enum(["low", "steady", "high"]).optional(),
  notes: z.string().max(500).optional(),
  issueTags: z.array(z.string().min(1).max(40)).max(8).optional(),
  dislikedIngredients: z.array(z.string().min(1).max(80)).max(8).optional()
});

feedbackRouter.post("/", authenticate, async (request, response) => {
  const input = feedbackSchema.parse(request.body);
  const userId = (request as AuthenticatedRequest).userId;

  const [meal, profile] = await Promise.all([
    prisma.mealOption.findUniqueOrThrow({ where: { id: input.mealId } }),
    prisma.userProfile.findUniqueOrThrow({ where: { userId } })
  ]);
  const learning = await analyzeMealFeedback({
    mealName: meal.name,
    ingredients: meal.ingredients,
    mood: input.mood,
    eatenPercentage: input.eatenPercentage,
    ...(input.notes ? { notes: input.notes } : {}),
    issueTags: input.issueTags ?? []
  });
  const dislikedIngredients = uniqueList([...(input.dislikedIngredients ?? []), ...learning.dislikedIngredients]);
  const issueTags = uniqueList([...(input.issueTags ?? []), ...learning.issueTags]);

  const savedFeedback = await prisma.mealFeedback.create({
    data: {
      userId,
      mealId: input.mealId,
      mood: input.mood,
      eatenPercentage: input.eatenPercentage,
      mealTime: input.mealTime,
      hydrationLevel: input.hydrationLevel ?? null,
      trainingDay: input.trainingDay ?? null,
      userMood: input.userMood ?? null,
      notes: input.notes ?? null,
      issueTags,
      dislikedIngredients,
      aiSummary: learning.summary
    }
  });

  const learnedProfile = learnFromFeedback(
    toDomainProfile(profile),
    toDomainMeal(meal),
    toDomainFeedback(savedFeedback)
  );

  await prisma.userProfile.update({
    where: { userId },
    data: {
      preferredTextures: learnedProfile.preferredTextures,
      preferredVolumes: learnedProfile.preferredVolumes,
      preferredFlavors: learnedProfile.preferredFlavors,
      safeMealIds: learnedProfile.safeMealIds,
      dislikedFoods: uniqueList([...profile.dislikedFoods, ...dislikedIngredients]),
      avoidedIngredients: uniqueList([...profile.avoidedIngredients, ...dislikedIngredients])
    }
  });

  response.status(201).json({
    message: learning.summary || "Obrigado. Vamos adaptar as proximas refeicoes.",
    feedback: savedFeedback,
    learning: {
      dislikedIngredients,
      issueTags,
      usedAi: learning.usedAi
    }
  });
});

function uniqueList(values: string[]) {
  return [...new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))];
}
