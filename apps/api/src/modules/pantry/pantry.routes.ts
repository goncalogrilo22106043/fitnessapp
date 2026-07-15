import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { AuthenticatedRequest, authenticate } from "../../http/authenticate.js";

export const pantryRouter = Router();

const pantryItemSchema = z.object({
  name: z.string().min(2).max(80),
  category: z.string().min(2).max(40).default("other"),
  quantity: z.string().max(40).optional(),
  available: z.boolean().default(true),
  expiresAt: z.string().datetime().optional()
});

const pantryListSchema = z.object({
  items: z.array(pantryItemSchema).min(1).max(80)
});

pantryRouter.get("/", authenticate, async (request, response) => {
  const userId = (request as AuthenticatedRequest).userId;
  const items = await prisma.pantryItem.findMany({
    where: { userId },
    orderBy: [{ available: "desc" }, { name: "asc" }]
  });

  response.json({ items });
});

pantryRouter.put("/", authenticate, async (request, response) => {
  const input = pantryListSchema.parse(request.body);
  const userId = (request as AuthenticatedRequest).userId;

  await prisma.$transaction(
    input.items.map((item) =>
      prisma.pantryItem.upsert({
        where: { userId_name: { userId, name: item.name.trim().toLowerCase() } },
        update: {
          category: item.category,
          quantity: item.quantity ?? null,
          available: item.available,
          expiresAt: item.expiresAt ? new Date(item.expiresAt) : null
        },
        create: {
          userId,
          name: item.name.trim().toLowerCase(),
          category: item.category,
          quantity: item.quantity ?? null,
          available: item.available,
          expiresAt: item.expiresAt ? new Date(item.expiresAt) : null
        }
      })
    )
  );

  const items = await prisma.pantryItem.findMany({ where: { userId }, orderBy: { name: "asc" } });
  response.json({ message: "Despensa atualizada. As próximas sugestões já podem usar estes alimentos.", items });
});
