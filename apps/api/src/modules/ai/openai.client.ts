import { env } from "../../config/env.js";

export async function callOpenAiJson(input: unknown, schema: unknown, schemaName: string): Promise<unknown> {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  let lastError: unknown;
  const attempts = Math.max(env.OPENAI_MAX_RETRIES + 1, 1);

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.OPENAI_TIMEOUT_MS);

    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL,
          input,
          text: {
            format: {
              type: "json_schema",
              name: schemaName,
              strict: true,
              schema
            }
          }
        })
      });

      if (!response.ok) {
        lastError = new Error(`OpenAI request failed with ${response.status}`);
        continue;
      }

      const payload = await response.json() as { output_text?: string };
      return JSON.parse(payload.output_text ?? "{}") as unknown;
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("OpenAI request failed.");
}
