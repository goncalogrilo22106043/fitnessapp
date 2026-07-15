import cors from "cors";
import express from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { aiRouter } from "../modules/ai/ai.routes.js";
import { feedbackRouter } from "../modules/feedback/feedback.routes.js";
import { mealsRouter } from "../modules/meals/meals.routes.js";
import { onboardingRouter } from "../modules/onboarding/onboarding.routes.js";
import { pantryRouter } from "../modules/pantry/pantry.routes.js";
import { plansRouter } from "../modules/plans/plans.routes.js";
import { profileRouter } from "../modules/profile/profile.routes.js";
import { progressRouter } from "../modules/progress/progress.routes.js";
import { routineProfileRouter } from "../modules/routine-profile/routine-profile.routes.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/", (_request, response) => {
    response.json({ status: "ok", product: "rotina", health: "/health" });
  });

  app.get("/health", (_request, response) => {
    response.json({ status: "ok", product: "rotina" });
  });

  app.use("/auth", authRouter);
  app.use("/ai", aiRouter);
  app.use("/onboarding", onboardingRouter);
  app.use("/pantry", pantryRouter);
  app.use("/plans", plansRouter);
  app.use("/profile", profileRouter);
  app.use("/feedback", feedbackRouter);
  app.use("/meals", mealsRouter);
  app.use("/progress", progressRouter);
  app.use("/routine-profile", routineProfileRouter);

  return app;
}
