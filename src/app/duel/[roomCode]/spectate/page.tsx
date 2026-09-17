"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Swords,
  Clock,
  Copy,
  Check,
  Loader2,
  Eye,
  Trophy,
  ArrowLeft,
  AlertTriangle,
  Code2,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { DifficultyLevel } from "@/types";

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
  difficulty: DifficultyLevel;
  startedAt?: string;
  endsAt?: string;
  winner?: string | null;
  finishedAt?: string;
}

interface SpectatorRoom {
  roomCode: string;
  difficulty: DifficultyLevel;
  rounds: number;
  currentRound: number;
  roundsData: SpectatorRound[];
  currentRoundData: SpectatorRound | null;
  player1: SpectatorPlayer;
  player2: SpectatorPlayer | null;
  player1Score: number;
  player2Score: number;
  status: "WAITING" | "COUNTDOWN" | "ACTIVE" | "FINISHED" | "CANCELLED" | "EXPIRED";
  countdownEndsAt?: string;
  winner?: string | null;
  finishedAt?: string;
  cancelReason?: string;
  createdAt: string;
}

interface SpectatorProblem {
  problemId: string;
  title: string;
  slug: string;
  phase: number;
  difficulty: DifficultyLevel;
  description: string;
  constraints?: string[];
  examples?: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  xp?: number;
}

