"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  ShieldAlert,
  Send,
  Loader2,
  AlertCircle,
  LogOut,
  Scale,
  FileText,
  Lock,
  User as UserIcon,
  Mail,
  Clock,
  XCircle,
} from "lucide-react";
import { formatIST } from "@/lib/dateUtils";

const APPEAL_REASONS = [
  "Misidentified Activity / False Positive",
  "Compromised / Unauthorized Account Access",
  "Clarification Request / First-Time Policy Question",
  "Remediated Security Issue / Explanation",
  "Other Reason",
];

interface ExistingAppeal {
  id: string;
  reason: string;
  statement: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  reviewedAt?: string;
  decision?: string;
}

export default function AppealPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [appealReason, setAppealReason] = useState(APPEAL_REASONS[0]);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [existingAppeal, setExistingAppeal] = useState<ExistingAppeal | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated" && session?.user && !session.user.isBanned) {
      router.replace("/problems");
      return;
    }

    if (status === "authenticated" && session?.user?.isBanned) {
      const fetchStatus = async () => {
        try {
          const res = await fetch("/api/feedback/appeal");
          if (res.ok) {
            const data = await res.json();
            if (data.hasAppeal && data.appeal) {
              setExistingAppeal(data.appeal);
            }
          }
        } catch {
          // silent
        } finally {
          setPageLoading(false);
        }
      };
      fetchStatus();
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (existingAppeal || isSending) return;

    setErrorMessage("");

    if (!additionalInfo.trim()) {
      setErrorMessage("Please provide details for your appeal statement.");
      return;
    }

    if (additionalInfo.trim().length < 20) {
      setErrorMessage("Please provide at least 20 characters of explanation.");
      return;
    }

    setIsSending(true);

    try {
      const res = await fetch("/api/feedback/appeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appealReason,
          additionalInfo: additionalInfo.trim(),
        }),
      });

      const data = await res.json();

      if (res.status === 201 || res.status === 200) {
        setExistingAppeal({
          id: data.appealId || "new",
          reason: appealReason,
          statement: additionalInfo.trim(),
          status: "PENDING",
          createdAt: new Date().toISOString(),
        });
      } else if (res.status === 409) {
        setErrorMessage(data.message || "An appeal has already been submitted for this suspension.");
        const statusRes = await fetch("/api/feedback/appeal");
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.appeal) setExistingAppeal(statusData.appeal);
        }
      } else {
        setErrorMessage(data.error || "Unable to submit appeal. Please try again.");
      }
    } catch {
      setErrorMessage("Network error occurred while submitting your appeal.");
    } finally {
      setIsSending(false);
    }
  };

  if (status === "loading" || pageLoading || (status === "authenticated" && !session?.user?.isBanned)) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-8">
      {/* Page Header */}
      <div className="pb-6" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="mono text-[11px] px-2 py-0.5 rounded font-medium"
            style={{
              backgroundColor: "color-mix(in srgb, var(--danger) 12%, transparent)",
              color: "var(--danger)",
              border: "1px solid color-mix(in srgb, var(--danger) 28%, transparent)",
            }}
          >
            RESTRICTED ACCOUNT
          </span>
        </div>
        <h1 className="text-[22px] font-bold tracking-tight" style={{ color: "var(--fg)" }}>
          Account Suspension Appeal
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed" style={{ color: "var(--fg-muted)" }}>
          Submit an official appeal to request a manual review of your account suspension by the InsidCode administrative team.
        </p>
      </div>

      {/* STATE 1: PENDING APPEAL */}
      {existingAppeal && existingAppeal.status === "PENDING" && (
        <div
          className="p-6 text-center space-y-5"
          style={{
            border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)",
            backgroundColor: "color-mix(in srgb, var(--accent) 5%, transparent)",
            borderRadius: "6px",
          }}
        >
          <div className="flex justify-center">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{
                backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
                color: "var(--accent)",
              }}
            >
              <Clock className="h-6 w-6" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-center">
              <span className="mono text-[10px] px-2.5 py-0.5 rounded font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Pending Review
              </span>
            </div>
            <h2 className="text-lg font-bold" style={{ color: "var(--fg)" }}>
              Appeal submitted
            </h2>
            <p className="text-[13px] leading-relaxed max-w-md mx-auto" style={{ color: "var(--fg-muted)" }}>
              Your appeal is currently pending review by the InsidCode administrative team.
            </p>
          </div>

          <div
            className="p-4 text-left text-xs space-y-2 max-w-lg mx-auto"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg)",
              borderRadius: "4px",
            }}
          >
            <div className="flex items-center justify-between mono text-[11px]" style={{ color: "var(--fg-dimmed)" }}>
              <span>Submitted: {formatIST(existingAppeal.createdAt)}</span>
              <span>1 Appeal / Suspension</span>
            </div>
            <p className="font-semibold" style={{ color: "var(--fg)" }}>
              Reason: {existingAppeal.reason}
            </p>
            <p className="font-mono text-[11px] leading-relaxed line-clamp-3" style={{ color: "var(--fg-muted)" }}>
              {existingAppeal.statement}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/suspended"
              className="btn btn-secondary inline-flex items-center justify-center gap-2 text-xs px-5 py-2.5"
              style={{
                border: "1px solid var(--border)",
                backgroundColor: "var(--bg)",
                color: "var(--fg)",
              }}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Back to Restriction Status</span>
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="btn btn-secondary inline-flex items-center justify-center gap-2 text-xs px-5 py-2.5"
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
        </div>
      )}

      {/* STATE 2: REJECTED APPEAL */}
      {existingAppeal && existingAppeal.status === "REJECTED" && (
        <div
          className="p-6 text-center space-y-5"
          style={{
            border: "1px solid color-mix(in srgb, var(--danger) 35%, transparent)",
            backgroundColor: "color-mix(in srgb, var(--danger) 5%, transparent)",
            borderRadius: "6px",
          }}
        >
          <div className="flex justify-center">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{
                backgroundColor: "color-mix(in srgb, var(--danger) 15%, transparent)",
                color: "var(--danger)",
              }}
            >
              <XCircle className="h-6 w-6" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-center">
              <span className="mono text-[10px] px-2.5 py-0.5 rounded font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/30">
                Appeal Rejected
              </span>
            </div>
            <h2 className="text-lg font-bold" style={{ color: "var(--fg)" }}>
              Appeal rejected
            </h2>
            <p className="text-[13px] leading-relaxed max-w-md mx-auto" style={{ color: "var(--fg-muted)" }}>
              Your suspension appeal was rejected by the InsidCode administrative team.
            </p>
          </div>

          <div
            className="p-4 text-left text-xs space-y-2 max-w-lg mx-auto"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg)",
              borderRadius: "4px",
            }}
          >
            <div className="flex items-center justify-between mono text-[11px]" style={{ color: "var(--fg-dimmed)" }}>
              <span>
                Decided: {formatIST(existingAppeal.reviewedAt)}
              </span>
              <span style={{ color: "var(--danger)" }}>Final Decision</span>
            </div>
            <p className="text-[12px] leading-relaxed" style={{ color: "var(--fg-muted)" }}>
              This decision is final for your current suspension. Account operations, submissions, and Duels remain restricted in accordance with platform security and integrity policies.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/suspended"
              className="btn btn-secondary inline-flex items-center justify-center gap-2 text-xs px-5 py-2.5"
              style={{
                border: "1px solid var(--border)",
                backgroundColor: "var(--bg)",
                color: "var(--fg)",
              }}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Back to Restriction Status</span>
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="btn btn-secondary inline-flex items-center justify-center gap-2 text-xs px-5 py-2.5"
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
        </div>
      )}

      {/* STATE 3: NO APPEAL YET -> SUBMISSION FORM */}
      {!existingAppeal && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            className="p-4 text-[12px] leading-relaxed space-y-1.5"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg-subtle)",
              borderRadius: "4px",
              color: "var(--fg-muted)",
            }}
          >
            <p className="font-semibold text-[13px]" style={{ color: "var(--fg)" }}>
              Appeal Review Policy
            </p>
            <p>
              Submitting an appeal constitutes a formal review request. The InsidCode security and administrative team will inspect the associated platform logs and security records.
            </p>
            <p className="text-[11px]" style={{ color: "var(--fg-dimmed)" }}>
              Please note: Submitting an appeal does not guarantee that the suspension will be lifted. Each account is limited to one active appeal per suspension.
            </p>
          </div>

          {errorMessage && (
            <div
              className="flex items-center gap-3 p-4 text-[12px]"
              style={{
                border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--danger) 8%, transparent)",
                borderRadius: "3px",
                color: "var(--danger)",
              }}
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p className="font-medium">{errorMessage}</p>
            </div>
          )}

          <div
            className="p-4 space-y-3"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg-subtle)",
              borderRadius: "4px",
            }}
          >
            <div className="flex items-center justify-between">
              <p className="section-label">Authenticated Account Record</p>
              <span className="flex items-center gap-1 text-[11px] mono" style={{ color: "var(--fg-dimmed)" }}>
                <Lock className="h-3 w-3" /> Read-only (Server Verified)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>
                  Username
                </label>
                <div
                  className="flex items-center gap-2 px-3 py-2 text-[12px] mono font-semibold select-none cursor-not-allowed"
                  style={{
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--bg)",
                    color: "var(--fg)",
                    borderRadius: "3px",
                  }}
                >
                  <UserIcon className="h-3.5 w-3.5 text-[var(--fg-dimmed)]" />
                  <span>@{session?.user?.username || "unknown"}</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>
                  Account Email
                </label>
                <div
                  className="flex items-center gap-2 px-3 py-2 text-[12px] mono select-none cursor-not-allowed"
                  style={{
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--bg)",
                    color: "var(--fg)",
                    borderRadius: "3px",
                  }}
                >
                  <Mail className="h-3.5 w-3.5 text-[var(--fg-dimmed)]" />
                  <span>{session?.user?.email || "No email attached"}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="section-label block mb-2">Reason for Appeal</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {APPEAL_REASONS.map((reason) => {
                const isSelected = appealReason === reason;
                return (
                  <button
                    type="button"
                    key={reason}
                    onClick={() => setAppealReason(reason)}
                    className="flex items-center gap-2.5 p-3 text-left transition-all cursor-pointer"
                    style={{
                      border: isSelected
                        ? "1px solid var(--accent)"
                        : "1px solid var(--border)",
                      backgroundColor: isSelected
                        ? "color-mix(in srgb, var(--accent) 8%, transparent)"
                        : "var(--bg)",
                      borderRadius: "3px",
                      color: isSelected ? "var(--fg)" : "var(--fg-muted)",
                    }}
                  >
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: isSelected ? "var(--accent)" : "var(--border-strong)",
                      }}
                    />
                    <span className="text-[12px] font-medium leading-snug">{reason}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="section-label">Appeal Statement & Supporting Information</label>
              <span className="mono text-[10px]" style={{ color: "var(--fg-dimmed)" }}>
                {additionalInfo.length} / 3000
              </span>
            </div>
            <textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              maxLength={3000}
              rows={8}
              placeholder="Provide a detailed explanation of why you believe this suspension should be reviewed. Include any context, clarification, or remediation steps taken..."
              required
              className="w-full p-3 text-[12px] font-mono leading-relaxed focus:outline-none resize-y"
              style={{
                border: "1px solid var(--border)",
                backgroundColor: "var(--bg)",
                color: "var(--fg)",
                borderRadius: "3px",
              }}
            />
          </div>

          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <Link
              href="/suspended"
              className="text-[12px] hover:underline inline-flex items-center gap-1.5"
              style={{ color: "var(--fg-muted)" }}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Back to Restriction Notice</span>
            </Link>

            <button
              type="submit"
              disabled={isSending || additionalInfo.trim().length < 20}
              className="btn btn-primary inline-flex items-center justify-center gap-2 text-[12px] px-6 py-2.5 disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Submitting Appeal...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Submit Appeal</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      <div
        className="pt-6 flex items-center justify-center gap-4 text-[11px]"
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
          <FileText className="h-3 w-3" /> Platform Integrity Policy
        </Link>
        <span>•</span>
        <Link href="/privacy" className="hover:underline">
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}
