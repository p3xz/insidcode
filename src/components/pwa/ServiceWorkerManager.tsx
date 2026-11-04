"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";

export function ServiceWorkerManager() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Kill switch check
    const isSwDisabled = process.env.NEXT_PUBLIC_SW_ENABLED === "false";
    if (isSwDisabled) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      if ("caches" in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
      return;
    }

    // Register service worker (only in production or when explicitly enabled)
    const isProd = process.env.NODE_ENV === "production";
    const isExplicitlyEnabled = process.env.NEXT_PUBLIC_SW_ENABLED === "true";

    if (!isProd && !isExplicitlyEnabled) {
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // If an updated worker is already waiting
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setShowUpdatePrompt(true);
        }

        // Listen for new service worker installation
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setWaitingWorker(newWorker);
              setShowUpdatePrompt(true);
            }
          });
        });
      })
      .catch(() => {
        // Registration failed or blocked (e.g. strict CSP / private mode), fail silently
      });

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage("SKIP_WAITING");
    }
    setShowUpdatePrompt(false);
  };

  if (!showUpdatePrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-xs shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center gap-2 text-[var(--fg)]">
        <RefreshCw className="h-3.5 w-3.5 text-[var(--primary)] animate-spin" />
        <span>New version available.</span>
      </div>
      <button
        onClick={handleUpdate}
        className="rounded bg-[var(--primary)] px-2.5 py-1 text-xs font-semibold text-black hover:opacity-90 transition"
      >
        Refresh
      </button>
      <button
        onClick={() => setShowUpdatePrompt(false)}
        className="text-[var(--fg-muted)] hover:text-[var(--fg)] transition"
        aria-label="Dismiss update notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
