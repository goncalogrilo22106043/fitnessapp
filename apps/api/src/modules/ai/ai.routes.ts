import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { generateMealIdeas } from "../../integrations/ai/meal-ai.gateway.js";
import { prisma } from "../../db/prisma.js";
import { AuthenticatedRequest, authenticate } from "../../http/authenticate.js";
import { getRoutineAnalysis } from "./nutrition-plan.service.js";

export const aiRouter = Router();

const mealIdeasSchema = z.object({
  mealTime: z.enum(["breakfast", "lunch", "snack", "dinner"]),
  notes: z.string().max(500).optional()
});

aiRouter.post("/meal-ideas", authenticate, async (request, response) => {
  const input = mealIdeasSchema.parse(request.body);
  const userId = (request as AuthenticatedRequest).userId;
  const [profile, targets, pantryItems] = await Promise.all([
    prisma.userProfile.findUniqueOrThrow({ where: { userId } }),
    prisma.nutritionTarget.findUnique({ where: { userId } }),
    prisma.pantryItem.findMany({ where: { userId, available: true }, orderBy: { name: "asc" } })
  ]);

  const result = await generateMealIdeas({
    mealTime: input.mealTime,
    ...(input.notes ? { notes: input.notes } : {}),
    profile,
    targets,
    pantryItems: pantryItems.map((item) => ({ name: item.name, category: item.category, quantity: item.quantity }))
  });

  await prisma.$transaction(
    result.ideas.map((idea) =>
      prisma.aiMealSuggestion.create({
        data: {
          userId,
          mealTime: idea.mealTime,
          title: idea.title,
          content: idea as unknown as Prisma.InputJsonValue,
          model: result.model,
          promptHash: result.promptHash
        }
      })
    )
  );

  response.json({
    message: result.usedAi
      ? "Gerei opções com AI usando o teu perfil e o que tens em casa."
      : "Ainda não há chave de AI ativa, por isso usei uma sugestão local com base na tua despensa.",
    ...result
  });
});

aiRouter.post("/routine-analysis", authenticate, async (request, response) => {
  const userId = (request as AuthenticatedRequest).userId;
  const result = await getRoutineAnalysis(userId);

  response.json({
    message: result.source === "openai"
      ? "Analise de rotina criada com AI."
      : result.source === "cache"
        ? "Reutilizei a analise de rotina mais recente."
        : "Usei uma analise deterministica porque a AI nao esta ativa ou falhou.",
    ...result
  });
});
