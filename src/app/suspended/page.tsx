"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ShieldAlert, Mail, LogOut, FileText, Scale, Loader2, Clock, CheckCircle2, XCircle } from "lucide-react";
import { ISuspensionDetails } from "@/types";

export default function SuspendedPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [details, setDetails] = useState<ISuspensionDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // If user is authenticated and not banned, redirect to problems
  useEffect(() => {
    if (status === "authenticated" && session?.user && !session.user.isBanned) {
      router.replace("/problems");
    }
  }, [session, status, router]);

  // Fetch verified suspension event details from the server
  useEffect(() => {
    let isMounted = true;
    async function fetchSuspensionDetails() {
      if (status !== "authenticated") {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/user/suspension-details");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.details) {
            setDetails(data.details);
          }
        }
      } catch {
        // Safe fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSuspensionDetails();
    return () => {
      isMounted = false;
    };
  }, [status]);

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12 sm:px-6">
      <div
        className="w-full max-w-2xl p-6 sm:p-8 space-y-6 text-center"
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
        <div className="space-y-3">
          <p className="section-label" style={{ color: "var(--danger)" }}>
            Security & Access Restriction
          </p>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>
            You have been banned from InsidCode.
          </h1>
          <p className="text-[13px] leading-relaxed max-w-lg mx-auto" style={{ color: "var(--fg-muted)" }}>
            Your access to InsidCode has been restricted due to unwanted or unauthorized activity.
          </p>
          <p className="text-[12px] leading-relaxed max-w-lg mx-auto" style={{ color: "var(--fg-dimmed)" }}>
            All protected platform operations, code executions, problem submissions, and competitive Duels are disabled for this account in accordance with platform security and integrity policies.
          </p>
        </div>

        {/* Loading State for Details */}
        {loading && (
          <div
            className="p-8 flex items-center justify-center gap-2 text-xs"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg)",
              borderRadius: "4px",
              color: "var(--fg-muted)",
            }}
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading suspension event details...</span>
          </div>
        )}

        {/* SUSPENSION DETAILS SECTION */}
        {!loading && (
          <div
            className="text-left text-xs space-y-4 p-5"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg)",
              borderRadius: "4px",
            }}
          >
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <span className="mono text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/30">
                  Suspension Details
                </span>
              </div>
              <span className="mono text-[11px]" style={{ color: "var(--fg-dimmed)" }}>
                ID: {details?.relatedEvents?.[0] || "SEC-RECORD"}
              </span>
            </div>

            {/* Grid of Key Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 pt-1">
              <div>
                <p className="section-label mb-0.5">User</p>
                <p className="mono font-semibold text-[13px]" style={{ color: "var(--fg)" }}>
                  {details?.user || (session?.user ? `@${session.user.username}` : "Restricted User")}
                </p>
              </div>

              <div>
                <p className="section-label mb-0.5">Action</p>
                <p className="mono font-bold text-[12px] tracking-wide" style={{ color: "var(--danger)" }}>
                  {details?.action || "SUSPENDED"}
                </p>
              </div>

              <div>
                <p className="section-label mb-0.5">Source</p>
                <p className="text-[12px] font-medium" style={{ color: "var(--fg)" }}>
                  {details?.source || "Automated"}
                </p>
              </div>

              <div>
                <p className="section-label mb-0.5">Admin</p>
                <p className="mono text-[12px] font-medium" style={{ color: "var(--fg)" }}>
                  {details?.admin || "System"}
                </p>
              </div>

              <div>
                <p className="section-label mb-0.5">Detected</p>
                <p className="mono text-[12px]" style={{ color: "var(--fg-muted)" }}>
                  {details?.formattedDate || "Recorded"}
                </p>
              </div>

              <div>
                <p className="section-label mb-0.5">Appeal</p>
                <div className="flex items-center gap-1.5 pt-0.5">
                  {details?.appealStatus === "PENDING" && (
                    <span className="mono text-[11px] px-2 py-0.5 rounded font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Pending review
                    </span>
                  )}
                  {details?.appealStatus === "APPROVED" && (
                    <span className="mono text-[11px] px-2 py-0.5 rounded font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Approved
                    </span>
                  )}
                  {details?.appealStatus === "REJECTED" && (
                    <span className="mono text-[11px] px-2 py-0.5 rounded font-medium bg-red-500/10 text-red-400 border border-red-500/30 inline-flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      Rejected
                    </span>
                  )}
                  {(!details || details.appealStatus === "NONE") && (
                    <span className="mono text-[11px] px-2 py-0.5 rounded font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/30">
                      Not submitted
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="section-label mb-0.5">Previous State</p>
                <p className="mono text-[12px]" style={{ color: "var(--fg-muted)" }}>
                  {details?.previousAccountState || "ACTIVE"}
                </p>
              </div>

              <div>
                <p className="section-label mb-0.5">Current State</p>
                <p className="mono text-[12px] font-semibold" style={{ color: "var(--danger)" }}>
                  {details?.newAccountState || "SUSPENDED"}
                </p>
              </div>
            </div>

            {/* Detailed Rows */}
            <div className="space-y-3 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
              <div>
                <p className="section-label mb-1">Reason</p>
                <p className="text-[12px] leading-relaxed" style={{ color: "var(--fg)" }}>
                  {details?.reason || "Unauthorized access attempts"}
                </p>
              </div>

              <div>
                <p className="section-label mb-1">Trigger</p>
                <p className="text-[12px] leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                  {details?.trigger || "Multiple unauthorized access attempts detected."}
                </p>
              </div>

              <div>
                <p className="section-label mb-1">Evidence</p>
                <p className="text-[12px] leading-relaxed" style={{ color: "var(--fg-dimmed)" }}>
                  {details?.evidence || "Available to the InsidCode administrative team."}
                </p>
              </div>

              <div>
                <p className="section-label mb-1.5">Related Events</p>
                <div className="flex flex-wrap gap-1.5">
                  {details?.relatedEvents && details.relatedEvents.length > 0 ? (
                    details.relatedEvents.map((ev, idx) => (
                      <span
                        key={idx}
                        className="mono text-[11px] px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: "var(--bg-subtle)",
                          border: "1px solid var(--border)",
                          color: "var(--fg-muted)",
                        }}
                      >
                        {ev}
                      </span>
                    ))
                  ) : (
                    <span className="mono text-[11px] text-zinc-500">None</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/feedback/appeal"
            className="btn btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs px-5 py-2.5"
          >
            <Mail className="h-3.5 w-3.5" />
            <span>
              {details?.appealStatus === "PENDING"
                ? "View Appeal Status"
                : details?.appealStatus === "REJECTED"
                ? "View Appeal Decision"
                : "Appeal Suspension"}
            </span>
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
