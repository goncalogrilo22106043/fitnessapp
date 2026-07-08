import { env } from "./config/env.js";
import { prisma } from "./db/prisma.js";
import { createApp } from "./http/app.js";

const app = createApp();
const server = app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Rotina API listening on port ${env.PORT}`);
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
}

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});

export default app;
