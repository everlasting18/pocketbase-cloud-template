import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  MIGRATION_SUFFIX,
  extractCollections,
  latestMigration,
  renderMigration,
  syncSchema,
} from "./schema-migration.mjs";

const v1 = [{ id: "pbc_1", name: "products", fields: [{ name: "title`${x}\\", type: "text" }] }];
const v2 = [{ id: "pbc_1", name: "products", fields: [{ name: "title", type: "text" }, { name: "slug", type: "text" }] }];

describe("renderMigration / extractCollections", () => {
  test("round-trips collections, including backticks and backslashes", () => {
    expect(extractCollections(renderMigration(v1, { first: true }))).toEqual(v1);
  });

  test("first migration's down deletes the collections; later ones do not", () => {
    expect(renderMigration(v1, { first: true })).toContain("findCollectionByNameOrId");
    expect(renderMigration(v1, { first: false })).not.toContain("findCollectionByNameOrId");
  });

  test("always imports with deleteMissing = false", () => {
    expect(renderMigration(v1, { first: true })).toMatch(/importCollectionsByMarshaledJSON\(".*", false\)/);
  });

  test("returns null for a file that is not a generated migration", () => {
    expect(extractCollections("migrate((app) => {})")).toBeNull();
  });
});

describe("latestMigration", () => {
  test("picks the highest numeric timestamp among generated files", () => {
    expect(
      latestMigration(["9_aura_collections.js", "100_aura_collections.js", "200_other.js", "readme.md"]),
    ).toBe("100_aura_collections.js");
    expect(latestMigration(["1_other.js"])).toBeNull();
  });
});

describe("syncSchema", () => {
  let dir;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "sync-schema-"));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  test("writes the first migration, then reports up to date", () => {
    const first = syncSchema({ collections: v1, migrationsDir: dir, now: 1000_000, check: false });
    expect(first).toEqual({ status: "written", file: `1000${MIGRATION_SUFFIX}` });
    expect(readFileSync(join(dir, first.file), "utf8")).toContain("findCollectionByNameOrId");

    const again = syncSchema({ collections: v1, migrationsDir: dir, now: 2000_000, check: false });
    expect(again).toEqual({ status: "up-to-date", file: `1000${MIGRATION_SUFFIX}` });
    expect(readdirSync(dir)).toHaveLength(1);
  });

  test("appends a new file on change and never edits the old one", () => {
    syncSchema({ collections: v1, migrationsDir: dir, now: 1000_000, check: false });
    const before = readFileSync(join(dir, `1000${MIGRATION_SUFFIX}`), "utf8");

    const changed = syncSchema({ collections: v2, migrationsDir: dir, now: 2000_000, check: false });
    expect(changed).toEqual({ status: "written", file: `2000${MIGRATION_SUFFIX}` });
    expect(readFileSync(join(dir, `1000${MIGRATION_SUFFIX}`), "utf8")).toBe(before);
    expect(readFileSync(join(dir, changed.file), "utf8")).not.toContain("findCollectionByNameOrId");
  });

  test("check mode reports outdated without writing", () => {
    writeFileSync(join(dir, "1000_other.js"), "migrate(() => {})");
    const result = syncSchema({ collections: v1, migrationsDir: dir, now: 1000_000, check: true });
    expect(result).toEqual({ status: "outdated", file: null });
    expect(readdirSync(dir)).toEqual(["1000_other.js"]);
  });
});
