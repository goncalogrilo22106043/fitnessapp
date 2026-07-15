import { Prisma } from "@prisma/client";
import { env } from "../../config/env.js";
import { prisma } from "../../db/prisma.js";
import { ENGINE_VERSION } from "../../../../../packages/domain/src/index.js";
import { buildRoutineContext } from "./routine-context.builder.js";
import { callOpenAiJson } from "./openai.client.js";
import { RoutineAnalysisOutput, routineAnalysisSchema } from "./nutrition-plan.schema.js";

const PROMPT_VERSION = "routine-analysis-v1";

export async function getRoutineAnalysis(userId: string): Promise<{
  analysis: RoutineAnalysisOutput;
  source: "cache" | "openai" | "fallback";
  routineHash: string;
  modelVersion: string;
}> {
  const consent = await prisma.userConsent.findUnique({ where: { userId } });
  const { context, routineHash } = await buildRoutineContext(userId);
  const modelVersion = env.OPENAI_MODEL;

  const cached = await prisma.routineAnalysisCache.findUnique({
    where: {
      userId_routineHash_engineVersion_promptVersion_modelVersion: {
        userId,
        routineHash,
        engineVersion: ENGINE_VERSION,
        promptVersion: PROMPT_VERSION,
        modelVersion
      }
    }
  });

  if (cached) {
    return {
      analysis: routineAnalysisSchema.parse(cached.content),
      source: "cache",
      routineHash,
      modelVersion
    };
  }

  if (!consent?.aiPersonalizationConsent || consent.revokedAiConsentAt) {
    return {
      analysis: buildFallbackAnalysis(context),
      source: "fallback",
      routineHash,
      modelVersion: "deterministic-no-consent"
    };
  }

  try {
    const raw = await callOpenAiJson(buildPrompt(context), jsonSchema, "rotina_routine_analysis");
    const analysis = routineAnalysisSchema.parse(raw);
    await saveCache(userId, context.profileVersion, routineHash, modelVersion, analysis);
    return { analysis, source: "openai", routineHash, modelVersion };
  } catch {
    const analysis = buildFallbackAnalysis(context);
    await saveCache(userId, context.profileVersion, routineHash, "fallback-local", analysis);
    return { analysis, source: "fallback", routineHash, modelVersion: "fallback-local" };
  }
}

function buildPrompt(context: unknown) {
  return [
    "És a camada de análise de rotina da app Rotina.",
    "Analisa a rotina diária e propõe uma estrutura alimentar. Não calcules BMR, TDEE ou macros totais; usa os targets já calculados.",
    "Não inventes MealOptions. Só sugere atributos para slots, como volume, textura, timing e preparação.",
    "Respeita alergias, intolerâncias e alimentos rejeitados.",
    "Usa português simples, positivo e direto.",
    `Contexto minimizado sem PII: ${JSON.stringify(context)}`
  ].join("\n");
}

