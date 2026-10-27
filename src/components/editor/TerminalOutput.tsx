"use client";

import React, { useState } from "react";
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
  isFirstSolve?: boolean;
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
  const [activeTab, setActiveTab] = useState<"output" | "input">("output");
  const reduced = useReducedMotion();

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
                  <div className="space-y-3">
                    {/* Status Result Header (with restrained 300ms shake on Wrong Answer) */}
                    {badge && (
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
                          {result.status === "Accepted" && (
                            <>
                              {result.awardedXp && result.awardedXp > 0 ? (
                                <div className="inline-flex items-center gap-1 rounded-full border border-[#22D3EE]/35 bg-[#22D3EE]/10 px-2.5 py-0.5 font-bold text-[#22D3EE]">
                                  <Award className="h-3.5 w-3.5" />
                                  <span>+{result.awardedXp} XP</span>
                                </div>
                              ) : submissionResult ? (
                                <span className="font-sans text-[11px] text-[#8B93A7]">
                                  Previously solved · 0 XP
                                </span>
                              ) : null}

                              {submissionResult?.streakIncreased &&
                                submissionResult.currentStreak > 0 && (
                                  <div className="inline-flex items-center gap-1 rounded-full border border-[#F59E0B]/35 bg-[#F59E0B]/10 px-2.5 py-0.5 font-bold text-[#FBBF24]">
                                    <Flame className="h-3.5 w-3.5" />
                                    <span>
                                      {submissionResult.currentStreak}-day
                                      streak
                                    </span>
                                  </div>
                                )}
                            </>
                          )}

                          {result.status !== "Accepted" && onRetrySubmit && (
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
