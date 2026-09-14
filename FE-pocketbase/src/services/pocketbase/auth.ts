/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getPocketBase } from "./client";
import { isMockPocketBaseEnabled } from "./mock";

const MOCK_ADMIN_EMAIL = "admin@aura.test";
const MOCK_ADMIN_PASSWORD = "secret123";

const mockToken = (): string => {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({
    id: "aura_mock_admin",
    type: "auth",
    collectionId: "pbc_3142635823",
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  })}.mock`;
};

export const isSuperuserSession = (): boolean => {
  const { authStore } = getPocketBase();
  return authStore.isValid && authStore.isSuperuser;
};

export const currentAdminEmail = (): string =>
  (getPocketBase().authStore.record?.email as string | undefined) ?? "";

export const loginSuperuser = async (
  email: string,
  password: string,
): Promise<void> => {
  if (isMockPocketBaseEnabled) {
    if (email !== MOCK_ADMIN_EMAIL || password !== MOCK_ADMIN_PASSWORD) {
      throw new Error("Failed to authenticate.");
    }
    getPocketBase().authStore.save(mockToken(), {
      id: "aura_mock_admin",
      collectionId: "pbc_3142635823",
      collectionName: "_superusers",
      email,
    });
    return;
  }

  await getPocketBase()
    .collection("_superusers")
    .authWithPassword(email, password);
};

export const refreshSuperuserSession = async (): Promise<boolean> => {
  const pb = getPocketBase();
  if (!isSuperuserSession()) return false;
  if (isMockPocketBaseEnabled) return true;

  try {
    await pb.collection("_superusers").authRefresh();
    if (isSuperuserSession()) return true;
  } catch {
    // A stored token is only a candidate session until its issuing server
    // verifies it. Network errors and rejected tokens both fail closed.
  }

  pb.authStore.clear();
  return false;
};

export const logout = (): void => {
  getPocketBase().authStore.clear();
};
