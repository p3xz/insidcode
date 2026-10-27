"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldAlert,
  Zap,
  UserX,
  RefreshCw,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { formatIST } from "@/lib/dateUtils";

interface SecurityViolation {
  id: string;
  targetUserId?: string;
  reason: string;
  details?: string;
  metadata?: {
    actionAttempted?: string;
    ip?: string;
    [key: string]: unknown;
  };
  createdAt: string;
}

interface RecentBan {
  id: string;
  adminUsername: string;
  targetUserId?: string;
  reason?: string;
  createdAt: string;
}

interface HighVelocityUser {
  userId: string;
  username: string;
  submissionsLast2Hours: number;
}

interface ActivityData {
  securityViolations: SecurityViolation[];
  recentBans: RecentBan[];
  highVelocityUsers: HighVelocityUser[];
}

export default function AdminActivityRadarPage() {
  const [data, setData] = useState<ActivityData>({
    securityViolations: [],
    recentBans: [],
    highVelocityUsers: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const fetchActivity = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/activity");
      if (res.ok) {
        const json = await res.json();
        setData(
          json.activity || {
            securityViolations: [],
            recentBans: [],
            highVelocityUsers: [],
          }
        );
        setLastRefreshed(new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }));
      }
    } catch (err) {
      console.error("Failed to load activity telemetry:", err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#252936] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin"
              className="text-xs text-[#8B93A7] hover:text-[#F5F7FA] inline-flex items-center gap-1 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </Link>
            <span className="text-[#5E667B]">/</span>
            <span className="text-xs font-semibold text-[#EF4444] mono uppercase tracking-wider">
              Security Radar
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F5F7FA]">
            Suspicious Activity Radar
          </h1>
          <p className="text-xs text-[#8B93A7] mt-1">
            Real-time telemetry tracking security violations, bot-level submission bursts, and administrative enforcement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-[11px] mono text-[#8B93A7]">
              IST: <span className="text-[#F5F7FA]">{lastRefreshed}</span>
            </span>
          )}
          <button
            onClick={() => fetchActivity(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181B24] border border-[#252936] text-xs font-medium text-[#F5F7FA] hover:border-[#00F0FF]/40 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#00F0FF] ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#00F0FF]" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section 1: Security Violations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444]">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#F5F7FA]">
                    Unauthorized Admin Access Attempts
                  </h2>
                  <p className="text-[11px] text-[#8B93A7]">
                    Non-admin users who attempted admin mutation endpoints and were automatically suspended.
                  </p>
                </div>
              </div>
              <span className="mono text-xs font-bold px-2 py-0.5 rounded bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20">
                {data.securityViolations.length} Detected
              </span>
            </div>

            <div className="rounded-xl border border-[#252936] bg-[#11131A] overflow-hidden">
              {data.securityViolations.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8B93A7] flex flex-col items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-[#10B981]" />
                  <p className="font-semibold text-[#F5F7FA]">All Clear</p>
                  <p>No unauthorized administrative mutation attempts recorded.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#181B24] text-[#8B93A7] border-b border-[#252936] font-mono text-[11px]">
                      <tr>
                        <th className="px-4 py-3">Timestamp (IST)</th>
                        <th className="px-4 py-3">Target User ID</th>
                        <th className="px-4 py-3">Attempted Action</th>
                        <th className="px-4 py-3">Violation Reason</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#252936] text-[#F5F7FA] font-mono">
                      {data.securityViolations.map((v) => (
                        <tr key={v.id} className="hover:bg-[#181B24]/40 transition">
                          <td className="px-4 py-3 text-[#8B93A7] text-[11px] whitespace-nowrap">
                            {formatIST(v.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[#00F0FF]">{v.targetUserId || "Unknown"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                              {v.metadata?.actionAttempted || "MUTATION_ATTEMPT"}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-sans text-xs text-[#8B93A7] max-w-sm">
                            <p className="text-[#F5F7FA] font-mono text-[11px]">{v.reason}</p>
                            {v.details && <p className="text-[10px] text-[#5E667B] truncate">{v.details}</p>}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {v.targetUserId && (
                              <Link
                                href={`/admin/users?search=${encodeURIComponent(v.targetUserId)}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#181B24] hover:bg-[#252936] text-[#00F0FF] border border-[#252936] text-[11px] transition"
                              >
                                <span>Inspect</span>
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: High Velocity Submissions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B]">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#F5F7FA]">
                    High-Velocity Submitters (Past 2 Hours)
                  </h2>
                  <p className="text-[11px] text-[#8B93A7]">
                    Accounts with &ge; 15 submissions within a 2-hour window (potential automated spam, script bots, or brute-force tests).
                  </p>
                </div>
              </div>
              <span className="mono text-xs font-bold px-2 py-0.5 rounded bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">
                {data.highVelocityUsers.length} Active
              </span>
            </div>

            <div className="rounded-xl border border-[#252936] bg-[#11131A] overflow-hidden">
              {data.highVelocityUsers.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8B93A7] flex flex-col items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-[#10B981]" />
                  <p className="font-semibold text-[#F5F7FA]">Normal Submission Rates</p>
                  <p>No accounts currently exceeding submission velocity thresholds.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#181B24] text-[#8B93A7] border-b border-[#252936] font-mono text-[11px]">
                      <tr>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">User ID</th>
                        <th className="px-4 py-3">Submissions (2 hrs)</th>
                        <th className="px-4 py-3">Severity Level</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#252936] text-[#F5F7FA]">
                      {data.highVelocityUsers.map((u) => {
                        const isCritical = u.submissionsLast2Hours >= 30;
                        return (
                          <tr key={u.userId} className="hover:bg-[#181B24]/40 transition">
                            <td className="px-4 py-3">
                              <span className="font-mono font-bold text-[#F5F7FA]">
                                @{u.username}
                              </span>
                            </td>
                            <td className="px-4 py-3 mono text-[11px] text-[#8B93A7]">
                              {u.userId}
                            </td>
                            <td className="px-4 py-3 mono font-bold text-sm text-[#F5F7FA]">
                              {u.submissionsLast2Hours}
                            </td>
                            <td className="px-4 py-3">
                              {isCritical ? (
                                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                                  <AlertTriangle className="h-3 w-3" />
                                  CRITICAL VELOCITY
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                                  <AlertTriangle className="h-3 w-3" />
                                  ELEVATED
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Link
                                href={`/admin/users?search=${encodeURIComponent(u.username)}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#181B24] hover:bg-[#252936] text-[#00F0FF] border border-[#252936] text-[11px] transition font-semibold"
                              >
                                <span>Inspect User</span>
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Recent Bans & Suspensions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444]">
                  <UserX className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#F5F7FA]">
                    Recent Administrative Suspensions & Bans
                  </h2>
                  <p className="text-[11px] text-[#8B93A7]">
                    Recent enforcement actions recorded in the immutable audit ledger.
                  </p>
                </div>
              </div>
              <span className="mono text-xs font-bold px-2 py-0.5 rounded bg-[#181B24] text-[#8B93A7] border border-[#252936]">
                {data.recentBans.length} Recorded
              </span>
            </div>

            <div className="rounded-xl border border-[#252936] bg-[#11131A] overflow-hidden">
              {data.recentBans.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8B93A7] flex flex-col items-center gap-2">
                  <p className="font-semibold text-[#F5F7FA]">No Recent Enforcement</p>
                  <p>No recent administrative ban or suspension actions found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#181B24] text-[#8B93A7] border-b border-[#252936] font-mono text-[11px]">
                      <tr>
                        <th className="px-4 py-3">Timestamp (IST)</th>
                        <th className="px-4 py-3">Actor</th>
                        <th className="px-4 py-3">Target User ID</th>
                        <th className="px-4 py-3">Reason</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#252936] text-[#F5F7FA] font-mono">
                      {data.recentBans.map((b) => (
                        <tr key={b.id} className="hover:bg-[#181B24]/40 transition">
                          <td className="px-4 py-3 text-[#8B93A7] text-[11px] whitespace-nowrap">
                            {formatIST(b.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[#00F0FF]">@{b.adminUsername}</span>
                          </td>
                          <td className="px-4 py-3 text-[#8B93A7]">
                            {b.targetUserId || "-"}
                          </td>
                          <td className="px-4 py-3 font-sans text-xs text-[#F5F7FA] max-w-sm">
                            {b.reason || "Administrative suspension"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {b.targetUserId && (
                              <Link
                                href={`/admin/users?search=${encodeURIComponent(b.targetUserId)}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#181B24] hover:bg-[#252936] text-[#00F0FF] border border-[#252936] text-[11px] transition"
                              >
                                <span>Inspect</span>
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
