"use client";

import React from "react";
import { X } from "lucide-react";

interface InlineNoticeProps {
  message: string | null;
  onDismiss?: () => void;
}

/**
 * Dismissible inline error notice. Replaces native alert() calls with
 * in-app UI that matches the app's design language.
 */
export default function InlineNotice({ message, onDismiss }: InlineNoticeProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-3 rounded-lg border border-[#FF4D6D]/40 bg-[#FF4D6D]/10 p-3 text-sm text-[#FF4D6D]"
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded p-1 text-[#FF4D6D] hover:bg-[#FF4D6D]/20 transition"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
