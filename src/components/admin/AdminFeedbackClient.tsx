"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import InlineNotice from "@/components/ui/InlineNotice";

interface FeedbackItem {
  id: string;
  userId?: string;
  username: string;
  email: string;
  feedbackType: string;
  subject: string;
  message: string;
  status: "NEW" | "IN_REVIEW" | "RESOLVED";
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({ new: 0, inReview: 0 });

  // Detail Modal
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
  const [actionStatus, setActionStatus] = useState<"NEW" | "IN_REVIEW" | "RESOLVED">("IN_REVIEW");
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (search.trim()) params.set("search", search.trim());
      params.set("page", page.toString());
      params.set("limit", limit.toString());

      const res = await fetch(`/api/admin/feedback?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.feedback || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
        }
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, search, page, limit]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/feedback/${selectedItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: actionStatus,
          adminNotes: adminNotes.trim() || undefined,
        }),
      });

      if (res.ok) {
        setActionNotice({
          type: "success",
          message: `Feedback status updated to ${actionStatus}.`,
        });
        setSelectedItem(null);
        fetchFeedback();
      } else {
        const data = await res.json();
        setActionNotice({ type: "error", message: data.error || "Failed to update feedback." });
      }
    } catch {
      setActionNotice({ type: "error", message: "Network error updating feedback." });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW":
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase mono"
            style={{
              backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
              color: "var(--accent)",
              border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
            }}
          >
            <AlertCircle className="h-3 w-3" />
            <span>New</span>
          </span>
        );
      case "IN_REVIEW":
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase mono"
            style={{
              backgroundColor: "color-mix(in srgb, var(--warning) 15%, transparent)",
              color: "var(--warning)",
              border: "1px solid color-mix(in srgb, var(--warning) 30%, transparent)",
            }}
          >
            <Clock className="h-3 w-3" />
            <span>In Review</span>
          </span>
        );
      case "RESOLVED":
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase mono"
            style={{
              backgroundColor: "color-mix(in srgb, var(--success) 15%, transparent)",
              color: "var(--success)",
              border: "1px solid color-mix(in srgb, var(--success) 30%, transparent)",
            }}
          >
            <CheckCircle2 className="h-3 w-3" />
            <span>Resolved</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      {actionNotice && (
        <InlineNotice
          message={actionNotice.message}
          onDismiss={() => setActionNotice(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6" style={{ borderBottom: "1px solid var(--border)" }}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>
            Feedback Inbox
          </h1>
          <p className="text-[12px] mt-1" style={{ color: "var(--fg-muted)" }}>
            Review bug reports, feature suggestions, compiler issues, and UI feedback from developers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {counts.new > 0 && (
            <span
              className="px-2.5 py-1 rounded text-[11px] font-semibold mono"
              style={{
                backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
                color: "var(--accent)",
                border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
              }}
            >
              {counts.new} New
            </span>
          )}
          {counts.inReview > 0 && (
            <span
              className="px-2.5 py-1 rounded text-[11px] font-semibold mono"
              style={{
                backgroundColor: "color-mix(in srgb, var(--warning) 15%, transparent)",
                color: "var(--warning)",
                border: "1px solid color-mix(in srgb, var(--warning) 30%, transparent)",
              }}
            >
              {counts.inReview} In Review
            </span>
          )}
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5" style={{ color: "var(--fg-dimmed)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search feedback..."
              className="w-full rounded py-1.5 pl-8 pr-3 text-[12px] focus:outline-none"
              style={{
                backgroundColor: "var(--bg-subtle)",
                color: "var(--fg)",
                border: "1px solid var(--border)",
              }}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded py-1.5 px-3 text-[12px] focus:outline-none"
            style={{
              backgroundColor: "var(--bg-subtle)",
              color: "var(--fg)",
              border: "1px solid var(--border)",
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          {/* Category Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="rounded py-1.5 px-3 text-[12px] focus:outline-none"
            style={{
              backgroundColor: "var(--bg-subtle)",
              color: "var(--fg)",
              border: "1px solid var(--border)",
            }}
          >
            <option value="ALL">All Categories</option>
            <option value="Bug Report">Bug Report</option>
            <option value="Feature Request">Feature Request</option>
            <option value="Compiler / Execution">Compiler / Execution</option>
            <option value="UI / Design">UI / Design</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Feedback Table */}
      <div
        className="rounded-lg overflow-hidden transition"
        style={{
          border: "1px solid var(--border)",
          backgroundColor: "var(--bg)",
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--accent)" }} />
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center text-[12px]" style={{ color: "var(--fg-muted)" }}>
            No feedback entries found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead
                className="font-mono text-[11px] uppercase tracking-wider"
                style={{
                  backgroundColor: "var(--bg-subtle)",
                  color: "var(--fg-dimmed)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="transition cursor-pointer"
                    onClick={() => {
                      setSelectedItem(item);
                      setActionStatus(item.status);
                      setAdminNotes(item.adminNotes || "");
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--bg-subtle)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold" style={{ color: "var(--fg)" }}>
                          {item.username}
                        </p>
                        <p className="mono text-[10px]" style={{ color: "var(--fg-dimmed)" }}>
                          {item.email}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded text-[11px] font-medium"
                        style={{
                          backgroundColor: "var(--bg-subtle)",
                          color: "var(--fg)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {item.feedbackType}
                      </span>
                    </td>

                    <td className="px-4 py-3 max-w-xs truncate font-medium" style={{ color: "var(--fg)" }}>
                      {item.subject}
                    </td>

                    <td className="px-4 py-3">
                      {getStatusBadge(item.status)}
                    </td>

                    <td className="px-4 py-3 mono text-[11px]" style={{ color: "var(--fg-dimmed)" }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedItem(item);
                          setActionStatus(item.status);
                          setAdminNotes(item.adminNotes || "");
                        }}
                        className="px-2.5 py-1 rounded text-[11px] font-semibold transition"
                        style={{
                          backgroundColor: "var(--bg-subtle)",
                          color: "var(--fg)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Strip */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{
            borderTop: "1px solid var(--border)",
            backgroundColor: "var(--bg-subtle)",
          }}
        >
          <span className="text-[11px]" style={{ color: "var(--fg-muted)" }}>
            Page {page} of {totalPages}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition disabled:opacity-40"
              style={{
                backgroundColor: "var(--bg)",
                color: "var(--fg)",
                border: "1px solid var(--border)",
              }}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition disabled:opacity-40"
              style={{
                backgroundColor: "var(--bg)",
                color: "var(--fg)",
                border: "1px solid var(--border)",
              }}
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Item Inspector Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div
            className="w-full max-w-lg rounded-lg p-6 space-y-4 shadow-2xl"
            style={{
              backgroundColor: "var(--bg)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" style={{ color: "var(--accent)" }} />
                <h3 className="text-sm font-bold" style={{ color: "var(--fg)" }}>
                  Feedback Submission
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                style={{ color: "var(--fg-muted)" }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-[12px]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold" style={{ color: "var(--fg)" }}>{selectedItem.subject}</p>
                  <p className="mono text-[11px]" style={{ color: "var(--fg-dimmed)" }}>
                    from {selectedItem.username} ({selectedItem.email}) &bull; {selectedItem.feedbackType}
                  </p>
                </div>
                {getStatusBadge(selectedItem.status)}
              </div>

              {/* Message content */}
              <div
                className="p-3 rounded leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto"
                style={{
                  backgroundColor: "var(--bg-subtle)",
                  color: "var(--fg)",
                  border: "1px solid var(--border)",
                }}
              >
                {selectedItem.message}
              </div>

              {/* Action Form */}
              <form onSubmit={handleUpdateStatus} className="space-y-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider mono" style={{ color: "var(--fg-muted)" }}>
                    Update Status
                  </label>
                  <select
                    value={actionStatus}
                    onChange={(e) => setActionStatus(e.target.value as "NEW" | "IN_REVIEW" | "RESOLVED")}
                    className="w-full mt-1 rounded p-2 text-[12px] focus:outline-none"
                    style={{
                      backgroundColor: "var(--bg-subtle)",
                      color: "var(--fg)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <option value="NEW">New (Unreviewed)</option>
                    <option value="IN_REVIEW">In Review (Being investigated)</option>
                    <option value="RESOLVED">Resolved (Completed / Closed)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider mono" style={{ color: "var(--fg-muted)" }}>
                    Admin Notes (Internal Ledger)
                  </label>
                  <input
                    type="text"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="e.g. Patch dispatched in v1.4.2..."
                    className="w-full mt-1 rounded p-2 text-[12px] focus:outline-none"
                    style={{
                      backgroundColor: "var(--bg-subtle)",
                      color: "var(--fg)",
                      border: "1px solid var(--border)",
                    }}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="px-3 py-1.5 rounded text-[12px] font-medium"
                    style={{
                      backgroundColor: "var(--bg-subtle)",
                      color: "var(--fg)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-1.5 rounded text-[12px] font-bold transition disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--accent)",
                      color: "var(--accent-fg)",
                    }}
                  >
                    {actionLoading ? "Saving..." : "Save Status"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
