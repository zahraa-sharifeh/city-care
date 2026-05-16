import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Refetch when the route changes, the tab/window regains focus, or the page
 * is restored from the back-forward cache (common cause of stale SPA data).
 *
 * `refetch` may accept `{ silent: true }` to skip full-page loading UI.
 */
export function useRefetchOnFocus(refetch, deps = [], { pollIntervalMs = 0 } = {}) {
  const location = useLocation();
  const refetchRef = useRef(refetch);
  const skipFocusOnce = useRef(false);

  refetchRef.current = refetch;

  useEffect(() => {
    skipFocusOnce.current = true;
    refetchRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, location.key, ...deps]);

  useEffect(() => {
    function runSilent() {
      if (skipFocusOnce.current) {
        skipFocusOnce.current = false;
        return;
      }
      if (document.visibilityState !== "visible") return;
      refetchRef.current({ silent: true });
    }

    function onPageShow(event) {
      if (event.persisted) refetchRef.current({ silent: true });
    }

    document.addEventListener("visibilitychange", runSilent);
    window.addEventListener("focus", runSilent);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", runSilent);
      window.removeEventListener("focus", runSilent);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  useEffect(() => {
    if (!pollIntervalMs) return undefined;
    const tick = () => {
      if (document.visibilityState === "visible") refetchRef.current({ silent: true });
    };
    const id = window.setInterval(tick, pollIntervalMs);
    return () => window.clearInterval(id);
  }, [pollIntervalMs]);
}
