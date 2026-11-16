"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Code2,
  Shield,
  Trophy,
  AlertTriangle,
  Pause,
  Play,
  RefreshCw,
} from "lucide-react";
import { Skeleton, SkeletonText, SkeletonRegion } from "@/components/ui/Skeleton";
import { LoadError } from "@/components/ui/LoadError";
import { useDelayedFlag } from "@/hooks/useDelayedFlag";
import AdminIntegrityPanel from "@/components/duel/AdminIntegrityPanel";
import type { AdminRoomIntegritySnapshot } from "@/lib/duelSpectateAdmin";

interface SpectatorPlayer {
  userId: string;
  username: string;
  displayName: string;
  image?: string;
  status: "CODING" | "SUBMITTED" | "SOLVED";
  testsPassed: number;
  totalTests: number;
  runtime?: number | null;
}

interface SpectatorRound {
  roundNumber: number;
  problemId: string;
  problemTitle: string;
  difficulty: string;
  startedAt?: string;
  endsAt?: string;
  winner?: string | null;
  finishedAt?: string;
}

interface SpectatorRoom {
  roomCode: string;
  difficulty: string;
  rounds: number;
  currentRound: number;
  roundsData: SpectatorRound[];
  currentRoundData: SpectatorRound | null;
  player1: SpectatorPlayer;
  player2: SpectatorPlayer | null;
  player1Score: number;
  player2Score: number;
  status: string;
  countdownEndsAt?: string;
  winner?: string | null;
  finishedAt?: string;
  cancelReason?: string;
  createdAt?: string;
}

interface SpectatorProblem {
  problemId: string;
  title: string;
  slug: string;
  phase: number;
  difficulty: string;
  description: string;
  constraints?: string[];
  examples?: Array<{ input: string; output: string; explanation?: string }>;
}

