import { calculateWeightTrend, summarizeHydration } from "@rotina/domain";
import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { AuthenticatedRequest, authenticate } from "../../http/authenticate.js";

export const progressRouter = Router();

const dateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

const waterSchema = z.object({
  amountMilliliters: z.number().int().min(50).max(2000),
  occurredAt: z.string().datetime().optional()
});

const weightSchema = z.object({
  weightKilograms: z.number().min(30).max(300),
  occurredAt: z.string().datetime().optional()
});

const historySchema = z.object({
  mood: z.enum(["loved", "neutral", "could_not_finish"]).optional(),
  mealId: z.string().optional()
});

progressRouter.post("/water", authenticate, async (request, response) => {
  const input = waterSchema.parse(request.body);
  const userId = (request as AuthenticatedRequest).userId;
  const log = await prisma.waterLog.create({
    data: {
      userId,
      amountMilliliters: input.amountMilliliters,
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date()
    }
  });

  response.status(201).json({
    message: "Agua registada. Bom ajuste para o resto do dia.",
    log
  });
});

progressRouter.get("/water", authenticate, async (request, response) => {
  const { date } = dateSchema.parse(request.query);
  const userId = (request as AuthenticatedRequest).userId;
  const [logs, profile] = await Promise.all([
    prisma.waterLog.findMany({
      where: { userId, occurredAt: dayRange(date) },
      orderBy: { occurredAt: "asc" }
    }),
    prisma.userProfile.findUnique({ where: { userId } })
  ]);

  response.json(summarizeHydration({ targetMilliliters: profile?.dailyWaterTargetMl ?? 2500, logs }));
});

progressRouter.post("/weight", authenticate, async (request, response) => {
  const input = weightSchema.parse(request.body);
  const userId = (request as AuthenticatedRequest).userId;
  const log = await prisma.weightLog.create({
    data: {
      userId,
      weightKilograms: input.weightKilograms,
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date()
    }
  });

  response.status(201).json({
    message: "Peso registado. Vou olhar para a tendencia, nao para um dia isolado.",
    log
  });
});

progressRouter.get("/weight", authenticate, async (request, response) => {
  const userId = (request as AuthenticatedRequest).userId;
  const logs = await prisma.weightLog.findMany({
    where: {
      userId,
      occurredAt: {
        gte: daysAgo(30)
      }
    },
    orderBy: { occurredAt: "asc" }
  });

  response.json({
    logs,
    trend: calculateWeightTrend(logs)
  });
});

progressRouter.get("/meal-history", authenticate, async (request, response) => {
  const input = historySchema.parse(request.query);
  const userId = (request as AuthenticatedRequest).userId;
  const where: Prisma.MealFeedbackWhereInput = { userId };

  if (input.mood) {
    where.mood = input.mood;
  }

  if (input.mealId) {
    where.mealId = input.mealId;
  }

  const feedback = await prisma.mealFeedback.findMany({
    where,
    include: { meal: true },
    orderBy: { occurredAt: "desc" },
    take: 100
  });

  response.json({
    meals: feedback.map((item) => ({
      id: item.id,
      mealId: item.mealId,
      mealName: item.meal.name,
      mood: item.mood,
      eatenPercentage: item.eatenPercentage,
      occurredAt: item.occurredAt
    }))
  });
});

progressRouter.get("/weekly-insights", authenticate, async (request, response) => {
  const userId = (request as AuthenticatedRequest).userId;
  const since = daysAgo(7);
  const [feedback, waterLogs, weightLogs] = await Promise.all([
    prisma.mealFeedback.findMany({
      where: { userId, occurredAt: { gte: since } },
      include: { meal: true },
      orderBy: { occurredAt: "asc" }
    }),
    prisma.waterLog.findMany({ where: { userId, occurredAt: { gte: since } } }),
    prisma.weightLog.findMany({ where: { userId, occurredAt: { gte: since } }, orderBy: { occurredAt: "asc" } })
  ]);
  const mealGroups = new Map<string, { name: string; loved: number; hard: number; total: number }>();

  for (const item of feedback) {
    const current = mealGroups.get(item.mealId) ?? { name: item.meal.name, loved: 0, hard: 0, total: 0 };
    current.total += 1;
    current.loved += item.mood === "loved" ? 1 : 0;
    current.hard += item.mood === "could_not_finish" ? 1 : 0;
    mealGroups.set(item.mealId, current);
  }

  const meals = Array.from(mealGroups.values());
  const hydrationAverage = Math.round(waterLogs.reduce((total, log) => total + log.amountMilliliters, 0) / 7);
  const completedMeals = feedback.filter((item) => item.eatenPercentage >= 70).length;
  const foodVarietyIndex = Math.round((mealGroups.size / Math.max(feedback.length, 1)) * 100);
  const consistencyScore = Math.round((completedMeals / Math.max(feedback.length, 1)) * 100);

  response.json({
    bestToleratedMeals: meals.sort((left, right) => right.loved - left.loved).slice(0, 3),
    nauseaRiskMeals: meals.filter((meal) => meal.hard >= 2).slice(0, 3),
    foodVarietyIndex,
    consistencyScore,
    weightTrend: calculateWeightTrend(weightLogs),
    hydrationAverage,
    suggestions: [
      "Vamos manter as refeicoes com melhor tolerancia como base.",
      "Na proxima semana posso reduzir repeticao nas opcoes com mais sinais de cansaco.",
      "Dias mais dificeis podem ficar com opcoes de menor volume mais cedo."
    ]
  });
});

function dayRange(date: string) {
  return {
    gte: new Date(`${date}T00:00:00.000Z`),
    lt: new Date(`${date}T23:59:59.999Z`)
  };
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}
