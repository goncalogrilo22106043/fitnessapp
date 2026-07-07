import { HydrationSummary, WeightTrend } from "./types.js";

export function summarizeHydration(input: {
  targetMilliliters: number;
  logs: Array<{ amountMilliliters: number; occurredAt: Date }>;
}): HydrationSummary {
  const consumedMilliliters = input.logs.reduce((total, log) => total + log.amountMilliliters, 0);

  return {
    targetMilliliters: input.targetMilliliters,
    consumedMilliliters,
    progress: Math.round(Math.min(consumedMilliliters / input.targetMilliliters, 1) * 100),
    timeline: [...input.logs].sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime())
  };
}

export function calculateWeightTrend(
  logs: Array<{ weightKilograms: number; occurredAt: Date }>
): WeightTrend {
  if (logs.length === 0) {
    return { direction: "stable", weeklyDeltaKilograms: 0, averageWeightKilograms: 0 };
  }

  const sorted = [...logs].sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime());
  const first = sorted[0]!;
  const last = sorted.at(-1)!;
  const weeklyDeltaKilograms = Math.round((last.weightKilograms - first.weightKilograms) * 10) / 10;
  const averageWeightKilograms =
    Math.round((sorted.reduce((total, log) => total + log.weightKilograms, 0) / sorted.length) * 10) / 10;

  return {
    direction: Math.abs(weeklyDeltaKilograms) < 0.2 ? "stable" : weeklyDeltaKilograms > 0 ? "up" : "down",
    weeklyDeltaKilograms,
    averageWeightKilograms
  };
}
