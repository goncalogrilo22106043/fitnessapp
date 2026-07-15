import { createHash } from "node:crypto";
import { env } from "../../config/env.js";

export interface AiMealIdeaInput {
  mealTime: "breakfast" | "lunch" | "snack" | "dinner";
  profile: unknown;
  targets: unknown;
  pantryItems: Array<{ name: string; category: string; quantity?: string | null }>;
  notes?: string;
}

export interface AiMealIdea {
  title: string;
  mealTime: "breakfast" | "lunch" | "snack" | "dinner";
  why: string;
  ingredientsToUse: string[];
  missingIngredients: string[];
  estimatedCalories: number;
  estimatedProteinGrams: number;
  prepSteps: string[];
  texture: string;
  volume: "low" | "medium" | "high";
}

export interface AiMealIdeasResult {
  model: string;
  promptHash: string;
  usedAi: boolean;
  ideas: AiMealIdea[];
}

export async function generateMealIdeas(input: AiMealIdeaInput): Promise<AiMealIdeasResult> {
  const prompt = buildPrompt(input);
  const promptHash = createHash("sha256").update(prompt).digest("hex").slice(0, 16);

  if (!env.OPENAI_API_KEY) {
    return {
      model: "fallback-local",
      promptHash,
      usedAi: false,
      ideas: buildFallbackIdeas(input)
    };
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
        input: prompt,
        text: {
          format: {
            type: "json_schema",
            name: "rotina_meal_ideas",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["ideas"],
              properties: {
                ideas: {
                  type: "array",
                  minItems: 3,
                  maxItems: 5,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: [
                      "title",
                      "mealTime",
                      "why",
                      "ingredientsToUse",
                      "missingIngredients",
                      "estimatedCalories",
                      "estimatedProteinGrams",
                      "prepSteps",
                      "texture",
                      "volume"
                    ],
                    properties: {
                      title: { type: "string" },
                      mealTime: { type: "string", enum: ["breakfast", "lunch", "snack", "dinner"] },
                      why: { type: "string" },
                      ingredientsToUse: { type: "array", items: { type: "string" } },
                      missingIngredients: { type: "array", items: { type: "string" } },
                      estimatedCalories: { type: "number" },
                      estimatedProteinGrams: { type: "number" },
                      prepSteps: { type: "array", items: { type: "string" } },
                      texture: { type: "string" },
                      volume: { type: "string", enum: ["low", "medium", "high"] }
                    }
                  }
                }
              }
            }
          }
        }
      })
    });

    if (!response.ok) {
      return { model: "fallback-local", promptHash, usedAi: false, ideas: buildFallbackIdeas(input) };
    }

    const payload = await response.json() as { output_text?: string };
    const parsed = JSON.parse(payload.output_text ?? "{\"ideas\":[]}") as { ideas: AiMealIdea[] };
    return {
      model: env.OPENAI_MODEL,
      promptHash,
      usedAi: true,
      ideas: parsed.ideas.length > 0 ? parsed.ideas : buildFallbackIdeas(input)
    };
  } catch {
    return {
      model: "fallback-local",
      promptHash,
      usedAi: false,
      ideas: buildFallbackIdeas(input)
    };
  }
}

function buildPrompt(input: AiMealIdeaInput): string {
  return [
    "És o motor AI da app Rotina. Gera opções práticas com base no que o utilizador tem em casa.",
    "Não inventes ingredientes como disponíveis. Se faltar algo, coloca em missingIngredients.",
    "Usa linguagem positiva, simples e portuguesa.",
    "Respeita tolerância alimentar, texturas evitadas, safe foods, objetivo e macros.",
    `Meal time: ${input.mealTime}`,
    `Notas do utilizador: ${input.notes ?? "sem notas"}`,
    `Perfil: ${JSON.stringify(input.profile)}`,
    `Metas: ${JSON.stringify(input.targets)}`,
    `Alimentos em casa: ${JSON.stringify(input.pantryItems)}`
  ].join("\n");
}

function buildFallbackIdeas(input: AiMealIdeaInput): AiMealIdea[] {
  const pantry = input.pantryItems.map((item) => item.name);
  const main = pantry.slice(0, 4);
  const baseTitle = input.mealTime === "snack" ? "Lanche com o que tens em casa" : "Refeicao simples com a tua despensa";

  return [
    {
      title: baseTitle,
      mealTime: input.mealTime,
      why: "Usei os alimentos que marcaste como disponíveis e mantive a opção simples para poderes decidir rápido.",
      ingredientsToUse: main,
      missingIngredients: main.length >= 2 ? [] : ["adiciona uma fonte de proteína se tiveres"],
      estimatedCalories: input.mealTime === "snack" ? 350 : 600,
      estimatedProteinGrams: input.mealTime === "snack" ? 25 : 40,
      prepSteps: ["Junta a base disponível.", "Adiciona uma fonte de proteína.", "Ajusta textura com iogurte, leite, molho ou azeite se fizer sentido."],
      texture: "adaptável",
      volume: "medium"
    },
    {
      title: "Opção de menor volume",
      mealTime: input.mealTime,
      why: "Priorizei densidade calórica para ajudar quando não apetece comer muito.",
      ingredientsToUse: main,
      missingIngredients: ["azeite, frutos secos ou iogurte se quiseres subir calorias"],
      estimatedCalories: input.mealTime === "snack" ? 420 : 700,
      estimatedProteinGrams: input.mealTime === "snack" ? 22 : 38,
      prepSteps: ["Usa uma porção pequena.", "Acrescenta algo mais denso em calorias.", "Mantém a textura fácil de comer."],
      texture: "cremosa ou macia",
      volume: "low"
    },
    {
      title: "Opção segura",
      mealTime: input.mealTime,
      why: "Mantive a sugestão perto de alimentos familiares para reduzir risco de enjoo alimentar.",
      ingredientsToUse: main,
      missingIngredients: [],
      estimatedCalories: input.mealTime === "snack" ? 300 : 550,
      estimatedProteinGrams: input.mealTime === "snack" ? 20 : 35,
      prepSteps: ["Escolhe os alimentos que já toleras bem.", "Evita texturas secas.", "Guarda feedback depois de comer."],
      texture: "familiar",
      volume: "medium"
    }
  ];
}
