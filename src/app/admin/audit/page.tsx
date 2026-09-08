"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

interface AuditLogItem {
  id: string;
  adminUsername: string;
  action: string;
  targetUserId?: string;
  targetProblemId?: string;
  previousValue?: string;
  newValue?: string;
  reason?: string;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8B93A7] hover:text-[#00F0FF] transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Admin Console
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#F5F7FA]">Admin Audit Log</h1>
        <p className="text-xs text-[#8B93A7]">
          Immutable ledger recording administrative changes, bans, XP adjustments, and problem modifications.
        </p>
      </div>

      <div className="rounded-xl border border-[#252936] bg-[#11131A] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#00F0FF]" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#8B93A7]">No audit logs recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#252936] bg-[#181B24]/70 font-mono text-[#8B93A7]">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Admin</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Details / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252936]/60 text-[#F5F7FA]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#181B24]/40 transition font-mono">
                    <td className="px-4 py-3 text-[11px] text-[#8B93A7] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-[#00F0FF]">@{log.adminUsername}</td>
                    <td className="px-4 py-3 font-semibold text-[#F5F7FA]">{log.action}</td>
                    <td className="px-4 py-3 text-[#F59E0B]">
                      {log.targetProblemId ? `Problem #${log.targetProblemId}` : log.targetUserId ? `User ${log.targetUserId.slice(-6)}` : "System"}
                    </td>
                    <td className="px-4 py-3 font-sans text-xs text-[#8B93A7] max-w-md">
                      {log.reason && <p className="text-[#F5F7FA]">{log.reason}</p>}
                      {log.newValue && (
                        <p className="text-[11px] text-[#5E667B] truncate">{log.newValue}</p>
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
  );
}
