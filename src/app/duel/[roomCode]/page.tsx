"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Swords,
  Clock,
  XCircle,
  Copy,
  Check,
  Loader2,
  Play,
  Send,
  RotateCcw,
  FileText,
  Code2,
  Terminal,
  AlertTriangle,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { TerminalOutput, ExecutionResultData } from "@/components/editor/TerminalOutput";
import { SUPPORTED_LANGUAGES, SupportedLanguageId } from "@/lib/constants";
import { IDuelRoom, IQuestion, SubmissionStatus } from "@/types";

export default function DuelArenaPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const roomCode = (params?.roomCode as string)?.toUpperCase();

  const [room, setRoom] = useState<IDuelRoom | null>(null);
  const [problem, setProblem] = useState<IQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editor & Execution State
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguageId>("python");
  const [code, setCode] = useState<string>("");
  const [customInput, setCustomInput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [execResult, setExecResult] = useState<ExecutionResultData | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<"problem" | "code" | "terminal">("problem");

  // Duel Timer & UI State
  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const [countdownSec, setCountdownSec] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Track previous round to auto-reset editor template on round transitions
  const previousRoundRef = useRef<number>(1);

  // Poll Duel Status
  const fetchDuelState = useCallback(async () => {
    if (!roomCode) return;
    try {
      const res = await fetch(`/api/duel/${encodeURIComponent(roomCode)}`);
      if (res.ok) {
        const data = await res.json();
        setRoom(data.room);
        if (data.problem) {
          setProblem(data.problem);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || "Failed to load Duel room.");
      }
    } catch {
      // silent polling error
    } finally {
      setLoading(false);
    }
  }, [roomCode]);

  useEffect(() => {
    fetchDuelState();
  }, [fetchDuelState]);

  // Polling loop while room is WAITING, COUNTDOWN, or ACTIVE
  useEffect(() => {
    if (!room || room.status === "FINISHED" || room.status === "CANCELLED" || room.status === "EXPIRED") {
      return;
    }

    const interval = setInterval(() => {
      fetchDuelState();
    }, 1500);

    return () => clearInterval(interval);
  }, [room, fetchDuelState]);

  // Handle round changes (reset starter code and terminal)
  useEffect(() => {
    if (!room || !problem) return;
    if (room.currentRound !== previousRoundRef.current) {
      previousRoundRef.current = room.currentRound;
      const template =
        problem.starterTemplates?.[selectedLanguage] ||
        `# Write your solution for ${problem.title} here\n`;
      setCode(template);
      setExecResult(null);
    }
  }, [room, problem, selectedLanguage]);

  // Initialize Starter Code on first load
  useEffect(() => {
    if (!problem) return;
    const template =
      problem.starterTemplates?.[selectedLanguage] ||
      `# Write your solution for ${problem.title} here\n`;
    setCode(template);
  }, [problem, selectedLanguage]);

  // Countdown & Round Timers
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

  const handleLeaveDuel = async () => {
    if (!roomCode) return;
    setIsLeaving(true);
    try {
      await fetch(`/api/duel/${encodeURIComponent(roomCode)}/leave`, { method: "POST" });
      router.push("/duel");
    } catch {
      router.push("/duel");
    }
  };

  // Run Code (Non-submission local testing)
  const handleRunCode = async () => {
    if (isRunning || isSubmitting) return;
    if (!session?.user) {
      alert("Please sign in to run code.");
      return;
    }

    setIsRunning(true);
    setActiveMobileTab("terminal");
    setExecResult(null);

    try {
      const stdin = customInput || (problem?.examples?.[0]?.input ?? "");
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: selectedLanguage,
          code,
          customInput: stdin,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setExecResult({ systemError: data.error || "Failed to execute code" });
        return;
      }

      const executionId = data.executionId;
      if (!executionId) {
        if (data.status) {
          setExecResult({
            stdout: data.stdout,
            stderr: data.stderr,
            output: data.output,
            errorDetails: data.compilationError || data.runtimeError || data.systemError,
            status: data.compilationError
              ? "Compilation Error"
              : data.runtimeError
              ? "Runtime Error"
              : data.isTimeout || data.status === "timeout"
              ? "Time Limit Exceeded"
              : "Accepted",
          });
          return;
        }
        setExecResult({ systemError: "Missing execution ID" });
        return;
      }

      const terminalStates = ["success", "error", "timeout", "failed", "cancelled"];
      let completed = false;
      const startTime = Date.now();
      const MAX_POLL = 30000;

      while (!completed && Date.now() - startTime < MAX_POLL) {
        await new Promise((r) => setTimeout(r, 800));
        const statusRes = await fetch(`/api/execute/status?id=${encodeURIComponent(executionId)}`);
        if (!statusRes.ok) break;

        const statusData = await statusRes.json();
        if (terminalStates.includes(statusData.status)) {
          completed = true;
          setExecResult({
            stdout: statusData.stdout,
            stderr: statusData.stderr,
            output: statusData.output,
            errorDetails: statusData.compilationError || statusData.runtimeError || statusData.systemError,
            status: statusData.compilationError
              ? "Compilation Error"
              : statusData.runtimeError
              ? "Runtime Error"
              : statusData.isTimeout || statusData.status === "timeout"
              ? "Time Limit Exceeded"
              : statusData.status === "failed" || statusData.status === "cancelled"
              ? "System Error"
              : "Accepted",
          });
          break;
        }
      }
    } catch {
      setExecResult({ systemError: "Code execution error. Please try again." });
    } finally {
      setIsRunning(false);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => {
        setCopiedCode(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  // Submit for Duel Round
  const handleSubmitDuel = async () => {
    if (!problem || isSubmitting || isRunning) return;
    if (!session?.user) {
      alert("Please sign in to submit.");
      return;
    }

    setIsSubmitting(true);
    setActiveMobileTab("terminal");
    setExecResult(null);

    try {
      const res = await fetch(`/api/duel/${encodeURIComponent(roomCode)}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: problem.problemId,
          language: selectedLanguage,
          code,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setExecResult({ systemError: data.error || "Submission failed" });
      } else {
        const sub = data.submission;
        setExecResult({
          status: sub.status as SubmissionStatus,
          runtime: sub.runtime,
          testsPassed: sub.testsPassed,
          totalTests: sub.totalTests,
          awardedXp: sub.awardedXp,
          errorDetails: sub.errorDetails,
        });

        // Trigger immediate state refresh to sync score and next round
        fetchDuelState();
      }
    } catch {
      setExecResult({ systemError: "Submission processing failed. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--fg-dimmed)" }} />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center p-6 text-center">
        <h2 className="text-[18px] font-bold mb-2" style={{ color: "var(--fg)" }}>
          {error || "Duel Room Not Found"}
        </h2>
        <p className="text-[12px] mb-6" style={{ color: "var(--fg-muted)" }}>
          The requested Duel room code does not exist or has expired.
        </p>
        <Link href="/duel" className="btn btn-primary text-[12px]">
          Back to Duel Hub
        </Link>
      </div>
    );
  }

  const currentUserId = session?.user?.id;
  const isPlayer1 = room.player1.userId === currentUserId;
  const opponent = isPlayer1 ? room.player2 : room.player1;
  const myScore = isPlayer1 ? room.player1Score : room.player2Score;
  const opponentScore = isPlayer1 ? room.player2Score : room.player1Score;

  // ─── WAITING ROOM VIEW ─────────────────────────────────────────────
  if (room.status === "WAITING") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <div
          className="p-8 text-center"
          style={{
            border: "1px solid var(--border-strong)",
            borderRadius: "4px",
            backgroundColor: "var(--bg)",
          }}
        >
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold mono mb-4"
            style={{
              border: "1px solid var(--border)",
              borderRadius: "3px",
              backgroundColor: "var(--bg-elevated)",
              color: "var(--warning)",
            }}
          >
            <Swords className="h-3.5 w-3.5" />
            <span>DUEL WAITING ROOM</span>
          </div>

          <h1 className="text-[22px] font-bold mb-1" style={{ color: "var(--fg)" }}>
            Best of 3 Match
          </h1>
          <p className="text-[12px] mb-6 mono" style={{ color: "var(--fg-dimmed)" }}>
            Difficulty: <span className="font-bold" style={{ color: "var(--fg)" }}>{room.difficulty}</span> · 3 Rounds · 5m/Round
          </p>

          {/* Room Code Display */}
          <div
            className="p-5 max-w-sm mx-auto mb-6"
            style={{
              border: "1.5px dashed var(--border-strong)",
              borderRadius: "4px",
              backgroundColor: "var(--bg-subtle)",
            }}
          >
            <p className="section-label mb-1">Room Code</p>
            <p className="text-[32px] font-bold mono tracking-widest" style={{ color: "var(--accent)" }}>
              {room.roomCode}
            </p>
            <button
              onClick={handleCopyRoomCode}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold mono transition-colors"
              style={{
                border: "1px solid var(--border-strong)",
                borderRadius: "3px",
                backgroundColor: "var(--bg)",
                color: copiedCode ? "var(--success)" : "var(--fg)",
              }}
            >
              {copiedCode ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[var(--success)]" />
                  <span>COPIED CODE</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>COPY ROOM CODE</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-[12px] mb-8" style={{ color: "var(--fg-muted)" }}>
            <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
            <span>Waiting for opponent to enter the room code...</span>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={handleLeaveDuel}
              disabled={isLeaving}
              className="btn btn-secondary text-[12px] px-4 py-2"
            >
              Cancel Duel Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── CANCELLED VIEW ────────────────────────────────────────────────
  if (room.status === "CANCELLED") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <AlertTriangle className="h-8 w-8 mx-auto mb-3" style={{ color: "var(--warning)" }} />
        <h2 className="text-[18px] font-bold mb-1" style={{ color: "var(--fg)" }}>
          Duel Room Cancelled
        </h2>
        <p className="text-[12px] mb-6" style={{ color: "var(--fg-muted)" }}>
          {room.cancelReason || "This duel was cancelled."}
        </p>
        <Link href="/duel" className="btn btn-primary text-[12px]">
          Back to Duel Hub
        </Link>
      </div>
    );
  }

  // Format timer seconds into MM:SS
  const formatTime = (secs: number | null) => {
    if (secs === null || secs < 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isFinished = room.status === "FINISHED";
  const isWinner = room.winner === currentUserId;
  const isDraw = room.winner === null || room.winner === "DRAW";

  // ─── ACTIVE DUEL ARENA / CODING WORKSPACE ───────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] w-full overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
      {/* COUNTDOWN OVERLAY */}
      {room.status === "COUNTDOWN" && countdownSec !== null && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
          <p className="section-label mb-2 text-white">DUEL STARTING IN</p>
          <span className="text-[72px] font-bold mono text-[var(--accent)] animate-pulse">
            {countdownSec > 0 ? countdownSec : "GO!"}
          </span>
          <p className="text-[13px] text-white/70 mt-2 font-mono">
            Round 1 of 3 · {room.difficulty} Difficulty
          </p>
        </div>
      )}

      {/* TOP DUEL TELEMETRY HEADER */}
      <div
        className="flex items-center justify-between px-4 py-2 shrink-0 gap-3"
        style={{
          borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--bg-subtle)",
        }}
      >
        {/* Left: Round & Score Badge */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold mono"
            style={{
              border: "1px solid var(--border)",
              borderRadius: "3px",
              color: "var(--warning)",
              backgroundColor: "var(--bg)",
            }}
          >
            <Swords className="h-3.5 w-3.5" />
            <span>ROUND {room.currentRound} / 3</span>
          </div>

          {/* Live Score */}
          <div
            className="mono text-[12px] font-bold px-2 py-0.5 rounded"
            style={{ backgroundColor: "var(--bg-elevated)", color: "var(--fg)" }}
          >
            Score: <span style={{ color: "var(--accent)" }}>{myScore}</span> -{" "}
            <span>{opponentScore}</span>
          </div>

          <span className="hidden sm:inline text-[12px] font-medium truncate max-w-[200px]" style={{ color: "var(--fg-dimmed)" }}>
            {problem?.title || "Loading Problem..."}
          </span>
        </div>

        {/* Center: Synced Round Timer */}
        <div
          className="flex items-center gap-1.5 px-3 py-1 mono text-[13px] font-bold"
          style={{
            border: "1px solid var(--border)",
            borderRadius: "3px",
            backgroundColor: "var(--bg)",
            color: (remainingSec ?? 300) < 60 ? "var(--danger)" : "var(--fg)",
          }}
        >
          <Clock className="h-3.5 w-3.5" style={{ color: "var(--fg-muted)" }} />
          <span>{formatTime(remainingSec)}</span>
        </div>

        {/* Right: Opponent Status */}
        <div className="flex items-center gap-3">
          {opponent ? (
            <div className="flex items-center gap-2 text-[12px]">
              <span className="text-[11px] hidden md:inline" style={{ color: "var(--fg-dimmed)" }}>Opponent:</span>
              <span className="font-semibold" style={{ color: "var(--fg)" }}>
                {opponent.displayName || opponent.username}
              </span>
              <span
                className="px-2 py-0.5 text-[10px] font-bold mono"
                style={{
                  borderRadius: "2px",
                  backgroundColor:
                    opponent.status === "SOLVED"
                      ? "color-mix(in srgb, var(--success) 20%, transparent)"
                      : opponent.status === "SUBMITTED"
                      ? "color-mix(in srgb, var(--warning) 20%, transparent)"
                      : "var(--bg-elevated)",
                  color:
                    opponent.status === "SOLVED"
                      ? "var(--success)"
                      : opponent.status === "SUBMITTED"
                      ? "var(--warning)"
                      : "var(--fg-dimmed)",
                }}
              >
                {opponent.status === "SOLVED"
                  ? "SOLVED"
                  : opponent.status === "SUBMITTED"
                  ? "SUBMITTED"
                  : "CODING"}
              </span>
            </div>
          ) : (
            <span className="text-[11px] mono" style={{ color: "var(--fg-dimmed)" }}>Waiting...</span>
          )}
        </div>
      </div>

      {/* MOBILE TAB SWITCHER */}
      <div
        className="flex lg:hidden items-center justify-between px-3 py-1.5 shrink-0"
        style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg)" }}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveMobileTab("problem")}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium"
            style={{
              borderRadius: "3px",
              backgroundColor: activeMobileTab === "problem" ? "var(--bg-elevated)" : "transparent",
              color: activeMobileTab === "problem" ? "var(--accent)" : "var(--fg-muted)",
            }}
          >
            <FileText className="h-3 w-3" />
            Description
          </button>
          <button
            onClick={() => setActiveMobileTab("code")}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium"
            style={{
              borderRadius: "3px",
              backgroundColor: activeMobileTab === "code" ? "var(--bg-elevated)" : "transparent",
              color: activeMobileTab === "code" ? "var(--accent)" : "var(--fg-muted)",
            }}
          >
            <Code2 className="h-3 w-3" />
            Editor
          </button>
          <button
            onClick={() => setActiveMobileTab("terminal")}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium"
            style={{
              borderRadius: "3px",
              backgroundColor: activeMobileTab === "terminal" ? "var(--bg-elevated)" : "transparent",
              color: activeMobileTab === "terminal" ? "var(--accent)" : "var(--fg-muted)",
            }}
          >
            <Terminal className="h-3 w-3" />
            Console
          </button>
        </div>
      </div>

      {/* MAIN SPLIT PANE WORKSPACE */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Pane: Problem Description (col-span-5) */}
        <div
          className={`h-full flex-col overflow-y-auto p-5 lg:col-span-5 ${
            activeMobileTab === "problem" ? "flex" : "hidden lg:flex"
          }`}
          style={{
            borderRight: "1px solid var(--border)",
            backgroundColor: "var(--bg)",
          }}
        >
          {problem ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="mono text-[11px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--fg-dimmed)" }}>
                  Round {room.currentRound}
                </span>
                <span
                  className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    borderRadius: "2px",
                    color:
                      problem.difficulty === "Easy"
                        ? "var(--easy)"
                        : problem.difficulty === "Medium"
                        ? "var(--medium)"
                        : "var(--hard)",
                    backgroundColor: "var(--bg-elevated)",
                  }}
                >
                  {problem.difficulty}
                </span>
                <span className="mono text-[11px] ml-auto font-semibold" style={{ color: "var(--accent)" }}>
                  +{problem.xp} XP
                </span>
              </div>

              <h1 className="text-[18px] font-bold mb-4" style={{ color: "var(--fg)" }}>
                {problem.title}
              </h1>

              <div className="text-[12px] leading-relaxed mb-6 whitespace-pre-wrap" style={{ color: "var(--fg-muted)" }}>
                {problem.description}
              </div>

              {problem.examples && problem.examples.length > 0 && (
                <div className="mb-6 space-y-3">
                  <p className="section-label">Examples</p>
                  {problem.examples.map((ex, idx) => (
                    <div
                      key={idx}
                      className="p-3 text-[11px] mono space-y-1.5"
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: "3px",
                        backgroundColor: "var(--bg-subtle)",
                      }}
                    >
                      <p className="font-bold" style={{ color: "var(--fg)" }}>Example {idx + 1}:</p>
                      <div>
                        <span style={{ color: "var(--fg-dimmed)" }}>Input: </span>
                        <pre className="p-1.5 rounded mt-0.5" style={{ backgroundColor: "var(--bg)", color: "var(--fg)" }}>
                          {ex.input || "(no input)"}
                        </pre>
                      </div>
                      <div>
                        <span style={{ color: "var(--fg-dimmed)" }}>Output: </span>
                        <pre className="p-1.5 rounded mt-0.5" style={{ backgroundColor: "var(--bg)", color: "var(--success)" }}>
                          {ex.output}
                        </pre>
                      </div>
                      {ex.explanation && (
                        <p className="text-[10px]" style={{ color: "var(--fg-muted)" }}>
                          <strong>Explanation: </strong>{ex.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {problem.constraints && problem.constraints.length > 0 && (
                <div className="mb-6">
                  <p className="section-label mb-2">Constraints</p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] mono" style={{ color: "var(--fg-dimmed)" }}>
                    {problem.constraints.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--fg-dimmed)" }} />
            </div>
          )}
        </div>

        {/* Right Pane: Code Editor + Terminal (col-span-7) */}
        <div
          className={`h-full flex-col lg:col-span-7 ${
            activeMobileTab === "problem" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Editor Action Bar */}
          <div
            className="flex items-center justify-between px-3 py-1.5 shrink-0"
            style={{
              borderBottom: "1px solid var(--border)",
              backgroundColor: "var(--bg-subtle)",
            }}
          >
            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[11px]" style={{ color: "var(--fg-dimmed)" }}>Lang:</span>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as SupportedLanguageId)}
                className="py-1 px-2 text-[11px] font-medium cursor-pointer focus:outline-none"
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "3px",
                  backgroundColor: "var(--bg)",
                  color: "var(--fg)",
                }}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                disabled={!code}
                aria-label={copiedCode ? "Code copied to clipboard" : "Copy code"}
                title={copiedCode ? "Copied to clipboard" : "Copy code"}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold mono transition-colors disabled:opacity-40"
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "3px",
                  backgroundColor: "var(--bg)",
                  color: copiedCode ? "var(--success)" : "var(--fg-muted)",
                }}
              >
                {copiedCode ? (
                  <>
                    <Check className="h-3 w-3" style={{ color: "var(--success)" }} />
                    <span className="hidden sm:inline">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  const template =
                    problem?.starterTemplates?.[selectedLanguage] ||
                    `# Write your solution for ${problem?.title} here\n`;
                  setCode(template);
                }}
                title="Reset starter template"
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold mono transition-colors"
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "3px",
                  backgroundColor: "var(--bg)",
                  color: "var(--fg-muted)",
                }}
              >
                <RotateCcw className="h-3 w-3" />
                <span className="hidden sm:inline">Reset</span>
              </button>

              <button
                onClick={handleRunCode}
                disabled={isRunning || isSubmitting || isFinished}
                className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold mono transition-colors disabled:opacity-40"
                style={{
                  border: "1px solid var(--border-strong)",
                  borderRadius: "3px",
                  backgroundColor: "var(--bg-elevated)",
                  color: "var(--fg)",
                }}
              >
                <Play className="h-3 w-3 fill-current" />
                <span>{isRunning ? "Running..." : "Run Code"}</span>
              </button>

              <button
                onClick={handleSubmitDuel}
                disabled={isRunning || isSubmitting || isFinished}
                className="flex items-center gap-1.5 px-3.5 py-1 text-[11px] font-bold mono transition-colors disabled:opacity-40"
                style={{
                  borderRadius: "3px",
                  backgroundColor: "var(--accent)",
                  color: "var(--accent-fg)",
                }}
              >
                {isSubmitting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
                <span>Submit for Round {room.currentRound}</span>
              </button>
            </div>
          </div>

          {/* Monaco Code Editor Frame */}
          <div
            className={`flex-1 overflow-hidden min-h-[260px] ${
              activeMobileTab === "terminal" ? "hidden lg:block" : "block"
            }`}
          >
            <CodeEditor
              language={selectedLanguage}
              code={code}
              onChange={setCode}
            />
          </div>

          {/* Terminal Output Console */}
          <div
            className={`h-56 shrink-0 overflow-hidden ${
              activeMobileTab === "code" ? "hidden lg:block" : "block"
            }`}
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <TerminalOutput
              result={execResult}
              isRunning={isRunning}
              isSubmitting={isSubmitting}
              customInput={customInput}
              onCustomInputChange={setCustomInput}
            />
          </div>
        </div>
      </div>

      {/* ─── DUEL FINISHED RESULTS MODAL ──────────────────────────────── */}
      {isFinished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-md p-6 text-center"
            style={{
              border: "1px solid var(--border-strong)",
              borderRadius: "4px",
              backgroundColor: "var(--bg)",
              boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
            }}
          >
            {isWinner ? (
              <>
                <div
                  className="h-12 w-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--success) 20%, transparent)",
                    color: "var(--success)",
                  }}
                >
                  <Trophy className="h-6 w-6" />
                </div>
                <h2 className="text-[22px] font-bold tracking-tight mb-1" style={{ color: "var(--success)" }}>
                  MATCH VICTORY!
                </h2>
                <p className="text-[12px] mb-4" style={{ color: "var(--fg-muted)" }}>
                  You won the Best of 3 Duel match!
                </p>
              </>
            ) : isDraw ? (
              <>
                <div
                  className="h-12 w-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    color: "var(--fg-dimmed)",
                  }}
                >
                  <Clock className="h-6 w-6" />
                </div>
                <h2 className="text-[20px] font-bold tracking-tight mb-1" style={{ color: "var(--fg)" }}>
                  MATCH DRAW
                </h2>
                <p className="text-[12px] mb-4" style={{ color: "var(--fg-muted)" }}>
                  The 3-round Duel match ended in an equal draw.
                </p>
              </>
            ) : (
              <>
                <div
                  className="h-12 w-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--danger) 20%, transparent)",
                    color: "var(--danger)",
                  }}
                >
                  <XCircle className="h-6 w-6" />
                </div>
                <h2 className="text-[20px] font-bold tracking-tight mb-1" style={{ color: "var(--danger)" }}>
                  MATCH DEFEAT
                </h2>
                <p className="text-[12px] mb-4" style={{ color: "var(--fg-muted)" }}>
                  Your opponent won the Best of 3 match.
                </p>
              </>
            )}

            {/* Score Summary Box */}
            <div
              className="p-3 text-[12px] mono rounded mb-4 flex justify-around"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border)" }}
            >
              <div>
                <span className="section-label block">Your Score</span>
                <span className="font-bold text-[15px]" style={{ color: "var(--accent)" }}>{myScore}</span>
              </div>
              <div className="flex items-center text-[13px] font-bold text-[var(--fg-dimmed)]">
                vs
              </div>
              <div>
                <span className="section-label block">Opponent Score</span>
                <span className="font-bold text-[15px]" style={{ color: "var(--fg)" }}>{opponentScore}</span>
              </div>
            </div>

            {/* Round by Round Breakdown */}
            <div className="space-y-1 mb-6 text-[11px] mono text-left">
              {room.roundsData.map((r) => {
                const rWinner = r.winner === currentUserId ? "You Won" : r.winner ? "Opponent Won" : "Draw";
                const isMyRoundWin = r.winner === currentUserId;
                return (
                  <div
                    key={r.roundNumber}
                    className="flex items-center justify-between px-3 py-1.5 rounded"
                    style={{ backgroundColor: "var(--bg-subtle)" }}
                  >
                    <span>Round {r.roundNumber}: {r.problemTitle}</span>
                    <span
                      className="font-bold"
                      style={{
                        color: isMyRoundWin
                          ? "var(--success)"
                          : r.winner
                          ? "var(--danger)"
                          : "var(--fg-dimmed)",
                      }}
                    >
                      {rWinner}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-3">
              <Link href="/duel" className="btn btn-secondary text-[12px] px-4 py-2">
                Back to Duel Hub
              </Link>
              <Link href="/problems" className="btn btn-primary text-[12px] px-4 py-2">
                Problems Directory
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
