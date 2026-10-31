"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LazyMotion, domAnimation, m } from "motion/react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Terminal,
  SlidersHorizontal,
  Award,
  Code2,
  Flame,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Trophy,
} from "lucide-react";
import { SubmissionStatus, IFailedTestCaseInfo } from "@/types";
import {
  SubmissionPhase,
  SubmissionLifecycleResult,
  SubmissionInfrastructureError,
} from "@/hooks/useSubmissionLifecycle";
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  AlertAction,
} from "@/components/ui/alert";
import { useReducedMotion } from "@/components/ui/alert-utils/use-reduced-motion";
import { TestResultGrid } from "@/components/problem/submission/TestResultGrid";
import { SubmissionStatusOverlay } from "@/components/problem/submission/SubmissionStatusOverlay";

export interface ExecutionResultData {
  status?: SubmissionStatus;
  stdout?: string;
  stderr?: string;
  output?: string;
  runtime?: number;
  testsPassed?: number;
  totalTests?: number;
  awardedXp?: number;
  awardedLanguagePoints?: number;
  languageAlreadyRewarded?: boolean;
  isFirstSolve?: boolean;
  language?: string;
  solvedLanguages?: string[];
  unsolvedLanguages?: string[];
  nextProblem?: {
    problemId: string;
    title: string;
    phase: number;
  } | null;
  isAllSolved?: boolean;
  errorDetails?: string;
  systemError?: string;
  failedTestCase?: IFailedTestCaseInfo;
  isTurboCMode?: boolean;
  turboCHint?: string;
}

interface TerminalOutputProps {
  result: ExecutionResultData | null;
  isRunning: boolean;
  isSubmitting: boolean;
  queuePosition?: number | null;
  customInput: string;
  onCustomInputChange: (val: string) => void;
  submissionPhase?: SubmissionPhase;
  isSlowJudge?: boolean;
  submissionResult?: SubmissionLifecycleResult | null;
  infraError?: SubmissionInfrastructureError | null;
  showAcceptedOverlay?: boolean;
  onSkipOverlay?: () => void;
  onRetrySubmit?: () => void;
  placeholderSlotCount?: number;
}

function formatLanguageName(lang?: string): string {
  switch (lang?.toLowerCase()) {
    case "python":
      return "Python";
    case "javascript":
      return "JavaScript";
    case "c":
      return "C";
    case "cpp":
      return "C++";
    case "java":
      return "Java";
    default:
      return lang ? lang.toUpperCase() : "Code";
  }
}

function formatUnsolvedHint(unsolved?: string[]): string | null {
  if (!unsolved || unsolved.length === 0) {
    return "Mastered in all supported languages!";
  }
  const formatted = unsolved.map(formatLanguageName);
  if (formatted.length === 1) {
    return `Solve it in ${formatted[0]} for +10 XP`;
  }
  if (formatted.length === 2) {
    return `Solve it in ${formatted[0]} or ${formatted[1]} for +10 XP each`;
  }
  const last = formatted[formatted.length - 1];
  const others = formatted.slice(0, -1).join(", ");
  return `Solve it in ${others}, or ${last} for +10 XP each`;
}