function buildFallbackAnalysis(context: Awaited<ReturnType<typeof buildRoutineContext>>["context"]): RoutineAnalysisOutput {
  const work = context.work as { wakeTime?: string | null; usualBedTime?: string | null } | null;
  const appetite = context.appetite as { appetiteMorning?: string | null; volumeTolerance?: "low" | "medium" | "high" | null; bestAppetiteWindow?: string | null; worstAppetiteWindow?: string | null } | null;
  const mealSchedule = context.mealSchedule as { breakfastTime?: string | null; lunchTime?: string | null; afternoonSnackTime?: string | null; dinnerTime?: string | null; mealsHardestToFinish?: string[] } | null;
  const tolerance = context.tolerance as { avoidedTextures?: string[]; preferredTextures?: string[] } | null;
  const targets = context.targets as { calories?: number; proteinGrams?: number; carbsGrams?: number; fatGrams?: number } | null;
  const volume = appetite?.volumeTolerance ?? "medium";
  const calories = targets?.calories ?? 2800;
  const protein = targets?.proteinGrams ?? 150;
  const carbs = targets?.carbsGrams ?? 330;
  const fat = targets?.fatGrams ?? 80;

  return {
    routineAnalysis: {
      summary: "Criei uma estrutura inicial com base nos horários, apetite e tolerância alimentar disponíveis.",
      strongestConstraints: [
        appetite?.appetiteMorning === "low" ? "Baixo apetite de manhã" : "Apetite matinal sem bloqueio forte",
        volume === "low" ? "Baixa tolerância a volume" : "Volume alimentar moderado",
        ...(tolerance?.avoidedTextures?.length ? [`Evitar texturas: ${tolerance.avoidedTextures.join(", ")}`] : [])
      ],
      appetiteWindows: [
        { label: "Manhã", timeRange: `${work?.wakeTime ?? "08:00"}-11:00`, appetite: normalizeAppetite(appetite?.appetiteMorning), rationale: "Usado para decidir volume e textura do pequeno-almoço." },
        { label: "Melhor janela", timeRange: appetite?.bestAppetiteWindow ?? "tarde", appetite: "medium", rationale: "Boa zona para reforçar calorias se necessário." }
      ],
      difficultWindows: [
        { label: "Janela difícil", timeRange: appetite?.worstAppetiteWindow ?? "manhã", reason: "Marcada como menor apetite ou refeição difícil." }
      ],
      trainingNutritionWindows: context.trainingBlocks.length > 0 ? [
        { dayPattern: "Dias de treino", timeRange: "pré e pós treino", recommendation: "Dar prioridade a hidratos antes/depois do treino sem aumentar demasiado o volume." }
      ] : [],
      practicalConstraints: ["Manter preparação simples e compatível com o tempo disponível."],
      personalizationSignals: ["Usar feedback para reduzir repetição e evitar alimentos cansativos."]
    },
    dailyStructure: {
      wakeTime: work?.wakeTime ?? null,
      bedtime: work?.usualBedTime ?? null,
      mealSlots: [
        slot("breakfast", mealSchedule?.breakfastTime ?? "08:30", volume, calories * 0.22, protein * 0.2, carbs * 0.22, fat * 0.2, tolerance),
        slot("lunch", mealSchedule?.lunchTime ?? "13:00", "medium", calories * 0.32, protein * 0.32, carbs * 0.32, fat * 0.32, tolerance),
        slot("snack", mealSchedule?.afternoonSnackTime ?? "16:30", volume, calories * 0.18, protein * 0.18, carbs * 0.2, fat * 0.16, tolerance),
        slot("dinner", mealSchedule?.dinnerTime ?? "20:30", "medium", calories * 0.28, protein * 0.3, carbs * 0.26, fat * 0.32, tolerance)
      ]
    },
    planRecommendations: {
      trainingDayStrategy: "Concentrar energia prática perto do treino e manter proteína distribuída.",
      restDayStrategy: "Distribuir calorias de forma estável, respeitando apetite e volume.",
      hardDayStrategy: "Priorizar Safe Meals, menor volume e opções familiares.",
      hydrationTimeline: [
        { time: "09:00", amountMilliliters: 500, rationale: "Começar cedo sem concentrar tudo à noite." },
        { time: "14:00", amountMilliliters: 750, rationale: "Apoiar refeições principais." },
        { time: "19:00", amountMilliliters: 750, rationale: "Fechar o dia de forma progressiva." }
      ],
      reminderRecommendations: ["Lembretes calmos antes das refeições mais difíceis."],
      adaptationRules: ["Se houver feedback negativo, reduzir ingrediente/textura associados nas próximas sugestões."]
    },
    clarifyingQuestions: mealSchedule?.mealsHardestToFinish?.length ? [] : [
      { id: "hardest_meal", question: "Qual é a refeição mais difícil de terminar?", reason: "Ajuda a ajustar volume e textura.", required: false, answerType: "single_choice" }
    ]
  };
}

function slot(
  name: string,
  suggestedTime: string,
  desiredVolume: "low" | "medium" | "high",
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
  tolerance: { avoidedTextures?: string[]; preferredTextures?: string[] } | null
) {
  return {
    name,
    suggestedTime,
    flexibilityMinutes: name === "breakfast" ? 90 : 60,
    targetCalories: Math.round(calories),
    targetProtein: Math.round(protein),
    targetCarbs: Math.round(carbs),
    targetFat: Math.round(fat),
    desiredVolume,
    desiredTextures: tolerance?.preferredTextures?.slice(0, 3) ?? ["soft"],
    avoidedTextures: tolerance?.avoidedTextures ?? [],
    preparationTimeLimit: name === "lunch" ? 20 : 15,
    rationale: "Definido por horário, apetite e tolerância alimentar."
  };
}

function normalizeAppetite(value?: string | null): "low" | "medium" | "high" | "unknown" {
  if (value === "low" || value === "medium" || value === "high") return value;
  return "unknown";
}

