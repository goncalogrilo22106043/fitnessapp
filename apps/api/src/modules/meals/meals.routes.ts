import { Router } from "express";
import { Prisma } from "@prisma/client";
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

const listSchema = z.object({
  mealTime: z.enum(["breakfast", "lunch", "snack", "dinner"]).optional(),
  texture: z.string().optional(),
  volume: z.enum(["low", "medium", "high"]).optional(),
  favorite: z.coerce.boolean().optional(),
  safe: z.coerce.boolean().optional(),
  paused: z.coerce.boolean().optional()
});

const createMealSchema = z.object({
  name: z.string().min(3).max(120),
  mealTime: z.enum(["breakfast", "lunch", "snack", "dinner"]),
  caloriesEstimate: z.number().int().min(50).max(1800),
  proteinEstimate: z.number().int().min(0).max(160),
  carbsEstimate: z.number().int().min(0).max(300).optional(),
  fatEstimate: z.number().int().min(0).max(150).optional(),
  budget: z.enum(["low", "medium", "high"]).default("medium"),
  ingredients: z.array(z.string()).default([]),
  recipeSteps: z.array(z.string()).default([]),
  dna: z.object({
    texture: z.enum(["dry", "creamy", "liquid", "crunchy", "soft", "mixed"]),
    temperature: z.enum(["hot", "cold", "room"]).default("room"),
    volume: z.enum(["low", "medium", "high"]),
    cookingTime: z.enum(["quick", "standard", "slow"]).default("quick"),
    dominantFlavors: z.array(z.string()).default([]),
    proteinSources: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([])
  })
});

mealsRouter.get("/", authenticate, async (request, response) => {
  const input = listSchema.parse(request.query);
  const userId = (request as AuthenticatedRequest).userId;
  const where: Prisma.MealOptionWhereInput = {};
  if (input.mealTime) where.mealTime = input.mealTime;
  if (input.volume) where.dna = { path: ["volume"], equals: input.volume };
  if (input.texture) where.dna = { path: ["texture"], equals: input.texture };
  if (input.paused === true) where.pausedUntil = { not: null };
  if (input.paused === false) where.pausedUntil = null;
  const [meals, profile] = await Promise.all([
    prisma.mealOption.findMany({
      where,
      orderBy: { createdAt: "desc" }
    }),
    prisma.userProfile.findUniqueOrThrow({ where: { userId } })
  ]);
  const hydrated = meals
    .map((meal) => ({
      ...meal,
      isFavorite: meal.isFavorite || profile.favoriteMealIds.includes(meal.id),
      isSafeMeal: meal.isSafeMeal || profile.safeMealIds.includes(meal.id),
      pauseReason: meal.pausedUntil ? "Pausada temporariamente para reduzir risco de enjoo alimentar." : null
    }))
    .filter((meal) => (input.favorite === undefined ? true : meal.isFavorite === input.favorite))
    .filter((meal) => (input.safe === undefined ? true : meal.isSafeMeal === input.safe));

  response.json({ meals: hydrated });
});

mealsRouter.post("/", authenticate, async (request, response) => {
  const input = createMealSchema.parse(request.body);
  const meal = await prisma.mealOption.create({
    data: {
      name: input.name,
      mealTime: input.mealTime,
      caloriesEstimate: input.caloriesEstimate,
      proteinEstimate: input.proteinEstimate,
      carbsEstimate: input.carbsEstimate ?? null,
      fatEstimate: input.fatEstimate ?? null,
      budget: input.budget,
      ingredients: input.ingredients,
      recipeSteps: input.recipeSteps,
      dna: input.dna
    }
  });

  response.status(201).json({
    message: "Refeicao adicionada. Agora pode entrar nas proximas sugestoes quando encaixar no perfil.",
    meal
  });
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
