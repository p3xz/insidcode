"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const BANNED_ALLOWED_ROUTES = [
  "/suspended",
  "/feedback",
  "/changelog",
  "/terms",
  "/privacy",
  "/integrity",
  "/credits",
];

const ONBOARDING_EXEMPT_ROUTES = [
  "/onboarding",
  "/login",
  "/changelog",
  "/privacy",
  "/terms",
  "/credits",
  "/integrity",
  "/feedback",
  "/suspended",
];

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Central 403 API response listener
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch;
    window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
      const response = await originalFetch(...args);

      if (response.status === 403) {
        try {
          const cloned = response.clone();
          const data = await cloned.json();
          const errorMsg = typeof data?.error === "string" ? data.error.toLowerCase() : "";
          if (
            errorMsg.includes("suspended") ||
            errorMsg.includes("banned") ||
            errorMsg.includes("restricted") ||
            data?.isBanned === true
          ) {
            const isCurrentlyAllowed = BANNED_ALLOWED_ROUTES.some(
              (r) => window.location.pathname === r || window.location.pathname.startsWith(`${r}/`)
            );
            if (!isCurrentlyAllowed) {
              router.replace("/suspended");
            }
          }
        } catch {
          // Not a JSON response or stream consumed
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [router]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) {
      return;
    }

    // 1. Suspension check: If user is banned, redirect to /suspended unless on an allowed appeal/legal route
    if (session.user.isBanned) {
      const isAllowed = BANNED_ALLOWED_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
      );
      if (!isAllowed) {
        router.replace("/suspended");
      }
      return;
    }

    const isCurrentExempt = ONBOARDING_EXEMPT_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );
    const isOnboardingComplete = Boolean(session.user.onboardingCompleted);

    // 2. Onboarding check: If user has not completed onboarding and is attempting to access non-exempt routes
    if (!isOnboardingComplete && !isCurrentExempt) {
      router.replace("/onboarding");
      return;
    }

    // 3. If user has completed onboarding and is active, redirect away from /onboarding
    if (isOnboardingComplete && pathname === "/onboarding") {
      router.replace("/problems");
      return;
    }
  }, [pathname, session, status, router]);

  // Prevent flash of protected UI if user is banned and attempting to access a blocked page
  if (status === "authenticated" && session?.user?.isBanned) {
    const isAllowed = BANNED_ALLOWED_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );
    if (!isAllowed) {
      return null;
    }
  }

  return <>{children}</>;
}

