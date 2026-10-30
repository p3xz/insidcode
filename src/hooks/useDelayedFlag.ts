"use client";

import { useEffect, useState } from "react";

/**
 * Returns true only after `active` has stayed true for `delayMs`.
 * Used so fast responses (< ~150 ms) never flash a skeleton.
 */
export function useDelayedFlag(active: boolean, delayMs = 150): boolean {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!active) {
      const reset = setTimeout(() => setShown(false), 0);
      return () => clearTimeout(reset);
    }
    const t = setTimeout(() => setShown(true), delayMs);
    return () => clearTimeout(t);
  }, [active, delayMs]);

  return active && shown;
}
