import { describe, expect, test } from "bun:test";
import { ClientResponseError } from "pocketbase";
import {
  COLLECTIONS_JSON,
  REQUIRED_COLLECTIONS,
  buildArticleSeeds,
  buildProductSeeds,
  describeSetupError,
  isInsecureUrl,
  normalizeUrl,
  partitionSeeds,
  slugify,
} from "./setupApi";

const responseError = (status: number, message = "boom", data: object = {}) =>
  new ClientResponseError({ status, response: { message, data } });

describe("urls", () => {
  test("normalizeUrl trims whitespace and trailing slashes", () => {
    expect(normalizeUrl("  https://x.pocketbasecloud.com/// ")).toBe("https://x.pocketbasecloud.com");
  });

  test("isInsecureUrl flags plain http except for local hosts", () => {
    expect(isInsecureUrl("http://example.com")).toBe(true);
    expect(isInsecureUrl("https://example.com")).toBe(false);
    expect(isInsecureUrl("http://127.0.0.1:8090")).toBe(false);
    expect(isInsecureUrl("http://localhost:8090")).toBe(false);
    expect(isInsecureUrl("not a url")).toBe(false);
  });
});

describe("describeSetupError", () => {
  test("network failure", () => {
    expect(describeSetupError(responseError(0), "connect")).toBe(
      "Can't reach this URL — check it and that the instance is running.",
    );
  });

  test("bad credentials on auth", () => {
    expect(describeSetupError(responseError(400, "Failed to authenticate."), "auth")).toBe(
      "Wrong superuser email or password.",
    );
  });

  test("forbidden", () => {
    expect(describeSetupError(responseError(403), "import")).toBe(
      "This account isn't a superuser, or the session expired. Sign in again.",
    );
  });

  test("validation errors list their fields", () => {
    const err = responseError(400, "Failed to import.", { collections: { message: "Invalid field." } });
    expect(describeSetupError(err, "import")).toBe("Failed to import. (collections: Invalid field.)");
  });

  test("plain errors fall back to their message", () => {
    expect(describeSetupError(new Error("nope"), "seed")).toBe("nope");
  });
});

describe("collections json", () => {
  test("contains exactly the required collections", () => {
    const names = JSON.parse(COLLECTIONS_JSON).map((c: { name: string }) => c.name).sort();
    expect(names).toEqual([...REQUIRED_COLLECTIONS].sort());
  });
});

describe("seeds", () => {
  test("slugify", () => {
    expect(slugify("  Aura Harmony ")).toBe("aura-harmony");
    expect(slugify("Café & Crème — No. 5")).toBe("cafe-creme-no-5");
  });

  test("product seeds carry every catalog product with a unique slug", () => {
    const seeds = buildProductSeeds();
    expect(seeds).toHaveLength(6);
    expect(new Set(seeds.map((s) => s.slug)).size).toBe(6);
    expect(seeds[0]).toMatchObject({ name: "Aura Harmony", slug: "aura-harmony", price: 429, category: "Audio" });
    expect(Array.isArray(seeds[0].gallery)).toBe(true);
  });

  test("article seeds turn the excerpt into escaped HTML when there is no contentHtml", () => {
    const seeds = buildArticleSeeds([
      { id: 1, title: "T", date: "D", excerpt: "a < b & c", image: "https://x/y.jpg", content: null },
    ]);
    expect(seeds).toEqual([
      { title: "T", date: "D", excerpt: "a < b & c", image: "https://x/y.jpg", contentHtml: "<p>a &lt; b &amp; c</p>" },
    ]);
    expect(buildArticleSeeds()).toHaveLength(3);
  });

  test("partitionSeeds skips records whose key already exists", () => {
    const seeds = [{ k: "a" }, { k: "b" }, { k: "c" }];
    expect(partitionSeeds(seeds, new Set(["b"]), (s) => s.k)).toEqual({
      toCreate: [{ k: "a" }, { k: "c" }],
      skipped: [{ k: "b" }],
    });
  });
});
