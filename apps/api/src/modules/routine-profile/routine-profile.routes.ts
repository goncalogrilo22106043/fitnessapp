import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { AuthenticatedRequest, authenticate } from "../../http/authenticate.js";

export const routineProfileRouter = Router();

const timeSchema = z.string().regex(/^\d{2}:\d{2}$/).optional().nullable();
const optionalString = z.string().max(300).optional().nullable();
const stringList = z.array(z.string().min(1).max(80)).max(30).default([]);

const routineProfileSchema = z.object({
  identity: z.object({
    name: z.string().min(2).max(80).optional(),
    age: z.number().int().min(13).max(90).optional(),
    sex: z.enum(["female", "male"]).optional(),
    heightCm: z.number().int().min(120).max(230).optional(),
    currentWeightKg: z.number().min(35).max(250).optional(),
    goalWeightKg: z.number().min(35).max(250).optional(),
    bodyGoal: z.enum(["lean_gain", "maintenance", "fat_loss"]).optional(),
    desiredPace: z.enum(["calm", "normal", "aggressive"]).optional()
  }).optional(),
  work: z.object({
    wakeTime: timeSchema,
    usualBedTime: timeSchema,
    sleepDurationEstimate: z.number().min(0).max(16).optional().nullable(),
    weekdayRoutineDifferentFromWeekend: z.boolean().optional(),
    weekendWakeTime: timeSchema,
    weekendBedTime: timeSchema,
    workType: z.enum(["sedentary", "mixed", "standing", "physical", "irregular"]).optional().nullable(),
    workStartTime: timeSchema,
    workEndTime: timeSchema,
    workDays: stringList,
    breaksAvailable: stringList,
    canEatAtWork: z.boolean().optional().nullable(),
    accessToKitchenAtWork: z.boolean().optional().nullable(),
    activityLevel: optionalString,
    averageDailySteps: z.number().int().min(0).max(50000).optional().nullable(),
    commuteDurationMinutes: z.number().int().min(0).max(300).optional().nullable(),
    commuteType: optionalString
  }).optional(),
  mealSchedule: z.object({
    breakfastTime: timeSchema,
    morningSnackTime: timeSchema,
    lunchTime: timeSchema,
    afternoonSnackTime: timeSchema,
    dinnerTime: timeSchema,
    supperTime: timeSchema,
    mealTimeFlexibility: z.record(z.number().int().min(0).max(240)).default({}),
    mealsUsuallySkipped: stringList,
    mealsHardestToFinish: stringList,
    weekendMealTimesDifferent: z.boolean().optional()
  }).optional(),
  trainingBlocks: z.array(z.object({
    activityType: z.string().min(2).max(80),
    daysOfWeek: stringList,
    startTime: timeSchema,
    durationMinutes: z.number().int().min(5).max(360).optional().nullable(),
    intensity: z.enum(["low", "moderate", "high"]).optional().nullable(),
    location: optionalString,
    preWorkoutMealLeadMinutes: z.number().int().min(0).max(360).optional().nullable(),
    postWorkoutMealWindowMinutes: z.number().int().min(0).max(360).optional().nullable(),
    appetiteAfterTraining: optionalString,
    isFlexibleTime: z.boolean().optional()
  })).max(14).optional(),
  appetite: z.object({
    appetiteOnWaking: optionalString,
    appetiteMorning: optionalString,
    appetiteLunch: optionalString,
    appetiteAfternoon: optionalString,
    appetiteDinner: optionalString,
    appetiteNight: optionalString,
    bestAppetiteWindow: optionalString,
    worstAppetiteWindow: optionalString,
    volumeTolerance: z.enum(["low", "medium", "high"]).optional().nullable(),
    eatingSpeed: optionalString,
    needsLongMealTime: z.boolean().optional().nullable(),
    preferredMealTemperature: optionalString,
    platePreference: optionalString
  }).optional(),
  tolerance: z.object({
    avoidedTextures: stringList,
    preferredTextures: stringList,
    toleratedTemperatures: stringList,
    avoidedTemperatures: stringList,
    nauseaFoods: stringList,
    temporaryFatigueFoods: stringList,
    safeFoods: stringList,
    favoriteFoods: stringList,
    dislikedFoods: stringList
  }).optional(),
  lifestyle: z.object({
    dietType: optionalString,
    allergies: stringList,
    intolerances: stringList,
    cookingSkill: optionalString,
    cookingTimeWeekdayMinutes: z.number().int().min(0).max(300).optional().nullable(),
    cookingTimeWeekendMinutes: z.number().int().min(0).max(300).optional().nullable(),
    batchCookingAvailable: z.boolean().optional().nullable(),
    budgetLevel: z.enum(["low", "medium", "high"]).optional().nullable(),
    mealsPerDayPreference: z.number().int().min(2).max(8).optional().nullable(),
    liquidCaloriesTolerance: optionalString,
    morningSweetOrSavory: optionalString,
    planMode: z.enum(["clean_bulk", "easy_bulk", "balanced", "maintenance", "fat_loss"]).optional().nullable(),
    motivation: optionalString,
    mainDifficulty: optionalString,
    previousDietExperience: optionalString,
    typicalReasonForSkippingMeals: optionalString,
    wantsReminders: z.boolean().optional().nullable(),
    reminderStyle: optionalString,
    preferredTone: optionalString,
    hardEatingDays: stringList,
    socialMealFrequency: optionalString
  }).optional()
});

