/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import PocketBase, { BaseAuthStore, LocalAuthStore } from "pocketbase";
import { isMockPocketBaseEnabled } from "./mock";

const STORAGE_KEY_URL = "aura_pb_url";
const STORAGE_KEY_ADMIN_AUTH = "aura_admin_auth";

const createPocketBase = (url: string): PocketBase => {
  const client = new PocketBase(url, new LocalAuthStore(STORAGE_KEY_ADMIN_AUTH));
  // Disable auto-cancellation to prevent request collisions in React StrictMode
  client.autoCancellation(false);
  return client;
};

export const getDefaultPocketBaseUrl = (): string => {
  // Check local storage first (user customized in app)
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(STORAGE_KEY_URL);
    if (saved) return saved;
  }
  // Check Vite env
  const envUrl = (import.meta as any).env?.VITE_POCKETBASE_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim().length > 0) {
    return envUrl.trim();
  }
  // Standard default placeholder for PocketBase Cloud instances
  // Format: https://<instance-id>.<region>.pocketbasecloud.com
  return "https://your-instance.pocketbasecloud.com";
};

// Singleton instance
let pbInstance: PocketBase | null = null;
let currentUrl: string = getDefaultPocketBaseUrl();

export const getPocketBase = (): PocketBase => {
  if (!pbInstance) {
    pbInstance = createPocketBase(currentUrl);
  }
  return pbInstance;
};

export const setPocketBaseUrl = (newUrl: string): PocketBase => {
  const sanitized = newUrl.trim().replace(/\/+$/, "");
  if (sanitized === currentUrl) return getPocketBase();

  // Authentication tokens are issued by one PocketBase instance and must not
  // be carried over when the admin switches to a different server.
  getPocketBase().authStore.clear();
  currentUrl = sanitized;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_URL, sanitized);
  }
  pbInstance = createPocketBase(sanitized);
  return pbInstance;
};

export const getCurrentPocketBaseUrl = (): string => currentUrl;

/**
 * Test connectivity with the PocketBase server
 */
export const testPocketBaseConnection = async (testUrl?: string): Promise<{
  connected: boolean;
  code?: number;
  message?: string;
  data?: any;
}> => {
  if (isMockPocketBaseEnabled) {
    return {
      connected: true,
      code: 200,
      message: "Development mock is active; no PocketBase server is being used.",
    };
  }

  const urlToCheck = (testUrl || currentUrl).trim().replace(/\/+$/, "");
  try {
    // Health checks never need authentication and shouldn't send a token to a
    // URL that hasn't been saved yet.
    const tempPb = new PocketBase(urlToCheck, new BaseAuthStore());
    tempPb.autoCancellation(false);
    const health = await tempPb.health.check();
    return {
      connected: health.code === 200,
      code: health.code,
      message: health.message || "PocketBase server is online and healthy.",
      data: health.data,
    };
  } catch (err: any) {
    // Also try standard fetch to /api/health in case SDK throws on non-standard cors
    try {
      const response = await fetch(`${urlToCheck}/api/health`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (response.ok) {
        const json = await response.json();
        return {
          connected: true,
          code: response.status,
          message: json.message || "Connected successfully",
          data: json.data,
        };
      }
    } catch {
      // Fall through to primary error
    }
    return {
      connected: false,
      message: err.message ||
        "Unable to reach PocketBase server. Please verify URL.",
    };
  }
};
