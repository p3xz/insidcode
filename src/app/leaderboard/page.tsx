"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Users, Flame, Lock, Loader2 } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"global" | "friends">("global");
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isFrozen, setIsFrozen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?tab=${activeTab}`);
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
  }, [activeTab]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#252936] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="h-5 w-5 text-[#F59E0B]" />
            <h1 className="text-2xl font-bold tracking-tight text-[#F5F7FA]">Rankings & Leaderboard</h1>
          </div>
          <p className="text-xs text-[#8B93A7]">
            Ranked by XP earned, unique problems solved, and practice streak consistency.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 rounded-lg border border-[#252936] bg-[#11131A] p-1">
          <button
            onClick={() => setActiveTab("global")}
            className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === "global"
                ? "bg-[#181B24] text-[#00F0FF]"
                : "text-[#8B93A7] hover:text-[#F5F7FA]"
            }`}
          >
            <Trophy className="h-3.5 w-3.5" />
            Global Leaderboard
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === "friends"
                ? "bg-[#181B24] text-[#00F0FF]"
                : "text-[#8B93A7] hover:text-[#F5F7FA]"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Friends Circle
          </button>
        </div>
      </div>

      {/* Freeze Banner */}
      {isFrozen && (
        <div className="flex items-center gap-2 rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-3.5 text-xs text-[#F59E0B]">
          <Lock className="h-4 w-4 shrink-0" />
          <span>
            <strong>Notice:</strong> Leaderboard rankings are temporarily frozen by administration. New submissions are still recorded and XP is preserved.
          </span>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="rounded-xl border border-[#252936] bg-[#11131A] overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-[#00F0FF]" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#8B93A7]">
            {activeTab === "friends"
              ? "No friends added yet. Search developers and send friend requests to compete."
              : "No active rankings recorded yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#252936] bg-[#181B24]/70 font-mono text-[#8B93A7]">
                <tr>
                  <th className="px-4 py-3 w-16 text-center">Rank</th>
                  <th className="px-4 py-3">Developer</th>
                  <th className="px-4 py-3 text-center">Solved</th>
                  <th className="px-4 py-3 text-center">Streak</th>
                  <th className="px-4 py-3 text-right">Total XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252936]/60 text-[#F5F7FA]">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className={`transition ${
                      u.isCurrentUser
                        ? "bg-[#00F0FF]/10 font-medium"
                        : "hover:bg-[#181B24]/40"
                    }`}
                  >
                    <td className="px-4 py-3.5 text-center font-mono">
                      {u.rank === 1 ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#F59E0B]/20 text-xs font-bold text-[#F59E0B]">
                          1
                        </span>
                      ) : u.rank === 2 ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#8B93A7]/20 text-xs font-bold text-[#F5F7FA]">
                          2
                        </span>
                      ) : u.rank === 3 ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#FF4D6D]/20 text-xs font-bold text-[#FF4D6D]">
                          3
                        </span>
                      ) : (
                        <span className="text-[#8B93A7]">{u.rank}</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <Link
                        href={`/profile/${u.username}`}
                        className="flex items-center gap-3 hover:opacity-80 transition"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#252936] bg-[#181B24] text-xs font-bold text-[#00F0FF] overflow-hidden">
                          {u.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={u.image} alt={u.displayName} className="h-full w-full object-cover" />
                          ) : (
                            <span>{u.username.slice(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-[#F5F7FA]">{u.displayName}</span>
                            {u.isCurrentUser && (
                              <span className="rounded bg-[#00F0FF] px-1.5 py-0.2 text-[9px] font-bold text-[#090A0F]">
                                YOU
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-[#8B93A7]">@{u.username}</span>
                        </div>
                      </Link>
                    </td>

                    <td className="px-4 py-3.5 text-center font-mono text-[#F5F7FA]">
                      {u.solvedCount}
                    </td>

                    <td className="px-4 py-3.5 text-center font-mono text-[#F59E0B]">
                      {u.currentStreak > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <Flame className="h-3.5 w-3.5" />
                          {u.currentStreak} d
                        </span>
                      ) : (
                        <span className="text-[#5E667B]">0</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono font-bold text-[#00F0FF]">
                      {u.xp} XP
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
