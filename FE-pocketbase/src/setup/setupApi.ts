/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import PocketBase, { BaseAuthStore, ClientResponseError } from "pocketbase";
import { JOURNAL_ARTICLES } from "@/constants/articles";
import { PRODUCTS } from "@/constants/products";
import { errorMessage } from "@/lib/errors";
import type { JournalArticle, Product } from "@/types";
import collections from "./collections.json";

export const REQUIRED_COLLECTIONS = ["products", "journal_articles", "orders"] as const;

export const COLLECTIONS_JSON = JSON.stringify(collections, null, 2);

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export const normalizeUrl = (url: string): string => url.trim().replace(/\/+$/, "");

export const isInsecureUrl = (url: string): boolean => {
  try {
    const parsed = new URL(normalizeUrl(url));
    return parsed.protocol !== "https:" && !LOCAL_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
};

export type SetupAction = "connect" | "auth" | "import" | "check" | "seed";

export const describeSetupError = (err: unknown, action: SetupAction): string => {
  if (err instanceof ClientResponseError) {
    if (err.status === 0) return "Can't reach this URL — check it and that the instance is running.";
    if (action === "auth" && err.status === 400) return "Wrong superuser email or password.";
    if (err.status === 401 || err.status === 403) {
      return "This account isn't a superuser, or the session expired. Sign in again.";
    }
  }
  return errorMessage(err);
};

/**
 * A client separate from the app singleton: its session lives only in memory,
 * so setup never disturbs the current (possibly mock) admin session.
 */
export const createSetupClient = (url: string): PocketBase => {
  const client = new PocketBase(normalizeUrl(url), new BaseAuthStore());
  client.autoCancellation(false);
  return client;
};

export const checkHealth = async (client: PocketBase): Promise<void> => {
  await client.health.check();
};

export const authSuperuser = async (
  client: PocketBase,
  email: string,
  password: string,
): Promise<void> => {
  await client.collection("_superusers").authWithPassword(email, password);
};

export const importCollections = async (client: PocketBase): Promise<void> => {
  // deleteMissing = false: never drop the user's other collections.
  await client.collections.import(collections as any, false);
};

export const findMissingCollections = async (client: PocketBase): Promise<string[]> => {
  const existing = await client.collections.getFullList({ fields: "name" });
  const names = new Set(existing.map((c) => c.name));
  return REQUIRED_COLLECTIONS.filter((name) => !names.has(name));
};

export const slugify = (text: string): string =>
  text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const escapeHtml = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export interface ProductSeed {
  name: string;
  tagline: string;
  description: string;
  longDescription: string;
  price: number;
  category: Product["category"];
  imageUrl: string;
  gallery: string[];
  features: string[];
  slug: string;
}

export interface ArticleSeed {
  title: string;
  date: string;
  excerpt: string;
  image: string;
  contentHtml: string;
}

export const buildProductSeeds = (products: Product[] = PRODUCTS): ProductSeed[] =>
  products.map((p) => ({
    name: p.name,
    tagline: p.tagline,
    description: p.description,
    longDescription: p.longDescription ?? "",
    price: p.price,
    category: p.category,
    imageUrl: p.imageUrl,
    gallery: p.gallery ?? [],
    features: p.features,
    // The static catalog has no slugs; derive them so re-seeding can detect existing records.
    slug: p.slug || slugify(p.name),
  }));

export const buildArticleSeeds = (articles: JournalArticle[] = JOURNAL_ARTICLES): ArticleSeed[] =>
  articles.map((a) => ({
    title: a.title,
    date: a.date,
    excerpt: a.excerpt,
    image: a.image,
    // Static articles are JSX; the excerpt is the only HTML-safe body available.
    contentHtml: a.contentHtml ?? `<p>${escapeHtml(a.excerpt)}</p>`,
  }));

export const partitionSeeds = <T>(
  seeds: T[],
  existing: Set<string>,
  keyOf: (seed: T) => string,
): { toCreate: T[]; skipped: T[] } => ({
  toCreate: seeds.filter((s) => !existing.has(keyOf(s))),
  skipped: seeds.filter((s) => existing.has(keyOf(s))),
});

export interface SeedProgress {
  collection: "products" | "journal_articles";
  done: number;
  total: number;
}

export interface SeedFailure {
  collection: string;
  label: string;
  message: string;
}

export interface SeedResult {
  created: number;
  skipped: number;
  failed: SeedFailure[];
}

const seedCollection = async <T extends object>(
  client: PocketBase,
  collection: SeedProgress["collection"],
  seeds: T[],
  keyField: keyof T & string,
  result: SeedResult,
  onProgress?: (p: SeedProgress) => void,
): Promise<void> => {
  const existing = await client.collection(collection).getFullList({ fields: keyField });
  const keys = new Set(existing.map((r) => String(r[keyField] ?? "")));
  const keyOf = (s: T) => String(s[keyField]);
  const { toCreate, skipped } = partitionSeeds(seeds, keys, keyOf);
  result.skipped += skipped.length;

  let done = skipped.length;
  onProgress?.({ collection, done, total: seeds.length });
  // Sequential on purpose: a handful of records, and SQLite has one write lock.
  for (const seed of toCreate) {
    try {
      await client.collection(collection).create(seed);
      result.created += 1;
    } catch (err) {
      result.failed.push({ collection, label: keyOf(seed), message: describeSetupError(err, "seed") });
    }
    done += 1;
    onProgress?.({ collection, done, total: seeds.length });
  }
};

/** Idempotent: products match on slug, articles on title; existing records are skipped. */
export const seedSampleData = async (
  client: PocketBase,
  onProgress?: (p: SeedProgress) => void,
): Promise<SeedResult> => {
  const result: SeedResult = { created: 0, skipped: 0, failed: [] };
  await seedCollection(client, "products", buildProductSeeds(), "slug", result, onProgress);
  await seedCollection(client, "journal_articles", buildArticleSeeds(), "title", result, onProgress);
  return result;
};
