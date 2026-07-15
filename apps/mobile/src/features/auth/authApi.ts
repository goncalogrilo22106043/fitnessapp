import { ApiError, apiRequest, hasSession, setSession } from "../../api/client";

const demoCredentials = {
  email: "demo@rotina.local",
  password: "rotina-demo-2026",
  name: "Rotina"
};

export async function ensureDemoSession() {
  if (hasSession()) {
    return;
  }

  try {
    const session = await apiRequest<{ token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: demoCredentials.email,
        password: demoCredentials.password
      })
    });
    setSession(session);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }

    const session = await apiRequest<{ token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(demoCredentials)
    });
    setSession(session);
  }
}

export async function registerAccount(input: { email: string; password: string; name: string }) {
  const session = await apiRequest<{ token: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input)
  });
  setSession(session);
  return session;
}

export async function loginAccount(input: { email: string; password: string }) {
  const session = await apiRequest<{ token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input)
  });
  setSession(session);
  return session;
}
