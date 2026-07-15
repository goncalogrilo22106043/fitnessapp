import { calculateOnboardingNutrition, calculateWaterTarget } from "../../../../../packages/domain/src/index.js";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { AuthenticatedRequest, authenticate } from "../../http/authenticate.js";

export const profileRouter = Router();

const waterTargetSchema = z.object({
  dailyWaterTargetMl: z.number().int().min(1000).max(6000)
});

const recalcSchema = z.object({
  sex: z.enum(["female", "male"]),
  age: z.number().int().min(13).max(90),
  heightCentimeters: z.number().int().min(120).max(230),
  weightKilograms: z.number().min(35).max(250),
  bodyGoal: z.enum(["lean_gain", "maintenance", "fat_loss"]),
  eatingMode: z.enum(["clean_bulking", "easy_bulking", "balanced"]),
  trainingDaysPerWeek: z.number().int().min(0).max(7),
  mealTimes: z.array(z.enum(["breakfast", "lunch", "snack", "dinner"])).min(3).max(6)
});

profileRouter.get("/", authenticate, async (request, response) => {
  const userId = (request as AuthenticatedRequest).userId;
  const [user, profile, targets, routine, budget, mealSlots] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, email: true, name: true } }),
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.nutritionTarget.findUnique({ where: { userId } }),
    prisma.trainingRoutine.findUnique({ where: { userId } }),
    prisma.budgetProfile.findUnique({ where: { userId } }),
    prisma.mealSlot.findMany({ where: { userId }, orderBy: { position: "asc" } })
  ]);

  response.json({ user, profile, targets, routine, budget, mealSlots });
});

profileRouter.patch("/water-target", authenticate, async (request, response) => {
  const input = waterTargetSchema.parse(request.body);
  const userId = (request as AuthenticatedRequest).userId;
  const profile = await prisma.userProfile.update({
    where: { userId },
    data: { dailyWaterTargetMl: input.dailyWaterTargetMl }
  });

  response.json({
    message: "Objetivo de agua atualizado para o teu dia.",
    profile
  });
});

profileRouter.post("/recalculate-targets", authenticate, async (request, response) => {
  const input = recalcSchema.parse(request.body);
  const userId = (request as AuthenticatedRequest).userId;
  const nutrition = calculateOnboardingNutrition(input);

  await prisma.$transaction([
    prisma.nutritionTarget.upsert({
      where: { userId },
      update: { bmr: nutrition.bmr, tdee: nutrition.tdee, ...nutrition.targets },
      create: { userId, bmr: nutrition.bmr, tdee: nutrition.tdee, ...nutrition.targets }
    }),
    prisma.userProfile.update({
      where: { userId },
      data: {
        bodyGoal: input.bodyGoal,
        planMode: input.eatingMode,
        eatingMode: input.eatingMode,
        dailyWaterTargetMl: calculateWaterTarget(input.weightKilograms)
      }
    })
  ]);

  response.json({
    message: "Metas recalculadas com base no teu momento atual.",
    nutrition
  });
});
