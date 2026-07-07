import { learnFromFeedback } from "@rotina/domain";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { AuthenticatedRequest, authenticate } from "../../http/authenticate.js";
import { toDomainFeedback, toDomainMeal, toDomainProfile } from "../meals/meal.mapper.js";

export const feedbackRouter = Router();

const feedbackSchema = z.object({
  mealId: z.string().uuid(),
  mealTime: z.enum(["breakfast", "lunch", "snack", "dinner"]),
  mood: z.enum(["loved", "neutral", "could_not_finish"]),
  eatenPercentage: z.number().int().min(0).max(100),
  hydrationLevel: z.enum(["low", "medium", "high"]).optional(),
  trainingDay: z.boolean().optional(),
  userMood: z.enum(["low", "steady", "high"]).optional()
});

feedbackRouter.post("/", authenticate, async (request, response) => {
  const input = feedbackSchema.parse(request.body);
  const userId = (request as AuthenticatedRequest).userId;

  const [meal, profile] = await Promise.all([
    prisma.mealOption.findUniqueOrThrow({ where: { id: input.mealId } }),
    prisma.userProfile.findUniqueOrThrow({ where: { userId } })
  ]);

  const savedFeedback = await prisma.mealFeedback.create({
    data: {
      userId,
      mealId: input.mealId,
      mood: input.mood,
      eatenPercentage: input.eatenPercentage,
      mealTime: input.mealTime,
      hydrationLevel: input.hydrationLevel ?? null,
      trainingDay: input.trainingDay ?? null,
      userMood: input.userMood ?? null
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
      safeMealIds: learnedProfile.safeMealIds
    }
  });

  response.status(201).json({
    message: "Obrigado. Vamos adaptar as proximas refeicoes.",
    feedback: savedFeedback
  });
});
