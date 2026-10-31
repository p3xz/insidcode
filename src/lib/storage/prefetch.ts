/**
 * Instagram-Style Problem & Asset Prefetcher
 *
 * Runs during browser idle periods to pre-warm the on-device cache for:
 *  - Next 3 unsolved problems in the user's current curriculum phase.
 *
 * Constraints & Invariants:
 *  - Strictly honors navigator.connection.saveData (disabled on data saver).
 *  - Bypasses prefetching on slow connections (2g, slow-2g).
 *  - NEVER runs while a code execution or submission is in flight.
 *  - Caps prefetch count to max 3 problems per idle window to preserve bandwidth and battery.
 */

import { getPublicCache, setPublicCache } from "./deviceCache";

let submissionInFlight = false;
const prefetchedSet = new Set<string>();

export function setSubmissionInFlightFlag(inFlight: boolean): void {
  submissionInFlight = inFlight;
}

export function isSubmissionInFlight(): boolean {
  return submissionInFlight;
}

interface NetworkInformation extends EventTarget {
  saveData?: boolean;
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
}

function shouldSkipPrefetch(): boolean {
  if (typeof window === "undefined") return true;

  // 1. Don't prefetch if submission or test run is in progress
  if (submissionInFlight) return true;

  // 2. Check Data Saver and slow connection
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = navigator as any;
  const connection: NetworkInformation | undefined =
    nav.connection || nav.mozConnection || nav.webkitConnection;

  if (connection) {
    if (connection.saveData) {
      return true; // Data Saver enabled
    }
    if (connection.effectiveType === "slow-2g" || connection.effectiveType === "2g") {
      return true; // Very slow connection
    }
  }

  // 3. Skip if offline
  if (!navigator.onLine) return true;

  return false;
}

/**
 * Prefetches problem details for given problem IDs during browser idle time.
 */
export function prefetchProblemsOnIdle(problemIds: string[]): void {
  if (shouldSkipPrefetch() || !problemIds || problemIds.length === 0) return;

  const targetIds = problemIds
    .filter((id) => id && !prefetchedSet.has(id))
    .slice(0, 3); // Max 3 items

  if (targetIds.length === 0) return;

  const doPrefetch = async () => {
    for (const problemId of targetIds) {
      // Re-verify flags in case submission started
      if (shouldSkipPrefetch()) break;

      prefetchedSet.add(problemId);
      const cacheKey = `/api/problems/${problemId}`;

      // Check if already in device cache
      const cached = await getPublicCache(cacheKey);
      if (cached) continue;

      try {
        const res = await fetch(cacheKey, {
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.problem) {
            await setPublicCache(cacheKey, json);
          }
        }
      } catch {
        // Silently catch network hiccups
      }
    }
  };

  if ("requestIdleCallback" in window) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).requestIdleCallback(() => doPrefetch(), { timeout: 3000 });
  } else {
    setTimeout(doPrefetch, 1500);
  }
}
