"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, CheckCircle2, ArrowRight, Loader2, FileText, Shield, ExternalLink } from "lucide-react";
import {
  CURRENT_PRIVACY_POLICY_VERSION,
  CURRENT_TERMS_VERSION,
  LEGAL_EFFECTIVE_DATE,
} from "@/config/legal";

const LEGAL_DOC_EXEMPT_ROUTES = [
  "/privacy",
  "/terms",
  "/integrity",
  "/changelog",
  "/credits",
  "/feedback",
  "/suspended",
  "/account-restored",
  "/onboarding",
];

export function LegalReconsentModal() {
  const { data: session, status, update } = useSession();
  const pathname = usePathname();

  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isAuthenticated = status === "authenticated" && Boolean(session?.user);
  const isBanned = Boolean(session?.user?.isBanned);
  const requiresReconsent = Boolean(session?.user?.requiresLegalReconsent);
  const consentStatus = session?.user?.legalConsentStatus;

  const needsPrivacy = Boolean(consentStatus && !consentStatus.privacyPolicyCurrent);
  const needsTerms = Boolean(consentStatus && !consentStatus.termsCurrent);

  // If user is not authenticated, is banned, or does not need re-consent, don't show
  if (!isAuthenticated || isBanned || !requiresReconsent) {
    return null;
  }

  // If user is currently doing initial onboarding or account restoration, let those dedicated pages handle consent
  if (!session?.user?.onboardingCompleted && pathname === "/onboarding") {
    return null;
  }
  if (session?.user?.requiresRestorationConsent && pathname === "/account-restored") {
    return null;
  }

  const isExemptRoute = LEGAL_DOC_EXEMPT_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const canSubmit =
    (!needsPrivacy || privacyAgreed) &&
    (!needsTerms || termsAgreed) &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setErrorMessage("");

    try {
      const payload: Record<string, boolean> = {};
      if (needsPrivacy) payload.privacyPolicyAccepted = true;
      if (needsTerms) payload.termsAccepted = true;

      const res = await fetch("/api/user/legal-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.error || "Failed to record updated consent. Please try again.");
        setSubmitting(false);
        return;
      }

      // Refresh session token so client state immediately reflects valid consent
      await update();
    } catch {
      setErrorMessage("A network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 ${
        isExemptRoute ? "pointer-events-none" : "bg-black/60 backdrop-blur-sm pointer-events-auto"
      }`}
      role="dialog"
      aria-modal={!isExemptRoute}
      aria-labelledby="legal-reconsent-title"
    >
      <div
        className={`w-full max-w-xl rounded-[6px] shadow-2xl p-6 transition-all duration-200 pointer-events-auto ${
          isExemptRoute
            ? "fixed bottom-6 right-6 max-w-md border shadow-2xl"
            : "border"
        }`}
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border)",
        }}
      >
        {/* Header */}
        <div className="flex items-start gap-3.5 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div
            className="p-2.5 rounded-[4px] flex-shrink-0"
            style={{ backgroundColor: "rgba(224, 90, 71, 0.1)", border: "1px solid rgba(224, 90, 71, 0.2)" }}
          >
            <ShieldAlert className="h-5 w-5" style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <h2 id="legal-reconsent-title" className="text-base font-bold tracking-tight" style={{ color: "var(--fg)" }}>
              Updated Legal Terms & Policies
            </h2>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--fg-muted)" }}>
              InsidCode&apos;s legal documents have been updated ({LEGAL_EFFECTIVE_DATE}). Please review and accept the latest versions to continue using the platform.
            </p>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div
            className="mt-4 p-3 rounded-[3px] text-xs font-medium"
            style={{
              backgroundColor: "rgba(224, 90, 71, 0.1)",
              border: "1px solid rgba(224, 90, 71, 0.3)",
              color: "var(--accent)",
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Documents list */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Privacy Policy */}
          <div
            className="p-3.5 rounded-[4px] space-y-2.5 transition-colors"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: needsPrivacy ? "var(--bg)" : "transparent",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" style={{ color: needsPrivacy ? "var(--accent)" : "var(--fg-muted)" }} />
                <span className="text-xs font-bold" style={{ color: "var(--fg)" }}>
                  Privacy Policy
                </span>
                <span
                  className="text-[10px] mono px-1.5 py-0.5 rounded font-medium"
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    color: "var(--fg-dimmed)",
                  }}
                >
                  v{CURRENT_PRIVACY_POLICY_VERSION}
                </span>
              </div>
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] underline underline-offset-2 transition-colors"
                style={{ color: "var(--fg-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-muted)")}
              >
                Read Policy
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            {needsPrivacy ? (
              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={privacyAgreed}
                  onChange={(e) => setPrivacyAgreed(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded"
                  style={{ accentColor: "var(--accent)" }}
                />
                <span className="text-xs leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                  I have read and agree to the updated <strong style={{ color: "var(--fg)" }}>Privacy Policy</strong>.
                </span>
              </label>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "#4ade80" }}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Your Privacy Policy consent is up to date.</span>
              </div>
            )}
          </div>

          {/* Terms of Use */}
          <div
            className="p-3.5 rounded-[4px] space-y-2.5 transition-colors"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: needsTerms ? "var(--bg)" : "transparent",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" style={{ color: needsTerms ? "var(--accent)" : "var(--fg-muted)" }} />
                <span className="text-xs font-bold" style={{ color: "var(--fg)" }}>
                  Terms of Use
                </span>
                <span
                  className="text-[10px] mono px-1.5 py-0.5 rounded font-medium"
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    color: "var(--fg-dimmed)",
                  }}
                >
                  v{CURRENT_TERMS_VERSION}
                </span>
              </div>
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] underline underline-offset-2 transition-colors"
                style={{ color: "var(--fg-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-muted)")}
              >
                Read Terms
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            {needsTerms ? (
              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded"
                  style={{ accentColor: "var(--accent)" }}
                />
                <span className="text-xs leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                  I have read and agree to the updated <strong style={{ color: "var(--fg)" }}>Terms of Use</strong>.
                </span>
              </label>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "#4ade80" }}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Your Terms of Use consent is up to date.</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-end gap-3" style={{ borderTop: "1px solid var(--border)" }}>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-[3px] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "var(--accent)",
                color: "#fff",
              }}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Recording Consent...
                </>
              ) : (
                <>
                  Accept & Continue
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
