import { apiRequest, setSession } from "../../api/client";

const demoCredentials = {
  email: "demo@rotina.local",
  password: "rotina-demo-2026",
  name: "Rotina"
};

export async function ensureDemoSession() {
  try {
    const session = await apiRequest<{ token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: demoCredentials.email,
        password: demoCredentials.password
      })
    });
    setSession(session);
  } catch {
    const session = await apiRequest<{ token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(demoCredentials)
    });
    setSession(session);
  }
}
