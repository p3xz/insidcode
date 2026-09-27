"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Cookie, X, ChevronRight, Settings2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { CURRENT_COOKIE_POLICY_VERSION } from "@/config/legal";

const STORAGE_KEY = "insidcode-cookie-consent";
const STORAGE_VERSION_KEY = "insidcode-cookie-consent-version";

interface CookiePreferences {
  necessary: boolean; // always true, cannot be toggled
  analytics: boolean;
  functional: boolean;
}

type ConsentState = "accepted" | "rejected" | "custom" | null;

interface StoredConsent {
  state: ConsentState;
  preferences: CookiePreferences;
  version: string;
  timestamp: string;
}

const DEFAULT_PREFS: CookiePreferences = {
  necessary: true,
  analytics: false,
  functional: false,
};

function loadStoredConsent(): StoredConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: StoredConsent = JSON.parse(raw);
    // Invalidate if version changed
    if (parsed.version !== CURRENT_COOKIE_POLICY_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveConsent(state: ConsentState, prefs: CookiePreferences) {
  const stored: StoredConsent = {
    state,
    preferences: prefs,
    version: CURRENT_COOKIE_POLICY_VERSION,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_COOKIE_POLICY_VERSION);
}

async function syncConsentToServer(prefs: CookiePreferences) {
  try {
    await fetch("/api/user/legal-consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cookieConsent: {
          necessary: prefs.necessary,
          analytics: prefs.analytics,
          functional: prefs.functional,
          version: CURRENT_COOKIE_POLICY_VERSION,
          acceptedAt: new Date().toISOString(),
        },
      }),
    });
  } catch {
    // Non-blocking: localStorage is source of truth for banner state
  }
}

// Exported for use by Footer "Privacy Choices" button
export function openPrivacyChoices() {
  window.dispatchEvent(new CustomEvent("insidcode:open-privacy-choices"));
}

