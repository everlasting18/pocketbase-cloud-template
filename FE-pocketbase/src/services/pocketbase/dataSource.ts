/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DataSource = "mock" | "remote";

export const DATA_SOURCE_STORAGE_KEY = "aura_data_source";

const envDefault = (): DataSource =>
  (import.meta as any).env?.VITE_USE_MOCK_POCKETBASE === "true" ? "mock" : "remote";

const readStored = (): DataSource | null => {
  try {
    const value = globalThis.localStorage?.getItem(DATA_SOURCE_STORAGE_KEY);
    return value === "mock" || value === "remote" ? value : null;
  } catch {
    // Storage can be blocked (private mode, sandboxed iframes).
    return null;
  }
};

/** The browser's saved choice wins; otherwise the build's VITE_USE_MOCK_POCKETBASE flag. */
export const getDataSource = (): DataSource => readStored() ?? envDefault();

export const isMockMode = (): boolean => getDataSource() === "mock";

export const persistDataSource = (source: DataSource): void => {
  try {
    globalThis.localStorage?.setItem(DATA_SOURCE_STORAGE_KEY, source);
  } catch {
    // Without storage the env default stays in effect.
  }
};
