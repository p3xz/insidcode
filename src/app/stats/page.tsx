"use client";

import React, { useState, useEffect } from "react";
import { Flame, Zap, Send, Loader2, CheckCircle2, Code2, Swords } from "lucide-react";

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
  duelRating?: number;
  duelsPlayed?: number;
  duelsWon?: number;
  duelsLost?: number;
  duelWinRate?: number;
  duelKd?: string;
  duelPoints?: number;
  duelRank?: string;
  duelRankTier?: number;
  duelPointsToNextRank?: number | null;
  duelNextRankName?: string | null;
  isChampion?: boolean;
  duelChampionPosition?: number | null;
  languagePoints?: {
    python?: number;
    javascript?: number;
    c?: number;
    cpp?: number;
    java?: number;
  };
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

function ProgressBar({ value, max, color = "var(--success)" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex-1 h-1.5 overflow-hidden"
        style={{ backgroundColor: "var(--bg-elevated)", borderRadius: "2px" }}
      >
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="mono text-[11px] w-8 text-right tabular-nums" style={{ color: "var(--fg-dimmed)" }}>
        {pct}%
      </span>
    </div>
  );
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
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--fg-dimmed)" }} />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="mx-auto max-w-4xl py-20 text-center text-[12px]" style={{ color: "var(--fg-muted)" }}>
        Please sign in to inspect your personal practice statistics.
      </div>
    );
  }

  // 52-week heatmap
  const days: { dateStr: string; count: number }[] = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    days.push({ dateStr, count: stats.heatmap[dateStr] || 0 });
  }

  const totalHeatmapSolves = Object.values(stats.heatmap).reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 space-y-0">

      {/* -- Page Header ---------------------------------------------- */}
      <div
        className="pb-6"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <p className="section-label mb-1">Analytics</p>
        <h1 className="text-[22px] font-bold tracking-tight" style={{ color: "var(--fg)" }}>
          Performance Statistics
        </h1>
        <p className="mt-1 text-[12px]" style={{ color: "var(--fg-muted)" }}>
          Real-time telemetry tracking problem resolution, duel combat, and practice momentum.
        </p>
      </div>

      {/* -- Primary Metrics Row -------------------------------------- */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 divide-x"
        style={{
          borderBottom: "1px solid var(--border)",
          borderLeft: "0px",
          "--tw-divide-color": "var(--border)",
        } as React.CSSProperties}
      >
        {[
          {
            value: stats.totalSolved,
            sub: `/ ${stats.totalQuestions}`,
            label: "Problems Solved",
            icon: CheckCircle2,
            iconColor: "var(--success)",
          },
          {
            value: stats.currentStreak,
            sub: `days`,
            label: "Current Streak",
            icon: Flame,
            iconColor: "var(--warning)",
            note: `Best: ${stats.longestStreak}d`,
          },
          {
            value: stats.xp,
            sub: "XP",
            label: "Total Experience",
            icon: Zap,
            iconColor: "var(--fg-muted)",
            mono: true,
          },
          {
            value: `${stats.acceptanceRate}%`,
            sub: `${stats.acceptedSubmissions}/${stats.totalSubmissions}`,
            label: "Acceptance Rate",
            icon: Send,
            iconColor: "var(--fg-muted)",
          },
        ].map(({ value, sub, label, icon: Icon, iconColor, note, mono }, i) => (
          <div key={i} className="px-5 py-6 space-y-1" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <p className="section-label">{label}</p>
              <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: iconColor }} />
            </div>
            <div className="flex items-baseline gap-1.5 pt-1">
              <span
                className={`text-[32px] font-bold leading-none tracking-tight ${mono ? "mono" : ""}`}
                style={{ color: "var(--fg)" }}
              >
                {value}
              </span>
              <span className="mono text-[13px]" style={{ color: "var(--fg-dimmed)" }}>
                {sub}
              </span>
            </div>
            {note && (
              <p className="text-[11px]" style={{ color: "var(--fg-dimmed)" }}>{note}</p>
            )}
          </div>
        ))}
      </div>

      {/* -- Duel Statistics Row -------------------------------------- */}
      <div
        className="py-6"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Swords className="h-4 w-4" style={{ color: "var(--accent)" }} />
            <p className="section-label">1v1 Duel Telemetry</p>
          </div>
          <span className="mono text-[11px]" style={{ color: "var(--fg-dimmed)" }}>
            Best of 3 matches
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Card 1: Competitive Rank */}
          <div
            className="p-4"
            style={{
              border: "1px solid var(--border)",
              borderRadius: "3px",
              backgroundColor: "var(--bg)",
            }}
          >
            <p className="text-[11px] font-medium" style={{ color: "var(--fg-muted)" }}>Rank</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span
                className="text-[20px] font-bold mono truncate"
                style={{ color: stats.isChampion ? "var(--accent)" : "var(--fg)" }}
              >
                {stats.duelRank || "Noob I"}
              </span>
            </div>
            <p className="text-[11px] mono mt-1 truncate" style={{ color: "var(--fg-dimmed)" }}>
              {stats.isChampion
                ? `Champion #${stats.duelChampionPosition}`
                : stats.duelPointsToNextRank != null
                ? `${stats.duelPointsToNextRank} DP to ${stats.duelNextRankName}`
                : "Max Normal Rank"}
            </p>
          </div>

          {/* Card 2: Duel Points */}
          <div
            className="p-4"
            style={{
              border: "1px solid var(--border)",
              borderRadius: "3px",
              backgroundColor: "var(--bg)",
            }}
          >
            <p className="text-[11px] font-medium" style={{ color: "var(--fg-muted)" }}>Duel Points</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[22px] font-bold mono" style={{ color: "var(--accent)" }}>
                {(stats.duelPoints || 0).toLocaleString()}
              </span>
              <span className="text-[11px] mono" style={{ color: "var(--fg-dimmed)" }}>DP</span>
            </div>
            <p className="text-[11px] mono mt-1" style={{ color: "var(--fg-dimmed)" }}>Progression</p>
          </div>

          {/* Card 3: Duel Rating (Elo) */}
          <div
            className="p-4"
            style={{
              border: "1px solid var(--border)",
              borderRadius: "3px",
              backgroundColor: "var(--bg)",
            }}
          >
            <p className="text-[11px] font-medium" style={{ color: "var(--fg-muted)" }}>Duel Rating</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[22px] font-bold mono" style={{ color: "var(--fg)" }}>
                {stats.duelRating ?? 1000}
              </span>
              <span className="text-[11px] mono" style={{ color: "var(--fg-dimmed)" }}>Elo</span>
            </div>
            <p className="text-[11px] mono mt-1" style={{ color: "var(--fg-dimmed)" }}>Skill Rating</p>
          </div>

          {/* Card 4: Duels Played */}
          <div
            className="p-4"
            style={{
              border: "1px solid var(--border)",
              borderRadius: "3px",
              backgroundColor: "var(--bg)",
            }}
          >
            <p className="text-[11px] font-medium" style={{ color: "var(--fg-muted)" }}>Duels Played</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[22px] font-bold mono" style={{ color: "var(--fg)" }}>
                {stats.duelsPlayed || 0}
              </span>
              <span className="text-[11px] mono" style={{ color: "var(--fg-dimmed)" }}>matches</span>
            </div>
            <p className="text-[11px] mono mt-1" style={{ color: "var(--fg-dimmed)" }}>Total</p>
          </div>

          {/* Card 5: Wins */}
          <div
            className="p-4"
            style={{
              border: "1px solid var(--border)",
              borderRadius: "3px",
              backgroundColor: "var(--bg)",
            }}
          >
            <p className="text-[11px] font-medium" style={{ color: "var(--fg-muted)" }}>Wins</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[22px] font-bold mono" style={{ color: "var(--success)" }}>
                {stats.duelsWon || 0}
              </span>
              <span className="text-[11px] mono" style={{ color: "var(--fg-dimmed)" }}>victories</span>
            </div>
            <p className="text-[11px] mono mt-1" style={{ color: "var(--fg-dimmed)" }}>+25 DP each</p>
          </div>

          {/* Card 6: Losses */}
          <div
            className="p-4"
            style={{
              border: "1px solid var(--border)",
              borderRadius: "3px",
              backgroundColor: "var(--bg)",
            }}
          >
            <p className="text-[11px] font-medium" style={{ color: "var(--fg-muted)" }}>Losses</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[22px] font-bold mono" style={{ color: "var(--fg-dimmed)" }}>
                {stats.duelsLost || 0}
              </span>
              <span className="text-[11px] mono" style={{ color: "var(--fg-dimmed)" }}>defeats</span>
            </div>
            <p className="text-[11px] mono mt-1" style={{ color: "var(--fg-dimmed)" }}>-10 DP each</p>
          </div>

          {/* Card 7: Win Rate */}
          <div
            className="p-4"
            style={{
              border: "1px solid var(--border)",
              borderRadius: "3px",
              backgroundColor: "var(--bg)",
            }}
          >
            <p className="text-[11px] font-medium" style={{ color: "var(--fg-muted)" }}>Win Rate</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span
                className="text-[22px] font-bold mono"
                style={{ color: (stats.duelWinRate || 0) >= 50 ? "var(--success)" : "var(--fg)" }}
              >
                {Number(stats.duelWinRate || 0).toFixed(1)}%
              </span>
            </div>
            <p className="text-[11px] mono mt-1" style={{ color: "var(--fg-dimmed)" }}>
              {stats.duelsWon || 0}W - {stats.duelsLost || 0}L
            </p>
          </div>

          {/* Card 8: K/D Ratio */}
          <div
            className="p-4"
            style={{
              border: "1px solid var(--border)",
              borderRadius: "3px",
              backgroundColor: "var(--bg)",
            }}
          >
            <p className="text-[11px] font-medium" style={{ color: "var(--fg-muted)" }}>K/D Ratio</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span
                className="text-[22px] font-bold mono"
                style={{ color: (stats.duelsWon || 0) >= (stats.duelsLost || 0) && (stats.duelsWon || 0) > 0 ? "var(--accent)" : "var(--fg)" }}
              >
                {stats.duelKd ?? (stats.duelsWon && !stats.duelsLost ? "∞" : !stats.duelsWon && !stats.duelsLost ? "—" : ((stats.duelsWon || 0) / (stats.duelsLost || 1)).toFixed(2))}
              </span>
            </div>
            <p className="text-[11px] mono mt-1" style={{ color: "var(--fg-dimmed)" }}>Wins / Losses</p>
          </div>
        </div>
      </div>

      {/* -- Difficulty Breakdown ------------------------------------- */}
      <div
        className="py-6"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <p className="section-label mb-4">Difficulty Breakdown</p>
        <div className="space-y-3">
          {[
            { label: "Easy", solved: stats.easySolved, total: stats.totalEasy, color: "var(--easy)" },
            { label: "Medium", solved: stats.mediumSolved, total: stats.totalMedium, color: "var(--medium)" },
            { label: "Hard", solved: stats.hardSolved, total: stats.totalHard, color: "var(--hard)" },
          ].map(({ label, solved, total, color }) => (
            <div key={label} className="grid grid-cols-12 items-center gap-3">
              <span
                className="col-span-2 text-[11px] font-semibold uppercase tracking-wide"
                style={{ color }}
              >
                {label}
              </span>
              <div className="col-span-7">
                <ProgressBar value={solved} max={total} color={color} />
              </div>
              <span className="col-span-3 mono text-[11px] text-right" style={{ color: "var(--fg-muted)" }}>
                {solved} / {total}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* -- Activity Heatmap ----------------------------------------- */}
      <div
        className="py-6"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="section-label">Solve Activity (Past 12 Months)</p>
          <span className="mono text-[11px]" style={{ color: "var(--fg-dimmed)" }}>
            {totalHeatmapSolves} total solves
          </span>
        </div>

        <div className="overflow-x-auto">
          <div
            className="grid grid-rows-7 grid-flow-col gap-[3px] w-max"
            style={{ gridTemplateRows: "repeat(7, 1fr)" }}
          >
            {days.map((d) => {
              const count = d.count;
              const bg =
                count === 0
                  ? "var(--bg-elevated)"
                  : count === 1
                  ? "color-mix(in srgb, var(--success) 25%, transparent)"
                  : count <= 3
                  ? "color-mix(in srgb, var(--success) 55%, transparent)"
                  : "var(--success)";

              return (
                <div
                  key={d.dateStr}
                  title={`${d.dateStr}: ${count} solve${count !== 1 ? "s" : ""}`}
                  style={{
                    width: "11px",
                    height: "11px",
                    borderRadius: "2px",
                    backgroundColor: bg,
                  }}
                />
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-3 text-[10px]" style={{ color: "var(--fg-dimmed)" }}>
          <span>Less</span>
          {["var(--bg-elevated)", "color-mix(in srgb, var(--success) 25%, transparent)", "color-mix(in srgb, var(--success) 55%, transparent)", "var(--success)"].map((bg, i) => (
            <span
              key={i}
              style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: bg, display: "inline-block" }}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* -- Language Points ------------------------------------------ */}
      <div
        className="py-6"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4" style={{ color: "var(--fg-muted)" }} />
            <p className="section-label">Language Points</p>
          </div>
          <span className="mono text-[11px]" style={{ color: "var(--fg-dimmed)" }}>
            +10 pts / solved problem
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { key: "python", label: "Python" },
            { key: "javascript", label: "JavaScript" },
            { key: "c", label: "C" },
            { key: "cpp", label: "C++" },
            { key: "java", label: "Java" },
          ].map(({ key, label }) => {
            const pts = stats.languagePoints?.[key as keyof typeof stats.languagePoints] || 0;
            return (
              <div
                key={key}
                className="p-3.5"
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "3px",
                  backgroundColor: "var(--bg)",
                }}
              >
                <p className="text-[11px] font-medium" style={{ color: "var(--fg-muted)" }}>{label}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-[18px] font-bold mono" style={{ color: "var(--fg)" }}>{pts}</span>
                  <span className="text-[10px] mono" style={{ color: "var(--fg-dimmed)" }}>pts</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* -- Phase Progress ------------------------------------------- */}
      <div
        className="py-6"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <p className="section-label mb-4">Phase Progress</p>
        <div className="space-y-0" style={{ border: "1px solid var(--border)", borderRadius: "3px", overflow: "hidden" }}>
          {stats.phaseBreakdown.map((p, i) => (
            <div
              key={p.phaseId}
              className="grid grid-cols-12 items-center gap-3 px-4 py-3"
              style={{ borderBottom: i < stats.phaseBreakdown.length - 1 ? "1px solid var(--border)" : "none" }}
            >
              <span className="col-span-1 mono text-[11px]" style={{ color: "var(--fg-dimmed)" }}>
                P{p.phaseId}
              </span>
              <span className="col-span-3 text-[12px] font-medium truncate" style={{ color: "var(--fg)" }}>
                {p.title}
              </span>
              <div className="col-span-5">
                <ProgressBar value={p.solved} max={p.total} color="var(--accent)" />
              </div>
              <span className="col-span-3 mono text-[11px] text-right" style={{ color: "var(--fg-muted)" }}>
                {p.solved} / {p.total}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* -- Recent Submissions --------------------------------------- */}
      {stats.recentSubmissions && stats.recentSubmissions.length > 0 && (
        <div className="py-6">
          <p className="section-label mb-4">Recent Submissions</p>
          <div style={{ border: "1px solid var(--border)", borderRadius: "3px", overflow: "hidden" }}>
            {/* Table header */}
            <div
              className="hidden sm:grid grid-cols-12 px-4 py-2.5"
              style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-subtle)" }}
            >
              {["Date", "Problem", "Language", "Status", "XP"].map((col, i) => (
                <div
                  key={i}
                  className={`section-label ${
                    i === 0 ? "col-span-2" :
                    i === 1 ? "col-span-4" :
                    i === 2 ? "col-span-2" :
                    i === 3 ? "col-span-2" :
                    "col-span-2 text-right"
                  }`}
                >
                  {col}
                </div>
              ))}
            </div>
            {stats.recentSubmissions.map((sub, i) => {
              const date = new Date(sub.createdAt);
              const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              const isAccepted = sub.status === "Accepted";
              return (
                <div
                  key={i}
                  className="grid grid-cols-12 items-center px-4 py-3 text-[12px]"
                  style={{ borderBottom: i < stats.recentSubmissions.length - 1 ? "1px solid var(--border)" : "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-subtle)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <span className="col-span-3 sm:col-span-2 mono" style={{ color: "var(--fg-dimmed)" }}>
                    {dateStr}
                  </span>
                  <span className="col-span-5 sm:col-span-4 font-medium truncate" style={{ color: "var(--fg)" }}>
                    {sub.problemTitle}
                  </span>
                  <span className="hidden sm:block col-span-2 mono" style={{ color: "var(--fg-muted)" }}>
                    {sub.language}
                  </span>
                  <span
                    className="col-span-2 text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: isAccepted ? "var(--success)" : "var(--danger)" }}
                  >
                    {isAccepted ? "OK" : "WA"}
                  </span>
                  <span className="col-span-2 text-right mono" style={{ color: "var(--fg-muted)" }}>
                    {sub.awardedXp > 0 ? `+${sub.awardedXp}` : "-"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
