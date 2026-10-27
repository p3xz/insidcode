"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Send,
  Trophy,
  Zap,
  Lock,
  Unlock,
  Radio,
  Loader2,
  Swords,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import InlineNotice from "@/components/ui/InlineNotice";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  activeLast7Days: number;
  totalProblems: number;
  publishedProblems: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  submissionsToday: number;
  acceptedToday: number;
  acceptanceRateToday: number;
  overallAcceptanceRate: number;
  openAppeals: number;
  unreadFeedback: number;
  duelsToday: number;
  totalXpAwarded: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLeaderboardFrozen, setIsLeaderboardFrozen] = useState(false);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [freezeError, setFreezeError] = useState<string | null>(null);

  // Announcement state
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const announcementActive = true;
  const [broadcastInApp, setBroadcastInApp] = useState(true);
  const [announcementStatus, setAnnouncementStatus] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, lbRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/leaderboard"),
        ]);

        if (statsRes.ok) {
          const sData = await statsRes.json();
          setStats(sData.stats);
        }

        if (lbRes.ok) {
          const lbData = await lbRes.json();
          setIsLeaderboardFrozen(lbData.isFrozen || false);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleToggleFreeze = async () => {
    setFreezeLoading(true);
    try {
      const res = await fetch("/api/admin/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freeze: !isLeaderboardFrozen }),
      });
      if (res.ok) {
        setIsLeaderboardFrozen(!isLeaderboardFrozen);
        setFreezeError(null);
      }
    } catch {
      setFreezeError("Failed to toggle leaderboard freeze");
    } finally {
      setFreezeLoading(false);
    }
  };

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementMessage.trim()) return;

    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          active: announcementActive,
          title: announcementTitle,
          message: announcementMessage,
          broadcastInApp,
        }),
      });

      if (res.ok) {
        setAnnouncementStatus("Announcement successfully broadcasted.");
        setAnnouncementTitle("");
        setAnnouncementMessage("");
        setTimeout(() => setAnnouncementStatus(""), 4000);
      }
    } catch {
      setAnnouncementStatus("Failed to broadcast announcement.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {freezeError && (
        <InlineNotice message={freezeError} onDismiss={() => setFreezeError(null)} />
      )}

      {/* Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6" style={{ borderBottom: "1px solid var(--border)" }}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>
            Platform Overview
          </h1>
          <p className="text-[12px] mt-1" style={{ color: "var(--fg-muted)" }}>
            Real-time server telemetry, live operational counts, and platform control toggles.
          </p>
        </div>

        {/* Quick action shortcuts */}
        <div className="flex items-center gap-2">
          {stats?.openAppeals ? (
            <Link
              href="/admin/appeals"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold transition"
              style={{
                backgroundColor: "color-mix(in srgb, var(--danger) 15%, transparent)",
                color: "var(--danger)",
                border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)",
              }}
            >
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{stats.openAppeals} Open {stats.openAppeals === 1 ? "Appeal" : "Appeals"}</span>
            </Link>
          ) : null}

          {stats?.unreadFeedback ? (
            <Link
              href="/admin/feedback"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold transition"
              style={{
                backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
                color: "var(--accent)",
                border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
              }}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{stats.unreadFeedback} New Feedback</span>
            </Link>
          ) : null}
        </div>
      </div>

      {/* Primary Telemetry Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div
          className="p-5 rounded-lg space-y-2 transition"
          style={{
            backgroundColor: "var(--bg-subtle)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center justify-between" style={{ color: "var(--fg-muted)" }}>
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Users</span>
            <Users className="h-4 w-4" style={{ color: "var(--accent)" }} />
          </div>
          <p className="text-2xl font-bold mono" style={{ color: "var(--fg)" }}>
            {stats?.totalUsers?.toLocaleString() || 0}
          </p>
          <div className="flex items-center justify-between text-[11px]" style={{ color: "var(--fg-dimmed)" }}>
            <span>{stats?.activeLast7Days || 0} active in 7d</span>
            <span>{stats?.bannedUsers || 0} suspended</span>
          </div>
        </div>

        {/* Submissions Today */}
        <div
          className="p-5 rounded-lg space-y-2 transition"
          style={{
            backgroundColor: "var(--bg-subtle)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center justify-between" style={{ color: "var(--fg-muted)" }}>
            <span className="text-[11px] font-medium uppercase tracking-wider">Submissions Today</span>
            <Send className="h-4 w-4" style={{ color: "var(--warning)" }} />
          </div>
          <p className="text-2xl font-bold mono" style={{ color: "var(--fg)" }}>
            {stats?.submissionsToday?.toLocaleString() || 0}
          </p>
          <div className="flex items-center justify-between text-[11px]" style={{ color: "var(--fg-dimmed)" }}>
            <span>{stats?.acceptedToday || 0} accepted</span>
            <span>{stats?.acceptanceRateToday || 0}% pass rate</span>
          </div>
        </div>

        {/* Duels Today */}
        <div
          className="p-5 rounded-lg space-y-2 transition"
          style={{
            backgroundColor: "var(--bg-subtle)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center justify-between" style={{ color: "var(--fg-muted)" }}>
            <span className="text-[11px] font-medium uppercase tracking-wider">Duels Today</span>
            <Swords className="h-4 w-4" style={{ color: "var(--accent)" }} />
          </div>
          <p className="text-2xl font-bold mono" style={{ color: "var(--fg)" }}>
            {stats?.duelsToday?.toLocaleString() || 0}
          </p>
          <div className="text-[11px]" style={{ color: "var(--fg-dimmed)" }}>
            <span>1v1 arena matches created</span>
          </div>
        </div>

        {/* Total XP Awarded */}
        <div
          className="p-5 rounded-lg space-y-2 transition"
          style={{
            backgroundColor: "var(--bg-subtle)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center justify-between" style={{ color: "var(--fg-muted)" }}>
            <span className="text-[11px] font-medium uppercase tracking-wider">Total XP Distributed</span>
            <Zap className="h-4 w-4" style={{ color: "var(--accent)" }} />
          </div>
          <p className="text-2xl font-bold mono" style={{ color: "var(--accent)" }}>
            {stats?.totalXpAwarded?.toLocaleString() || 0}
          </p>
          <div className="text-[11px]" style={{ color: "var(--fg-dimmed)" }}>
            <span>{stats?.publishedProblems || 0} live problems ({stats?.totalProblems || 0} total)</span>
          </div>
        </div>
      </div>

      {/* Control Actions Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Leaderboard Controls */}
        <div
          className="p-6 rounded-lg space-y-4"
          style={{
            backgroundColor: "var(--bg-subtle)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4" style={{ color: "var(--warning)" }} />
              <h3 className="text-sm font-bold" style={{ color: "var(--fg)" }}>Leaderboard Controls</h3>
            </div>
            <span
              className="rounded px-2 py-0.5 text-[10px] font-semibold mono"
              style={{
                backgroundColor: isLeaderboardFrozen
                  ? "color-mix(in srgb, var(--danger) 15%, transparent)"
                  : "color-mix(in srgb, var(--success) 15%, transparent)",
                color: isLeaderboardFrozen ? "var(--danger)" : "var(--success)",
                border: isLeaderboardFrozen
                  ? "1px solid color-mix(in srgb, var(--danger) 30%, transparent)"
                  : "1px solid color-mix(in srgb, var(--success) 30%, transparent)",
              }}
            >
              {isLeaderboardFrozen ? "Frozen" : "Live"}
            </span>
          </div>

          <p className="text-[12px] leading-relaxed" style={{ color: "var(--fg-muted)" }}>
            Freezing the leaderboard prevents public rank updates during contests or database maintenance while user code submissions continue executing normally.
          </p>

          <button
            type="button"
            onClick={handleToggleFreeze}
            disabled={freezeLoading}
            className="flex items-center gap-2 rounded px-4 py-2 text-[12px] font-bold transition cursor-pointer"
            style={{
              backgroundColor: isLeaderboardFrozen ? "var(--success)" : "var(--danger)",
              color: "#000",
            }}
          >
            {isLeaderboardFrozen ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            <span>
              {freezeLoading
                ? "Processing..."
                : isLeaderboardFrozen
                ? "Unfreeze Leaderboard"
                : "Freeze Leaderboard"}
            </span>
          </button>
        </div>

        {/* Global Announcement Broadcaster */}
        <div
          className="p-6 rounded-lg space-y-4"
          style={{
            backgroundColor: "var(--bg-subtle)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4" style={{ color: "var(--accent)" }} />
            <h3 className="text-sm font-bold" style={{ color: "var(--fg)" }}>Broadcast Announcement</h3>
          </div>

          <form onSubmit={handleSendAnnouncement} className="space-y-3">
            <div>
              <input
                type="text"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="Announcement Title (e.g. Weekend Duel Match)"
                className="w-full rounded px-3 py-2 text-[12px] focus:outline-none"
                style={{
                  backgroundColor: "var(--bg)",
                  color: "var(--fg)",
                  border: "1px solid var(--border)",
                }}
              />
            </div>
            <div>
              <textarea
                rows={3}
                value={announcementMessage}
                onChange={(e) => setAnnouncementMessage(e.target.value)}
                placeholder="Broadcast message to all developers..."
                className="w-full rounded px-3 py-2 text-[12px] focus:outline-none resize-none"
                style={{
                  backgroundColor: "var(--bg)",
                  color: "var(--fg)",
                  border: "1px solid var(--border)",
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-[12px] cursor-pointer" style={{ color: "var(--fg-muted)" }}>
                <input
                  type="checkbox"
                  checked={broadcastInApp}
                  onChange={(e) => setBroadcastInApp(e.target.checked)}
                  className="rounded"
                />
                Send in-app notification to all users
              </label>

              <button
                type="submit"
                className="rounded px-4 py-1.5 text-[12px] font-bold transition cursor-pointer"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "var(--accent-fg)",
                }}
              >
                Send Broadcast
              </button>
            </div>
            {announcementStatus && (
              <p className="text-[11px] font-mono" style={{ color: "var(--success)" }}>
                {announcementStatus}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
