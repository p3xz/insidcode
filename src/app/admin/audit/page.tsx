"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, ShieldAlert, UserX, AlertTriangle } from "lucide-react";

interface AuditLogItem {
  id: string;
  adminId?: string;
  adminUsername: string;
  action: string;
  targetUserId?: string;
  targetProblemId?: string;
  previousValue?: string;
  newValue?: string;
  reason?: string;
  metadata?: {
    category?: string;
    source?: string;
    user?: string;
    detectedAt?: string;
    trigger?: string;
    evidence?: string;
    ip?: string;
  };
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/admin/audit?limit=50");
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filter === "ALL") return true;
    if (filter === "MODERATION") return log.action === "USERNAME_REJECTED" || log.metadata?.category === "ABUSIVE_USERNAME";
    if (filter === "BANS") return log.action === "USER_BAN" || log.action === "USER_UNBAN" || log.action === "USER_SUSPENDED";
    if (filter === "PROBLEMS") return Boolean(log.targetProblemId);
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8B93A7] hover:text-[#00F0FF] transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Admin Console
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F5F7FA]">Admin & Moderation Audit Log</h1>
          <p className="text-xs text-[#8B93A7]">
            Immutable ledger recording administrative changes, automated moderation events, bans, and policy enforcement.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-[#181B24] p-1 rounded-lg border border-[#252936] text-[11px] font-mono">
          {[
            { id: "ALL", label: "All Logs" },
            { id: "MODERATION", label: "Moderation" },
            { id: "BANS", label: "Bans/Suspensions" },
            { id: "PROBLEMS", label: "Problems" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-2.5 py-1 rounded transition ${
                filter === tab.id
                  ? "bg-[#00F0FF]/15 text-[#00F0FF] font-semibold border border-[#00F0FF]/30"
                  : "text-[#8B93A7] hover:text-[#F5F7FA]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[#252936] bg-[#11131A] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#00F0FF]" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#8B93A7]">No audit logs match the selected filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#252936] bg-[#181B24]/70 font-mono text-[#8B93A7]">
                <tr>
                  <th className="px-4 py-3">Timestamp (IST)</th>
                  <th className="px-4 py-3">Source / Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Details & Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252936]/60 text-[#F5F7FA]">
                {filteredLogs.map((log) => {
                  const isModeration = log.action === "USERNAME_REJECTED";
                  const isBan = log.action === "USER_BAN" || log.action === "USER_SUSPENDED";
                  const isAutomated = log.metadata?.source === "AUTOMATED" || log.adminId === "system";

                  return (
                    <tr key={log.id} className="hover:bg-[#181B24]/40 transition font-mono">
                      <td className="px-4 py-3 text-[11px] text-[#8B93A7] whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>

                      {/* Source / Actor */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isAutomated ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded border border-[#F59E0B]/20">
                            <ShieldAlert className="h-3 w-3" />
                            Automated
                          </span>
                        ) : (
                          <span className="text-[#00F0FF]">@{log.adminUsername}</span>
                        )}
                      </td>

                      {/* Action Badge */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isModeration ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded text-[11px] border border-[#EF4444]/20">
                            <AlertTriangle className="h-3 w-3" />
                            USERNAME_REJECTED
                          </span>
                        ) : isBan ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-[#EF4444] bg-[#EF4444]/15 px-2 py-0.5 rounded text-[11px] border border-[#EF4444]/30">
                            <UserX className="h-3 w-3" />
                            {log.action}
                          </span>
                        ) : (
                          <span className="font-semibold text-[#F5F7FA]">{log.action}</span>
                        )}
                      </td>

                      {/* Target */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {log.metadata?.user ? (
                          <span className="text-[#00F0FF]">{log.metadata.user}</span>
                        ) : log.targetProblemId ? (
                          <span className="text-[#3B82F6]">Problem #{log.targetProblemId}</span>
                        ) : log.targetUserId ? (
                          <span className="text-[#F59E0B]">User {log.targetUserId.slice(-6)}</span>
                        ) : (
                          <span className="text-[#5E667B]">System</span>
                        )}
                      </td>

                      {/* Details / Evidence */}
                      <td className="px-4 py-3 font-sans text-xs text-[#8B93A7] max-w-md">
                        {log.metadata?.category && (
                          <p className="font-mono text-[10px] text-[#F59E0B] mb-0.5">
                            Category: {log.metadata.category}
                          </p>
                        )}
                        {log.reason && <p className="text-[#F5F7FA]">{log.reason}</p>}
                        {log.metadata?.evidence && (
                          <p className="text-[11px] text-[#EF4444] mt-0.5 font-mono">
                            Evidence: {log.metadata.evidence}
                          </p>
                        )}
                        {log.newValue && (
                          <p className="text-[11px] text-[#5E667B] truncate font-mono mt-0.5">{log.newValue}</p>
                        )}
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
  );
}
