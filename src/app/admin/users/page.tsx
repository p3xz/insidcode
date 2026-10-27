"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Ban,
  Zap,
  Loader2,
  UserCheck,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
  Shield,
  AlertTriangle,
} from "lucide-react";
import InlineNotice from "@/components/ui/InlineNotice";

interface AdminUserItem {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  image?: string;
  provider: string;
  role: "user" | "admin";
  xp: number;
  currentStreak: number;
  longestStreak: number;
  solvedCount: number;
  isBanned: boolean;
  banReason?: string;
  bannedAt?: string;
  bannedUntil?: string;
  leaderboardVisible: boolean;
  lastActiveDate?: string;
  createdAt: string;
}

interface UserDetailData {
  user: AdminUserItem & {
    duelRating: number;
    duelPoints: number;
    duelsPlayed: number;
    duelsWon: number;
    duelsLost: number;
    winRate: number;
    selectedTitle?: string | null;
  };
  recentSubmissions: Array<{
    id: string;
    problemId: string;
    status: string;
    language: string;
    runtime?: string;
    memory?: string;
    createdAt: string;
  }>;
  appeals: Array<{
    id: string;
    status: string;
    reason: string;
    statement: string;
    reviewedBy?: string;
    decision?: string;
    createdAt: string;
  }>;
  auditActions: Array<{
    id: string;
    adminUsername: string;
    action: string;
    newValue?: string;
    reason?: string;
    createdAt: string;
  }>;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // User Detail Drawer
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<UserDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Modals state
  const [suspendModalUser, setSuspendModalUser] = useState<AdminUserItem | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendDuration, setSuspendDuration] = useState("permanent");
  const [confirmUsername, setConfirmUsername] = useState("");

  const [unsuspendModalUser, setUnsuspendModalUser] = useState<AdminUserItem | null>(null);
  const [unsuspendReason, setUnsuspendReason] = useState("");

  const [xpModalUser, setXpModalUser] = useState<AdminUserItem | null>(null);
  const [xpDelta, setXpDelta] = useState(0);
  const [xpReason, setXpReason] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (filter !== "all") params.set("filter", filter);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      params.set("page", page.toString());
      params.set("limit", limit.toString());

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalCount(data.pagination.totalCount || 0);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [search, filter, sortBy, sortOrder, page, limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Load User Detail when a user is selected
  useEffect(() => {
    if (!selectedUserId) {
      setDetailData(null);
      return;
    }
    const loadDetail = async () => {
      setDetailLoading(true);
      try {
        const res = await fetch(`/api/admin/users/${selectedUserId}`);
        if (res.ok) {
          const data = await res.json();
          setDetailData(data);
        }
      } catch {
        // silent
      } finally {
        setDetailLoading(false);
      }
    };
    loadDetail();
  }, [selectedUserId]);

  const handleOpenSuspend = (u: AdminUserItem) => {
    setSuspendModalUser(u);
    setSuspendReason("");
    setSuspendDuration("permanent");
    setConfirmUsername("");
  };

  const handleExecuteSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendModalUser) return;

    if (!suspendReason.trim()) {
      setActionNotice({ type: "error", message: "A specific suspension reason is required." });
      return;
    }

    if (confirmUsername.trim() !== suspendModalUser.username) {
      setActionNotice({
        type: "error",
        message: `Please type "${suspendModalUser.username}" to confirm suspension.`,
      });
      return;
    }

    let bannedUntil: string | null = null;
    if (suspendDuration === "24h") {
      bannedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    } else if (suspendDuration === "7d") {
      bannedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (suspendDuration === "30d") {
      bannedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: suspendModalUser.id,
          isBanned: true,
          banReason: suspendReason.trim(),
          bannedUntil,
        }),
      });

      if (res.ok) {
        setActionNotice({
          type: "success",
          message: `User @${suspendModalUser.username} has been suspended.`,
        });
        setSuspendModalUser(null);
        fetchUsers();
        if (selectedUserId === suspendModalUser.id) {
          setSelectedUserId(null);
        }
      } else {
        const data = await res.json();
        setActionNotice({ type: "error", message: data.error || "Failed to suspend user." });
      }
    } catch {
      setActionNotice({ type: "error", message: "Network error suspending user." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteUnsuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unsuspendModalUser) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: unsuspendModalUser.id,
          isBanned: false,
          banReason: unsuspendReason.trim() || "Administrative suspension lifted.",
        }),
      });

      if (res.ok) {
        setActionNotice({
          type: "success",
          message: `User @${unsuspendModalUser.username} has been restored.`,
        });
        setUnsuspendModalUser(null);
        fetchUsers();
        if (selectedUserId === unsuspendModalUser.id) {
          setSelectedUserId(null);
        }
      } else {
        const data = await res.json();
        setActionNotice({ type: "error", message: data.error || "Failed to unsuspend user." });
      }
    } catch {
      setActionNotice({ type: "error", message: "Network error lifting suspension." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteXpAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!xpModalUser || xpDelta === 0) return;

    if (!xpReason.trim()) {
      setActionNotice({ type: "error", message: "A clear reason is required for manual XP adjustment." });
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: xpModalUser.id,
          xpChange: xpDelta,
          xpReason: xpReason.trim(),
        }),
      });

      if (res.ok) {
        setActionNotice({
          type: "success",
          message: `XP updated by ${xpDelta > 0 ? `+${xpDelta}` : xpDelta} for @${xpModalUser.username}.`,
        });
        setXpModalUser(null);
        fetchUsers();
        if (selectedUserId === xpModalUser.id) {
          setSelectedUserId(null);
        }
      } else {
        const data = await res.json();
        setActionNotice({ type: "error", message: data.error || "Failed to adjust XP." });
      }
    } catch {
      setActionNotice({ type: "error", message: "Network error adjusting XP." });
    } finally {
      setActionLoading(false);
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
            User Moderation
          </h1>
          <p className="text-[12px] mt-1" style={{ color: "var(--fg-muted)" }}>
            Search user profiles, manage suspensions with duration, audit XP, and inspect telemetry history.
          </p>
        </div>

        <div className="flex items-center gap-2 mono text-[12px]" style={{ color: "var(--fg-dimmed)" }}>
          <span>{totalCount.toLocaleString()} total users</span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5" style={{ color: "var(--fg-dimmed)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search username, name, email..."
              className="w-full rounded py-1.5 pl-8 pr-3 text-[12px] focus:outline-none"
              style={{
                backgroundColor: "var(--bg-subtle)",
                color: "var(--fg)",
                border: "1px solid var(--border)",
              }}
            />
          </div>

          {/* Status filter */}
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            className="rounded py-1.5 px-3 text-[12px] focus:outline-none"
            style={{
              backgroundColor: "var(--bg-subtle)",
              color: "var(--fg)",
              border: "1px solid var(--border)",
            }}
          >
            <option value="all">All Users</option>
            <option value="active">Active Only</option>
            <option value="banned">Suspended Only</option>
            <option value="admin">Administrators Only</option>
          </select>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-[11px]" style={{ color: "var(--fg-muted)" }}>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="rounded py-1 px-2.5 text-[12px] focus:outline-none"
            style={{
              backgroundColor: "var(--bg-subtle)",
              color: "var(--fg)",
              border: "1px solid var(--border)",
            }}
          >
            <option value="createdAt">Join Date</option>
            <option value="xp">Total XP</option>
            <option value="currentStreak">Streak</option>
            <option value="lastActiveDate">Last Active</option>
          </select>

          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="flex items-center gap-1 rounded py-1 px-2 text-[12px] font-mono transition"
            style={{
              backgroundColor: "var(--bg-subtle)",
              color: "var(--fg-muted)",
              border: "1px solid var(--border)",
            }}
            title="Toggle sort direction"
          >
            <ArrowUpDown className="h-3 w-3" />
            <span>{sortOrder.toUpperCase()}</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
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
        ) : users.length === 0 ? (
          <div className="py-20 text-center text-[12px]" style={{ color: "var(--fg-muted)" }}>
            No accounts found matching the query.
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
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 text-right">XP</th>
                  <th className="px-4 py-3 text-center">Solved</th>
                  <th className="px-4 py-3 text-center">Streak</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {users.map((u) => {
                  return (
                    <tr
                      key={u.id}
                      className="transition cursor-pointer"
                      onClick={() => setSelectedUserId(u.id)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--bg-subtle)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {/* User Column */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="h-7 w-7 rounded flex items-center justify-center font-bold text-[11px] shrink-0"
                            style={{
                              backgroundColor: "var(--bg-elevated)",
                              color: "var(--fg-muted)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            {u.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate" style={{ color: "var(--fg)" }}>
                              {u.displayName}
                            </p>
                            <p className="mono text-[10px]" style={{ color: "var(--fg-dimmed)" }}>
                              @{u.username}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <span
                          className="mono text-[10px] font-semibold px-2 py-0.5 rounded uppercase"
                          style={{
                            backgroundColor: u.role === "admin"
                              ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                              : "var(--bg-subtle)",
                            color: u.role === "admin" ? "var(--accent)" : "var(--fg-muted)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {u.role}
                        </span>
                      </td>

                      {/* XP */}
                      <td className="px-4 py-3 text-right mono font-semibold" style={{ color: "var(--fg)" }}>
                        {u.xp?.toLocaleString()}
                      </td>

                      {/* Solved Count */}
                      <td className="px-4 py-3 text-center mono" style={{ color: "var(--fg-muted)" }}>
                        {u.solvedCount}
                      </td>

                      {/* Streak */}
                      <td className="px-4 py-3 text-center mono" style={{ color: "var(--warning)" }}>
                        {u.currentStreak > 0 ? u.currentStreak : "–"}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {u.isBanned ? (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: "color-mix(in srgb, var(--danger) 15%, transparent)",
                              color: "var(--danger)",
                              border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)",
                            }}
                          >
                            <Ban className="h-3 w-3" />
                            <span>Suspended</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: "color-mix(in srgb, var(--success) 15%, transparent)",
                              color: "var(--success)",
                              border: "1px solid color-mix(in srgb, var(--success) 30%, transparent)",
                            }}
                          >
                            <UserCheck className="h-3 w-3" />
                            <span>Active</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setXpModalUser(u);
                              setXpDelta(0);
                              setXpReason("");
                            }}
                            className="p-1.5 rounded transition"
                            style={{
                              backgroundColor: "var(--bg-subtle)",
                              color: "var(--fg-muted)",
                              border: "1px solid var(--border)",
                            }}
                            title="Adjust XP"
                          >
                            <Zap className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
                          </button>

                          {u.isBanned ? (
                            <button
                              type="button"
                              onClick={() => {
                                setUnsuspendModalUser(u);
                                setUnsuspendReason("");
                              }}
                              className="px-2.5 py-1 rounded text-[11px] font-semibold transition"
                              style={{
                                backgroundColor: "color-mix(in srgb, var(--success) 15%, transparent)",
                                color: "var(--success)",
                                border: "1px solid color-mix(in srgb, var(--success) 30%, transparent)",
                              }}
                            >
                              Restore
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenSuspend(u)}
                              className="px-2.5 py-1 rounded text-[11px] font-semibold transition"
                              style={{
                                backgroundColor: "color-mix(in srgb, var(--danger) 12%, transparent)",
                                color: "var(--danger)",
                                border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)",
                              }}
                            >
                              Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-side Pagination Strip */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-3"
          style={{
            borderTop: "1px solid var(--border)",
            backgroundColor: "var(--bg-subtle)",
          }}
        >
          <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--fg-muted)" }}>
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value, 10));
                setPage(1);
              }}
              className="rounded py-0.5 px-2 text-[11px] focus:outline-none"
              style={{
                backgroundColor: "var(--bg)",
                color: "var(--fg)",
                border: "1px solid var(--border)",
              }}
            >
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
            <span>
              Page {page} of {totalPages}
            </span>
          </div>

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

      {/* User Detail Slide-Over Drawer */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-xl h-full overflow-y-auto p-6 space-y-6 shadow-2xl transition"
            style={{
              backgroundColor: "var(--bg)",
              borderLeft: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" style={{ color: "var(--accent)" }} />
                <h2 className="text-sm font-bold tracking-tight" style={{ color: "var(--fg)" }}>
                  User Account Inspector
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className="p-1 rounded text-[12px] hover:opacity-80 transition"
                style={{ color: "var(--fg-muted)" }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--accent)" }} />
              </div>
            ) : detailData ? (
              <div className="space-y-6">
                {/* User Header Profile */}
                <div
                  className="p-4 rounded-lg flex items-center justify-between gap-4"
                  style={{
                    backgroundColor: "var(--bg-subtle)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded flex items-center justify-center font-bold text-sm shrink-0"
                      style={{
                        backgroundColor: "var(--bg-elevated)",
                        color: "var(--fg)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {detailData.user.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: "var(--fg)" }}>
                        {detailData.user.displayName}
                      </p>
                      <p className="mono text-[11px]" style={{ color: "var(--fg-dimmed)" }}>
                        @{detailData.user.username} &bull; {detailData.user.email || "No email on record"}
                      </p>
                    </div>
                  </div>

                  <span
                    className="mono text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                    style={{
                      backgroundColor: detailData.user.isBanned
                        ? "color-mix(in srgb, var(--danger) 15%, transparent)"
                        : "color-mix(in srgb, var(--success) 15%, transparent)",
                      color: detailData.user.isBanned ? "var(--danger)" : "var(--success)",
                      border: detailData.user.isBanned
                        ? "1px solid color-mix(in srgb, var(--danger) 30%, transparent)"
                        : "1px solid color-mix(in srgb, var(--success) 30%, transparent)",
                    }}
                  >
                    {detailData.user.isBanned ? "Suspended" : "Active"}
                  </span>
                </div>

                {/* Suspension metadata if banned */}
                {detailData.user.isBanned && (
                  <div
                    className="p-4 rounded-lg space-y-1.5 text-[12px]"
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--danger) 8%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)",
                      color: "var(--danger)",
                    }}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>Account Suspension Notice</span>
                    </div>
                    <p style={{ color: "var(--fg)" }}>
                      <strong>Reason:</strong> {detailData.user.banReason || "Administrative violation"}
                    </p>
                    {detailData.user.bannedUntil && (
                      <p className="mono text-[11px]" style={{ color: "var(--fg-muted)" }}>
                        Suspended until: {new Date(detailData.user.bannedUntil).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Practice & Duel Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded border text-center" style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border)" }}>
                    <span className="text-[10px] font-medium" style={{ color: "var(--fg-dimmed)" }}>TOTAL XP</span>
                    <p className="text-lg font-bold mono" style={{ color: "var(--accent)" }}>{detailData.user.xp}</p>
                  </div>
                  <div className="p-3 rounded border text-center" style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border)" }}>
                    <span className="text-[10px] font-medium" style={{ color: "var(--fg-dimmed)" }}>STREAK</span>
                    <p className="text-lg font-bold mono" style={{ color: "var(--warning)" }}>{detailData.user.currentStreak}d</p>
                  </div>
                  <div className="p-3 rounded border text-center" style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border)" }}>
                    <span className="text-[10px] font-medium" style={{ color: "var(--fg-dimmed)" }}>DUEL RATING</span>
                    <p className="text-lg font-bold mono" style={{ color: "var(--fg)" }}>{detailData.user.duelRating}</p>
                  </div>
                </div>

                {/* Recent Submissions */}
                <div className="space-y-2">
                  <h3 className="text-[12px] font-bold uppercase tracking-wider mono" style={{ color: "var(--fg-muted)" }}>
                    Recent Submissions
                  </h3>
                  {detailData.recentSubmissions.length === 0 ? (
                    <p className="text-[11px]" style={{ color: "var(--fg-dimmed)" }}>No recent submissions recorded.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {detailData.recentSubmissions.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-2 rounded text-[11px] mono border"
                          style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border)" }}
                        >
                          <span style={{ color: "var(--fg)" }}>Problem #{s.problemId}</span>
                          <span
                            className="font-bold px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: s.status === "Accepted"
                                ? "color-mix(in srgb, var(--success) 15%, transparent)"
                                : "color-mix(in srgb, var(--danger) 15%, transparent)",
                              color: s.status === "Accepted" ? "var(--success)" : "var(--danger)",
                            }}
                          >
                            {s.status}
                          </span>
                          <span style={{ color: "var(--fg-dimmed)" }}>{s.language}</span>
                          <span style={{ color: "var(--fg-dimmed)" }}>{new Date(s.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Audit History */}
                <div className="space-y-2">
                  <h3 className="text-[12px] font-bold uppercase tracking-wider mono" style={{ color: "var(--fg-muted)" }}>
                    Audit Ledger Records
                  </h3>
                  {detailData.auditActions.length === 0 ? (
                    <p className="text-[11px]" style={{ color: "var(--fg-dimmed)" }}>No admin actions recorded for this account.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {detailData.auditActions.map((act) => (
                        <div
                          key={act.id}
                          className="p-2 rounded text-[11px] border space-y-1"
                          style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border)" }}
                        >
                          <div className="flex items-center justify-between font-mono">
                            <span className="font-bold" style={{ color: "var(--accent)" }}>{act.action}</span>
                            <span style={{ color: "var(--fg-dimmed)" }}>by @{act.adminUsername}</span>
                          </div>
                          {act.reason && <p style={{ color: "var(--fg-muted)" }}>{act.reason}</p>}
                          <p className="mono text-[10px]" style={{ color: "var(--fg-dimmed)" }}>
                            {new Date(act.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Suspend Modal Dialog */}
      {suspendModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div
            className="w-full max-w-md rounded-lg p-6 space-y-4 shadow-2xl"
            style={{
              backgroundColor: "var(--bg)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ban className="h-5 w-5" style={{ color: "var(--danger)" }} />
                <h3 className="text-sm font-bold" style={{ color: "var(--fg)" }}>
                  Suspend User Account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSuspendModalUser(null)}
                style={{ color: "var(--fg-muted)" }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-[12px] leading-relaxed" style={{ color: "var(--fg-muted)" }}>
              Suspending <strong>@{suspendModalUser.username}</strong> immediately blocks site access and redirects all subsequent requests to the suspension appeals notice.
            </p>

            <form onSubmit={handleExecuteSuspend} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mono" style={{ color: "var(--fg-muted)" }}>
                  Suspension Reason (Required)
                </label>
                <textarea
                  rows={2}
                  required
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="e.g. Terms violation, abusive behavior, cheating..."
                  className="w-full mt-1 rounded p-2 text-[12px] focus:outline-none resize-none"
                  style={{
                    backgroundColor: "var(--bg-subtle)",
                    color: "var(--fg)",
                    border: "1px solid var(--border)",
                  }}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mono" style={{ color: "var(--fg-muted)" }}>
                  Duration
                </label>
                <select
                  value={suspendDuration}
                  onChange={(e) => setSuspendDuration(e.target.value)}
                  className="w-full mt-1 rounded p-2 text-[12px] focus:outline-none"
                  style={{
                    backgroundColor: "var(--bg-subtle)",
                    color: "var(--fg)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <option value="24h">24 Hours (Temporary cooldown)</option>
                  <option value="7d">7 Days (1 Week)</option>
                  <option value="30d">30 Days (1 Month)</option>
                  <option value="permanent">Indefinite / Permanent</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mono" style={{ color: "var(--fg-muted)" }}>
                  Type <span className="font-bold" style={{ color: "var(--fg)" }}>{suspendModalUser.username}</span> to confirm
                </label>
                <input
                  type="text"
                  required
                  value={confirmUsername}
                  onChange={(e) => setConfirmUsername(e.target.value)}
                  placeholder={suspendModalUser.username}
                  className="w-full mt-1 rounded p-2 text-[12px] font-mono focus:outline-none"
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
                  onClick={() => setSuspendModalUser(null)}
                  className="px-3 py-1.5 rounded text-[12px] font-medium"
                  style={{
                    backgroundColor: "var(--bg-subtle)",
                    color: "var(--fg)",
                    border: "1px solid var(--border)",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded text-[12px] font-bold transition disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--danger)",
                    color: "#000",
                  }}
                >
                  {actionLoading ? "Suspending..." : "Confirm Suspension"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unsuspend Modal Dialog */}
      {unsuspendModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div
            className="w-full max-w-md rounded-lg p-6 space-y-4 shadow-2xl"
            style={{
              backgroundColor: "var(--bg)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" style={{ color: "var(--success)" }} />
                <h3 className="text-sm font-bold" style={{ color: "var(--fg)" }}>
                  Restore User Account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setUnsuspendModalUser(null)}
                style={{ color: "var(--fg-muted)" }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-[12px] leading-relaxed" style={{ color: "var(--fg-muted)" }}>
              Restoring <strong>@{unsuspendModalUser.username}</strong> will remove the active suspension and require the user to re-accept platform Terms upon next visit.
            </p>

            <form onSubmit={handleExecuteUnsuspend} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mono" style={{ color: "var(--fg-muted)" }}>
                  Restoration Reason / Internal Note
                </label>
                <input
                  type="text"
                  value={unsuspendReason}
                  onChange={(e) => setUnsuspendReason(e.target.value)}
                  placeholder="e.g. Suspension duration expired, appeal review..."
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
                  onClick={() => setUnsuspendModalUser(null)}
                  className="px-3 py-1.5 rounded text-[12px] font-medium"
                  style={{
                    backgroundColor: "var(--bg-subtle)",
                    color: "var(--fg)",
                    border: "1px solid var(--border)",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded text-[12px] font-bold transition disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--success)",
                    color: "#000",
                  }}
                >
                  {actionLoading ? "Restoring..." : "Restore Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* XP Adjustment Modal */}
      {xpModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div
            className="w-full max-w-md rounded-lg p-6 space-y-4 shadow-2xl"
            style={{
              backgroundColor: "var(--bg)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5" style={{ color: "var(--accent)" }} />
                <h3 className="text-sm font-bold" style={{ color: "var(--fg)" }}>
                  Adjust User XP
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setXpModalUser(null)}
                style={{ color: "var(--fg-muted)" }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-[12px]" style={{ color: "var(--fg-muted)" }}>
              Modifying XP for <strong>@{xpModalUser.username}</strong> (Current balance: {xpModalUser.xp} XP).
            </p>

            <form onSubmit={handleExecuteXpAdjustment} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mono" style={{ color: "var(--fg-muted)" }}>
                  XP Delta (Positive to add, Negative to deduct)
                </label>
                <input
                  type="number"
                  required
                  value={xpDelta}
                  onChange={(e) => setXpDelta(parseInt(e.target.value, 10) || 0)}
                  placeholder="e.g. 50 or -20"
                  className="w-full mt-1 rounded p-2 text-[12px] mono focus:outline-none"
                  style={{
                    backgroundColor: "var(--bg-subtle)",
                    color: "var(--fg)",
                    border: "1px solid var(--border)",
                  }}
                />
                <p className="text-[10px] mono mt-1" style={{ color: "var(--fg-dimmed)" }}>
                  Projected balance: {Math.max(0, xpModalUser.xp + xpDelta)} XP
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mono" style={{ color: "var(--fg-muted)" }}>
                  Mandatory Reason
                </label>
                <input
                  type="text"
                  required
                  value={xpReason}
                  onChange={(e) => setXpReason(e.target.value)}
                  placeholder="e.g. Bug bounty reward, contested duel correction..."
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
                  onClick={() => setXpModalUser(null)}
                  className="px-3 py-1.5 rounded text-[12px] font-medium"
                  style={{
                    backgroundColor: "var(--bg-subtle)",
                    color: "var(--fg)",
                    border: "1px solid var(--border)",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || xpDelta === 0}
                  className="px-4 py-1.5 rounded text-[12px] font-bold transition disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--accent)",
                    color: "var(--accent-fg)",
                  }}
                >
                  {actionLoading ? "Applying..." : "Apply XP Change"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
