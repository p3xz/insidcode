"use client";

import React, { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";
import { ShieldCheck, AlertTriangle } from "lucide-react";

function LoginContent() {
  const searchParams = useSearchParams();
  const rawError = searchParams?.get("error");
  const error = rawError && rawError !== "undefined" ? rawError : null;

  const getErrorMessage = (errCode: string) => {
    switch (errCode) {
      case "AccessDenied":
        return "Access was denied. Your account may be suspended or lacks required permissions.";
      case "OAuthSignin":
      case "OAuthCallbackError":
        return "Unable to sign in with OAuth provider. Please try again.";
      case "Verification":
        return "Verification token expired or has already been used.";
      default:
        return "Authentication encountered an issue. Please try again.";
    }
  };

  return (
    <div className="w-full max-w-sm rounded-2xl border border-[#252936] bg-[#11131A] p-8 shadow-2xl space-y-6">
      {/* Brand */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>
        <h1 className="text-lg font-bold tracking-tight text-[#F5F7FA]">Sign in to insidcode</h1>
        <p className="text-xs text-[#8B93A7]">
          Private coding practice platform for logic mastery.
        </p>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-[#FF4D6D]/40 bg-[#FF4D6D]/10 p-3 text-xs text-[#FF4D6D]">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{getErrorMessage(error)}</span>
        </div>
      )}

      {/* OAuth Action Buttons */}
      <div className="space-y-3 pt-2">
        <button
          onClick={() => signIn("google", { callbackUrl: "/problems" })}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#252936] bg-[#181B24] px-4 py-2.5 text-xs font-semibold text-[#F5F7FA] hover:border-[#363C4E] hover:bg-[#252936] transition"
        >
          {/* Google Vector Icon */}
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.54 0 2.94.55 4.04 1.46l3.03-3.03C17.24 1.72 14.81 1 12 1 7.37 1 3.44 3.72 1.63 7.64l3.66 2.84C6.18 7.36 8.86 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.28c0-.85-.08-1.68-.22-2.28H12v4.51h6.47c-.28 1.48-1.12 2.73-2.39 3.58l3.69 2.86c2.16-1.99 3.41-4.92 3.41-8.67z"
            />
            <path
              fill="#FBBC05"
              d="M5.29 14.48c-.23-.68-.36-1.41-.36-2.18s.13-1.5.36-2.18L1.63 7.28C.59 9.38 0 11.63 0 14s.59 4.62 1.63 6.72l3.66-2.84z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.96-1.07 7.95-2.91l-3.69-2.86c-1.08.73-2.47 1.16-4.26 1.16-3.14 0-5.82-2.36-6.71-5.48L1.63 16.72C3.44 20.64 7.37 23 12 23z"
            />
          </svg>
          Continue with Google
        </button>

        <button
          onClick={() => signIn("github", { callbackUrl: "/problems" })}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#252936] bg-[#181B24] px-4 py-2.5 text-xs font-semibold text-[#F5F7FA] hover:border-[#363C4E] hover:bg-[#252936] transition"
        >
          {/* GitHub Vector Icon */}
          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          Continue with GitHub
        </button>
      </div>

      {/* Security Notice */}
      <div className="flex items-center gap-2 text-[11px] text-[#8B93A7] border-t border-[#252936] pt-4">
        <ShieldCheck className="h-4 w-4 text-[#39FF14] shrink-0" />
        <span>Password-free OAuth. We only request public profile and email.</span>
      </div>

      <div className="text-center text-[10px] text-[#5E667B]">
        By continuing, you agree to the{" "}
        <Link href="/terms" className="underline hover:text-[#8B93A7]">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-[#8B93A7]">
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-[#090A0F] px-4 py-12 text-[#F5F7FA]">
      <Suspense fallback={<div className="h-96 w-full max-w-sm rounded-2xl border border-[#252936] bg-[#11131A] animate-pulse" />}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
