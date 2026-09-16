"use client";

import React from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { ShieldAlert, Mail, LogOut, FileText, Scale } from "lucide-react";

export default function SuspendedPage() {
  const { data: session } = useSession();

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-12 sm:px-6">
      <div
        className="w-full max-w-lg p-6 sm:p-8 space-y-6 text-center"
        style={{
          border: "1px solid var(--border)",
          backgroundColor: "var(--bg-subtle)",
          borderRadius: "6px",
        }}
      >
        {/* Header Icon */}
        <div className="flex justify-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{
              backgroundColor: "color-mix(in srgb, var(--danger) 12%, transparent)",
              border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)",
              color: "var(--danger)",
            }}
          >
            <ShieldAlert className="h-7 w-7" />
          </div>
        </div>

        {/* Title and Explanation */}
        <div className="space-y-2">
          <p className="section-label" style={{ color: "var(--danger)" }}>
            Security & Policy Notice
          </p>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>
            Account Suspended
          </h1>
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--fg-muted)" }}>
            Access to your InsidCode account has been suspended due to an unauthorized action,
            security violation, or policy breach.
          </p>
        </div>

        {/* User Identity Box */}
        {session?.user && (
          <div
            className="p-3.5 text-left text-xs space-y-1"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg)",
              borderRadius: "4px",
            }}
          >
            <p className="section-label">Account Identifier</p>
            <p className="mono font-semibold" style={{ color: "var(--fg)" }}>
              @{session.user.username || "user"}
            </p>
            <p className="text-[11px]" style={{ color: "var(--fg-dimmed)" }}>
              Protected platform actions, coding submissions, and Duels are disabled.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/feedback"
            className="btn btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs px-5 py-2.5"
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Contact Support / Appeal</span>
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="btn btn-secondary w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs px-5 py-2.5"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg)",
              color: "var(--fg)",
            }}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Legal Links Footer */}
        <div
          className="pt-4 flex items-center justify-center gap-4 text-[11px]"
          style={{
            borderTop: "1px solid var(--border)",
            color: "var(--fg-dimmed)",
          }}
        >
          <Link href="/terms" className="hover:underline inline-flex items-center gap-1">
            <Scale className="h-3 w-3" /> Terms of Use
          </Link>
          <span>•</span>
          <Link href="/integrity" className="hover:underline inline-flex items-center gap-1">
            <FileText className="h-3 w-3" /> Platform Integrity
          </Link>
          <span>•</span>
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
