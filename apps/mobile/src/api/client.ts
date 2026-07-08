const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const apiBaseUrl = (configuredApiBaseUrl || "http://localhost:4000").replace(/\/$/, "");

export interface ApiSession {
  token: string;
}

let session: ApiSession | null = null;

export function setSession(nextSession: ApiSession) {
  session = nextSession;
}

export async function apiRequest<TResponse>(
  path: string,
  options: RequestInit = {}
): Promise<TResponse> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: "Vamos tentar novamente." }));
    throw new Error(payload.message ?? "Vamos tentar novamente.");
  }

  return response.json() as Promise<TResponse>;
}
