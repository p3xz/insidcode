"use client";

import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

/** Error state for a failed load, with a Retry button. Status is conveyed by icon and text. */
export function LoadError({
  message = "Something went wrong while loading this content.",
  onRetry,
  className = "",
  minHeight,
}: {
  message?: string;
  onRetry: () => void;
  className?: string;
  minHeight?: number;
}) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-3 px-4 py-12 text-center ${className}`}
      style={{ minHeight, color: "var(--fg-muted)" }}
    >
      <AlertTriangle className="h-5 w-5" style={{ color: "var(--warning)" }} aria-hidden="true" />
      <p className="text-[12px]">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold cursor-pointer focus-visible:outline-2"
        style={{
          border: "1px solid var(--border-strong)",
          borderRadius: 3,
          color: "var(--fg)",
          backgroundColor: "var(--bg-elevated)",
        }}
      >
        <RotateCcw className="h-3 w-3" aria-hidden="true" />
        Retry
      </button>
    </div>
  );
}
