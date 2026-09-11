"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Flame, Lock, Loader2 } from "lucide-react";

interface LeaderboardUser {
  rank: number;
  id: string;
  username: string;
  displayName: string;
  image?: string;
  xp: number;
  solvedCount: number;
  currentStreak: number;
  role: string;
  isCurrentUser: boolean;
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isFrozen, setIsFrozen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard`);
        if (res.ok) {
          const data = await res.json();
          setUsers(data.leaderboard || []);
          setIsFrozen(data.isFrozen || false);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div
        className="pb-6 mb-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div>
          <p className="section-label mb-1">Rankings</p>
          <h1 className="text-[22px] font-bold tracking-tight" style={{ color: "var(--fg)" }}>
            Leaderboard
          </h1>
          <p className="mt-1 text-[12px]" style={{ color: "var(--fg-muted)" }}>
            Ranked by XP earned, problems solved, and streak consistency.
          </p>
        </div>
      </div>

      {/* Frozen notice */}
      {isFrozen && (
        <div
          className="flex items-start gap-2.5 px-4 py-3 my-4 text-[12px]"
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

      {/* ── Rankings Table ─────────────────────────────────────────── */}
      <div style={{ border: "1px solid var(--border)", borderRadius: "3px", overflow: "hidden" }}>
        {/* Column headers */}
        <div
          className="hidden sm:grid grid-cols-12 px-4 py-2.5"
          style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-subtle)" }}
        >
          {["Rank", "Developer", "", "Solved", "Streak", "XP"].map((col, i) => (
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
            No active rankings recorded yet.
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
                    {u.rank === 1 ? "①" : u.rank === 2 ? "②" : u.rank === 3 ? "③" : u.rank}
                  </span>
                </div>

                {/* Avatar + name */}
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
                      <span className="mono text-[10px]" style={{ color: "var(--fg-dimmed)" }}>
                        @{u.username}
                      </span>
                    </div>
                  </Link>
                </div>

                {/* Spacer col (sm only) */}
                <div className="hidden sm:block col-span-2" />

                {/* Solved */}
                <div className="col-span-2 sm:col-span-2 text-center mono text-[12px]" style={{ color: "var(--fg-muted)" }}>
                  {u.solvedCount}
                </div>

                {/* Streak */}
                <div className="col-span-2 sm:col-span-1 text-center mono text-[12px]" style={{ color: "var(--warning)" }}>
                  {u.currentStreak > 0 ? (
                    <span className="inline-flex items-center gap-1">
                      <Flame className="h-3 w-3" />
                      {u.currentStreak}
                    </span>
                  ) : (
                    <span style={{ color: "var(--fg-dimmed)" }}>—</span>
                  )}
                </div>

                {/* XP */}
                <div
                  className="col-span-2 text-right mono text-[13px] font-semibold"
                  style={{ color: isTop ? "var(--fg)" : "var(--fg-muted)" }}
                >
                  {u.xp.toLocaleString()}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
