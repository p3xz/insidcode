"use client";

import * as React from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * SSR-safe hook returning `true` when `prefers-reduced-motion: reduce` matches.
 * Initial render returns `false` to prevent hydration mismatch, then updates in an effect
 * and subscribes to media query changes.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mql = window.matchMedia(QUERY);
    setReduced(mql.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setReduced(event.matches);
    };

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handleChange);
      return () => mql.removeEventListener("change", handleChange);
    }

    // Legacy fallback
    mql.addListener(handleChange);
    return () => mql.removeListener(handleChange);
  }, []);

  return reduced;
}
