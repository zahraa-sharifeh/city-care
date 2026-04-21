import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { apiFetch, getAdminToken, setAdminToken } from "../api/client";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    const raw = localStorage.getItem("admin_user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  const login = useCallback(async (email, password) => {
    const data = await apiFetch("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setAdminToken(data.token);
    localStorage.setItem("admin_user", JSON.stringify(data.admin));
    setAdmin(data.admin);
    return data;
  }, []);

  const logout = useCallback(() => {
    setAdminToken(null);
    localStorage.removeItem("admin_user");
    setAdmin(null);
  }, []);

  const value = useMemo(
    () => ({
      admin,
      login,
      logout,
      isAuthenticated: Boolean(getAdminToken() && admin),
    }),
    [admin, login, logout]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
