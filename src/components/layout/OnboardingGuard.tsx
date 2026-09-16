"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const EXEMPT_ROUTES = [
  "/suspended",
  "/feedback",
  "/onboarding",
  "/login",
  "/privacy",
  "/terms",
  "/credits",
  "/integrity",
];

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) {
      return;
    }

    const isCurrentExempt = EXEMPT_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

    // 1. Suspension check: If user is banned, redirect to /suspended (unless already on an exempt support/legal page)
    if (session.user.isBanned) {
      if (!isCurrentExempt) {
        router.replace("/suspended");
      }
      return;
    }

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

  return <>{children}</>;
}
