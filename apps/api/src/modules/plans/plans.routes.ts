import {
  DailyPlan,
  ENGINE_VERSION,
  PlanMeal,
  SCORING_WEIGHTS_VERSION,
  WeeklyPlan,
  WeightedAdaptiveNutritionEngine
} from "@rotina/domain";
import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { AuthenticatedRequest, authenticate } from "../../http/authenticate.js";
import { toDomainFeedback, toDomainMeal, toDomainProfile } from "../meals/meal.mapper.js";

export const plansRouter = Router();
const engine = new WeightedAdaptiveNutritionEngine();

const planSchema = z.object({
  startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

const dateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

const substitutionsSchema = dateSchema.extend({
  mealTime: z.enum(["breakfast", "lunch", "snack", "dinner"]),
  referenceMealId: z.string().optional()
});

const swapSchema = substitutionsSchema.extend({
  selectedMealId: z.string()
});

const rollbackSchema = dateSchema.extend({
  version: z.number().int().min(1).optional()
});

plansRouter.post("/weekly", authenticate, async (request, response) => {
  const { startsOn } = planSchema.parse(request.body);
  const userId = (request as AuthenticatedRequest).userId;

  const [profile, mealOptions, feedbackHistory] = await Promise.all([
    prisma.userProfile.findUniqueOrThrow({ where: { userId } }),
    prisma.mealOption.findMany(),
    prisma.mealFeedback.findMany({
      where: { userId },
      orderBy: { occurredAt: "asc" },
      take: 120
    })
  ]);

  const weeklyPlan = engine.generateWeeklyPlan({
    userId,
    startsOn,
    profile: toDomainProfile(profile),
    mealOptions: mealOptions.map(toDomainMeal),
    feedbackHistory: feedbackHistory.map(toDomainFeedback)
  });

  const savedPlan = await prisma.weeklyPlan.create({
    data: {
      userId,
      startsOn: new Date(`${startsOn}T00:00:00.000Z`),
      content: weeklyPlan as unknown as Prisma.InputJsonValue,
      engineVersion: weeklyPlan.engineVersion,
      scoringWeightsVersion: weeklyPlan.scoringWeightsVersion
    }
  });

  response.status(201).json({ id: savedPlan.id, ...weeklyPlan });
});

plansRouter.get("/latest", authenticate, async (request, response) => {
  const userId = (request as AuthenticatedRequest).userId;
  const plan = await prisma.weeklyPlan.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  if (!plan) {
    response.status(404).json({ message: "Vamos criar o teu primeiro plano." });
    return;
  }

  response.json({ id: plan.id, content: plan.content });
});

plansRouter.get("/daily", authenticate, async (request, response) => {
  const { date } = dateSchema.parse(request.query);
  const userId = (request as AuthenticatedRequest).userId;
  const [dailyPlan, feedback] = await Promise.all([
    loadDailyPlan(userId, date),
    prisma.mealFeedback.findMany({
      where: {
        userId,
        occurredAt: dayRange(date)
      }
    })
  ]);
  const eatenMealIds = [...new Set(feedback.map((item) => item.mealId))];

  response.json({
    ...engine.getDailyDashboard(dailyPlan),
    mealProgress: {
      totalMeals: dailyPlan.meals.length,
      eatenMeals: eatenMealIds.length,
      remainingMeals: Math.max(dailyPlan.meals.length - eatenMealIds.length, 0),
      eatenMealIds
    }
  });
});

plansRouter.post("/daily/hard-day", authenticate, async (request, response) => {
  const { date } = dateSchema.parse(request.body);
  const userId = (request as AuthenticatedRequest).userId;
  const [dailyPlan, profile, mealOptions, feedbackHistory] = await Promise.all([
    loadDailyPlan(userId, date),
    prisma.userProfile.findUniqueOrThrow({ where: { userId } }),
    prisma.mealOption.findMany(),
    prisma.mealFeedback.findMany({ where: { userId }, orderBy: { occurredAt: "asc" }, take: 120 })
  ]);

  const existingHardDay = await prisma.dailyPlanAdjustment.findFirst({
    where: {
      userId,
      date: dateToUtc(date),
      type: "hard_day"
    }
  });

  if (existingHardDay) {
    response.status(409).json({
      message: "Ja adaptei este dia. Mantive esse ajuste para nao baralhar o teu plano.",
      adjustment: existingHardDay
    });
    return;
  }

  const adapted = {
    ...engine.adaptHardDay({
    dailyPlan,
    profile: toDomainProfile(profile),
    mealOptions: mealOptions.map(toDomainMeal),
    feedbackHistory: feedbackHistory.map(toDomainFeedback),
    currentMealTime: "lunch"
    }),
    version: dailyPlan.version + 1
  };

  await persistDailyAdjustment({
    userId,
    date,
    type: "hard_day",
    reason: "Hoje nao consigo",
    previous: dailyPlan,
    next: adapted
  });

  response.json({
    message: "Hoje ajustei as proximas refeicoes para menor volume e opcoes mais familiares.",
    dailyPlan: adapted
  });
});

plansRouter.get("/substitutions", authenticate, async (request, response) => {
  const input = substitutionsSchema.parse(request.query);
  const userId = (request as AuthenticatedRequest).userId;
  const [profile, mealOptions, feedbackHistory] = await Promise.all([
    prisma.userProfile.findUniqueOrThrow({ where: { userId } }),
    prisma.mealOption.findMany(),
    prisma.mealFeedback.findMany({ where: { userId }, orderBy: { occurredAt: "asc" }, take: 120 })
  ]);
  const referenceMeal = input.referenceMealId
    ? mealOptions.find((meal) => meal.id === input.referenceMealId)
    : undefined;

  const suggestionInput = {
    date: input.date,
    mealTime: input.mealTime,
    profile: toDomainProfile(profile),
    mealOptions: mealOptions.map(toDomainMeal),
    feedbackHistory: feedbackHistory.map(toDomainFeedback)
  };

  response.json({
    alternatives: engine.suggestMealAlternatives(
      referenceMeal ? { ...suggestionInput, referenceMeal: toDomainMeal(referenceMeal) } : suggestionInput
    )
  });
});

plansRouter.post("/swap", authenticate, async (request, response) => {
  const input = swapSchema.parse(request.body);
  const userId = (request as AuthenticatedRequest).userId;
  const [dailyPlan, meal] = await Promise.all([
    loadDailyPlan(userId, input.date),
    prisma.mealOption.findUniqueOrThrow({ where: { id: input.selectedMealId } })
  ]);

  const replacement = engine.suggestSubstitutions({
    date: input.date,
    mealTime: input.mealTime,
    profile: toDomainProfile(await prisma.userProfile.findUniqueOrThrow({ where: { userId } })),
    mealOptions: [toDomainMeal(meal)],
    feedbackHistory: []
  });
  const nextContent: DailyPlan = {
    ...dailyPlan,
    version: dailyPlan.version + 1,
    meals: dailyPlan.meals.map((planMeal) =>
      planMeal.date === input.date && planMeal.mealTime === input.mealTime ? replacement : planMeal
    )
  };

  await persistDailyAdjustment({
    userId,
    date: input.date,
    type: "swap",
    reason: `Troca de ${input.mealTime}`,
    previous: dailyPlan,
    next: nextContent
  });

  response.json({
    message: "Troca feita. Mantive a estrutura do dia tao proxima quanto possivel.",
    meal: replacement
  });
});

plansRouter.get("/daily/adjustments", authenticate, async (request, response) => {
  const userId = (request as AuthenticatedRequest).userId;
  const adjustments = await prisma.dailyPlanAdjustment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 30
  });

  response.json({ adjustments });
});

