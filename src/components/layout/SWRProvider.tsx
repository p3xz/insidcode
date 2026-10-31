"use client";

import React, { useEffect, useRef } from "react";
import { SWRConfig, useSWRConfig } from "swr";
import { useSession } from "next-auth/react";
import {
  getPublicCache,
  setPublicCache,
  clearUserDeviceData,
  performStorageCleanup,
} from "@/lib/storage/deviceCache";
import { ServiceWorkerManager } from "@/components/pwa/ServiceWorkerManager";

const persistentFetcher = async (url: string) => {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const error = new Error("An error occurred while fetching data.");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any).info = await res.json().catch(() => ({}));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any).status = res.status;
      throw error;
    }
    const data = await res.json();

    // Persist safe public GET endpoints to IndexedDB device cache
    if (
      url.startsWith("/api/problems") &&
      !url.includes("/user-state")
    ) {
      setPublicCache(url, data).catch(() => {});
    } else if (url.startsWith("/api/leaderboard")) {
      setPublicCache(url, data).catch(() => {});
    }

    return data;
  } catch (err) {
    // If offline or network error, fallback to device cache if available
    if (
      url.startsWith("/api/problems") &&
      !url.includes("/user-state")
    ) {
      const cached = await getPublicCache(url);
      if (cached) return cached;
    } else if (url.startsWith("/api/leaderboard")) {
      const cached = await getPublicCache(url);
      if (cached) return cached;
    }
    throw err;
  }
};

function UserCacheClearer() {
  const { data: session, status } = useSession();
  const { mutate } = useSWRConfig();
  const prevUserIdRef = useRef<string | undefined>(undefined);

  // App initialization: perform background cleanup of expired cache entries
  useEffect(() => {
    performStorageCleanup().catch(() => {});
  }, []);

  useEffect(() => {
    const currentUserId = session?.user?.id;

    // If user changed or logged out, wipe all local user data and in-memory caches
    if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== currentUserId) {
      if (prevUserIdRef.current) {
        // Synchronously wipe IndexedDB user entries and drafts
        clearUserDeviceData(prevUserIdRef.current).catch(() => {});
      }

      // Clear SWR cache entries without revalidating
      mutate(() => true, undefined, { revalidate: false });

      // Clear any session storage
      try {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("insidcode:catalog-cache");
        }
      } catch {
        // Ignore storage access errors
      }
    }
    prevUserIdRef.current = currentUserId;
  }, [session?.user?.id, status, mutate]);

  return null;
}

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: persistentFetcher,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        // Throttle focus/reconnect revalidations to max once per 30 seconds
        focusThrottleInterval: 30000,
        // Keep deduplication window sensible
        dedupingInterval: 5000,
        shouldRetryOnError: false,
      }}
    >
      <UserCacheClearer />
      <ServiceWorkerManager />
      {children}
    </SWRConfig>
  );
}
