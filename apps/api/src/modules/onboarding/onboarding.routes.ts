import { calculateOnboardingNutrition } from "@rotina/domain";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { AuthenticatedRequest, authenticate } from "../../http/authenticate.js";

export const onboardingRouter = Router();

const onboardingSchema = z.object({
  basic: z.object({
    sex: z.enum(["female", "male"]),
    age: z.number().int().min(13).max(90),
    heightCentimeters: z.number().int().min(120).max(230),
    weightKilograms: z.number().min(35).max(250)
  }),
  bodyGoal: z.enum(["lean_gain", "maintenance", "fat_loss"]),
  trainingRoutine: z.object({
    trainingDaysPerWeek: z.number().int().min(0).max(7),
    trainingType: z.string().min(2),
    preferredTimes: z.array(z.string()).default([])
  }),
  toleranceProfile: z.object({
    preferredTextures: z.record(z.number().min(0).max(1)),
    preferredVolumes: z.record(z.number().min(0).max(1))
  }),
  foodPreferences: z.object({
    preferredFlavors: z.record(z.number().min(0).max(1)).default({}),
    avoidedIngredients: z.array(z.string()).default([]),
    safeMealIds: z.array(z.string()).default([]),
    favoriteMealIds: z.array(z.string()).default([])
  }),
  budgetProfile: z.object({
    level: z.enum(["low", "medium", "high"]),
    maxCookingMinutes: z.number().int().min(5).max(180)
  }),
  eatingMode: z.enum(["clean_bulking", "easy_bulking"]),
  mealTimes: z.array(z.enum(["breakfast", "lunch", "snack", "dinner"])).min(3).max(6)
});

onboardingRouter.put("/", authenticate, async (request, response) => {
  const input = onboardingSchema.parse(request.body);
  const userId = (request as AuthenticatedRequest).userId;
  const nutrition = calculateOnboardingNutrition({
    ...input.basic,
    bodyGoal: input.bodyGoal,
    eatingMode: input.eatingMode,
    trainingDaysPerWeek: input.trainingRoutine.trainingDaysPerWeek,
    mealTimes: input.mealTimes
  });

  await prisma.$transaction([
    prisma.userProfile.upsert({
      where: { userId },
      update: {
        preferredTextures: input.toleranceProfile.preferredTextures,
        preferredVolumes: input.toleranceProfile.preferredVolumes,
        preferredFlavors: input.foodPreferences.preferredFlavors,
        avoidedIngredients: input.foodPreferences.avoidedIngredients,
        budgetPreference: input.budgetProfile.level,
        cookingTimePreference: input.budgetProfile.maxCookingMinutes <= 15 ? "quick" : "standard",
        safeMealIds: input.foodPreferences.safeMealIds,
        favoriteMealIds: input.foodPreferences.favoriteMealIds,
        eatingMode: input.eatingMode,
        bodyGoal: input.bodyGoal,
        dailyWaterTargetMl: nutrition.dailyWaterTargetMl
      },
      create: {
        userId,
        preferredTextures: input.toleranceProfile.preferredTextures,
        preferredVolumes: input.toleranceProfile.preferredVolumes,
        preferredFlavors: input.foodPreferences.preferredFlavors,
        avoidedIngredients: input.foodPreferences.avoidedIngredients,
        budgetPreference: input.budgetProfile.level,
        cookingTimePreference: input.budgetProfile.maxCookingMinutes <= 15 ? "quick" : "standard",
        safeMealIds: input.foodPreferences.safeMealIds,
        favoriteMealIds: input.foodPreferences.favoriteMealIds,
        eatingMode: input.eatingMode,
        bodyGoal: input.bodyGoal,
        dailyWaterTargetMl: nutrition.dailyWaterTargetMl
      }
    }),
    prisma.nutritionTarget.upsert({
      where: { userId },
      update: { bmr: nutrition.bmr, tdee: nutrition.tdee, ...nutrition.targets },
      create: { userId, bmr: nutrition.bmr, tdee: nutrition.tdee, ...nutrition.targets }
    }),
    prisma.trainingRoutine.upsert({
      where: { userId },
      update: input.trainingRoutine,
      create: { userId, ...input.trainingRoutine }
    }),
    prisma.budgetProfile.upsert({
      where: { userId },
      update: input.budgetProfile,
      create: { userId, ...input.budgetProfile }
    }),
    prisma.mealSlot.deleteMany({ where: { userId } }),
    ...nutrition.mealSlots.map((slot, index) =>
      prisma.mealSlot.create({
        data: {
          userId,
          mealTime: slot.mealTime,
          targetCalories: slot.targetCalories,
          targetProtein: slot.targetProtein,
          position: index + 1
        }
      })
    )
  ]);

  response.json({
    message: "Perfil criado. Vamos adaptar as primeiras refeicoes ao teu ritmo.",
    nutrition
  });
});

onboardingRouter.get("/", authenticate, async (request, response) => {
  const userId = (request as AuthenticatedRequest).userId;
  const [profile, targets, routine, budget, mealSlots] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.nutritionTarget.findUnique({ where: { userId } }),
    prisma.trainingRoutine.findUnique({ where: { userId } }),
    prisma.budgetProfile.findUnique({ where: { userId } }),
    prisma.mealSlot.findMany({ where: { userId }, orderBy: { position: "asc" } })
  ]);

  response.json({ profile, targets, routine, budget, mealSlots });
});
