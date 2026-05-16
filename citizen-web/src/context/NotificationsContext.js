import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, getToken } from "../api/client";

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!getToken()) {
      setUnreadCount(0);
      return 0;
    }
    try {
      const data = await apiFetch("/api/notifications?limit=1&page=1");
      const count = data?.unreadCount || 0;
      setUnreadCount(count);
      return count;
    } catch {
      return unreadCount;
    }
  }, [unreadCount]);

  useEffect(() => {
    refreshUnreadCount();
    const timer = window.setInterval(refreshUnreadCount, 30000);
    return () => window.clearInterval(timer);
  }, [refreshUnreadCount]);

  const value = useMemo(
    () => ({
      unreadCount,
      setUnreadCount,
      refreshUnreadCount,
    }),
    [unreadCount, refreshUnreadCount]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
