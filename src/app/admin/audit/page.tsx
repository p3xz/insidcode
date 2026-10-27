"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  ShieldAlert,
  UserX,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileText,
} from "lucide-react";
import { formatIST } from "@/lib/dateUtils";

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
    [key: string]: unknown;
  };
  createdAt: string;
}

const CATEGORIES = [
  { id: "ALL", label: "All Logs" },
  { id: "MODERATION", label: "Moderation" },
  { id: "APPEALS", label: "Appeals" },
  { id: "SECURITY", label: "Security" },
  { id: "LEADERBOARD", label: "Leaderboard" },
  { id: "PROBLEMS", label: "Problems" },
  { id: "SEEDER", label: "Seeder" },
  { id: "FEEDBACK", label: "Feedback" },
];

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "ALL") params.set("category", category);
      if (search.trim()) params.set("search", search.trim());
      params.set("page", page.toString());
      params.set("limit", "25");

      const res = await fetch(`/api/admin/audit?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [category, search, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
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
            <span className="text-xs font-semibold text-[#00F0FF] mono uppercase tracking-wider">
              Audit Trail
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F5F7FA]">
            Administrative Audit Ledger
          </h1>
          <p className="text-xs text-[#8B93A7] mt-1">
            Tamper-evident ledger recording all administrative mutations, user bans, problem updates, and security events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-[#252936] bg-[#11131A] px-3.5 py-2">
            <FileText className="h-4 w-4 text-[#00F0FF]" />
            <span className="text-xs text-[#8B93A7]">Total Records:</span>
            <span className="mono text-sm font-bold text-[#F5F7FA]">{total}</span>
          </div>
          <button
            onClick={() => fetchLogs()}
            className="p-2 rounded-lg bg-[#11131A] border border-[#252936] text-[#8B93A7] hover:text-[#00F0FF] hover:border-[#00F0FF]/40 transition"
            title="Refresh"
            aria-label="Refresh audit logs"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Controls: Category Filter + Search */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-[#11131A] p-1.5 rounded-lg border border-[#252936]">
          {CATEGORIES.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleCategoryChange(tab.id)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                category === tab.id
                  ? "bg-[#181B24] text-[#00F0FF] border border-[#00F0FF]/30 font-semibold"
                  : "text-[#8B93A7] hover:text-[#F5F7FA]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5E667B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by actor username, target user ID, reason, or action name..."
            className="w-full bg-[#11131A] border border-[#252936] rounded-lg pl-9 pr-3 py-2 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#00F0FF]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#252936] bg-[#11131A] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#00F0FF]" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#8B93A7] space-y-1">
            <p className="font-semibold text-sm text-[#F5F7FA]">No audit records found</p>
            <p>No logged actions match the selected category and search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#252936] bg-[#181B24] font-mono text-[#8B93A7] text-[11px]">
                <tr>
                  <th className="px-4 py-3">Timestamp (IST)</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Details & Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252936] text-[#F5F7FA]">
                {logs.map((log) => {
                  const isSecurity = log.action === "UNAUTHORIZED_ADMIN_ACTION";
                  const isModeration = log.action === "USERNAME_REJECTED";
                  const isBan = log.action === "USER_BAN" || log.action === "USER_SUSPENDED";
                  const isAutomated = log.metadata?.source === "AUTOMATED" || log.adminId === "system";

                  return (
                    <tr key={log.id} className="hover:bg-[#181B24]/40 transition">
                      <td className="px-4 py-3 text-[11px] font-mono text-[#8B93A7] whitespace-nowrap">
                        {formatIST(log.createdAt)}
                      </td>

                      {/* Actor */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isAutomated ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded border border-[#F59E0B]/20 font-mono">
                            <ShieldAlert className="h-3 w-3" />
                            System
                          </span>
                        ) : (
                          <span className="font-mono font-medium text-[#00F0FF]">
                            @{log.adminUsername}
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isSecurity ? (
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-[#EF4444] bg-[#EF4444]/15 px-2 py-0.5 rounded text-[10px] border border-[#EF4444]/30">
                            <ShieldAlert className="h-3 w-3" />
                            SECURITY_ALERT
                          </span>
                        ) : isModeration ? (
                          <span className="inline-flex items-center gap-1 font-mono font-semibold text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded text-[11px] border border-[#EF4444]/20">
                            <AlertTriangle className="h-3 w-3" />
                            USERNAME_REJECTED
                          </span>
                        ) : isBan ? (
                          <span className="inline-flex items-center gap-1 font-mono font-semibold text-[#EF4444] bg-[#EF4444]/15 px-2 py-0.5 rounded text-[11px] border border-[#EF4444]/30">
                            <UserX className="h-3 w-3" />
                            {log.action}
                          </span>
                        ) : (
                          <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-[#181B24] border border-[#252936] text-[#F5F7FA]">
                            {log.action}
                          </span>
                        )}
                      </td>

                      {/* Target */}
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px]">
                        {log.targetProblemId ? (
                          <span className="text-[#3B82F6]">Problem #{log.targetProblemId}</span>
                        ) : log.targetUserId ? (
                          <Link
                            href={`/admin/users?search=${encodeURIComponent(log.targetUserId)}`}
                            className="text-[#00F0FF] hover:underline"
                          >
                            User {log.targetUserId.slice(-8)}
                          </Link>
                        ) : log.metadata?.user ? (
                          <span className="text-[#00F0FF]">{log.metadata.user}</span>
                        ) : (
                          <span className="text-[#5E667B]">System</span>
                        )}
                      </td>

                      {/* Details */}
                      <td className="px-4 py-3 text-xs text-[#8B93A7] max-w-md">
                        {log.reason && (
                          <p className="text-[#F5F7FA] font-medium mb-0.5">{log.reason}</p>
                        )}
                        {log.newValue && (
                          <p className="text-[11px] text-[#5E667B] font-mono truncate">
                            {log.newValue}
                          </p>
                        )}
                        {log.metadata?.evidence && (
                          <p className="text-[11px] text-[#EF4444] font-mono mt-0.5">
                            Evidence: {log.metadata.evidence}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#252936] bg-[#181B24]/50">
            <span className="text-xs text-[#8B93A7]">
              Page <span className="text-[#F5F7FA] font-semibold">{page}</span> of{" "}
              <span className="text-[#F5F7FA] font-semibold">{totalPages}</span> ({total} logs)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 rounded bg-[#11131A] border border-[#252936] text-xs text-[#F5F7FA] hover:border-[#00F0FF] disabled:opacity-40 disabled:cursor-not-allowed transition inline-flex items-center gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Previous</span>
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded bg-[#11131A] border border-[#252936] text-xs text-[#F5F7FA] hover:border-[#00F0FF] disabled:opacity-40 disabled:cursor-not-allowed transition inline-flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
