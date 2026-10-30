"use client";

import React, { useEffect, useRef } from "react";
import { SWRConfig, useSWRConfig } from "swr";
import { useSession } from "next-auth/react";
import { clearAllUserStateCache } from "@/lib/problemClientCache";

const defaultFetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("An error occurred while fetching data.");
    // Attach extra info to the error object.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any).info = await res.json().catch(() => ({}));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any).status = res.status;
    throw error;
  }
  return res.json();
};

function UserCacheClearer() {
  const { data: session, status } = useSession();
  const { mutate } = useSWRConfig();
  const prevUserIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const currentUserId = session?.user?.id;
    // If user changed or logged out, clear all SWR cache entries to prevent stale data leaks
    if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== currentUserId) {
      // Clear SWR cache entries without revalidating
      mutate(() => true, undefined, { revalidate: false });
      // Clear in-memory user state cache
      clearAllUserStateCache();
      // Also clear any catalog session storage if present
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
        fetcher: defaultFetcher,
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
      {children}
    </SWRConfig>
  );
}