async function saveCache(userId: string, profileVersion: number, routineHash: string, modelVersion: string, analysis: RoutineAnalysisOutput) {
  await prisma.routineAnalysisCache.upsert({
    where: {
      userId_routineHash_engineVersion_promptVersion_modelVersion: {
        userId,
        routineHash,
        engineVersion: ENGINE_VERSION,
        promptVersion: PROMPT_VERSION,
        modelVersion
      }
    },
    update: { content: analysis as unknown as Prisma.InputJsonValue },
    create: {
      userId,
      profileVersion,
      routineHash,
      engineVersion: ENGINE_VERSION,
      promptVersion: PROMPT_VERSION,
      modelVersion,
      content: analysis as unknown as Prisma.InputJsonValue
    }
  });
}

const jsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["routineAnalysis", "dailyStructure", "planRecommendations", "clarifyingQuestions"],
  properties: routineAnalysisSchemaToJson()
};

function routineAnalysisSchemaToJson() {
  return {
    routineAnalysis: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "strongestConstraints", "appetiteWindows", "difficultWindows", "trainingNutritionWindows", "practicalConstraints", "personalizationSignals"],
      properties: {
        summary: { type: "string" },
        strongestConstraints: { type: "array", items: { type: "string" } },
        appetiteWindows: { type: "array", items: { type: "object", additionalProperties: false, required: ["label", "timeRange", "appetite", "rationale"], properties: { label: { type: "string" }, timeRange: { type: "string" }, appetite: { type: "string", enum: ["low", "medium", "high", "unknown"] }, rationale: { type: "string" } } } },
        difficultWindows: { type: "array", items: { type: "object", additionalProperties: false, required: ["label", "timeRange", "reason"], properties: { label: { type: "string" }, timeRange: { type: "string" }, reason: { type: "string" } } } },
        trainingNutritionWindows: { type: "array", items: { type: "object", additionalProperties: false, required: ["dayPattern", "timeRange", "recommendation"], properties: { dayPattern: { type: "string" }, timeRange: { type: "string" }, recommendation: { type: "string" } } } },
        practicalConstraints: { type: "array", items: { type: "string" } },
        personalizationSignals: { type: "array", items: { type: "string" } }
      }
    },
    dailyStructure: {
      type: "object",
      additionalProperties: false,
      required: ["wakeTime", "bedtime", "mealSlots"],
      properties: {
        wakeTime: { type: ["string", "null"] },
        bedtime: { type: ["string", "null"] },
        mealSlots: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "suggestedTime", "flexibilityMinutes", "targetCalories", "targetProtein", "targetCarbs", "targetFat", "desiredVolume", "desiredTextures", "avoidedTextures", "preparationTimeLimit", "rationale"], properties: { name: { type: "string" }, suggestedTime: { type: "string" }, flexibilityMinutes: { type: "number" }, targetCalories: { type: "number" }, targetProtein: { type: "number" }, targetCarbs: { type: "number" }, targetFat: { type: "number" }, desiredVolume: { type: "string", enum: ["low", "medium", "high"] }, desiredTextures: { type: "array", items: { type: "string" } }, avoidedTextures: { type: "array", items: { type: "string" } }, preparationTimeLimit: { type: "number" }, rationale: { type: "string" } } } }
      }
    },
    planRecommendations: {
      type: "object",
      additionalProperties: false,
      required: ["trainingDayStrategy", "restDayStrategy", "hardDayStrategy", "hydrationTimeline", "reminderRecommendations", "adaptationRules"],
      properties: {
        trainingDayStrategy: { type: "string" },
        restDayStrategy: { type: "string" },
        hardDayStrategy: { type: "string" },
        hydrationTimeline: { type: "array", items: { type: "object", additionalProperties: false, required: ["time", "amountMilliliters", "rationale"], properties: { time: { type: "string" }, amountMilliliters: { type: "number" }, rationale: { type: "string" } } } },
        reminderRecommendations: { type: "array", items: { type: "string" } },
        adaptationRules: { type: "array", items: { type: "string" } }
      }
    },
    clarifyingQuestions: { type: "array", items: { type: "object", additionalProperties: false, required: ["id", "question", "reason", "required", "answerType"], properties: { id: { type: "string" }, question: { type: "string" }, reason: { type: "string" }, required: { type: "boolean" }, answerType: { type: "string", enum: ["text", "number", "time", "single_choice", "multi_choice", "boolean"] } } } }
  };
}
