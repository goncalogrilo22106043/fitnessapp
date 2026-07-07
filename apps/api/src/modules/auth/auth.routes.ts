import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../../config/env.js";
import { prisma } from "../../db/prisma.js";

export const authRouter = Router();

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).optional()
});

authRouter.post("/register", async (request, response) => {
  const input = authSchema.parse(request.body);
  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash,
      name: input.name ?? "Rotina",
      profile: {
        create: {
          preferredTextures: {},
          preferredVolumes: { medium: 0.7 },
          preferredFlavors: {},
          avoidedIngredients: [],
          budgetPreference: "medium",
          cookingTimePreference: "standard",
          safeMealIds: []
        }
      }
    }
  });

  response.status(201).json(createSession(user.id));
});

authRouter.post("/login", async (request, response) => {
  const input = authSchema.omit({ name: true }).parse(request.body);
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });

  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    response.status(401).json({ message: "Dados de acesso a rever." });
    return;
  }

  response.json(createSession(user.id));
});

function createSession(userId: string) {
  return {
    token: jwt.sign({}, env.JWT_SECRET, { subject: userId, expiresIn: "30d" })
  };
}
