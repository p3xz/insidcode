"use client";

import React from "react";
import { Database, WifiOff } from "lucide-react";

interface FreshnessBadgeProps {
  isFromCache: boolean;
  isOnline?: boolean;
  className?: string;
}

export function FreshnessBadge({
  isFromCache,
  isOnline = true,
  className = "",
}: FreshnessBadgeProps) {
  if (!isFromCache && isOnline) return null;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
        !isOnline
          ? "border border-amber-500/30 bg-amber-500/10 text-amber-400"
          : "border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--fg-muted)]"
      } ${className}`}
      role="status"
    >
      {!isOnline ? (
        <>
          <WifiOff className="h-3 w-3 text-amber-400" />
          <span>Offline · Showing saved data</span>
        </>
      ) : (
        <>
          <Database className="h-3 w-3 text-[var(--fg-dimmed)]" />
          <span>Showing saved data</span>
        </>
      )}
    </div>
  );
}
