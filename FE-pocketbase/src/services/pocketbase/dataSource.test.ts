import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  DATA_SOURCE_STORAGE_KEY,
  getDataSource,
  isMockMode,
  persistDataSource,
} from "./dataSource";

// Bun has no localStorage; install a minimal in-memory one per test.
const installStorage = () => {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  };
  return store;
};

describe("dataSource", () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = installStorage();
    delete process.env.VITE_USE_MOCK_POCKETBASE;
  });

  afterEach(() => {
    delete (globalThis as any).localStorage;
    delete process.env.VITE_USE_MOCK_POCKETBASE;
  });

  test("defaults to mock when the env flag is true", () => {
    process.env.VITE_USE_MOCK_POCKETBASE = "true";
    expect(getDataSource()).toBe("mock");
    expect(isMockMode()).toBe(true);
  });

  test("defaults to remote when the env flag is missing or not true", () => {
    expect(getDataSource()).toBe("remote");
    process.env.VITE_USE_MOCK_POCKETBASE = "false";
    expect(getDataSource()).toBe("remote");
  });

  test("a stored choice overrides the env default", () => {
    process.env.VITE_USE_MOCK_POCKETBASE = "true";
    persistDataSource("remote");
    expect(store.get(DATA_SOURCE_STORAGE_KEY)).toBe("remote");
    expect(getDataSource()).toBe("remote");
  });

  test("ignores an invalid stored value", () => {
    process.env.VITE_USE_MOCK_POCKETBASE = "true";
    store.set(DATA_SOURCE_STORAGE_KEY, "banana");
    expect(getDataSource()).toBe("mock");
  });

  test("works when storage is unavailable", () => {
    delete (globalThis as any).localStorage;
    process.env.VITE_USE_MOCK_POCKETBASE = "true";
    expect(getDataSource()).toBe("mock");
  });
});
