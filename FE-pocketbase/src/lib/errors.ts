/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ClientResponseError } from "pocketbase";

/** Human-readable message for a failed PocketBase call, including per-field validation errors. */
export const errorMessage = (err: unknown): string => {
  if (err instanceof ClientResponseError) {
    const data = (err.response?.data ?? {}) as Record<string, { message?: string }>;
    const fields = Object.entries(data).map(([field, detail]) => `${field}: ${detail?.message ?? "invalid"}`);
    return fields.length ? `${err.message} (${fields.join("; ")})` : err.message;
  }
  return err instanceof Error ? err.message : "Something went wrong";
};
