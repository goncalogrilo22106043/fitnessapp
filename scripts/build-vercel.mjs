import { build } from "esbuild";

await build({
  entryPoints: ["apps/api/src/vercel.ts"],
  outfile: "dist/vercel/server.mjs",
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  sourcemap: false,
  external: [
    "@prisma/client",
    ".prisma/client",
    "bcryptjs",
    "cors",
    "dotenv",
    "dotenv/config",
    "express",
    "jsonwebtoken",
    "zod"
  ]
});