export function TerminalOutput({
  result,
  isRunning,
  isSubmitting,
  queuePosition,
  customInput,
  onCustomInputChange,
  submissionPhase = "idle",
  isSlowJudge = false,
  submissionResult = null,
  infraError = null,
  showAcceptedOverlay = false,
  onSkipOverlay,
  onRetrySubmit,
  placeholderSlotCount = 4,
}: TerminalOutputProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"output" | "input">("output");
  const reduced = useReducedMotion();

  const nextProblem = result?.nextProblem || submissionResult?.nextProblem || null;
  const isAllSolved = Boolean(result?.isAllSolved || submissionResult?.isAllSolved);
  const unsolvedLanguages = result?.unsolvedLanguages || submissionResult?.unsolvedLanguages;
  const unsolvedHint = formatUnsolvedHint(unsolvedLanguages);

  useEffect(() => {
    if (result?.status !== "Accepted" || !nextProblem) return;
    router.prefetch(`/problems/${nextProblem.problemId}`);

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if ((e.altKey && e.key.toLowerCase() === "n") || e.key === "Enter") {
        e.preventDefault();
        router.push(`/problems/${nextProblem.problemId}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [result?.status, nextProblem, router]);

  const isJudgingPhase =
    isSubmitting ||
    submissionPhase === "submitting" ||
    submissionPhase === "judging";

  const getStatusMeta = (status?: SubmissionStatus) => {
    switch (status) {
      case "Accepted":
        return {
          icon: CheckCircle2,
          color: "text-[#4ADE80]",
          bg: "bg-[#22C55E]/10 border-[#22C55E]/30",
          label: "Accepted",
          explanation: null,
        };
      case "Wrong Answer":
        return {
          icon: XCircle,
          color: "text-[#F87171]",
          bg: "bg-[#EF4444]/10 border-[#EF4444]/35",
          label: "Wrong Answer",
          explanation: null,
        };
      case "Time Limit Exceeded":
        return {
          icon: Clock,
          color: "text-[#FBBF24]",
          bg: "bg-[#F59E0B]/10 border-[#F59E0B]/35",
          label: "Time Limit Exceeded",
          explanation:
            "Your solution took too long to finish. Check for infinite loops or optimize your algorithm.",
        };
      case "Compilation Error":
        return {
          icon: Code2,
          color: "text-[#F87171]",
          bg: "bg-[#EF4444]/10 border-[#EF4444]/35",
          label: "Compilation Error",
          explanation:
            "Your code did not compile. Fix the syntax or type errors below and try again.",
        };
      case "Runtime Error":
        return {
          icon: AlertTriangle,
          color: "text-[#F87171]",
          bg: "bg-[#EF4444]/10 border-[#EF4444]/35",
          label: "Runtime Error",
          explanation:
            "Your program exited with a runtime exception while executing a test case.",
        };
      case "System Error":
        return {
          icon: ShieldAlert,
          color: "text-[#FBBF24]",
          bg: "bg-[#F59E0B]/10 border-[#F59E0B]/35",
          label: "Judge is busy, try again shortly",
          explanation:
            "The execution service could not complete evaluation right now. Your progress and stats were not affected.",
        };
      default:
        return null;
    }
  };

  const badge = getStatusMeta(result?.status);
  const hasInfraIssue =
    Boolean(infraError) ||
    Boolean(result?.systemError) ||
    result?.status === "System Error";

  return (
    <div
      className="relative flex h-full flex-col text-xs font-mono"
      style={{ backgroundColor: "var(--bg)", color: "var(--fg)" }}
    >
      {/* Header Tabs */}
      <div
        className="flex items-center justify-between px-3 py-1.5"
        style={{
          borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--bg-secondary, var(--bg))",
        }}
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("output")}
            className="flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition"
            style={
              activeTab === "output"
                ? {
                    backgroundColor: "var(--bg-tertiary, var(--bg))",
                    color: "#00F0FF",
                  }
                : { color: "var(--fg-muted)" }
            }
          >
            <Terminal className="h-3.5 w-3.5" />
            Terminal Output
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("input")}
            className="flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition"
            style={
              activeTab === "input"
                ? {
                    backgroundColor: "var(--bg-tertiary, var(--bg))",
                    color: "#00F0FF",
                  }
                : { color: "var(--fg-muted)" }
            }
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Custom Input
          </button>
        </div>

        {/* Runtime info */}
        {result?.runtime !== undefined && !isJudgingPhase && !isRunning && (
          <span style={{ color: "var(--fg-muted)" }}>
            Runtime: {result.runtime}s
          </span>
        )}
      </div>

      {/* Main Tab Content Wrapper (relative for Accepted Overlay) */}
      <div className="relative flex-1 overflow-hidden">
        {/* Phase 4A Full-Panel Accepted Celebration Overlay (never covers code editor) */}
        <SubmissionStatusOverlay
          open={Boolean(showAcceptedOverlay)}
          result={submissionResult}
          onSkip={onSkipOverlay ?? (() => {})}
        />

        <div className="h-full overflow-y-auto p-3">
          {activeTab === "input" ? (
            <div className="flex h-full flex-col">
              <label
                className="mb-1.5 text-[11px]"
                style={{ color: "var(--fg-muted)" }}
              >
                Standard Input (stdin) - Test your code with custom data:
              </label>
              <textarea
                value={customInput}
                onChange={(e) => onCustomInputChange(e.target.value)}
                placeholder="Enter custom input here..."
                rows={5}
                className="w-full flex-1 resize-none rounded-md p-2.5 text-xs focus:outline-none"
                style={{
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--bg-secondary, var(--bg))",
                  color: "var(--fg)",
                }}
              />
            </div>
          ) : (
            <div>
              {isJudgingPhase ? (
                /* Phase 2: Judging — Indeterminate scan + neutral empty test slots */
                <TestResultGrid
                  isJudging={true}
                  isSlowJudge={isSlowJudge}
                  queuePosition={queuePosition}
                  placeholderCount={placeholderSlotCount}
                />
              ) : isRunning ? (
                /* Custom Run In-Flight State */
                <div
                  className="relative overflow-hidden rounded-lg border border-[#252936] bg-[#11131A] p-4"
                  aria-busy="true"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#22D3EE] border-t-transparent shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-[#F5F7FA]">
                        {queuePosition
                          ? `Queued (#${queuePosition}) — waiting for worker slot…`
                          : "Running code against custom input…"}
                      </p>
                      <p className="text-[11px] text-[#8B93A7] mt-0.5">
                        Standard output will appear here as soon as execution completes.
                      </p>
                    </div>
                  </div>
                </div>
              ) : hasInfraIssue ? (
                /* Phase 4C: Rate-limit (429) or Judge Busy / Infrastructure Alert */
                <div className="font-sans">
                  <Alert
                    variant={
                      infraError?.kind === "rate_limit" ? "warning" : "error"
                    }
                    role="alert"
                  >
                    <AlertIcon>
                      {infraError?.kind === "rate_limit" ? (
                        <Clock className="size-full" />
                      ) : (
                        <ShieldAlert className="size-full" />
                      )}
                    </AlertIcon>
                    <AlertTitle>
                      {infraError?.title ||
                        "Judge is busy, try again shortly"}
                    </AlertTitle>
                    <AlertDescription>
                      {infraError?.message ||
                        result?.systemError ||
                        result?.errorDetails ||
                        "The execution service could not evaluate your submission right now. Your code and stats were not penalized."}
                    </AlertDescription>
                    {onRetrySubmit && (
                      <AlertAction>
                        <button
                          type="button"
                          onClick={onRetrySubmit}
                          className="inline-flex items-center gap-1.5 rounded-md border border-[#252936] bg-[#181B24] px-2.5 py-1 text-xs font-semibold text-[#F5F7FA] hover:border-[#22D3EE]/50 hover:text-[#22D3EE] transition cursor-pointer"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Try again</span>
                        </button>
                      </AlertAction>
                    )}
                  </Alert>
                </div>
              ) : !result ? (
                <div
                  className="py-8 text-center"
                  style={{ color: "var(--fg-muted)" }}
                >
                  Run your code or submit for automated test verification.
                </div>
              ) : (
                <LazyMotion features={domAnimation} strict>
                  <div className="space-y-4">
                    {/* Dedicated Full Accepted Result Card */}
                    {result.status === "Accepted" ? (
                      <div className="rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/5 p-4 sm:p-5 space-y-4">
                        {/* Top Row: Big checkmark + Accepted + Tests Passed + Runtime */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#22C55E]/20 border border-[#22C55E]/40 text-[#4ADE80] shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-[#F5F7FA]">Accepted</h3>
                                {result.isTurboCMode && (
                                  <span className="inline-flex items-center gap-1 rounded border border-[#00F0FF]/30 bg-[#00F0FF]/10 px-2 py-0.5 text-[10px] font-semibold text-[#00F0FF]">
                                    Turbo C mode
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#8B93A7]">
                                {result.testsPassed} / {result.totalTests} tests passed
                                {typeof result.runtime === "number" && ` • ${result.runtime} ms`}
                                {result.language && ` • ${formatLanguageName(result.language)}`}
                              </p>
                            </div>
                          </div>

                          {/* Badges: XP & Streak */}
                          <div className="flex flex-wrap items-center gap-2">
                            {result.awardedXp && result.awardedXp > 0 ? (
                              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#22D3EE]/35 bg-[#22D3EE]/15 px-3 py-1 text-xs font-bold text-[#22D3EE]">
                                <Award className="h-3.5 w-3.5" />
                                <span>+{result.awardedXp} XP earned</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#8B93A7]/30 bg-[#181B24] px-3 py-1 text-xs font-medium text-[#8B93A7]">
                                <span>Already solved in {formatLanguageName(result.language)} · 0 XP</span>
                              </div>
                            )}

                            {submissionResult?.streakIncreased && submissionResult.currentStreak > 0 && (
                              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#F59E0B]/35 bg-[#F59E0B]/15 px-3 py-1 text-xs font-bold text-[#FBBF24]">
                                <Flame className="h-3.5 w-3.5" />
                                <span>{submissionResult.currentStreak}-day streak</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Points breakdown & Data-driven language hint */}
                        <div className="rounded-lg border border-[#252936] bg-[#11131A] p-3 text-xs space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[#8B93A7]">
                            <span className="flex items-center gap-1.5 text-[#F5F7FA]">
                              <Code2 className="h-4 w-4 text-[#00F0FF]" />
                              <span>Language points:</span>
                              <strong className="text-[#4ADE80]">
                                {result.awardedXp && result.awardedXp > 0
                                  ? `+10 ${formatLanguageName(result.language)} XP`
                                  : `+0 XP (${formatLanguageName(result.language)} already recorded)`}
                              </strong>
                            </span>
                            {submissionResult?.totalXp ? (
                              <span className="text-[#8B93A7]">
                                Total XP: <strong className="text-[#F5F7FA]">{submissionResult.totalXp}</strong>
                              </span>
                            ) : null}
                          </div>

                          {/* Data-driven Hint for remaining languages */}
                          {unsolvedHint && (
                            <div className="flex items-center gap-2 pt-1 border-t border-[#252936]/60 text-[11px] text-[#22D3EE]">
                              <Sparkles className="h-3.5 w-3.5 shrink-0" />
                              <span>{unsolvedHint}</span>
                            </div>
                          )}
                        </div>

                        {/* Next Problem Primary Action */}
                        <div className="pt-1 flex flex-wrap items-center gap-3">
                          {nextProblem ? (
                            <button
                              type="button"
                              onClick={() => router.push(`/problems/${nextProblem.problemId}`)}
                              onMouseEnter={() => router.prefetch(`/problems/${nextProblem.problemId}`)}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E0] active:scale-[0.99] px-5 py-2.5 text-xs font-bold text-[#090A0F] shadow-[0_0_15px_rgba(0,240,255,0.25)] transition cursor-pointer"
                            >
                              <span>Next Problem: {nextProblem.title}</span>
                              <ArrowRight className="h-4 w-4" />
                              <span className="text-[10px] opacity-75 font-mono ml-1 hidden sm:inline">(Enter)</span>
                            </button>
                          ) : isAllSolved ? (
                            <div className="w-full flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-3">
                              <div className="flex items-center gap-2 text-xs font-bold text-[#FBBF24]">
                                <Trophy className="h-4 w-4 shrink-0" />
                                <span>You&apos;ve solved every problem on InsidCode!</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => router.push("/problems")}
                                className="inline-flex items-center gap-1.5 rounded-md border border-[#F59E0B]/40 bg-[#11131A] px-3 py-1.5 text-xs font-semibold text-[#FBBF24] hover:bg-[#F59E0B]/20 transition cursor-pointer"
                              >
                                <span>View Problems Directory</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => router.push("/problems")}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E0] active:scale-[0.99] px-5 py-2.5 text-xs font-bold text-[#090A0F] shadow-[0_0_15px_rgba(0,240,255,0.25)] transition cursor-pointer"
                            >
                              <span>Explore More Problems</span>
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Non-Accepted Verdict Banner (Wrong Answer, TLE, etc.) */
                      badge && (
                        <m.div
                          key={`verdict-banner-${
                            submissionResult?.submissionId ?? result.status
                          }`}
                          initial={{ x: 0 }}
                          animate={
                            result.status === "Wrong Answer" && !reduced
                              ? { x: [0, -6, 6, -4, 4, 0] }
                              : { x: 0 }
                          }
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 ${badge.bg}`}
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <badge.icon
                                className={`h-4 w-4 shrink-0 ${badge.color}`}
                                aria-hidden="true"
                              />
                              <span className={`font-semibold ${badge.color}`}>
                                {badge.label}
                              </span>
                              {result.totalTests ? (
                                <span
                                  className="text-[11px]"
                                  style={{ color: "var(--fg-muted)" }}
                                >
                                  ({result.testsPassed} / {result.totalTests}{" "}
                                  tests passed)
                                </span>
                              ) : null}
                              {result.isTurboCMode && (
                                <span className="inline-flex items-center gap-1 rounded border border-[#00F0FF]/30 bg-[#00F0FF]/10 px-2 py-0.5 text-[10px] font-semibold text-[#00F0FF]">
                                  Judged in Turbo C mode
                                </span>
                              )}
                            </div>
                            {badge.explanation && (
                              <p className="font-sans text-[11px] text-[#8B93A7]">
                                {badge.explanation}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {onRetrySubmit && (
                              <button
                                type="button"
                                onClick={onRetrySubmit}
                                className="inline-flex items-center gap-1 rounded-md border border-[#252936] bg-[#11131A]/90 px-2.5 py-1 font-sans text-[11px] font-semibold text-[#F5F7FA] hover:border-[#22D3EE]/50 hover:text-[#22D3EE] transition cursor-pointer"
                              >
                                <RotateCcw className="h-3 w-3" />
                                <span>Try again</span>
                              </button>
                            )}
                          </div>
                        </m.div>
                      )
                    )}

                    {/* Phase 3: Staggered Per-Test Result Reveal Grid */}
                    {result.totalTests &&
                    result.totalTests > 0 &&
                    result.status !== "Compilation Error" ? (
                      <TestResultGrid
                        isJudging={false}
                        status={result.status}
                        testsPassed={result.testsPassed}
                        totalTests={result.totalTests}
                        failedTestCase={result.failedTestCase}
                      />
                    ) : null}

                    {/* Detailed Test Case Comparison Card for Wrong Answer */}
                    {result.status === "Wrong Answer" &&
                      result.failedTestCase && (
                        <div
                          className="rounded-lg p-3.5 space-y-3"
                          style={{
                            border:
                              "1px solid color-mix(in srgb, #EF4444 35%, transparent)",
                            backgroundColor: "var(--bg-secondary, var(--bg))",
                          }}
                        >
                          {result.failedTestCase.hint && (
                            <div className="flex items-start gap-2 rounded-md border border-[#F59E0B]/40 bg-[#F59E0B]/10 p-2.5 text-xs text-[#FBBF24]">
                              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                              <span>{result.failedTestCase.hint}</span>
                            </div>
                          )}
                          <div
                            className="flex items-center justify-between border-b pb-2"
                            style={{ borderColor: "var(--border)" }}
                          >
                            <span className="font-semibold text-xs text-[#F87171]">
                              Failed on Test Case #
                              {result.failedTestCase.testCaseIndex}
                            </span>
                            {result.failedTestCase.isPublic ? (
                              <span className="text-[10px] text-[#8B93A7] uppercase tracking-wider bg-[#181B24] px-2 py-0.5 rounded">
                                Sample Test
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#FBBF24] uppercase tracking-wider bg-[#F59E0B]/10 px-2 py-0.5 rounded border border-[#F59E0B]/30">
                                Hidden Test
                              </span>
                            )}
                          </div>

                          {result.failedTestCase.isPublic ? (
                            <div className="space-y-2.5">
                              {/* Input */}
                              <div>
                                <span className="text-[10px] font-semibold text-[#8B93A7] uppercase tracking-wider block mb-1">
                                  Input:
                                </span>
                                <pre
                                  className="rounded p-2 text-xs font-mono text-[#F5F7FA] whitespace-pre-wrap"
                                  style={{
                                    backgroundColor: "var(--bg)",
                                    border: "1px solid var(--border)",
                                  }}
                                >
                                  {result.failedTestCase.input || "(no input)"}
                                </pre>
                              </div>

                              {/* Expected Output */}
                              <div>
                                <span className="text-[10px] font-semibold text-[#8B93A7] uppercase tracking-wider block mb-1">
                                  Expected Output:
                                </span>
                                <pre
                                  className="rounded p-2 text-xs font-mono text-[#4ADE80] whitespace-pre-wrap"
                                  style={{
                                    backgroundColor: "var(--bg)",
                                    border: "1px solid var(--border)",
                                  }}
                                >
                                  {result.failedTestCase.expectedOutput}
                                </pre>
                              </div>

                              {/* Your Output */}
                              <div>
                                <span className="text-[10px] font-semibold text-[#8B93A7] uppercase tracking-wider block mb-1">
                                  Your Output:
                                </span>
                                <pre
                                  className="rounded p-2 text-xs font-mono text-[#F87171] whitespace-pre-wrap"
                                  style={{
                                    backgroundColor: "var(--bg)",
                                    border: "1px solid var(--border)",
                                  }}
                                >
                                  {result.failedTestCase.actualOutput ||
                                    "(empty output)"}
                                </pre>
                              </div>
                            </div>
                          ) : (
                            <div className="p-2.5 rounded bg-[#181B24] border border-[#252936] space-y-1">
                              <p className="text-xs font-semibold text-[#F5F7FA]">
                                A hidden test case failed.
                              </p>
                              <p className="text-[11px] text-[#8B93A7] leading-relaxed font-sans">
                                Input and expected output are concealed to
                                preserve problem evaluation integrity.
                              </p>
                            </div>
                          )}

                          {/* Remaining failed tests note */}
                          {result.failedTestCase.remainingFailedCount !==
                            undefined &&
                            result.failedTestCase.remainingFailedCount > 0 && (
                              <p
                                className="text-[11px] text-[#8B93A7] pt-1 border-t italic font-sans"
                                style={{ borderColor: "var(--border)" }}
                              >
                                {result.failedTestCase.remainingFailedCount} more
                                test case
                                {result.failedTestCase.remainingFailedCount > 1
                                  ? "s"
                                  : ""}{" "}
                                skipped after failure.
                              </p>
                            )}
                        </div>
                      )}

                    {/* Compilation / Runtime / TLE Diagnostic Box */}
                    {result.status !== "Wrong Answer" &&
                      (result.errorDetails ||
                        result.systemError ||
                        result.stderr) && (
                        <div
                          className="rounded-lg p-3 text-[#F87171]"
                          style={{
                            border: "1px solid rgba(239,68,68,0.3)",
                            backgroundColor: "var(--bg-secondary, var(--bg))",
                          }}
                        >
                          <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider">
                            <span>
                              {result.status === "Compilation Error"
                                ? "Compiler Output"
                                : result.status === "Runtime Error"
                                ? "Runtime Diagnostic"
                                : result.status === "Time Limit Exceeded"
                                ? "Execution Timeout"
                                : "Diagnostic Details"}
                            </span>
                            {result.errorDetails?.includes("graphics.h") && (
                              <span className="text-[10px] font-medium text-[#FBBF24] bg-[#F59E0B]/10 px-2 py-0.5 rounded border border-[#F59E0B]/30 lowercase">
                                Environment limitation (not a logic error)
                              </span>
                            )}
                          </div>
                          <pre className="whitespace-pre-wrap font-mono text-xs">
                            {result.errorDetails ||
                              result.systemError ||
                              result.stderr}
                          </pre>
                        </div>
                      )}

                    {/* Standard Output for Run or when present */}
                    {result.status !== "Wrong Answer" &&
                      (result.stdout || result.output) && (
                        <div
                          className="rounded-lg p-3"
                          style={{
                            border: "1px solid var(--border)",
                            backgroundColor: "var(--bg-secondary, var(--bg))",
                          }}
                        >
                          <div
                            className="mb-1 text-[11px] font-semibold uppercase tracking-wider"
                            style={{ color: "var(--fg-muted)" }}
                          >
                            Standard Output
                          </div>
                          <pre
                            className="whitespace-pre-wrap font-mono text-xs"
                            style={{ color: "var(--fg)" }}
                          >
                            {result.stdout || result.output}
                          </pre>
                        </div>
                      )}
                  </div>
                </LazyMotion>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