export default function DuelSpectatorPage() {
  const params = useParams();
  const roomCode = (params?.roomCode as string)?.toUpperCase();

  const [room, setRoom] = useState<SpectatorRoom | null>(null);
  const [problem, setProblem] = useState<SpectatorProblem | null>(null);
  const [spectatorCount, setSpectatorCount] = useState<number>(1);
  const [isParticipant, setIsParticipant] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Timer states
  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const [countdownSec, setCountdownSec] = useState<number | null>(null);

  // Poll Spectator State
  const fetchSpectatorState = useCallback(async () => {
    if (!roomCode) return;
    try {
      const res = await fetch(`/api/duel/${encodeURIComponent(roomCode)}/spectate`);
      if (res.ok) {
        const data = await res.json();
        setRoom(data.room);
        if (data.problem) {
          setProblem(data.problem);
        }
        setSpectatorCount(data.spectatorCount || 1);
        setIsParticipant(Boolean(data.isParticipant));
        setError(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || "Failed to load spectator stream.");
      }
    } catch {
      // silent polling error
    } finally {
      setLoading(false);
    }
  }, [roomCode]);

  useEffect(() => {
    fetchSpectatorState();
  }, [fetchSpectatorState]);

  // Polling loop while match is WAITING, COUNTDOWN, or ACTIVE
  useEffect(() => {
    if (!room || room.status === "FINISHED" || room.status === "CANCELLED" || room.status === "EXPIRED") {
      return;
    }

    const interval = setInterval(() => {
      fetchSpectatorState();
    }, 1500);

    return () => clearInterval(interval);
  }, [room, fetchSpectatorState]);

  // Real-time Timer update
  useEffect(() => {
    if (!room) return;

    const timer = setInterval(() => {
      const now = Date.now();

      if (room.status === "COUNTDOWN" && room.countdownEndsAt) {
        const diff = Math.max(0, Math.ceil((new Date(room.countdownEndsAt).getTime() - now) / 1000));
        setCountdownSec(diff);
      } else {
        setCountdownSec(null);
      }

      if (room.status === "ACTIVE") {
        const currentRoundData = room.roundsData?.[room.currentRound - 1];
        if (currentRoundData?.endsAt) {
          const diff = Math.max(0, Math.floor((new Date(currentRoundData.endsAt).getTime() - now) / 1000));
          setRemainingSec(diff);
        } else {
          setRemainingSec(null);
        }
      } else {
        setRemainingSec(null);
      }
    }, 500);

    return () => clearInterval(timer);
  }, [room]);

  const handleCopyRoomCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getDifficultyColor = (diff?: DifficultyLevel) => {
    if (diff === "Easy") return "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30";
    if (diff === "Hard") return "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30";
    return "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30";
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#00F0FF]" />
        <p className="font-mono text-xs text-[#8B93A7] tracking-wider uppercase">
          Connecting to Duel Spectator Stream...
        </p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center space-y-6">
        <div className="inline-flex p-4 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444]">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-[#F5F7FA]">Spectator Error</h1>
          <p className="text-xs text-[#8B93A7] leading-relaxed max-w-md mx-auto">
            {error || "The requested Duel room cannot be spectated."}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/duel"
            className="px-4 py-2 text-xs font-semibold text-[#00F0FF] bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 border border-[#00F0FF]/30 rounded transition"
          >
            ← Back to Duel Hub
          </Link>
        </div>
      </div>
    );
  }

  const isFinished = room.status === "FINISHED";
  const winnerUser =
    room.winner === room.player1.userId
      ? room.player1
      : room.winner === room.player2?.userId
      ? room.player2
      : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-6 text-[#F5F7FA]">
      {/* Participant Switch Banner */}
      {isParticipant && (
        <div className="flex items-center justify-between p-3 bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <Swords className="h-4 w-4 text-[#00F0FF]" />
            <span className="text-[#F5F7FA] font-medium">
              You are a registered player in this match.
            </span>
          </div>
          <Link
            href={`/duel/${encodeURIComponent(room.roomCode)}`}
            className="inline-flex items-center gap-1 font-semibold text-[#00F0FF] hover:underline"
          >
            Open Duel Arena Editor <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* ── Top Match Control Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#11131A] border border-[#252936] rounded-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/duel"
            className="p-1.5 rounded bg-[#181B24] border border-[#252936] text-[#8B93A7] hover:text-[#00F0FF] transition"
            title="Back to Hub"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
                SPECTATOR MODE
              </span>
              <span className="font-mono text-xs font-bold text-[#8B93A7]">
                {room.roomCode}
              </span>
              <button
                type="button"
                onClick={handleCopyRoomCode}
                className="text-[#8B93A7] hover:text-[#00F0FF] transition p-1"
                title="Copy Room Code"
              >
                {copiedCode ? <Check className="h-3 w-3 text-[#10B981]" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            <p className="text-[11px] text-[#5E667B] font-mono mt-0.5">
              Best of {room.rounds} Rounds · {room.difficulty} Tier
            </p>
          </div>
        </div>

        {/* Status / Timer / Spectator count */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#181B24] border border-[#252936] text-[11px] font-mono text-[#8B93A7]">
            <Eye className="h-3.5 w-3.5 text-[#00F0FF]" />
            <span>{spectatorCount} Watching</span>
          </div>

          {room.status === "COUNTDOWN" && countdownSec !== null && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#F59E0B]/15 border border-[#F59E0B]/30 font-mono text-xs font-bold text-[#F59E0B]">
              <Clock className="h-3.5 w-3.5 animate-spin" />
              <span>STARTS IN {countdownSec}s</span>
            </div>
          )}

          {room.status === "ACTIVE" && remainingSec !== null && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded font-mono text-xs font-bold border ${
                remainingSec <= 60
                  ? "bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444] animate-pulse"
                  : "bg-[#181B24] border-[#252936] text-[#00F0FF]"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>{formatTime(remainingSec)}</span>
            </div>
          )}

          {room.status === "WAITING" && (
            <div className="px-2.5 py-1 rounded bg-[#F59E0B]/10 border border-[#F59E0B]/20 font-mono text-[11px] text-[#F59E0B]">
              WAITING FOR OPPONENT
            </div>
          )}

          {room.status === "FINISHED" && (
            <div className="px-2.5 py-1 rounded bg-[#10B981]/15 border border-[#10B981]/30 font-mono text-[11px] font-bold text-[#10B981]">
              MATCH CONCLUDED
            </div>
          )}
        </div>
      </div>

      {/* ── Match Scoreboard & Two-Player Arena ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
        {/* Player 1 Card (Cols 1-5) */}
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
              <span className="font-mono text-2xl font-black text-[#00F0FF]">
                {room.player1Score}
              </span>
              <p className="text-[9px] font-mono text-[#5E667B] uppercase">POINTS</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between pt-2 border-t border-[#252936]/60 text-xs">
            <span className="text-[11px] text-[#8B93A7] font-mono">STATUS:</span>
            {room.player1.status === "SOLVED" ? (
              <span className="inline-flex items-center gap-1 font-mono font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/30">
                <CheckCircle2 className="h-3 w-3" /> SOLVED
              </span>
            ) : room.player1.status === "SUBMITTED" ? (
              <span className="inline-flex items-center gap-1 font-mono font-semibold text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded border border-[#F59E0B]/20">
                <Loader2 className="h-3 w-3 animate-spin" /> SUBMITTED ({room.player1.testsPassed}/{room.player1.totalTests})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-mono text-[#8B93A7] bg-[#181B24] px-2 py-0.5 rounded border border-[#252936]">
                <Code2 className="h-3 w-3 text-[#00F0FF]" /> CODING
              </span>
            )}
          </div>
        </div>

        {/* VS / Round Indicator (Col 6) */}
        <div className="md:col-span-1 text-center py-2">
          <div className="inline-flex flex-col items-center justify-center">
            <span className="font-mono font-black text-sm text-[#5E667B] tracking-wider">VS</span>
            <span className="font-mono text-[10px] text-[#8B93A7] mt-0.5 whitespace-nowrap">
              ROUND {room.currentRound}/{room.rounds}
            </span>
          </div>
        </div>

        {/* Player 2 Card (Cols 7-11) */}
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
                  <span className="font-mono text-2xl font-black text-[#F59E0B]">
                    {room.player2Score}
                  </span>
                  <p className="text-[9px] font-mono text-[#5E667B] uppercase">POINTS</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between pt-2 border-t border-[#252936]/60 text-xs">
                <span className="text-[11px] text-[#8B93A7] font-mono">STATUS:</span>
                {room.player2.status === "SOLVED" ? (
                  <span className="inline-flex items-center gap-1 font-mono font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/30">
                    <CheckCircle2 className="h-3 w-3" /> SOLVED
                  </span>
                ) : room.player2.status === "SUBMITTED" ? (
                  <span className="inline-flex items-center gap-1 font-mono font-semibold text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded border border-[#F59E0B]/20">
                    <Loader2 className="h-3 w-3 animate-spin" /> SUBMITTED ({room.player2.testsPassed}/{room.player2.totalTests})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-mono text-[#8B93A7] bg-[#181B24] px-2 py-0.5 rounded border border-[#252936]">
                    <Code2 className="h-3 w-3 text-[#F59E0B]" /> CODING
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="py-6 text-center space-y-2">
              <p className="font-mono text-xs text-[#8B93A7]">Waiting for opponent to join...</p>
              <p className="font-mono text-[11px] text-[#5E667B]">Share code: {room.roomCode}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Match Concluded Winner Showcase (When Finished) ───────────────── */}
      {isFinished && (
        <div className="p-6 bg-[#11131A] border border-[#10B981]/40 rounded-xl text-center space-y-4">
          <div className="inline-flex p-3 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
            <Trophy className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#F5F7FA]">
              {winnerUser ? `🏆 @${winnerUser.username} Won the Duel!` : "Match Ended in a Draw!"}
            </h2>
            <p className="text-xs text-[#8B93A7] mt-1 font-mono">
              Final Score: {room.player1Score} - {room.player2Score} ({room.rounds} Rounds)
            </p>
          </div>
        </div>
      )}

      {/* ── Round Summary Timeline ────────────────────────────────────────── */}
      <div className="p-4 bg-[#11131A] border border-[#252936] rounded-xl space-y-3">
        <h3 className="section-label">ROUND SUMMARY</h3>
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
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${getDifficultyColor(rd.difficulty)}`}>
                    {rd.difficulty}
                  </span>
                </div>
                <p className="text-xs text-[#8B93A7] truncate">{rd.problemTitle}</p>
                <p className="font-mono text-[11px] text-[#00F0FF] mt-1">
                  {rd.finishedAt ? `Winner: @${roundWinnerUser}` : isCurrent ? "⚡ Live Now" : "Upcoming"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Public Problem Statement ──────────────────────────────────────── */}
      {problem && (
        <div className="p-6 bg-[#11131A] border border-[#252936] rounded-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-[#252936]">
            <div>
              <span className="section-label block mb-1">CURRENT ROUND CHALLENGE</span>
              <h2 className="text-xl font-bold tracking-tight text-[#F5F7FA]">
                {problem.title}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border ${getDifficultyColor(problem.difficulty)}`}>
                {problem.difficulty}
              </span>
              <span className="text-xs font-mono text-[#8B93A7]">
                Phase {problem.phase}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="prose prose-invert max-w-none text-xs leading-relaxed text-[#8B93A7] space-y-3 font-sans">
            <p className="whitespace-pre-wrap">{problem.description}</p>
          </div>

          {/* Examples */}
          {problem.examples && problem.examples.length > 0 && (
            <div className="space-y-4 pt-2">
              <h4 className="section-label">PUBLIC EXAMPLES</h4>
              <div className="space-y-3">
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
                    {ex.explanation && (
                      <p className="text-[11px] text-[#8B93A7] font-sans pt-1">
                        <strong className="text-[#F5F7FA]">Explanation:</strong> {ex.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Constraints */}
          {problem.constraints && problem.constraints.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="section-label">CONSTRAINTS</h4>
              <ul className="list-disc pl-4 space-y-1 text-xs text-[#8B93A7] font-mono">
                {problem.constraints.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
