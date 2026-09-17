"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { formatIST, formatISTDateOnly } from "@/lib/dateUtils";

interface AppealItem {
  id: string;
  userId: string;
  username: string;
  email: string;
  banReason?: string;
  reason: string;
  statement: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedAt?: string;
  reviewedBy?: string;
  decision?: string;
  createdAt: string;
}

export default function AdminAppealsPage() {
  const [appeals, setAppeals] = useState<AppealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [selectedAppeal, setSelectedAppeal] = useState<AppealItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [modalFeedback, setModalFeedback] = useState("");

  const fetchAppeals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/appeals?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAppeals(data.appeals || []);
        setPendingCount(data.pendingCount || 0);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchAppeals();
  }, [fetchAppeals]);

  const handleProcessAppeal = async (action: "APPROVE" | "REJECT") => {
    if (!selectedAppeal) return;
    setActionLoading(true);
    setModalFeedback("");

    try {
      const res = await fetch(`/api/admin/appeals/${selectedAppeal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          decisionNotes: decisionNotes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setModalFeedback(`Appeal successfully ${action === "APPROVE" ? "approved" : "rejected"}.`);
        setTimeout(() => {
          setSelectedAppeal(null);
          setDecisionNotes("");
          setModalFeedback("");
          fetchAppeals();
        }, 1200);
      } else {
        setModalFeedback(data.error || "Failed to process decision.");
      }
    } catch {
      setModalFeedback("Network error processing appeal.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
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
              Appeals Management
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F5F7FA]">
            Suspension Appeals
          </h1>
          <p className="text-xs text-[#8B93A7] mt-1">
            Review formal suspension appeal requests, inspect statements, and decide account restorations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-[#252936] bg-[#11131A] px-3.5 py-2">
            <Clock className="h-4 w-4 text-[#F59E0B]" />
            <span className="text-xs text-[#8B93A7]">Pending Review:</span>
            <span className="mono text-sm font-bold text-[#F59E0B]">{pendingCount}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-[#11131A] border border-[#252936] rounded-lg">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((tab) => {
            const isSelected = statusFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                  isSelected
                    ? "bg-[#181B24] text-[#F5F7FA] border border-[#252936]"
                    : "text-[#8B93A7] hover:text-[#F5F7FA]"
                }`}
              >
                {tab === "ALL" ? "All Appeals" : tab}
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5E667B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search username, email, reason..."
            className="w-full bg-[#11131A] border border-[#252936] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#00F0FF]"
          />
        </div>
      </div>

      <div className="rounded-xl border border-[#252936] bg-[#11131A] overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#00F0FF]" />
          </div>
        ) : appeals.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#8B93A7] space-y-1">
            <p className="font-semibold text-sm text-[#F5F7FA]">No appeals found</p>
            <p>There are no suspension appeals matching the active filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#181B24] text-[#8B93A7] border-b border-[#252936]">
                <tr>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Appeal Reason</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                  <th className="px-4 py-3 font-semibold">Reviewed</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252936] text-[#F5F7FA]">
                {appeals.map((appeal) => (
                  <tr key={appeal.id} className="hover:bg-[#181B24]/50 transition">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-mono font-bold text-[#F5F7FA]">@{appeal.username}</p>
                        <p className="text-[11px] text-[#8B93A7]">{appeal.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium truncate">{appeal.reason}</p>
                      <p className="text-[11px] text-[#8B93A7] truncate">{appeal.statement}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={appeal.status} />
                    </td>
                    <td className="px-4 py-3 mono text-[11px] text-[#8B93A7]">
                      {formatISTDateOnly(appeal.createdAt)}
                    </td>
                    <td className="px-4 py-3 mono text-[11px] text-[#8B93A7]">
                      {appeal.reviewedAt ? formatISTDateOnly(appeal.reviewedAt) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedAppeal(appeal)}
                        className="px-3 py-1 rounded bg-[#181B24] hover:bg-[#252936] text-[#00F0FF] border border-[#252936] text-[11px] font-semibold transition"
                      >
                        {appeal.status === "PENDING" ? "Review Appeal" : "Inspect"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedAppeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#11131A] border border-[#252936] rounded-xl p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-[#252936] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedAppeal.status} />
                  <span className="mono text-xs text-[#8B93A7]">ID: {selectedAppeal.id}</span>
                </div>
                <h2 className="text-lg font-bold text-[#F5F7FA] mt-1">
                  Appeal Review — @{selectedAppeal.username}
                </h2>
                <p className="text-xs text-[#8B93A7]">{selectedAppeal.email}</p>
              </div>
              <button
                onClick={() => setSelectedAppeal(null)}
                className="text-[#8B93A7] hover:text-[#F5F7FA] text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-[#181B24] border border-[#252936] rounded-lg space-y-1">
                <span className="text-[10px] uppercase tracking-wider mono text-[#8B93A7] font-semibold">
                  Recorded Ban Reason
                </span>
                <p className="text-red-400 font-mono">{selectedAppeal.banReason || "Administrative suspension"}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider mono text-[#8B93A7] font-semibold">
                  Appeal Reason Category
                </span>
                <p className="text-[#F5F7FA] font-medium">{selectedAppeal.reason}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider mono text-[#8B93A7] font-semibold">
                  Full Appeal Statement
                </span>
                <div className="p-3.5 bg-[#09090b] border border-[#252936] rounded-lg font-mono text-[11px] leading-relaxed text-[#F5F7FA] whitespace-pre-wrap">
                  {selectedAppeal.statement}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px] text-[#8B93A7] mono">
                <div>
                  <span>Submitted (IST): </span>
                  <span className="text-[#F5F7FA]">{formatIST(selectedAppeal.createdAt)}</span>
                </div>
                <div>
                  <span>Reviewed (IST): </span>
                  <span className="text-[#F5F7FA]">
                    {selectedAppeal.reviewedAt ? formatIST(selectedAppeal.reviewedAt) : "Not yet"}
                  </span>
                </div>
              </div>

              {selectedAppeal.decision && (
                <div className="p-3 bg-[#181B24] border border-[#252936] rounded-lg space-y-1">
                  <span className="text-[10px] uppercase tracking-wider mono text-[#8B93A7] font-semibold">
                    Recorded Decision Notes (by @{selectedAppeal.reviewedBy})
                  </span>
                  <p className="text-[#F5F7FA]">{selectedAppeal.decision}</p>
                </div>
              )}

              {selectedAppeal.status === "PENDING" && (
                <div className="pt-2 space-y-3 border-t border-[#252936]">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider mono text-[#8B93A7] font-semibold block mb-1">
                      Administrator Decision Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={decisionNotes}
                      onChange={(e) => setDecisionNotes(e.target.value)}
                      placeholder="Optional rationale for approval or rejection..."
                      className="w-full bg-[#181B24] border border-[#252936] rounded-lg px-3 py-2 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#00F0FF]"
                    />
                  </div>

                  {modalFeedback && (
                    <div className="p-2.5 rounded bg-[#181B24] text-xs font-medium text-center text-[#00F0FF]">
                      {modalFeedback}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => handleProcessAppeal("REJECT")}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-lg bg-red-950/40 border border-red-800 text-red-400 hover:bg-red-900/50 text-xs font-semibold transition disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Reject Appeal</span>
                    </button>

                    <button
                      onClick={() => handleProcessAppeal("APPROVE")}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-400 hover:bg-emerald-900/50 text-xs font-semibold transition disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Approve Appeal & Restore Account</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: "PENDING" | "APPROVED" | "REJECTED" }) {
  if (status === "PENDING") {
    return (
      <span className="mono text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
        <Clock className="h-3 w-3" />
        <span>Pending</span>
      </span>
    );
  }
  if (status === "APPROVED") {
    return (
      <span className="mono text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" />
        <span>Approved</span>
      </span>
    );
  }
  return (
    <span className="mono text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/30 inline-flex items-center gap-1">
      <XCircle className="h-3 w-3" />
      <span>Rejected</span>
    </span>
  );
}
