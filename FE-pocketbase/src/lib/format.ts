/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const formatMoney = (amount: number): string =>
  amount.toLocaleString("en-US", { style: "currency", currency: "USD" });

/** PocketBase timestamps look like "2025-04-12 10:00:00.000Z"; Safari needs the "T". */
export const formatDate = (value?: string): string => {
  if (!value) return "—";
  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const shortId = (id?: string): string => (id ? id.slice(-6).toUpperCase() : "—");
