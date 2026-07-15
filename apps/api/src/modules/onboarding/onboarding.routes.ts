import { calculateOnboardingNutrition } from "@rotina/domain";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { AuthenticatedRequest, authenticate } from "../../http/authenticate.js";

export const onboardingRouter = Router();

const onboardingSchema = z.object({
  basic: z.object({
    name: z.string().min(2).max(80).optional(),
    sex: z.enum(["female", "male"]),
    age: z.number().int().min(13).max(90),
    heightCentimeters: z.number().int().min(120).max(230),
    weightKilograms: z.number().min(35).max(250),
    targetWeightKilograms: z.number().min(35).max(250).optional(),
    desiredPace: z.enum(["calm", "normal", "aggressive"]).default("normal")
  }),
  bodyGoal: z.enum(["lean_gain", "maintenance", "fat_loss"]),
  dailyRoutine: z.object({
    wakeTime: z.string().min(4).max(8),
    sleepTime: z.string().min(4).max(8),
    workType: z.enum(["seated", "mixed", "active"]),
    hardEatingDays: z.array(z.string()).default([])
  }).optional(),
  trainingRoutine: z.object({
    trainingDaysPerWeek: z.number().int().min(0).max(7),
    trainingType: z.string().min(2),
    preferredTimes: z.array(z.string()).default([]),
    trainingDays: z.array(z.string()).default([]),
    trainingTime: z.string().optional(),
    trainingIntensity: z.enum(["low", "moderate", "high"]).default("moderate"),
    restDays: z.array(z.string()).default([])
  }),
  appetiteProfile: z.object({
    bestAppetiteTime: z.string().optional(),
    worstAppetiteTime: z.string().optional(),
    appetiteMorning: z.enum(["low", "medium", "high"]),
    appetiteNight: z.enum(["low", "medium", "high"]),
    volumeTolerance: z.enum(["low", "medium", "high"])
  }).optional(),
  toleranceProfile: z.object({
    preferredTextures: z.record(z.number().min(0).max(1)),
    preferredVolumes: z.record(z.number().min(0).max(1)),
    avoidedTextures: z.array(z.string()).default([]),
    preferredTextureStyle: z.enum(["separate", "mixed"]).default("mixed"),
    nauseaFoods: z.array(z.string()).default([]),
    safeFoods: z.array(z.string()).default([])
  }),
  foodPreferences: z.object({
    preferredFlavors: z.record(z.number().min(0).max(1)).default({}),
    avoidedIngredients: z.array(z.string()).default([]),
    safeMealIds: z.array(z.string()).default([]),
    favoriteMealIds: z.array(z.string()).default([]),
    favoriteFoods: z.array(z.string()).default([]),
    dislikedFoods: z.array(z.string()).default([]),
    allergies: z.array(z.string()).default([]),
    dietType: z.enum(["omnivore", "vegetarian", "vegan", "other"]).default("omnivore")
  }),
  budgetProfile: z.object({
    level: z.enum(["low", "medium", "high"]),
    maxCookingMinutes: z.number().int().min(5).max(180)
  }),
  eatingMode: z.enum(["clean_bulking", "easy_bulking", "balanced"]),
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
  const profileData = {
    wakeTime: input.dailyRoutine?.wakeTime ?? null,
    sleepTime: input.dailyRoutine?.sleepTime ?? null,
    workType: input.dailyRoutine?.workType ?? null,
    hardEatingDays: input.dailyRoutine?.hardEatingDays ?? [],
    targetWeightKilograms: input.basic.targetWeightKilograms ?? null,
    desiredPace: input.basic.desiredPace,
    appetiteMorning: input.appetiteProfile?.appetiteMorning ?? null,
    appetiteNight: input.appetiteProfile?.appetiteNight ?? null,
    bestAppetiteTime: input.appetiteProfile?.bestAppetiteTime ?? null,
    worstAppetiteTime: input.appetiteProfile?.worstAppetiteTime ?? null,
    volumeTolerance: input.appetiteProfile?.volumeTolerance ?? null,
    avoidedTextures: input.toleranceProfile.avoidedTextures,
    preferredTextureStyle: input.toleranceProfile.preferredTextureStyle,
    nauseaFoods: input.toleranceProfile.nauseaFoods,
    safeFoods: input.toleranceProfile.safeFoods,
    favoriteFoods: input.foodPreferences.favoriteFoods,
    dislikedFoods: input.foodPreferences.dislikedFoods,
    allergies: input.foodPreferences.allergies,
    dietType: input.foodPreferences.dietType,
    planMode: input.eatingMode,
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
  };

  await prisma.$transaction([
    ...(input.basic.name
      ? [
          prisma.user.update({
            where: { id: userId },
            data: { name: input.basic.name }
          })
        ]
      : []),
    prisma.userProfile.upsert({
      where: { userId },
      update: profileData,
      create: {
        userId,
        ...profileData
      }
    }),
    prisma.nutritionTarget.upsert({
      where: { userId },
      update: { bmr: nutrition.bmr, tdee: nutrition.tdee, ...nutrition.targets },
      create: { userId, bmr: nutrition.bmr, tdee: nutrition.tdee, ...nutrition.targets }
    }),
    prisma.trainingRoutine.upsert({
      where: { userId },
      update: {
        ...input.trainingRoutine,
        trainingTime: input.trainingRoutine.trainingTime ?? null
      },
      create: {
        userId,
        ...input.trainingRoutine,
        trainingTime: input.trainingRoutine.trainingTime ?? null
      }
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
