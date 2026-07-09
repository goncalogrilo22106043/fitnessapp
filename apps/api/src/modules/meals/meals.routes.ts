import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { AuthenticatedRequest, authenticate } from "../../http/authenticate.js";

export const mealsRouter = Router();

const mealParamsSchema = z.object({
  mealId: z.string().min(1)
});

const toggleSchema = z.object({
  enabled: z.boolean()
});

mealsRouter.get("/:mealId", authenticate, async (request, response) => {
  const { mealId } = mealParamsSchema.parse(request.params);
  const userId = (request as AuthenticatedRequest).userId;
  const [meal, profile, feedback] = await Promise.all([
    prisma.mealOption.findUniqueOrThrow({ where: { id: mealId } }),
    prisma.userProfile.findUniqueOrThrow({ where: { userId } }),
    prisma.mealFeedback.findMany({
      where: { userId, mealId },
      orderBy: { occurredAt: "desc" },
      take: 8
    })
  ]);

  response.json({
    meal: {
      ...meal,
      isFavorite: meal.isFavorite || profile.favoriteMealIds.includes(meal.id),
      isSafeMeal: meal.isSafeMeal || profile.safeMealIds.includes(meal.id),
      lastFeedback: feedback[0] ?? null,
      feedbackHistory: feedback
    }
  });
});

mealsRouter.patch("/:mealId/favorite", authenticate, async (request, response) => {
  const { mealId } = mealParamsSchema.parse(request.params);
  const { enabled } = toggleSchema.parse(request.body);
  const userId = (request as AuthenticatedRequest).userId;
  await prisma.mealOption.findUniqueOrThrow({ where: { id: mealId } });
  const profile = await prisma.userProfile.findUniqueOrThrow({ where: { userId } });
  const favoriteMealIds = toggleId(profile.favoriteMealIds, mealId, enabled);

  await prisma.userProfile.update({
    where: { userId },
    data: { favoriteMealIds }
  });

  response.json({
    message: enabled ? "Boa escolha - esta refeicao passa a ter prioridade." : "Removi esta refeicao dos favoritos.",
    mealId,
    isFavorite: enabled
  });
});

mealsRouter.patch("/:mealId/safe", authenticate, async (request, response) => {
  const { mealId } = mealParamsSchema.parse(request.params);
  const { enabled } = toggleSchema.parse(request.body);
  const userId = (request as AuthenticatedRequest).userId;
  await prisma.mealOption.findUniqueOrThrow({ where: { id: mealId } });
  const profile = await prisma.userProfile.findUniqueOrThrow({ where: { userId } });
  const safeMealIds = toggleId(profile.safeMealIds, mealId, enabled);

  await prisma.userProfile.update({
    where: { userId },
    data: { safeMealIds }
  });

  response.json({
    message: enabled ? "Marquei como Safe Meal para dias de menor apetite." : "Removi esta refeicao das Safe Meals.",
    mealId,
    isSafeMeal: enabled
  });
});

function toggleId(ids: string[], id: string, enabled: boolean): string[] {
  const uniqueIds = new Set(ids);
  if (enabled) {
    uniqueIds.add(id);
  } else {
    uniqueIds.delete(id);
  }

  return [...uniqueIds];
}
