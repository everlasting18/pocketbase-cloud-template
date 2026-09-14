// Usage: bun run sync:schema [--check]
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { syncSchema } from "./schema-migration.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const collectionsPath = join(here, "../src/setup/collections.json");
const migrationsDir = join(here, "../../BE-pocketbase/pb_migrations");
const check = process.argv.includes("--check");

const collections = JSON.parse(readFileSync(collectionsPath, "utf8"));
const result = syncSchema({ collections, migrationsDir, now: Date.now(), check });

if (result.status === "up-to-date") {
  console.log(`Schema up to date (${result.file}).`);
} else if (result.status === "written") {
  console.log(`Wrote BE-pocketbase/pb_migrations/${result.file}`);
} else {
  console.error("Schema changed: run `bun run sync:schema` and commit the new migration.");
  process.exit(1);
}
