"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CheckCircle2, ArrowRight, Loader2, ShieldCheck, Scale, FileText } from "lucide-react";

interface RestoreDetails {
  isRestored: boolean;
  username: string;
  restorationDate: string;
  appealStatus: string;
  needsConsent: boolean;
  onboardingCompleted: boolean;
}

export default function AccountRestoredPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  const [details, setDetails] = useState<RestoreDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchDetails() {
      if (status === "unauthenticated") {
        router.replace("/login");
        return;
      }

      if (status !== "authenticated") return;

      if (session?.user?.isBanned) {
        router.replace("/suspended");
        return;
      }

      try {
        const res = await fetch("/api/user/restore-details");
        if (res.ok) {
          const data: RestoreDetails = await res.json();
          if (isMounted) {
            setDetails(data);
            // If user already gave consent and is completely active, send to problems
            if (!data.needsConsent && data.onboardingCompleted) {
              router.replace("/problems");
              return;
            }
          }
        } else if (res.status === 403) {
          router.replace("/suspended");
          return;
        }
      } catch {
        // silent
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/user/restore-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: true }),
      });

      if (res.ok) {
        // Refresh session token so OnboardingGuard and client state know consent is granted
        await update();
        router.replace("/problems");
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Failed to record legal consent. Please try again.");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--fg-muted)" }}>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Verifying account restoration status...</span>
        </div>
      </div>
    );
  }

  const username = details?.username || session?.user?.username || "authenticated user";
  const restorationDate = details?.restorationDate || "Today";

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12 sm:px-6">
      <div
        className="w-full max-w-lg p-6 sm:p-8 space-y-6 text-center"
        style={{
          border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)",
          backgroundColor: "var(--bg-subtle)",
          borderRadius: "6px",
        }}
      >
        {/* Header Icon */}
        <div className="flex justify-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{
              backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
              border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)",
              color: "var(--accent)",
            }}
          >
            <CheckCircle2 className="h-7 w-7" />
          </div>
        </div>

        {/* Title and Explanation */}
        <div className="space-y-3">
          <div className="flex justify-center">
            <span className="mono text-[10px] px-2.5 py-0.5 rounded font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3" />
              Account Restored
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>
            Your account has been restored.
          </h1>

          <p className="text-[13px] leading-relaxed max-w-md mx-auto" style={{ color: "var(--fg-muted)" }}>
            Your InsidCode account has been restored following a review of your suspension appeal.
          </p>

          <p className="text-[13px] font-medium leading-relaxed max-w-md mx-auto" style={{ color: "var(--fg)" }}>
            We&apos;re sorry for the inconvenience.
          </p>
        </div>

        {/* Restoration Metadata Card */}
        <div
          className="text-left text-xs space-y-2.5 p-4"
          style={{
            border: "1px solid var(--border)",
            backgroundColor: "var(--bg)",
            borderRadius: "4px",
          }}
        >
          <div className="flex items-center justify-between pb-2" style={{ borderBottom: "1px solid var(--border)" }}>
            <span className="section-label">Restoration Details</span>
            <span className="mono text-[10px] text-emerald-400">STATUS: RESTORED</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <p className="section-label mb-0.5">Account</p>
              <p className="mono font-semibold text-[12px]" style={{ color: "var(--fg)" }}>
                @{username}
              </p>
            </div>

            <div>
              <p className="section-label mb-0.5">Appeal Status</p>
              <p className="mono font-bold text-[11px] text-emerald-400">APPROVED</p>
            </div>

            <div className="col-span-2">
              <p className="section-label mb-0.5">Restoration Date (IST)</p>
              <p className="mono text-[12px]" style={{ color: "var(--fg-muted)" }}>
                {restorationDate}
              </p>
            </div>
          </div>
        </div>

        {/* Consent Form */}
        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          {errorMessage && (
            <div
              className="p-3 text-[12px] rounded"
              style={{
                backgroundColor: "color-mix(in srgb, var(--danger) 10%, transparent)",
                border: "1px solid var(--danger)",
                color: "var(--danger)",
              }}
            >
              {errorMessage}
            </div>
          )}

          <div
            className="p-4 rounded space-y-3"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg)",
            }}
          >
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#252936] bg-[#11131A] text-[#00F0FF] focus:ring-0 cursor-pointer"
              />
              <span className="text-[12px] leading-relaxed" style={{ color: "var(--fg)" }}>
                I agree to the{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline hover:text-[#00F0FF] transition"
                  onClick={(e) => e.stopPropagation()}
                >
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline hover:text-[#00F0FF] transition"
                  onClick={(e) => e.stopPropagation()}
                >
                  Terms of Use
                </Link>
                .
              </span>
            </label>
            <p className="text-[11px] leading-relaxed" style={{ color: "var(--fg-dimmed)" }}>
              Please re-confirm your agreement to our platform integrity policies and developer terms to re-activate your workspace.
            </p>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={!agreed || isSubmitting}
            className="btn btn-primary w-full inline-flex items-center justify-center gap-2 text-xs py-3 font-semibold disabled:opacity-50 transition"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Restoring Workspace Access...</span>
              </>
            ) : (
              <>
                <span>Continue to InsidCode</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Legal Footer */}
        <div
          className="pt-4 flex items-center justify-center gap-4 text-[11px]"
          style={{
            borderTop: "1px solid var(--border)",
            color: "var(--fg-dimmed)",
          }}
        >
          <Link href="/terms" target="_blank" className="hover:underline inline-flex items-center gap-1">
            <Scale className="h-3 w-3" /> Terms of Use
          </Link>
          <span>•</span>
          <Link href="/integrity" target="_blank" className="hover:underline inline-flex items-center gap-1">
            <FileText className="h-3 w-3" /> Platform Integrity
          </Link>
          <span>•</span>
          <Link href="/privacy" target="_blank" className="hover:underline">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
