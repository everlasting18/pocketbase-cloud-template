/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  currentAdminEmail,
  getPocketBase,
  isSuperuserSession,
  loginSuperuser,
  logout as clearSession,
  refreshSuperuserSession,
} from "@/services/pocketbase";

interface AdminAuthContextValue {
  isAuthed: boolean;
  isChecking: boolean;
  email: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

const readSession = () => ({
  isAuthed: isSuperuserSession(),
  email: currentAdminEmail(),
});

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState(readSession);
  const [isChecking, setIsChecking] = useState(session.isAuthed);

  useEffect(() => {
    let active = true;
    const unsubscribe = getPocketBase().authStore.onChange(() => {
      if (active) setSession(readSession());
    });

    if (!isSuperuserSession()) {
      setIsChecking(false);
      return unsubscribe;
    }

    void refreshSuperuserSession().then((verified) => {
      if (!active) return;
      setSession(verified ? readSession() : { isAuthed: false, email: "" });
      setIsChecking(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await loginSuperuser(email, password);
    setSession(readSession());
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession({ isAuthed: false, email: "" });
  }, []);

  const value = useMemo(
    () => ({ ...session, isChecking, login, logout }),
    [session, isChecking, login, logout],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = (): AdminAuthContextValue => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
};
