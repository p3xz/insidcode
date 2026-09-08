"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  CheckCircle2,
  Flame,
  Zap,
  Send,
  Loader2,
  Calendar,
  Layers,
} from "lucide-react";

interface UserStatsData {
  totalSolved: number;
  totalQuestions: number;
  easySolved: number;
  totalEasy: number;
  mediumSolved: number;
  totalMedium: number;
  hardSolved: number;
  totalHard: number;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  acceptanceRate: number;
  phaseBreakdown: Array<{
    phaseId: number;
    title: string;
    solved: number;
    total: number;
    percentage: number;
  }>;
  heatmap: Record<string, number>;
  recentSubmissions: Array<{
    problemId: string;
    problemTitle: string;
    language: string;
    status: string;
    runtime: number;
    awardedXp: number;
    createdAt: string;
  }>;
}

export default function UserStatsPage() {
  const [stats, setStats] = useState<UserStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#00F0FF]" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="mx-auto max-w-4xl py-20 text-center text-xs text-[#8B93A7]">
        Please sign in to inspect your personal practice statistics and heatmap.
      </div>
    );
  }

  // Generate 52-week activity grid
  const days: { dateStr: string; count: number }[] = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    days.push({ dateStr, count: stats.heatmap[dateStr] || 0 });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#252936] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-5 w-5 text-[#00F0FF]" />
            <h1 className="text-2xl font-bold tracking-tight text-[#F5F7FA]">Performance Statistics</h1>
          </div>
          <p className="text-xs text-[#8B93A7]">
            Real-time telemetry tracking problem resolution, accuracy, and practice momentum.
          </p>
        </div>
      </div>

      {/* Primary Metrics 4-Card Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#252936] bg-[#11131A] p-4">
          <div className="flex items-center justify-between text-[#8B93A7] mb-2">
            <span className="text-xs font-medium">Problems Solved</span>
            <CheckCircle2 className="h-4 w-4 text-[#39FF14]" />
          </div>
          <p className="text-2xl font-bold text-[#F5F7FA] font-mono">
            {stats.totalSolved}{" "}
            <span className="text-xs font-normal text-[#5E667B]">/ {stats.totalQuestions}</span>
          </p>
          <div className="mt-2 text-[11px] text-[#8B93A7] space-x-2">
            <span className="text-[#39FF14]">{stats.easySolved} Easy</span>
            <span className="text-[#F59E0B]">{stats.mediumSolved} Med</span>
            <span className="text-[#FF4D6D]">{stats.hardSolved} Hard</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#252936] bg-[#11131A] p-4">
          <div className="flex items-center justify-between text-[#8B93A7] mb-2">
            <span className="text-xs font-medium">Practice Streak</span>
            <Flame className="h-4 w-4 text-[#F59E0B]" />
          </div>
          <p className="text-2xl font-bold text-[#F59E0B] font-mono">{stats.currentStreak} Days</p>
          <p className="text-[11px] text-[#5E667B] mt-1">Longest record: {stats.longestStreak} days</p>
        </div>

        <div className="rounded-xl border border-[#252936] bg-[#11131A] p-4">
          <div className="flex items-center justify-between text-[#8B93A7] mb-2">
            <span className="text-xs font-medium">Total Experience</span>
            <Zap className="h-4 w-4 text-[#00F0FF]" />
          </div>
          <p className="text-2xl font-bold text-[#00F0FF] font-mono">{stats.xp} XP</p>
          <p className="text-[11px] text-[#5E667B] mt-1">First-solve verified rewards</p>
        </div>

        <div className="rounded-xl border border-[#252936] bg-[#11131A] p-4">
          <div className="flex items-center justify-between text-[#8B93A7] mb-2">
            <span className="text-xs font-medium">Acceptance Rate</span>
            <Send className="h-4 w-4 text-[#39FF14]" />
          </div>
          <p className="text-2xl font-bold text-[#F5F7FA] font-mono">{stats.acceptanceRate}%</p>
          <p className="text-[11px] text-[#5E667B] mt-1">
            {stats.acceptedSubmissions} / {stats.totalSubmissions} submissions
          </p>
        </div>
      </div>

      {/* GitHub-style 12-Month Activity Heatmap */}
      <div className="rounded-xl border border-[#252936] bg-[#11131A] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#00F0FF]" />
            <h3 className="text-sm font-bold text-[#F5F7FA]">Solve Activity (Past 12 Months)</h3>
          </div>
          <span className="text-xs font-mono text-[#8B93A7]">
            {Object.values(stats.heatmap).reduce((a, b) => a + b, 0)} total solves
          </span>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="grid grid-rows-7 grid-flow-col gap-1 w-max">
            {days.map((d) => {
              const count = d.count;
              const bgClass =
                count === 0
                  ? "bg-[#181B24]"
                  : count === 1
                  ? "bg-[#00F0FF]/30"
                  : count <= 3
                  ? "bg-[#00F0FF]/60"
                  : "bg-[#00F0FF]";

              return (
                <div
                  key={d.dateStr}
                  title={`${d.dateStr}: ${count} solves`}
                  className={`h-3 w-3 rounded-xs ${bgClass} transition hover:ring-1 hover:ring-[#F5F7FA]`}
                />
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 text-[10px] text-[#8B93A7]">
          <span>Less</span>
          <div className="h-2.5 w-2.5 rounded-xs bg-[#181B24]" />
          <div className="h-2.5 w-2.5 rounded-xs bg-[#00F0FF]/30" />
          <div className="h-2.5 w-2.5 rounded-xs bg-[#00F0FF]/60" />
          <div className="h-2.5 w-2.5 rounded-xs bg-[#00F0FF]" />
          <span>More</span>
        </div>
      </div>

      {/* Curriculum Phase Breakdown */}
      <div className="rounded-xl border border-[#252936] bg-[#11131A] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-[#39FF14]" />
          <h3 className="text-sm font-bold text-[#F5F7FA]">Curriculum Phase Progress</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.phaseBreakdown.map((p) => (
            <div key={p.phaseId} className="rounded-lg border border-[#252936] bg-[#090A0F] p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#F5F7FA]">
                  Phase {p.phaseId}: {p.title}
                </span>
                <span className="font-mono text-[#8B93A7]">
                  {p.solved} / {p.total} ({p.percentage}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#181B24]">
                <div
                  className="h-full bg-[#00F0FF] transition-all duration-500"
                  style={{ width: `${p.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