function getDifficultyBadgeClass(difficulty: string): string {
  if (difficulty === "Very Easy" || difficulty === "Easy") {
    return "bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]";
  }
  if (difficulty === "Medium") {
    return "bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]";
  }
  return "bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]";
}

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function AdminDuelSpectateView({ roomCode }: { roomCode: string }) {
  const [room, setRoom] = useState<SpectatorRoom | null>(null);
  const [problem, setProblem] = useState<SpectatorProblem | null>(null);
  const [adminIntegrity, setAdminIntegrity] = useState<AdminRoomIntegritySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoPoll, setAutoPoll] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [remainingSec, setRemainingSec] = useState<number>(300);
  const [countdownSec, setCountdownSec] = useState<number>(0);
  const [serverOffsetMs, setServerOffsetMs] = useState<number>(0);
  const showSkeleton = useDelayedFlag(loading);

  const fetchAdminSpectateState = useCallback(
    async (isManual = false) => {
      if (!roomCode) return;
      if (isManual) setRefreshing(true);
      try {
        const res = await fetch(`/api/admin/duels/${encodeURIComponent(roomCode)}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load admin duel spectate state.");
          return;
        }
        setRoom(data.room);
        setProblem(data.problem || null);
        setAdminIntegrity(data.adminIntegrity || null);
        if (data.serverTime) {
          setServerOffsetMs(new Date(data.serverTime).getTime() - Date.now());
        }
        setError(null);
      } catch {
        setError("Network error while polling admin duel telemetry.");
      } finally {
        setLoading(false);
        if (isManual) setRefreshing(false);
      }
    },
    [roomCode]
  );

  useEffect(() => {
    fetchAdminSpectateState(false);
  }, [fetchAdminSpectateState]);

  useEffect(() => {
    if (!autoPoll) return;
    const pollId = setInterval(() => {
      fetchAdminSpectateState(false);
    }, 1500);
    return () => clearInterval(pollId);
  }, [autoPoll, fetchAdminSpectateState]);

  useEffect(() => {
    if (!room) return;
    const tick = () => {
      const serverNowMs = Date.now() + serverOffsetMs;
      if (room.status === "COUNTDOWN" && room.countdownEndsAt) {
        const diff = Math.ceil((new Date(room.countdownEndsAt).getTime() - serverNowMs) / 1000);
        setCountdownSec(Math.max(0, diff));
      } else {
        setCountdownSec(0);
      }

      if (room.status === "ACTIVE" && room.currentRoundData?.endsAt) {
        const diff = Math.ceil((new Date(room.currentRoundData.endsAt).getTime() - serverNowMs) / 1000);
        setRemainingSec(Math.max(0, diff));
      }
    };

    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [room, serverOffsetMs]);

  if (loading) {
    return (
      <SkeletonRegion label="Loading admin duel spectate" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {showSkeleton ? (
          <div className="space-y-6">
            <Skeleton style={{ height: 64, borderRadius: 12 }} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton style={{ height: 140, borderRadius: 12 }} />
              <Skeleton style={{ height: 140, borderRadius: 12 }} />
            </div>
            <Skeleton style={{ height: 220, borderRadius: 12 }} />
            <SkeletonText lines={4} />
          </div>
        ) : (
          <div aria-busy="true" style={{ minHeight: 420 }} />
        )}
      </SkeletonRegion>
    );
  }

  if (error && !room) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 space-y-4">
        <LoadError message={error} onRetry={() => fetchAdminSpectateState(true)} />
        <div className="text-center">
          <Link
            href="/admin/duels"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#00F0FF] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Back to Live Duels Monitor</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!room) return null;

  const isFinished = room.status === "FINISHED";
  const isCancelledOrExpired = room.status === "CANCELLED" || room.status === "EXPIRED";
  const winnerUser =
    room.winner === room.player1.userId
      ? room.player1
      : room.winner === room.player2?.userId
      ? room.player2
      : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-6 text-[#F5F7FA]">
      {/* Top Admin Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#11131A] border border-[#252936] rounded-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/duels"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#181B24] border border-[#252936] text-xs font-mono text-[#8B93A7] hover:text-[#F5F7FA] transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Live Duels</span>
          </Link>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                <Shield className="h-3 w-3" aria-hidden="true" />
                ADMIN ONLY SPECTATE
              </span>
              <span className="font-mono text-xs text-[#8B93A7]">
                {room.difficulty} · {room.rounds === 1 ? "1 Round" : `${room.rounds} Rounds`}
              </span>
            </div>
            <h1 className="text-lg font-bold text-[#F5F7FA] mt-0.5">
              Duel Room {room.roomCode}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {room.status === "ACTIVE" && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#10B981]/10 border border-[#10B981]/30 font-mono text-xs font-bold text-[#10B981]">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{formatClock(remainingSec)}</span>
            </div>
          )}

          {room.status === "COUNTDOWN" && (
            <div className="px-2.5 py-1 rounded bg-[#F59E0B]/10 border border-[#F59E0B]/30 font-mono text-xs font-bold text-[#F59E0B]">
              STARTING IN {countdownSec}s
            </div>
          )}

          {room.status !== "ACTIVE" && room.status !== "COUNTDOWN" && (
            <span className="px-2.5 py-1 rounded bg-[#181B24] border border-[#252936] font-mono text-[11px] font-bold text-[#8B93A7]">
              {room.status}
            </span>
          )}

          <button
            type="button"
            onClick={() => setAutoPoll((prev) => !prev)}
            aria-pressed={autoPoll}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#181B24] border border-[#252936] text-[11px] font-mono text-[#8B93A7] hover:text-[#F5F7FA] transition"
          >
            {autoPoll ? (
              <Pause className="h-3 w-3 text-[#10B981]" aria-hidden="true" />
            ) : (
              <Play className="h-3 w-3 text-[#F59E0B]" aria-hidden="true" />
            )}
            <span>{autoPoll ? "Live 1.5s" : "Paused"}</span>
          </button>

          <button
            type="button"
            onClick={() => fetchAdminSpectateState(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#181B24] border border-[#252936] text-[11px] font-mono text-[#8B93A7] hover:text-[#F5F7FA] transition"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Cancellation / Expiry Alert */}
      {isCancelledOrExpired && room.cancelReason && (
        <div className="p-4 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center gap-3 text-xs text-[#FDE68A]">
          <AlertTriangle className="h-4 w-4 text-[#F59E0B] shrink-0" aria-hidden="true" />
          <span>
            <strong className="font-mono uppercase mr-1.5">{room.status}:</strong>
            {room.cancelReason}
          </span>
        </div>
      )}

      {/* Match Scoreboard */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
        {/* Player 1 */}
        <div className="md:col-span-5 p-5 bg-[#11131A] border border-[#252936] rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#00F0FF]/15 border border-[#00F0FF]/30 flex items-center justify-center font-mono font-bold text-[#00F0FF] text-sm">
                {room.player1.username.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-sm text-[#F5F7FA]">@{room.player1.username}</p>
                <p className="text-[11px] text-[#8B93A7]">{room.player1.displayName}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-2xl font-black text-[#00F0FF]">{room.player1Score}</span>
              <p className="text-[9px] font-mono text-[#5E667B] uppercase">POINTS</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#252936]/60 text-xs">
            <span className="text-[11px] text-[#8B93A7] font-mono">STATUS:</span>
            {room.player1.status === "SOLVED" ? (
              <span className="inline-flex items-center gap-1 font-mono font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/30">
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> SOLVED
              </span>
            ) : room.player1.status === "SUBMITTED" ? (
              <span className="inline-flex items-center gap-1 font-mono font-semibold text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded border border-[#F59E0B]/20">
                SUBMITTED ({room.player1.testsPassed}/{room.player1.totalTests})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-mono text-[#8B93A7] bg-[#181B24] px-2 py-0.5 rounded border border-[#252936]">
                <Code2 className="h-3 w-3 text-[#00F0FF]" aria-hidden="true" /> CODING
              </span>
            )}
          </div>
        </div>

        {/* Center VS */}
        <div className="md:col-span-1 text-center py-2">
          <div className="inline-flex flex-col items-center justify-center">
            <span className="font-mono font-black text-sm text-[#5E667B] tracking-wider">VS</span>
            <span className="font-mono text-[10px] text-[#8B93A7] mt-0.5 whitespace-nowrap">
              ROUND {room.currentRound}/{room.rounds}
            </span>
          </div>
        </div>

        {/* Player 2 */}
        <div className="md:col-span-5 p-5 bg-[#11131A] border border-[#252936] rounded-xl space-y-4">
          {room.player2 ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center font-mono font-bold text-[#F59E0B] text-sm">
                    {room.player2.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#F5F7FA]">@{room.player2.username}</p>
                    <p className="text-[11px] text-[#8B93A7]">{room.player2.displayName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-2xl font-black text-[#F59E0B]">{room.player2Score}</span>
                  <p className="text-[9px] font-mono text-[#5E667B] uppercase">POINTS</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#252936]/60 text-xs">
                <span className="text-[11px] text-[#8B93A7] font-mono">STATUS:</span>
                {room.player2.status === "SOLVED" ? (
                  <span className="inline-flex items-center gap-1 font-mono font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/30">
                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> SOLVED
                  </span>
                ) : room.player2.status === "SUBMITTED" ? (
                  <span className="inline-flex items-center gap-1 font-mono font-semibold text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded border border-[#F59E0B]/20">
                    SUBMITTED ({room.player2.testsPassed}/{room.player2.totalTests})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-mono text-[#8B93A7] bg-[#181B24] px-2 py-0.5 rounded border border-[#252936]">
                    <Code2 className="h-3 w-3 text-[#F59E0B]" aria-hidden="true" /> CODING
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="py-6 text-center space-y-1">
              <p className="font-mono text-xs text-[#8B93A7]">Waiting for opponent to join...</p>
              <p className="font-mono text-[11px] text-[#5E667B]">Room Code: {room.roomCode}</p>
            </div>
          )}
        </div>
      </div>

      {/* Admin Live Anti-Cheat & Warnings Monitor */}
      {adminIntegrity && (
        <AdminIntegrityPanel
          player1={room.player1}
          player2={room.player2}
          integrity={adminIntegrity}
          roomStatus={room.status}
        />
      )}

      {/* Match Winner Showcase */}
      {isFinished && (
        <div className="p-5 bg-[#11131A] border border-[#10B981]/40 rounded-xl text-center space-y-2">
          <div className="inline-flex p-2.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
            <Trophy className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-[#F5F7FA]">
            {winnerUser ? `@${winnerUser.username} Won the Duel` : "Match Ended in a Draw"}
          </h2>
          <p className="text-xs text-[#8B93A7] font-mono">
            Final Score: {room.player1Score} - {room.player2Score} ({room.rounds} Rounds)
          </p>
        </div>
      )}

      {/* Round Summary */}
      <div className="p-4 bg-[#11131A] border border-[#252936] rounded-xl space-y-3">
        <h2 className="section-label">ROUND SUMMARY</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {room.roundsData.map((rd) => {
            const isCurrent = rd.roundNumber === room.currentRound && room.status === "ACTIVE";
            const roundWinnerUser =
              rd.winner === room.player1.userId
                ? room.player1.username
                : rd.winner === room.player2?.userId
                ? room.player2?.username
                : rd.winner === "DRAW"
                ? "Draw"
                : null;

            return (
              <div
                key={rd.roundNumber}
                className={`p-3 rounded-lg border transition ${
                  isCurrent
                    ? "bg-[#00F0FF]/10 border-[#00F0FF]/40"
                    : rd.finishedAt
                    ? "bg-[#181B24] border-[#252936]"
                    : "bg-[#11131A] border-[#252936]/40 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-[#F5F7FA]">
                    Round {rd.roundNumber}
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${getDifficultyBadgeClass(rd.difficulty)}`}>
                    {rd.difficulty}
                  </span>
                </div>
                <p className="text-xs text-[#8B93A7] truncate">{rd.problemTitle}</p>
                <p className="font-mono text-[11px] text-[#00F0FF] mt-1">
                  {rd.finishedAt ? `Winner: @${roundWinnerUser}` : isCurrent ? "Live Now" : "Upcoming"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Problem Reference */}
      {problem && (
        <div className="p-6 bg-[#11131A] border border-[#252936] rounded-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-[#252936]">
            <div>
              <span className="section-label block mb-1">CURRENT ROUND CHALLENGE</span>
              <h2 className="text-xl font-bold tracking-tight text-[#F5F7FA]">{problem.title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border ${getDifficultyBadgeClass(problem.difficulty)}`}>
                {problem.difficulty}
              </span>
              <span className="text-xs font-mono text-[#8B93A7]">Phase {problem.phase}</span>
            </div>
          </div>

          <div className="text-xs leading-relaxed text-[#8B93A7] font-sans">
            <p className="whitespace-pre-wrap">{problem.description}</p>
          </div>

          {problem.examples && problem.examples.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="section-label">PUBLIC EXAMPLES</h3>
              <div className="space-y-2.5">
                {problem.examples.map((ex, idx) => (
                  <div key={idx} className="p-3.5 rounded-lg bg-[#181B24] border border-[#252936] space-y-2 text-xs font-mono">
                    <p className="text-[11px] font-bold text-[#8B93A7]">Example {idx + 1}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="p-2 rounded bg-[#11131A] border border-[#252936]/60">
                        <span className="text-[10px] text-[#5E667B] block mb-1">INPUT</span>
                        <pre className="text-xs text-[#00F0FF] whitespace-pre-wrap">{ex.input}</pre>
                      </div>
                      <div className="p-2 rounded bg-[#11131A] border border-[#252936]/60">
                        <span className="text-[10px] text-[#5E667B] block mb-1">EXPECTED OUTPUT</span>
                        <pre className="text-xs text-[#10B981] whitespace-pre-wrap">{ex.output}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
