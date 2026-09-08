"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Ban, Zap, Loader2 } from "lucide-react";

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
  solvedCount: number;
  isBanned: boolean;
  banReason?: string;
  leaderboardVisible: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // XP adjustment modal
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [xpChange, setXpChange] = useState<number>(0);
  const [xpReason, setXpReason] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filter !== "all") params.set("filter", filter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, filter]);

  const handleToggleBan = async (user: AdminUserItem) => {
    const isBanning = !user.isBanned;
    const reason = isBanning
      ? prompt("Enter reason for account suspension:") || "Administrative violation"
      : undefined;

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          isBanned: isBanning,
          banReason: reason,
        }),
      });

      if (res.ok) {
        fetchUsers();
      }
    } catch {
      alert("Failed to update user ban status");
    }
  };

  const handleApplyXp = async () => {
    if (!selectedUser || xpChange === 0 || !xpReason.trim()) {
      alert("Please provide a valid XP change amount and reason.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          xpChange,
          xpReason,
        }),
      });

      if (res.ok) {
        setSelectedUser(null);
        setXpChange(0);
        setXpReason("");
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to adjust XP");
      }
    } catch {
      alert("Error adjusting XP");
    } finally {
      setActionLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold tracking-tight text-[#F5F7FA]">User Moderation</h1>
          <p className="text-xs text-[#8B93A7]">
            Inspect user profiles, manage suspensions, and audit or adjust XP balances with reasons.
          </p>
        </div>

        {/* Filter and Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8B93A7]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username or email..."
              className="rounded-lg border border-[#252936] bg-[#11131A] py-1.5 pl-8 pr-3 text-xs text-[#F5F7FA] focus:border-[#00F0FF] focus:outline-none"
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-[#252936] bg-[#11131A] py-1.5 px-3 text-xs text-[#F5F7FA] focus:border-[#00F0FF] focus:outline-none"
          >
            <option value="all">All Users</option>
            <option value="banned">Suspended</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-[#252936] bg-[#11131A] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#00F0FF]" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#8B93A7]">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#252936] bg-[#181B24]/70 font-mono text-[#8B93A7]">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">XP</th>
                  <th className="px-4 py-3">Solved</th>
                  <th className="px-4 py-3">Streak</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252936]/60 text-[#F5F7FA]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#181B24]/40 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#181B24] text-[11px] font-bold text-[#00F0FF]">
                          {u.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-[#F5F7FA]">{u.displayName}</p>
                          <p className="font-mono text-[10px] text-[#8B93A7]">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                          u.role === "admin" ? "bg-[#39FF14]/10 text-[#39FF14]" : "bg-[#181B24] text-[#8B93A7]"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[#00F0FF]">{u.xp} XP</td>
                    <td className="px-4 py-3 font-mono">{u.solvedCount}</td>
                    <td className="px-4 py-3 font-mono text-[#F59E0B]">{u.currentStreak} d</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                          u.isBanned ? "bg-[#FF4D6D]/10 text-[#FF4D6D]" : "bg-[#39FF14]/10 text-[#39FF14]"
                        }`}
                      >
                        {u.isBanned ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setXpChange(0);
                            setXpReason("");
                          }}
                          className="flex items-center gap-1 rounded bg-[#181B24] px-2.5 py-1 text-[11px] text-[#00F0FF] hover:bg-[#252936] transition"
                        >
                          <Zap className="h-3 w-3" /> Adjust XP
                        </button>
                        <button
                          onClick={() => handleToggleBan(u)}
                          className={`rounded p-1 text-xs transition ${
                            u.isBanned
                              ? "text-[#39FF14] hover:bg-[#39FF14]/10"
                              : "text-[#FF4D6D] hover:bg-[#FF4D6D]/10"
                          }`}
                          title={u.isBanned ? "Restore Access" : "Suspend Account"}
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual XP Modification Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-[#252936] bg-[#11131A] p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-[#F5F7FA]">
              Adjust XP for @{selectedUser.username}
            </h3>
            <p className="text-xs text-[#8B93A7]">
              Current XP balance: <strong className="text-[#00F0FF]">{selectedUser.xp} XP</strong>. Specify the delta (e.g. +50 or -50) and a reason.
            </p>

            <div>
              <label className="block mb-1 text-xs text-[#8B93A7]">XP Change Amount</label>
              <input
                type="number"
                value={xpChange}
                onChange={(e) => setXpChange(parseInt(e.target.value, 10) || 0)}
                placeholder="e.g. 50 or -50"
                className="w-full rounded-md border border-[#252936] bg-[#181B24] p-2 text-xs font-mono text-[#F5F7FA] focus:border-[#00F0FF] focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-1 text-xs text-[#8B93A7]">Required Reason for Audit Log</label>
              <input
                type="text"
                value={xpReason}
                onChange={(e) => setXpReason(e.target.value)}
                placeholder="e.g. Compensation for contest server issue"
                className="w-full rounded-md border border-[#252936] bg-[#181B24] p-2 text-xs text-[#F5F7FA] focus:border-[#00F0FF] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedUser(null)}
                className="rounded-lg border border-[#252936] bg-[#181B24] px-3.5 py-1.5 text-xs text-[#8B93A7] hover:text-[#F5F7FA]"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyXp}
                disabled={actionLoading || xpChange === 0 || !xpReason.trim()}
                className="rounded-lg bg-[#00F0FF] px-4 py-1.5 text-xs font-bold text-[#090A0F] hover:bg-[#00F0FF]/90 disabled:opacity-50 transition"
              >
                {actionLoading ? "Applying..." : "Apply XP Change"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
