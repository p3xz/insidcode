"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ShieldCheck, AlertTriangle, Loader2, ArrowRight, User, AtSign } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status, update: updateSession } = useSession();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [consent, setConsent] = useState(false); // Unchecked by default
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  // Populate username from session or fetch
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status === "authenticated" && session?.user) {
      if (session.user.onboardingCompleted) {
        router.replace("/problems");
        return;
      }

      const fetchUserData = async () => {
        try {
          const res = await fetch("/api/user/onboarding");
          if (res.ok) {
            const data = await res.json();
            if (data.user?.onboardingCompleted) {
              router.replace("/problems");
              return;
            }
            setUsername(data.user?.username || session.user.username || "");
            setDisplayName(data.user?.displayName || session.user.name || "");
          } else {
            setUsername(session.user.username || "");
            setDisplayName(session.user.name || "");
          }
        } catch {
          setUsername(session.user.username || "");
          setDisplayName(session.user.name || "");
        } finally {
          setPageLoading(false);
        }
      };

      fetchUserData();
    }
  }, [status, session, router]);

  const validateUsername = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) {
      return "Username is required.";
    }
    if (trimmed.length < 3) {
      return "Username must be at least 3 characters.";
    }
    if (trimmed.length > 20) {
      return "Username cannot exceed 20 characters.";
    }
    if (/\s/.test(val)) {
      return "Username cannot contain spaces.";
    }
    if (!/^[A-Za-z0-9_]+$/.test(trimmed)) {
      return "Username can only contain letters, numbers, and underscores.";
    }
    return null;
  };

  const usernameValidationError = validateUsername(username);
  const isUsernameValid = usernameValidationError === null;
  const isFormValid = isUsernameValid && consent && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!consent) {
      setError("You must agree to the Privacy Policy and Terms of Use to continue.");
      return;
    }

    if (!isUsernameValid) {
      setError(usernameValidationError || "Please enter a valid username.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          displayName: displayName.trim() || undefined,
          consent: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to complete onboarding. Please try again.");
        setLoading(false);
        return;
      }

      // Synchronize session token with updated username and onboardingCompleted = true
      if (updateSession) {
        await updateSession({
          username: data.user.username,
          onboardingCompleted: true,
        });
      }

      router.replace("/problems");
    } catch {
      setError("Network error occurred during onboarding. Please try again.");
      setLoading(false);
    }
  };

  if (pageLoading || status === "loading") {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div
        className="w-full max-w-md p-6 sm:p-8 space-y-6"
        style={{
          border: "1px solid var(--border-strong)",
          borderRadius: "4px",
          backgroundColor: "var(--bg-surface)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header / Logo */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <Logo size="lg" />
          </div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>
            Welcome to insidcode
          </h1>
          <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
            Set up your profile handle and accept platform policies to begin practicing.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div
            className="flex items-start gap-2.5 p-3 text-xs"
            style={{
              border: "1px solid color-mix(in srgb, var(--danger) 40%, transparent)",
              borderRadius: "3px",
              backgroundColor: "color-mix(in srgb, var(--danger) 10%, transparent)",
              color: "var(--danger)",
            }}
          >
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="onboarding-username"
              className="block text-xs font-semibold"
              style={{ color: "var(--fg)" }}
            >
              Choose Username <span style={{ color: "var(--accent)" }}>*</span>
            </label>
            <div className="relative">
              <div
                className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
                style={{ color: "var(--fg-muted)" }}
              >
                <AtSign className="h-3.5 w-3.5" />
              </div>
              <input
                id="onboarding-username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                maxLength={20}
                placeholder="your_username"
                autoComplete="username"
                autoFocus
                disabled={loading}
                className="w-full py-2 pl-9 pr-14 mono text-xs"
                style={{
                  border: usernameValidationError && username.length > 0
                    ? "1px solid var(--warning)"
                    : "1px solid var(--border-strong)",
                  borderRadius: "3px",
                  backgroundColor: "var(--bg-elevated)",
                  color: "var(--fg)",
                  outline: "none",
                }}
              />
              <div
                className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 mono text-[10px]"
                style={{ color: "var(--fg-dimmed)" }}
              >
                {username.length}/20
              </div>
            </div>

            {/* Live helper / validation text */}
            {usernameValidationError && username.length > 0 ? (
              <p className="text-[11px] flex items-center gap-1" style={{ color: "var(--warning)" }}>
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {usernameValidationError}
              </p>
            ) : (
              <p className="text-[11px]" style={{ color: "var(--fg-dimmed)" }}>
                3 to 20 characters. Letters, numbers, and underscores only.
              </p>
            )}
          </div>

          {/* Display Name Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="onboarding-display-name"
              className="block text-xs font-semibold"
              style={{ color: "var(--fg)" }}
            >
              Display Name <span className="text-[11px] font-normal" style={{ color: "var(--fg-dimmed)" }}>(optional)</span>
            </label>
            <div className="relative">
              <div
                className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
                style={{ color: "var(--fg-muted)" }}
              >
                <User className="h-3.5 w-3.5" />
              </div>
              <input
                id="onboarding-display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={40}
                placeholder="Your Full Name or Alias"
                disabled={loading}
                className="w-full py-2 pl-9 pr-3 text-xs"
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "3px",
                  backgroundColor: "var(--bg-elevated)",
                  color: "var(--fg)",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Mandatory Consent Checkbox */}
          <div
            className="p-3.5 transition-colors"
            style={{
              border: "1px solid var(--border-strong)",
              borderRadius: "3px",
              backgroundColor: "var(--bg-subtle)",
            }}
          >
            <div className="flex items-start gap-3">
              <input
                id="legal-consent-checkbox"
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  setError("");
                }}
                disabled={loading}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded focus:ring-1"
                style={{
                  accentColor: "var(--accent)",
                  borderColor: "var(--border-strong)",
                }}
              />
              <label
                htmlFor="legal-consent-checkbox"
                className="text-xs leading-relaxed cursor-pointer select-none"
                style={{ color: "var(--fg)" }}
              >
                I agree to the{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="font-semibold underline underline-offset-2 transition-colors hover:opacity-80"
                  style={{ color: "var(--accent)" }}
                >
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="font-semibold underline underline-offset-2 transition-colors hover:opacity-80"
                  style={{ color: "var(--accent)" }}
                >
                  Terms of Use
                </Link>
                .
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid}
            className="btn btn-primary w-full py-2.5 text-xs font-bold"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Completing Setup...
              </>
            ) : (
              <>
                <span>Complete Signup</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Security badge */}
        <div
          className="flex items-center justify-center gap-1.5 pt-3 text-[11px]"
          style={{
            borderTop: "1px solid var(--border)",
            color: "var(--fg-dimmed)",
          }}
        >
          <ShieldCheck className="h-3.5 w-3.5" style={{ color: "var(--success)" }} />
          <span>Strict privacy standards &amp; sandboxed code execution</span>
        </div>
      </div>
    </div>
  );
}
