import cors from "cors";
import express from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { feedbackRouter } from "../modules/feedback/feedback.routes.js";
import { onboardingRouter } from "../modules/onboarding/onboarding.routes.js";
import { plansRouter } from "../modules/plans/plans.routes.js";
import { profileRouter } from "../modules/profile/profile.routes.js";
import { progressRouter } from "../modules/progress/progress.routes.js";

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
  app.use("/onboarding", onboardingRouter);
  app.use("/plans", plansRouter);
  app.use("/profile", profileRouter);
  app.use("/feedback", feedbackRouter);
  app.use("/progress", progressRouter);

  return app;
}
