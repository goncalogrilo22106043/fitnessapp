const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const localApiBaseUrl = process.env.NODE_ENV === "production" ? undefined : "http://localhost:4000";
const apiBaseUrl = (configuredApiBaseUrl || localApiBaseUrl)?.replace(/\/$/, "");
const requestTimeoutMs = 15000;

if (!apiBaseUrl) {
  throw new Error("EXPO_PUBLIC_API_BASE_URL is required outside local development.");
}

export interface ApiSession {
  token: string;
}

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    if (status !== undefined) {
      this.status = status;
    }
  }
}

let session: ApiSession | null = null;

export function setSession(nextSession: ApiSession) {
  session = nextSession;
}

export async function apiRequest<TResponse>(
  path: string,
  options: RequestInit = {}
): Promise<TResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
        ...options.headers
      }
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("A API demorou demasiado a responder. Confirma se o Railway está ativo e tenta outra vez.");
    }

    throw new ApiError("Não consegui ligar à API. Confirma a ligação e o endereço da API.");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: "Vamos tentar novamente." }));
    throw new ApiError(payload.message ?? "Vamos tentar novamente.", response.status);
  }

  return response.json() as Promise<TResponse>;
}
