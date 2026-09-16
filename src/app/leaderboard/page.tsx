"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Flame, Lock, Loader2, Swords, Trophy, Award } from "lucide-react";

interface LeaderboardUser {
  rank: number;
  id: string;
  username: string;
  displayName: string;
  image?: string;
  selectedTitle?: string | null;
  xp?: number;
  solvedCount?: number;
  currentStreak?: number;
  duelsWon?: number;
  duelsPlayed?: number;
  duelsLost?: number;
  winRate?: number;
  role: string;
  isCurrentUser: boolean;
}

interface PersonalDuelStats {
  duelsPlayed: number;
  duelsWon: number;
  duelsLost: number;
  winRate: number;
  eligible: boolean;
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<"xp" | "duel">("xp");
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isFrozen, setIsFrozen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [personalDuelStats, setPersonalDuelStats] = useState<PersonalDuelStats | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?tab=${activeTab}`);
        if (res.ok) {
          const data = await res.json();
          setUsers(data.leaderboard || []);
          setIsFrozen(data.isFrozen || false);
          setPersonalDuelStats(data.personalDuelStats || null);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [activeTab]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 space-y-6">
      {/* -- Page Header & Tabs ---------------------------------------- */}
      <div
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div>
          <p className="section-label mb-1">Rankings</p>
          <h1 className="text-[22px] font-bold tracking-tight" style={{ color: "var(--fg)" }}>
            {activeTab === "xp" ? "Global Leaderboard" : "Duel Arena Leaderboard"}
          </h1>
          <p className="mt-1 text-[12px]" style={{ color: "var(--fg-muted)" }}>
            {activeTab === "xp"
              ? "Ranked by cumulative XP earned, problem solutions, and streak consistency."
              : "Ranked by total 1v1 match victories and win rate (minimum 3 completed matches required)."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          className="flex items-center p-1 w-fit"
          style={{
            border: "1px solid var(--border)",
            backgroundColor: "var(--bg-subtle)",
            borderRadius: "3px",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("xp")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold transition-all cursor-pointer"
            style={{
              backgroundColor: activeTab === "xp" ? "var(--bg)" : "transparent",
              color: activeTab === "xp" ? "var(--fg)" : "var(--fg-muted)",
              borderRadius: "2px",
              boxShadow: activeTab === "xp" ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
            }}
          >
            <Trophy className="h-3.5 w-3.5" />
            <span>XP Leaderboard</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("duel")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold transition-all cursor-pointer"
            style={{
              backgroundColor: activeTab === "duel" ? "var(--bg)" : "transparent",
              color: activeTab === "duel" ? "var(--fg)" : "var(--fg-muted)",
              borderRadius: "2px",
              boxShadow: activeTab === "duel" ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
            }}
          >
            <Swords className="h-3.5 w-3.5" />
            <span>Duel Leaderboard</span>
          </button>
        </div>
      </div>

      {/* Frozen notice */}
      {isFrozen && activeTab === "xp" && (
        <div
          className="flex items-start gap-2.5 px-4 py-3 text-[12px]"
          style={{
            border: "1px solid color-mix(in srgb, var(--warning) 30%, transparent)",
            backgroundColor: "color-mix(in srgb, var(--warning) 6%, transparent)",
            borderRadius: "3px",
            color: "var(--warning)",
          }}
        >
          <Lock className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            <strong>Frozen:</strong> Rankings are temporarily locked by administration.
            New submissions are still recorded and XP preserved.
          </span>
        </div>
      )}

      {/* Duel Eligibility Notice */}
      {activeTab === "duel" && personalDuelStats && !personalDuelStats.eligible && (
        <div
          className="flex items-start gap-2.5 px-4 py-3 text-[12px]"
          style={{
            border: "1px solid var(--border)",
            backgroundColor: "var(--bg-subtle)",
            borderRadius: "3px",
            color: "var(--fg-muted)",
          }}
        >
          <Award className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
          <span>
            You have completed <strong>{personalDuelStats.duelsPlayed}</strong>/3 required Duel matches.
            Complete {3 - personalDuelStats.duelsPlayed} more to appear in the ranked Duel Leaderboard.
            Current stats: {personalDuelStats.duelsWon} wins ({personalDuelStats.winRate}% win rate).
          </span>
        </div>
      )}

      {/* -- Rankings Table ------------------------------------------- */}
      <div style={{ border: "1px solid var(--border)", borderRadius: "3px", overflow: "hidden" }}>
        {/* Column headers */}
        <div
          className="hidden sm:grid grid-cols-12 px-4 py-2.5"
          style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-subtle)" }}
        >
          {activeTab === "xp"
            ? ["Rank", "Developer", "", "Solved", "Streak", "XP"].map((col, i) => (
                <div
                  key={i}
                  className={`section-label ${
                    i === 0 ? "col-span-1 text-center" :
                    i === 1 ? "col-span-4" :
                    i === 2 ? "col-span-2" :
                    i === 3 ? "col-span-2 text-center" :
                    i === 4 ? "col-span-1 text-center" :
                    "col-span-2 text-right"
                  }`}
                >
                  {col}
                </div>
              ))
            : ["Rank", "Duelist", "", "Win Rate", "Played", "Wins"].map((col, i) => (
                <div
                  key={i}
                  className={`section-label ${
                    i === 0 ? "col-span-1 text-center" :
                    i === 1 ? "col-span-4" :
                    i === 2 ? "col-span-2" :
                    i === 3 ? "col-span-2 text-center" :
                    i === 4 ? "col-span-1 text-center" :
                    "col-span-2 text-right"
                  }`}
                >
                  {col}
                </div>
              ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--fg-dimmed)" }} />
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-[12px]" style={{ color: "var(--fg-muted)" }}>
            {activeTab === "xp" ? "No active rankings recorded yet." : "No ranked duelists with 3+ completed matches yet."}
          </div>
        ) : (
          users.map((u, i) => {
            const isTop = u.rank <= 3;
            return (
              <div
                key={u.id}
                className="grid grid-cols-12 items-center px-4 py-3.5"
                style={{
                  borderBottom: i < users.length - 1 ? "1px solid var(--border)" : "none",
                  backgroundColor: u.isCurrentUser
                    ? "color-mix(in srgb, var(--accent) 5%, transparent)"
                    : "transparent",
                  borderLeft: u.isCurrentUser ? "2px solid var(--accent)" : "2px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!u.isCurrentUser)
                    e.currentTarget.style.backgroundColor = "var(--bg-subtle)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = u.isCurrentUser
                    ? "color-mix(in srgb, var(--accent) 5%, transparent)"
                    : "transparent";
                }}
              >
                {/* Rank */}
                <div className="col-span-1 text-center mono text-[13px]">
                  <span
                    style={{
                      fontWeight: isTop ? 700 : 400,
                      color: isTop ? "var(--fg)" : "var(--fg-dimmed)",
                      fontSize: u.rank === 1 ? "15px" : undefined,
                    }}
                  >
                    {u.rank === 1 ? "?" : u.rank === 2 ? "?" : u.rank === 3 ? "?" : u.rank}
                  </span>
                </div>

                {/* Avatar + name + title */}
                <div className="col-span-6 sm:col-span-4">
                  <Link
                    href={`/profile/${u.username}`}
                    className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
                  >
                    <div
                      className="flex h-7 w-7 items-center justify-center shrink-0 overflow-hidden text-[11px] font-bold"
                      style={{
                        border: "1px solid var(--border-strong)",
                        borderRadius: "3px",
                        backgroundColor: "var(--bg-elevated)",
                        color: "var(--fg-muted)",
                      }}
                    >
                      {u.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.image} alt={u.displayName} className="h-full w-full object-cover" />
                      ) : (
                        u.username.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-semibold truncate" style={{ color: "var(--fg)" }}>
                          {u.displayName}
                        </span>
                        {u.isCurrentUser && (
                          <span
                            className="mono text-[9px] font-bold px-1 py-px shrink-0"
                            style={{
                              backgroundColor: "var(--accent)",
                              color: "var(--accent-fg)",
                              borderRadius: "2px",
                            }}
                          >
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="mono text-[10px]" style={{ color: "var(--fg-dimmed)" }}>
                          @{u.username}
                        </span>
                        {u.selectedTitle && (
                          <span
                            className="text-[9px] px-1 py-px font-semibold uppercase tracking-wider"
                            style={{
                              backgroundColor: "var(--bg-elevated)",
                              color: "var(--fg-muted)",
                              borderRadius: "2px",
                              border: "1px solid var(--border)",
                            }}
                          >
                            {u.selectedTitle}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>

                {/* Spacer col (sm only) */}
                <div className="hidden sm:block col-span-2" />

                {/* Tab specific columns */}
                {activeTab === "xp" ? (
                  <>
                    {/* Solved */}
                    <div className="col-span-2 sm:col-span-2 text-center mono text-[12px]" style={{ color: "var(--fg-muted)" }}>
                      {u.solvedCount}
                    </div>

                    {/* Streak */}
                    <div className="col-span-2 sm:col-span-1 text-center mono text-[12px]" style={{ color: "var(--warning)" }}>
                      {u.currentStreak && u.currentStreak > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <Flame className="h-3 w-3" />
                          {u.currentStreak}
                        </span>
                      ) : (
                        <span style={{ color: "var(--fg-dimmed)" }}>�</span>
                      )}
                    </div>

                    {/* XP */}
                    <div
                      className="col-span-2 text-right mono text-[13px] font-semibold"
                      style={{ color: isTop ? "var(--fg)" : "var(--fg-muted)" }}
                    >
                      {u.xp?.toLocaleString()}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Win Rate */}
                    <div className="col-span-2 sm:col-span-2 text-center mono text-[12px]" style={{ color: "var(--fg)" }}>
                      <span className="font-semibold">{u.winRate}%</span>
                    </div>

                    {/* Duels Played */}
                    <div className="col-span-2 sm:col-span-1 text-center mono text-[12px]" style={{ color: "var(--fg-muted)" }}>
                      {u.duelsPlayed}
                    </div>

                    {/* Duels Won */}
                    <div
                      className="col-span-2 text-right mono text-[13px] font-semibold"
                      style={{ color: isTop ? "var(--accent)" : "var(--fg)" }}
                    >
                      {u.duelsWon} <span className="text-[11px] font-normal" style={{ color: "var(--fg-dimmed)" }}>wins</span>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
