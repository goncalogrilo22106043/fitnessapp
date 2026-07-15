import { env } from "../../config/env.js";

export interface FeedbackLearningInput {
  mealName: string;
  ingredients: string[];
  mood: "loved" | "neutral" | "could_not_finish";
  eatenPercentage: number;
  notes?: string;
  issueTags: string[];
}

export interface FeedbackLearningResult {
  dislikedIngredients: string[];
  issueTags: string[];
  summary: string;
  usedAi: boolean;
}

export async function analyzeMealFeedback(input: FeedbackLearningInput): Promise<FeedbackLearningResult> {
  if (input.mood !== "could_not_finish" && input.notes?.trim().length === 0) {
    return {
      dislikedIngredients: [],
      issueTags: input.issueTags,
      summary: "Feedback positivo ou neutro guardado para reforçar escolhas semelhantes.",
      usedAi: false
    };
  }

  if (!env.OPENAI_API_KEY) {
    return fallbackAnalyze(input);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        input: buildPrompt(input),
        text: {
          format: {
            type: "json_schema",
            name: "rotina_feedback_learning",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["dislikedIngredients", "issueTags", "summary"],
              properties: {
                dislikedIngredients: { type: "array", items: { type: "string" } },
                issueTags: { type: "array", items: { type: "string" } },
                summary: { type: "string" }
              }
            }
          }
        }
      })
    });

    if (!response.ok) {
      return fallbackAnalyze(input);
    }

    const payload = await response.json() as { output_text?: string };
    const parsed = JSON.parse(payload.output_text ?? "{}") as Omit<FeedbackLearningResult, "usedAi">;
    return {
      dislikedIngredients: normalizeList(parsed.dislikedIngredients),
      issueTags: normalizeList([...input.issueTags, ...(parsed.issueTags ?? [])]),
      summary: parsed.summary || "Feedback analisado e guardado no perfil.",
      usedAi: true
    };
  } catch {
    return fallbackAnalyze(input);
  }
}

function buildPrompt(input: FeedbackLearningInput) {
  return [
    "És o sistema de aprendizagem alimentar da app Rotina.",
    "Analisa feedback de uma refeição e devolve sinais simples para adaptar planos futuros.",
    "Só marca ingredientes como dislikedIngredients se o utilizador indicar ou se a nota apontar claramente para esse ingrediente.",
    "Não inventes alergias. Não dês aconselhamento médico.",
    `Refeição: ${input.mealName}`,
    `Ingredientes: ${JSON.stringify(input.ingredients)}`,
    `Mood: ${input.mood}`,
    `Percentagem comida: ${input.eatenPercentage}`,
    `Tags escolhidas: ${JSON.stringify(input.issueTags)}`,
    `Notas: ${input.notes ?? ""}`
  ].join("\n");
}

function fallbackAnalyze(input: FeedbackLearningInput): FeedbackLearningResult {
  const text = `${input.notes ?? ""} ${input.issueTags.join(" ")}`.toLowerCase();
  const dislikedIngredients = normalizeList(
    input.ingredients.filter((ingredient) => text.includes(ingredient.toLowerCase()))
  );
  const inferredTags = [...input.issueTags];

  if (text.includes("seco") || text.includes("seca")) inferredTags.push("textura_seca");
  if (text.includes("cheio") || text.includes("volume")) inferredTags.push("demasiado_volume");
  if (text.includes("enjoo") || text.includes("enjoei")) inferredTags.push("enjoo");

  return {
    dislikedIngredients,
    issueTags: normalizeList(inferredTags),
    summary: dislikedIngredients.length > 0
      ? `Vou reduzir ${dislikedIngredients.join(", ")} em próximas sugestões semelhantes.`
      : "Feedback guardado para ajustar volume, textura e repetição nas próximas escolhas.",
    usedAi: false
  };
}

function normalizeList(values: string[] = []) {
  return [...new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))];
}