const progressSchema = z.object({
  currentStep: z.string().max(80).optional(),
  completedSteps: z.array(z.string().max(80)).max(30).optional(),
  draftData: z.record(z.unknown()).optional()
});

const consentSchema = z.object({
  aiPersonalizationConsent: z.boolean().optional(),
  dataProcessingConsent: z.boolean().optional(),
  aiConsentVersion: z.string().max(40).optional()
});

const overrideSchema = z.object({
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
  changedFields: z.record(z.unknown()),
  reason: z.string().min(2).max(200),
  temporary: z.boolean().default(true)
});

routineProfileRouter.get("/", authenticate, async (request, response) => {
  const userId = (request as AuthenticatedRequest).userId;
  response.json(await loadRoutineProfile(userId));
});

routineProfileRouter.put("/", authenticate, async (request, response) => {
  const input = routineProfileSchema.parse(request.body);
  const userId = (request as AuthenticatedRequest).userId;
  const existing = await prisma.routineProfile.findUnique({ where: { userId } });
  const nextVersion = (existing?.profileVersion ?? 0) + 1;

  await prisma.$transaction([
    upsertRoutineProfile(userId, input.identity, nextVersion),
    ...(input.work ? [upsertWorkRoutine(userId, input.work)] : []),
    ...(input.mealSchedule ? [upsertMealSchedule(userId, input.mealSchedule)] : []),
    ...(input.appetite ? [upsertAppetiteProfile(userId, input.appetite)] : []),
    ...(input.tolerance ? [upsertFoodToleranceProfile(userId, input.tolerance)] : []),
    ...(input.lifestyle ? [upsertLifestylePreferences(userId, input.lifestyle)] : []),
    ...(input.trainingBlocks ? [
      prisma.trainingBlock.deleteMany({ where: { userId } }),
      ...input.trainingBlocks.map((block, index) => prisma.trainingBlock.create({
        data: {
          userId,
          position: index + 1,
          ...block,
          startTime: block.startTime ?? null,
          durationMinutes: block.durationMinutes ?? null,
          intensity: block.intensity ?? null,
          location: block.location ?? null,
          preWorkoutMealLeadMinutes: block.preWorkoutMealLeadMinutes ?? null,
          postWorkoutMealWindowMinutes: block.postWorkoutMealWindowMinutes ?? null,
          appetiteAfterTraining: block.appetiteAfterTraining ?? null,
          isFlexibleTime: block.isFlexibleTime ?? false
        }
      }))
    ] : [])
  ]);

  response.json({
    message: "Routine Intelligence Profile atualizado.",
    profile: await loadRoutineProfile(userId)
  });
});

