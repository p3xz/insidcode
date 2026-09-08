"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Code2,
  Send,
  Trophy,
  ShieldAlert,
  Zap,
  Lock,
  Unlock,
  Radio,
  Loader2,
  FileText,
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalProblems: number;
  publishedProblems: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  totalXpAwarded: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLeaderboardFrozen, setIsLeaderboardFrozen] = useState(false);
  const [freezeLoading, setFreezeLoading] = useState(false);

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
      }
    } catch {
      alert("Failed to toggle leaderboard freeze");
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
        <Loader2 className="h-8 w-8 animate-spin text-[#00F0FF]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#252936] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="h-5 w-5 text-[#39FF14]" />
            <h1 className="text-2xl font-bold tracking-tight text-[#F5F7FA]">Admin Console</h1>
          </div>
          <p className="text-xs text-[#8B93A7]">
            Server authoritative control, curriculum management, moderation, and system telemetry.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/problems"
            className="flex items-center gap-1.5 rounded-lg border border-[#252936] bg-[#11131A] px-3 py-1.5 text-xs font-semibold text-[#F5F7FA] hover:border-[#00F0FF] transition"
          >
            <Code2 className="h-3.5 w-3.5 text-[#00F0FF]" />
            Manage Questions
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-1.5 rounded-lg border border-[#252936] bg-[#11131A] px-3 py-1.5 text-xs font-semibold text-[#F5F7FA] hover:border-[#00F0FF] transition"
          >
            <Users className="h-3.5 w-3.5 text-[#F59E0B]" />
            Users & Moderation
          </Link>
          <Link
            href="/admin/audit"
            className="flex items-center gap-1.5 rounded-lg border border-[#252936] bg-[#11131A] px-3 py-1.5 text-xs font-semibold text-[#F5F7FA] hover:border-[#00F0FF] transition"
          >
            <FileText className="h-3.5 w-3.5 text-[#39FF14]" />
            Audit Logs
          </Link>
        </div>
      </div>

      {/* Real Statistics Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#252936] bg-[#11131A] p-4">
          <div className="flex items-center justify-between text-[#8B93A7] mb-2">
            <span className="text-xs font-medium">Total Users</span>
            <Users className="h-4 w-4 text-[#00F0FF]" />
          </div>
          <p className="text-2xl font-bold text-[#F5F7FA] font-mono">{stats?.totalUsers || 0}</p>
          <p className="text-[11px] text-[#5E667B] mt-1">{stats?.bannedUsers || 0} suspended</p>
        </div>

        <div className="rounded-xl border border-[#252936] bg-[#11131A] p-4">
          <div className="flex items-center justify-between text-[#8B93A7] mb-2">
            <span className="text-xs font-medium">Published Problems</span>
            <Code2 className="h-4 w-4 text-[#39FF14]" />
          </div>
          <p className="text-2xl font-bold text-[#F5F7FA] font-mono">{stats?.publishedProblems || 0}</p>
          <p className="text-[11px] text-[#5E667B] mt-1">{stats?.totalProblems || 0} total in DB</p>
        </div>

        <div className="rounded-xl border border-[#252936] bg-[#11131A] p-4">
          <div className="flex items-center justify-between text-[#8B93A7] mb-2">
            <span className="text-xs font-medium">Submissions</span>
            <Send className="h-4 w-4 text-[#F59E0B]" />
          </div>
          <p className="text-2xl font-bold text-[#F5F7FA] font-mono">{stats?.totalSubmissions || 0}</p>
          <p className="text-[11px] text-[#5E667B] mt-1">{stats?.acceptedSubmissions || 0} accepted</p>
        </div>

        <div className="rounded-xl border border-[#252936] bg-[#11131A] p-4">
          <div className="flex items-center justify-between text-[#8B93A7] mb-2">
            <span className="text-xs font-medium">Total XP Awarded</span>
            <Zap className="h-4 w-4 text-[#00F0FF]" />
          </div>
          <p className="text-2xl font-bold text-[#00F0FF] font-mono">{stats?.totalXpAwarded || 0}</p>
          <p className="text-[11px] text-[#5E667B] mt-1">Platform aggregate</p>
        </div>
      </div>

      {/* Control Actions Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Leaderboard Controls */}
        <div className="rounded-xl border border-[#252936] bg-[#11131A] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-[#F59E0B]" />
              <h3 className="text-sm font-bold text-[#F5F7FA]">Leaderboard Controls</h3>
            </div>
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                isLeaderboardFrozen ? "bg-[#FF4D6D]/10 text-[#FF4D6D]" : "bg-[#39FF14]/10 text-[#39FF14]"
              }`}
            >
              {isLeaderboardFrozen ? "Frozen" : "Live"}
            </span>
          </div>

          <p className="text-xs text-[#8B93A7] leading-relaxed">
            Freezing the leaderboard prevents public rank fluctuations during contests or maintenance while user submissions continue executing normally.
          </p>

          <button
            onClick={handleToggleFreeze}
            disabled={freezeLoading}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
              isLeaderboardFrozen
                ? "bg-[#39FF14] text-[#090A0F] hover:bg-[#39FF14]/90"
                : "bg-[#FF4D6D] text-[#F5F7FA] hover:bg-[#FF4D6D]/90"
            }`}
          >
            {isLeaderboardFrozen ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            {freezeLoading ? "Processing..." : isLeaderboardFrozen ? "Unfreeze Leaderboard" : "Freeze Leaderboard"}
          </button>
        </div>

        {/* Global Announcement Broadcaster */}
        <div className="rounded-xl border border-[#252936] bg-[#11131A] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-[#00F0FF]" />
            <h3 className="text-sm font-bold text-[#F5F7FA]">Broadcast Announcement</h3>
          </div>

          <form onSubmit={handleSendAnnouncement} className="space-y-3">
            <div>
              <input
                type="text"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="Announcement Title (e.g. Weekend Logic Challenge)"
                className="w-full rounded-md border border-[#252936] bg-[#181B24] p-2 text-xs text-[#F5F7FA] placeholder-[#5E667B] focus:border-[#00F0FF] focus:outline-none"
              />
            </div>
            <div>
              <textarea
                rows={3}
                value={announcementMessage}
                onChange={(e) => setAnnouncementMessage(e.target.value)}
                placeholder="Broadcast message to all developers..."
                className="w-full rounded-md border border-[#252936] bg-[#181B24] p-2 text-xs text-[#F5F7FA] placeholder-[#5E667B] focus:border-[#00F0FF] focus:outline-none resize-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-[#8B93A7] cursor-pointer">
                <input
                  type="checkbox"
                  checked={broadcastInApp}
                  onChange={(e) => setBroadcastInApp(e.target.checked)}
                  className="rounded border-[#252936] bg-[#181B24] text-[#00F0FF] focus:ring-0"
                />
                Send in-app notification to all users
              </label>

              <button
                type="submit"
                className="rounded-lg bg-[#00F0FF] px-4 py-1.5 text-xs font-bold text-[#090A0F] hover:bg-[#00F0FF]/90 transition"
              >
                Send Broadcast
              </button>
            </div>
            {announcementStatus && (
              <p className="text-[11px] text-[#39FF14] font-mono">{announcementStatus}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