plansRouter.post("/daily/rollback", authenticate, async (request, response) => {
  const input = rollbackSchema.parse(request.body);
  const userId = (request as AuthenticatedRequest).userId;
  const current = await loadDailyPlan(userId, input.date);
  const targetVersion = input.version ?? Math.max(current.version - 1, 1);
  const target = await prisma.dailyPlanVersion.findUniqueOrThrow({
    where: {
      userId_date_version: {
        userId,
        date: dateToUtc(input.date),
        version: targetVersion
      }
    }
  });
  const next = {
    ...(target.content as unknown as DailyPlan),
    version: current.version + 1
  };

  await persistDailyAdjustment({
    userId,
    date: input.date,
    type: "rollback",
    reason: `Voltar para versao ${targetVersion}`,
    previous: current,
    next
  });

  response.json({
    message: "Voltei a uma versao anterior do plano para simplificar o dia.",
    dailyPlan: next
  });
});

async function loadDailyPlan(userId: string, date: string): Promise<DailyPlan> {
  const [dailyVersion, latestPlan, targets, feedback, waterLogs, profile] = await Promise.all([
    prisma.dailyPlanVersion.findFirst({
      where: { userId, date: dateToUtc(date) },
      orderBy: { version: "desc" }
    }),
    prisma.weeklyPlan.findFirstOrThrow({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.nutritionTarget.findUnique({ where: { userId } }),
    prisma.mealFeedback.findMany({
      where: {
        userId,
        occurredAt: {
          gte: new Date(`${date}T00:00:00.000Z`),
          lt: new Date(`${date}T23:59:59.999Z`)
        }
      },
      include: { meal: true }
    }),
    prisma.waterLog.findMany({
      where: {
        userId,
        occurredAt: dayRange(date)
      }
    }),
    prisma.userProfile.findUnique({ where: { userId } })
  ]);
  const content = latestPlan.content as unknown as WeeklyPlan;
  const rawMeals = dailyVersion
    ? (dailyVersion.content as unknown as DailyPlan).meals
    : content.meals.filter((meal): meal is PlanMeal => meal.date === date);
  const meals = await hydratePlanMeals(rawMeals, {
    favoriteMealIds: profile?.favoriteMealIds ?? [],
    safeMealIds: profile?.safeMealIds ?? []
  });
  const consumedCalories = feedback.reduce((total, item) => {
    return total + Math.round(item.meal.caloriesEstimate * (item.eatenPercentage / 100));
  }, 0);
  const consumedProtein = feedback.reduce((total, item) => {
    return total + Math.round(item.meal.proteinEstimate * (item.eatenPercentage / 100));
  }, 0);

  return {
    userId,
    date,
    version: dailyVersion?.version ?? 1,
    engineVersion: dailyVersion?.engineVersion ?? latestPlan.engineVersion,
    scoringWeightsVersion: dailyVersion?.scoringWeightsVersion ?? latestPlan.scoringWeightsVersion,
    targets: {
      calories: targets?.calories ?? 2800,
      proteinGrams: targets?.proteinGrams ?? 180,
      carbsGrams: targets?.carbsGrams ?? 320,
      fatGrams: targets?.fatGrams ?? 80
    },
    meals,
    consumed: {
      calories: consumedCalories,
      proteinGrams: consumedProtein,
      waterMilliliters: waterLogs.reduce((total, log) => total + log.amountMilliliters, 0)
    }
  };
}

async function hydratePlanMeals(
  meals: PlanMeal[],
  profile: { favoriteMealIds: string[]; safeMealIds: string[] }
): Promise<PlanMeal[]> {
  const mealIds = [...new Set(meals.flatMap((meal) => [meal.selected.meal.id, ...meal.alternatives.map((option) => option.meal.id)]))];
  const mealOptions = await prisma.mealOption.findMany({ where: { id: { in: mealIds } } });
  const mealById = new Map(mealOptions.map((meal) => [meal.id, meal]));

  return meals.map((meal) => ({
    ...meal,
    selected: hydrateSelectedMeal(meal.selected, mealById, profile),
    alternatives: meal.alternatives.map((option) => hydrateSelectedMeal(option, mealById, profile))
  }));
}

function hydrateSelectedMeal(
  selected: PlanMeal["selected"],
  mealById: Map<string, Awaited<ReturnType<typeof prisma.mealOption.findMany>>[number]>,
  profile: { favoriteMealIds: string[]; safeMealIds: string[] }
): PlanMeal["selected"] {
  const meal = mealById.get(selected.meal.id);
  if (!meal) {
    return selected;
  }

  const hydratedMeal: PlanMeal["selected"]["meal"] = {
    ...selected.meal,
    caloriesEstimate: meal.caloriesEstimate,
    proteinEstimate: meal.proteinEstimate,
    dna: meal.dna as unknown as PlanMeal["selected"]["meal"]["dna"],
    isFavorite: meal.isFavorite || profile.favoriteMealIds.includes(meal.id),
    isSafeMeal: meal.isSafeMeal || profile.safeMealIds.includes(meal.id),
    ingredients: meal.ingredients,
    recipeSteps: meal.recipeSteps
  };

  if (meal.carbsEstimate !== null) {
    hydratedMeal.carbsEstimate = meal.carbsEstimate;
  }

  if (meal.fatEstimate !== null) {
    hydratedMeal.fatEstimate = meal.fatEstimate;
  }

  return {
    ...selected,
    meal: hydratedMeal
  };
}

async function persistDailyAdjustment(input: {
  userId: string;
  date: string;
  type: string;
  reason: string;
  previous: DailyPlan;
  next: DailyPlan;
}) {
  const changedMeals = input.next.meals
    .filter((nextMeal) => {
      const previousMeal = input.previous.meals.find((meal) => meal.mealTime === nextMeal.mealTime);
      return previousMeal?.selected.meal.id !== nextMeal.selected.meal.id;
    })
    .map((meal) => ({
      mealTime: meal.mealTime,
      mealId: meal.selected.meal.id,
      reason: meal.selected.rationale[0] ?? input.reason
    }));

  await prisma.$transaction([
    prisma.dailyPlanVersion.upsert({
      where: {
        userId_date_version: {
          userId: input.userId,
          date: dateToUtc(input.date),
          version: input.previous.version
        }
      },
      update: {},
      create: {
        userId: input.userId,
        date: dateToUtc(input.date),
        version: input.previous.version,
        content: input.previous as unknown as Prisma.InputJsonValue,
        reason: "Plano original do dia",
        engineVersion: input.previous.engineVersion,
        scoringWeightsVersion: input.previous.scoringWeightsVersion
      }
    }),
    prisma.dailyPlanVersion.create({
      data: {
        userId: input.userId,
        date: dateToUtc(input.date),
        version: input.next.version,
        content: input.next as unknown as Prisma.InputJsonValue,
        previousContent: input.previous as unknown as Prisma.InputJsonValue,
        reason: input.reason,
        engineVersion: input.next.engineVersion,
        scoringWeightsVersion: input.next.scoringWeightsVersion
      }
    }),
    prisma.dailyPlanAdjustment.create({
      data: {
        userId: input.userId,
        date: dateToUtc(input.date),
        type: input.type,
        reason: input.reason,
        previousVersion: input.previous.version,
        nextVersion: input.next.version,
        changedMeals: changedMeals as unknown as Prisma.InputJsonValue,
        previousContent: input.previous as unknown as Prisma.InputJsonValue,
        nextContent: input.next as unknown as Prisma.InputJsonValue,
        engineVersion: input.next.engineVersion,
        scoringWeightsVersion: input.next.scoringWeightsVersion
      }
    })
  ]);
}

function dateToUtc(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

function dayRange(date: string) {
  return {
    gte: new Date(`${date}T00:00:00.000Z`),
    lt: new Date(`${date}T23:59:59.999Z`)
  };
}
