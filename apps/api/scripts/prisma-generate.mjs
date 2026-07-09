import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = join(import.meta.dirname, "../../..");
const cacheDir = join(root, ".cache");
const enginesDir = join(root, "node_modules/@prisma/engines");
const queryEngine = join(enginesDir, "libquery_engine-darwin-arm64.dylib.node");
const schemaEngine = join(enginesDir, "schema-engine-darwin-arm64");

mkdirSync(cacheDir, { recursive: true });

const env = { ...process.env };
env.XDG_CACHE_HOME = cacheDir;
env.HOME = root;
env.PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING = "1";

if (process.platform === "darwin" && process.arch === "arm64" && existsSync(queryEngine) && existsSync(schemaEngine)) {
  env.PRISMA_QUERY_ENGINE_LIBRARY = queryEngine;
  env.PRISMA_SCHEMA_ENGINE_BINARY = schemaEngine;
}

const result = spawnSync("prisma", ["generate"], {
  env,
  shell: true,
  stdio: "inherit"
});

process.exit(result.status ?? 1);