routineProfileRouter.patch("/progress", authenticate, async (request, response) => {
  const input = progressSchema.parse(request.body);
  const userId = (request as AuthenticatedRequest).userId;

  const progress = await prisma.onboardingProgress.upsert({
    where: { userId },
    update: {
      ...(input.currentStep !== undefined ? { currentStep: input.currentStep } : {}),
      ...(input.completedSteps ? { completedSteps: input.completedSteps } : {}),
      ...(input.draftData ? { draftData: input.draftData as Prisma.InputJsonValue } : {})
    },
    create: {
      userId,
      currentStep: input.currentStep ?? null,
      completedSteps: input.completedSteps ?? [],
      draftData: (input.draftData ?? {}) as Prisma.InputJsonValue
    }
  });

  response.json({ message: "Progresso guardado.", progress });
});

routineProfileRouter.post("/complete", authenticate, async (request, response) => {
  const userId = (request as AuthenticatedRequest).userId;
  const completedAt = new Date();
  await prisma.$transaction([
    prisma.routineProfile.update({ where: { userId }, data: { completedAt, lastReviewedAt: completedAt } }),
    prisma.onboardingProgress.upsert({
      where: { userId },
      update: { completedAt },
      create: { userId, currentStep: "complete", completedSteps: [], draftData: {}, completedAt }
    })
  ]);

  response.json({ message: "Perfil de rotina concluído.", completedAt });
});

routineProfileRouter.patch("/consent", authenticate, async (request, response) => {
  const input = consentSchema.parse(request.body);
  const userId = (request as AuthenticatedRequest).userId;
  const now = new Date();

  const consent = await prisma.userConsent.upsert({
    where: { userId },
    update: {
      ...(input.aiPersonalizationConsent !== undefined ? {
        aiPersonalizationConsent: input.aiPersonalizationConsent,
        aiConsentAt: input.aiPersonalizationConsent ? now : null,
        revokedAiConsentAt: input.aiPersonalizationConsent ? null : now
      } : {}),
      ...(input.aiConsentVersion ? { aiConsentVersion: input.aiConsentVersion } : {}),
      ...(input.dataProcessingConsent !== undefined ? {
        dataProcessingConsent: input.dataProcessingConsent,
        dataProcessingConsentAt: input.dataProcessingConsent ? now : null
      } : {})
    },
    create: {
      userId,
      aiPersonalizationConsent: input.aiPersonalizationConsent ?? false,
      aiConsentAt: input.aiPersonalizationConsent ? now : null,
      aiConsentVersion: input.aiConsentVersion ?? null,
      dataProcessingConsent: input.dataProcessingConsent ?? false,
      dataProcessingConsentAt: input.dataProcessingConsent ? now : null
    }
  });

  response.json({ message: "Consentimento atualizado.", consent });
});

routineProfileRouter.post("/override", authenticate, async (request, response) => {
  const input = overrideSchema.parse(request.body);
  const userId = (request as AuthenticatedRequest).userId;
  const override = await prisma.routineOverride.create({
    data: {
      userId,
      dateFrom: new Date(input.dateFrom),
      dateTo: new Date(input.dateTo),
      changedFields: input.changedFields as Prisma.InputJsonValue,
      reason: input.reason,
      temporary: input.temporary
    }
  });

  response.status(201).json({ message: "Alteração de rotina guardada.", override });
});

routineProfileRouter.get("/export", authenticate, async (request, response) => {
  const userId = (request as AuthenticatedRequest).userId;
  response.json(await loadRoutineProfile(userId));
});

