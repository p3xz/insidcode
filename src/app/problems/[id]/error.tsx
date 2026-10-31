"use client";

import React, { useEffect } from "react";
import { RotateCcw, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProblemPageError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log sanitized error message without sensitive credentials
    console.error("[Problem Page Error]", error.message || error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center p-6 text-center"
      style={{ backgroundColor: "var(--bg, #090A0F)", color: "var(--fg, #F5F7FA)" }}
    >
      <div
        className="w-full max-w-md rounded-xl p-6 sm:p-8 space-y-5"
        style={{
          border: "1px solid var(--border, #252936)",
          backgroundColor: "var(--bg-surface, #11131A)",
        }}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#F87171]">
          <AlertCircle className="h-6 w-6" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-[#F5F7FA]">Could not load problem</h2>
          <p className="text-xs text-[#8B93A7] leading-relaxed">
            A temporary connection issue prevented loading this problem. Please try again.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E0] px-4 py-2 text-xs font-bold text-[#090A0F] transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Retry</span>
          </button>

          <Link
            href="/problems"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-[#252936] bg-[#181B24] hover:bg-[#202430] px-4 py-2 text-xs font-semibold text-[#F5F7FA] transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Problems Directory</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
