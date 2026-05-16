import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { apiFetch, getToken, setToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const persistUser = useCallback((nextUser) => {
    localStorage.setItem("citizen_user", JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("citizen_user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  const login = useCallback(async (email, password) => {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    persistUser(data.user);
    return data;
  }, [persistUser]);

  const register = useCallback(async (payload) => {
    const data = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setToken(data.token);
    persistUser(data.user);
    return data;
  }, [persistUser]);

  const refreshUser = useCallback(
    async (nextUser = null) => {
      if (nextUser) {
        persistUser(nextUser);
        return nextUser;
      }
      const data = await apiFetch("/api/auth/me");
      persistUser(data.user);
      return data.user;
    },
    [persistUser]
  );

  const loginWithGoogle = useCallback(
    async credential => {
      const data = await apiFetch("/api/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential }),
      });
      setToken(data.token);
      persistUser(data.user);
      return data;
    },
    [persistUser]
  );

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem("citizen_user");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(getToken() && user),
      login,
      loginWithGoogle,
      register,
      refreshUser,
      logout,
    }),
    [user, login, loginWithGoogle, register, refreshUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