routineProfileRouter.delete("/ai-history", authenticate, async (request, response) => {
  const userId = (request as AuthenticatedRequest).userId;
  const deleted = await prisma.$transaction([
    prisma.routineAnalysisCache.deleteMany({ where: { userId } }),
    prisma.aiMealSuggestion.deleteMany({ where: { userId } })
  ]);

  response.json({
    message: "Histórico de IA apagado.",
    deleted: {
      routineAnalysisCache: deleted[0].count,
      aiSuggestions: deleted[1].count
    }
  });
});

async function loadRoutineProfile(userId: string) {
  const [
    identity,
    work,
    mealSchedule,
    trainingBlocks,
    appetite,
    tolerance,
    lifestyle,
    progress,
    consent,
    overrides
  ] = await Promise.all([
    prisma.routineProfile.findUnique({ where: { userId } }),
    prisma.workRoutine.findUnique({ where: { userId } }),
    prisma.mealSchedule.findUnique({ where: { userId } }),
    prisma.trainingBlock.findMany({ where: { userId }, orderBy: { position: "asc" } }),
    prisma.appetiteProfile.findUnique({ where: { userId } }),
    prisma.foodToleranceProfile.findUnique({ where: { userId } }),
    prisma.lifestylePreferences.findUnique({ where: { userId } }),
    prisma.onboardingProgress.findUnique({ where: { userId } }),
    prisma.userConsent.findUnique({ where: { userId } }),
    prisma.routineOverride.findMany({ where: { userId }, orderBy: { dateFrom: "desc" }, take: 20 })
  ]);

  return { identity, work, mealSchedule, trainingBlocks, appetite, tolerance, lifestyle, progress, consent, overrides };
}

function upsertRoutineProfile(
  userId: string,
  identity: z.infer<typeof routineProfileSchema>["identity"],
  profileVersion: number
) {
  const update = stripUndefined({
    ...(identity ?? {}),
    profileVersion,
    lastReviewedAt: new Date()
  }) as Prisma.RoutineProfileUncheckedUpdateInput;
  const create = stripUndefined({
    userId,
    ...(identity ?? {}),
    profileVersion
  }) as Prisma.RoutineProfileUncheckedCreateInput;

  return prisma.routineProfile.upsert({
    where: { userId },
    update,
    create
  });
}

function upsertWorkRoutine(userId: string, work: NonNullable<z.infer<typeof routineProfileSchema>["work"]>) {
  const data = stripUndefined(work) as Omit<Prisma.WorkRoutineUncheckedCreateInput, "userId">;
  return prisma.workRoutine.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data }
  });
}

function upsertMealSchedule(userId: string, mealSchedule: NonNullable<z.infer<typeof routineProfileSchema>["mealSchedule"]>) {
  const data = stripUndefined(mealSchedule) as Omit<Prisma.MealScheduleUncheckedCreateInput, "userId">;
  return prisma.mealSchedule.upsert({
    where: { userId },
    update: { ...data, mealTimeFlexibility: mealSchedule.mealTimeFlexibility as Prisma.InputJsonValue },
    create: { userId, ...data, mealTimeFlexibility: mealSchedule.mealTimeFlexibility as Prisma.InputJsonValue }
  });
}

function upsertAppetiteProfile(userId: string, appetite: NonNullable<z.infer<typeof routineProfileSchema>["appetite"]>) {
  const data = stripUndefined(appetite) as Omit<Prisma.AppetiteProfileUncheckedCreateInput, "userId">;
  return prisma.appetiteProfile.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data }
  });
}

function upsertFoodToleranceProfile(userId: string, tolerance: NonNullable<z.infer<typeof routineProfileSchema>["tolerance"]>) {
  return prisma.foodToleranceProfile.upsert({
    where: { userId },
    update: tolerance,
    create: { userId, ...tolerance }
  });
}

function upsertLifestylePreferences(userId: string, lifestyle: NonNullable<z.infer<typeof routineProfileSchema>["lifestyle"]>) {
  const data = stripUndefined(lifestyle) as Omit<Prisma.LifestylePreferencesUncheckedCreateInput, "userId">;
  return prisma.lifestylePreferences.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data }
  });
}

function stripUndefined<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}