export function CookieConsent() {
  const { status } = useSession();
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>(DEFAULT_PREFS);

  useEffect(() => {
    const stored = loadStoredConsent();
    if (!stored) {
      // Show banner after a brief delay to avoid layout flash
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
    setPrefs(stored.preferences);
  }, []);

  // Allow Footer / other components to open the modal
  useEffect(() => {
    const handler = () => setModalOpen(true);
    window.addEventListener("insidcode:open-privacy-choices", handler);
    return () => window.removeEventListener("insidcode:open-privacy-choices", handler);
  }, []);

  const handleAcceptAll = useCallback(async () => {
    const fullPrefs: CookiePreferences = { necessary: true, analytics: true, functional: true };
    saveConsent("accepted", fullPrefs);
    setPrefs(fullPrefs);
    setVisible(false);
    setModalOpen(false);
    if (status === "authenticated") await syncConsentToServer(fullPrefs);
  }, [status]);

  const handleRejectOptional = useCallback(async () => {
    saveConsent("rejected", DEFAULT_PREFS);
    setPrefs(DEFAULT_PREFS);
    setVisible(false);
    setModalOpen(false);
    if (status === "authenticated") await syncConsentToServer(DEFAULT_PREFS);
  }, [status]);

  const handleSaveCustom = useCallback(async () => {
    saveConsent("custom", prefs);
    setVisible(false);
    setModalOpen(false);
    if (status === "authenticated") await syncConsentToServer(prefs);
  }, [prefs, status]);

  const togglePref = (key: keyof Omit<CookiePreferences, "necessary">) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  return (
    <>
      {/* ── Cookie Banner ── */}
      {visible && !modalOpen && (
        <div
          role="dialog"
          aria-label="Cookie consent"
          aria-modal="false"
          className="fixed bottom-20 md:bottom-4 left-0 right-0 z-[9998] flex justify-center px-4 pointer-events-none"
        >
          <div
            className="pointer-events-auto w-full max-w-2xl rounded-[4px] p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center gap-3"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <Cookie
              className="h-5 w-5 flex-shrink-0 mt-0.5 sm:mt-0"
              style={{ color: "var(--accent)" }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                We use necessary cookies to operate the platform and optional cookies to improve
                your experience. You can manage your preferences at any time.{" "}
                <a
                  href="/privacy"
                  className="underline underline-offset-2"
                  style={{ color: "var(--fg)" }}
                >
                  Privacy Policy
                </a>
              </p>
            </div>
            <div className="flex flex-wrap gap-2 flex-shrink-0 items-center">
              <button
                onClick={() => { setVisible(false); setModalOpen(true); }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold rounded-[3px] transition-colors"
                style={{
                  border: "1px solid var(--border)",
                  color: "var(--fg-muted)",
                  backgroundColor: "transparent",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-muted)")}
              >
                <Settings2 className="h-3 w-3" />
                Manage
              </button>
              <button
                onClick={handleRejectOptional}
                className="px-3 py-1.5 text-[11px] font-semibold rounded-[3px] transition-colors"
                style={{
                  border: "1px solid var(--border)",
                  color: "var(--fg-muted)",
                  backgroundColor: "transparent",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-muted)")}
              >
                Reject Optional
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-3 py-1.5 text-[11px] font-bold rounded-[3px] transition-opacity"
                style={{
                  backgroundColor: "var(--fg)",
                  color: "var(--bg)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cookie Preferences Modal ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          role="dialog"
          aria-modal="true"
          aria-label="Cookie preferences"
        >
          <div
            className="w-full max-w-lg rounded-[4px] shadow-xl"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <Cookie className="h-4 w-4" style={{ color: "var(--accent)" }} />
                <span className="text-sm font-bold" style={{ color: "var(--fg)" }}>
                  Privacy Choices
                </span>
              </div>
              <button
                onClick={() => { setModalOpen(false); setVisible(true); }}
                className="p-1 rounded transition-opacity hover:opacity-70"
                aria-label="Close"
              >
                <X className="h-4 w-4" style={{ color: "var(--fg-muted)" }} />
              </button>
            </div>

            {/* Cookie categories */}
            <div className="px-5 py-4 space-y-4">
              <p className="text-xs leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                Manage which cookies InsidCode may use. Necessary cookies cannot be disabled as
                they are required for core platform functionality.
              </p>

              {/* Necessary */}
              <CookieCategoryRow
                title="Necessary"
                description="Session authentication, security tokens, rate-limit state. Required for the platform to function."
                enabled={true}
                locked
              />

              {/* Functional */}
              <CookieCategoryRow
                title="Functional"
                description="Theme preferences, editor settings, language selection. Improves your personal experience."
                enabled={prefs.functional}
                onToggle={() => togglePref("functional")}
              />

              {/* Analytics */}
              <CookieCategoryRow
                title="Analytics"
                description="Aggregate, anonymized usage data to understand platform performance. No personally identifiable data is shared."
                enabled={prefs.analytics}
                onToggle={() => togglePref("analytics")}
              />
            </div>

            {/* Modal footer */}
            <div
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <a
                href="/privacy"
                className="inline-flex items-center gap-1 text-[11px] underline underline-offset-2"
                style={{ color: "var(--fg-muted)" }}
              >
                Privacy Policy
                <ChevronRight className="h-3 w-3" />
              </a>
              <div className="flex gap-2">
                <button
                  onClick={handleRejectOptional}
                  className="px-3 py-1.5 text-[11px] font-semibold rounded-[3px] transition-colors"
                  style={{
                    border: "1px solid var(--border)",
                    color: "var(--fg-muted)",
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-muted)")}
                >
                  Reject Optional
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-3 py-1.5 text-[11px] font-semibold rounded-[3px] transition-opacity"
                  style={{ backgroundColor: "var(--fg)", color: "var(--bg)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  Accept All
                </button>
                <button
                  onClick={handleSaveCustom}
                  className="px-3 py-1.5 text-[11px] font-bold rounded-[3px] transition-opacity"
                  style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Sub-component: category row ──

interface CookieCategoryRowProps {
  title: string;
  description: string;
  enabled: boolean;
  locked?: boolean;
  onToggle?: () => void;
}

function CookieCategoryRow({ title, description, enabled, locked, onToggle }: CookieCategoryRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold" style={{ color: "var(--fg)" }}>
          {title}
          {locked && (
            <span
              className="ml-2 text-[10px] font-normal px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: "var(--bg)",
                color: "var(--fg-dimmed)",
                border: "1px solid var(--border)",
              }}
            >
              Always On
            </span>
          )}
        </p>
        <p className="text-[11px] leading-relaxed mt-0.5" style={{ color: "var(--fg-muted)" }}>
          {description}
        </p>
      </div>
      {/* Toggle */}
      <button
        role="switch"
        aria-checked={enabled}
        aria-label={`${title} cookies ${enabled ? "enabled" : "disabled"}`}
        disabled={locked}
        onClick={onToggle}
        className="flex-shrink-0 mt-0.5 relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          backgroundColor: enabled ? "var(--accent)" : "var(--border)",
          cursor: locked ? "not-allowed" : "pointer",
          opacity: locked ? 0.6 : 1,
        }}
      >
        <span
          className="inline-block h-3.5 w-3.5 transform rounded-full transition-transform"
          style={{
            backgroundColor: "#fff",
            transform: enabled ? "translateX(18px)" : "translateX(2px)",
          }}
        />
      </button>
    </div>
  );
}
