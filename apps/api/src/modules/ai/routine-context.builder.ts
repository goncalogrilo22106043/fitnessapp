import { createHash } from "node:crypto";
import { prisma } from "../../db/prisma.js";

export interface RoutineContext {
  profileVersion: number;
  identity: {
    age?: number | null;
    sex?: string | null;
    heightCm?: number | null;
    currentWeightKg?: number | null;
    goalWeightKg?: number | null;
    bodyGoal?: string | null;
    desiredPace?: string | null;
  } | null;
  work: unknown;
  mealSchedule: unknown;
  trainingBlocks: unknown[];
  appetite: unknown;
  tolerance: unknown;
  lifestyle: unknown;
  targets: unknown;
  activeOverrides: unknown[];
}

export async function buildRoutineContext(userId: string, date = new Date()): Promise<{ context: RoutineContext; routineHash: string }> {
  const [
    identity,
    work,
    mealSchedule,
    trainingBlocks,
    appetite,
    tolerance,
    lifestyle,
    targets,
    activeOverrides
  ] = await Promise.all([
    prisma.routineProfile.findUnique({ where: { userId } }),
    prisma.workRoutine.findUnique({ where: { userId } }),
    prisma.mealSchedule.findUnique({ where: { userId } }),
    prisma.trainingBlock.findMany({ where: { userId }, orderBy: { position: "asc" } }),
    prisma.appetiteProfile.findUnique({ where: { userId } }),
    prisma.foodToleranceProfile.findUnique({ where: { userId } }),
    prisma.lifestylePreferences.findUnique({ where: { userId } }),
    prisma.nutritionTarget.findUnique({ where: { userId } }),
    prisma.routineOverride.findMany({
      where: {
        userId,
        dateFrom: { lte: date },
        dateTo: { gte: date }
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const context: RoutineContext = {
    profileVersion: identity?.profileVersion ?? 1,
    identity: identity ? {
      age: identity.age,
      sex: identity.sex,
      heightCm: identity.heightCm,
      currentWeightKg: identity.currentWeightKg,
      goalWeightKg: identity.goalWeightKg,
      bodyGoal: identity.bodyGoal,
      desiredPace: identity.desiredPace
    } : null,
    work: stripMeta(work),
    mealSchedule: stripMeta(mealSchedule),
    trainingBlocks: trainingBlocks.map(stripMeta),
    appetite: stripMeta(appetite),
    tolerance: stripMeta(tolerance),
    lifestyle: stripMeta(lifestyle),
    targets: targets ? {
      calories: targets.calories,
      proteinGrams: targets.proteinGrams,
      carbsGrams: targets.carbsGrams,
      fatGrams: targets.fatGrams
    } : null,
    activeOverrides: activeOverrides.map((override) => ({
      dateFrom: override.dateFrom,
      dateTo: override.dateTo,
      changedFields: override.changedFields,
      reason: override.reason,
      temporary: override.temporary
    }))
  };

  return {
    context,
    routineHash: createHash("sha256").update(JSON.stringify(context)).digest("hex").slice(0, 24)
  };
}

function stripMeta<T extends Record<string, unknown> | null>(value: T) {
  if (!value) return null;
  const { id, userId, createdAt, updatedAt, ...safe } = value;
  void id;
  void userId;
  void createdAt;
  void updatedAt;
  return safe;
}
