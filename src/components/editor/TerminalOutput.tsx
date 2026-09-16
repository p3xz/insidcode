"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Clock, Terminal, SlidersHorizontal, Award } from "lucide-react";
import { SubmissionStatus } from "@/types";

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
}

interface TerminalOutputProps {
  result: ExecutionResultData | null;
  isRunning: boolean;
  isSubmitting: boolean;
  queuePosition?: number | null;
  customInput: string;
  onCustomInputChange: (val: string) => void;
}

export function TerminalOutput({
  result,
  isRunning,
  isSubmitting,
  queuePosition,
  customInput,
  onCustomInputChange,
}: TerminalOutputProps) {
  const [activeTab, setActiveTab] = useState<"output" | "input">("output");

  const getStatusBadge = (status?: SubmissionStatus) => {
    switch (status) {
      case "Accepted":
        return {
          icon: CheckCircle2,
          color: "text-[#39FF14]",
          bg: "bg-[#39FF14]/10 border-[#39FF14]/30",
          label: "Accepted",
        };
      case "Wrong Answer":
        return {
          icon: XCircle,
          color: "text-[#FF4D6D]",
          bg: "bg-[#FF4D6D]/10 border-[#FF4D6D]/30",
          label: "Wrong Answer",
        };
      case "Time Limit Exceeded":
        return {
          icon: Clock,
          color: "text-[#F59E0B]",
          bg: "bg-[#F59E0B]/10 border-[#F59E0B]/30",
          label: "Time Limit Exceeded",
        };
      case "Compilation Error":
      case "Runtime Error":
      case "System Error":
        return {
          icon: AlertTriangle,
          color: "text-[#FF4D6D]",
          bg: "bg-[#FF4D6D]/10 border-[#FF4D6D]/30",
          label: status,
        };
      default:
        return null;
    }
  };

  const badge = getStatusBadge(result?.status);

  return (
    <div
      className="flex h-full flex-col text-xs font-mono"
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
            onClick={() => setActiveTab("output")}
            className="flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition"
            style={
              activeTab === "output"
                ? { backgroundColor: "var(--bg-tertiary, var(--bg))", color: "#00F0FF" }
                : { color: "var(--fg-muted)" }
            }
          >
            <Terminal className="h-3.5 w-3.5" />
            Terminal Output
          </button>
          <button
            onClick={() => setActiveTab("input")}
            className="flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition"
            style={
              activeTab === "input"
                ? { backgroundColor: "var(--bg-tertiary, var(--bg))", color: "#00F0FF" }
                : { color: "var(--fg-muted)" }
            }
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Custom Input
          </button>
        </div>

        {/* Runtime info */}
        {result?.runtime !== undefined && (
          <span style={{ color: "var(--fg-muted)" }}>Runtime: {result.runtime}s</span>
        )}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === "input" ? (
          <div className="flex h-full flex-col">
            <label className="mb-1.5 text-[11px]" style={{ color: "var(--fg-muted)" }}>
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
            {isRunning || isSubmitting ? (
              <div className="flex flex-col items-center justify-center py-10" style={{ color: "var(--fg-muted)" }}>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#00F0FF] border-t-transparent mb-2" />
                <p>
                  {isSubmitting
                    ? "Evaluating test cases..."
                    : queuePosition
                    ? `Queued in position #${queuePosition}, waiting for worker slot...`
                    : "Running code..."}
                </p>
              </div>
            ) : !result ? (
              <div className="py-8 text-center" style={{ color: "var(--fg-muted)" }}>
                Run your code or submit for automated test verification.
              </div>
            ) : (
              <div className="space-y-3">
                {/* Status Result Header */}
                {badge && (
                  <div className={`flex items-center justify-between rounded-lg border p-3 ${badge.bg}`}>
                    <div className="flex items-center gap-2">
                      <badge.icon className={`h-4 w-4 ${badge.color}`} />
                      <span className={`font-semibold ${badge.color}`}>{badge.label}</span>
                      {result.totalTests ? (
                        <span className="text-[11px]" style={{ color: "var(--fg-muted)" }}>
                          ({result.testsPassed} / {result.totalTests} test cases passed)
                        </span>
                      ) : null}
                    </div>

                    {result.awardedXp && result.awardedXp > 0 ? (
                      <div className="flex items-center gap-1 font-bold text-[#00F0FF]">
                        <Award className="h-4 w-4" />
                        <span>+{result.awardedXp} XP</span>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Error Box */}
                {(result.errorDetails || result.systemError || result.stderr) && (
                  <div
                    className="rounded-lg p-3 text-[#FF4D6D]"
                    style={{
                      border: "1px solid rgba(255,77,109,0.3)",
                      backgroundColor: "var(--bg-secondary, var(--bg))",
                    }}
                  >
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider">Error Details</div>
                    <pre className="whitespace-pre-wrap font-mono text-xs">
                      {result.errorDetails || result.systemError || result.stderr}
                    </pre>
                  </div>
                )}

                {/* Standard Output */}
                {(result.stdout || result.output) && (
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
                    <pre className="whitespace-pre-wrap font-mono text-xs" style={{ color: "var(--fg)" }}>
                      {result.stdout || result.output}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
