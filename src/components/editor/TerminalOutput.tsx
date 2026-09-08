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
  customInput: string;
  onCustomInputChange: (val: string) => void;
}

export function TerminalOutput({
  result,
  isRunning,
  isSubmitting,
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
    <div className="flex h-full flex-col bg-[#090A0F] text-xs font-mono">
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-[#252936] bg-[#11131A] px-3 py-1.5">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("output")}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition ${
              activeTab === "output"
                ? "bg-[#181B24] text-[#00F0FF]"
                : "text-[#8B93A7] hover:text-[#F5F7FA]"
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            Terminal Output
          </button>
          <button
            onClick={() => setActiveTab("input")}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition ${
              activeTab === "input"
                ? "bg-[#181B24] text-[#00F0FF]"
                : "text-[#8B93A7] hover:text-[#F5F7FA]"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Custom Input
          </button>
        </div>

        {/* Runtime info */}
        {result?.runtime !== undefined && (
          <span className="text-[11px] text-[#8B93A7]">Runtime: {result.runtime}s</span>
        )}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === "input" ? (
          <div className="flex h-full flex-col">
            <label className="mb-1.5 text-[11px] text-[#8B93A7]">
              Standard Input (stdin) - Test your code with custom data:
            </label>
            <textarea
              value={customInput}
              onChange={(e) => onCustomInputChange(e.target.value)}
              placeholder="Enter custom input here..."
              rows={5}
              className="w-full flex-1 resize-none rounded-md border border-[#252936] bg-[#11131A] p-2.5 text-xs text-[#F5F7FA] placeholder-[#5E667B] focus:border-[#00F0FF] focus:outline-none"
            />
          </div>
        ) : (
          <div>
            {isRunning || isSubmitting ? (
              <div className="flex flex-col items-center justify-center py-10 text-[#8B93A7]">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#00F0FF] border-t-transparent mb-2" />
                <p>{isSubmitting ? "Evaluating test cases..." : "Running code..."}</p>
              </div>
            ) : !result ? (
              <div className="py-8 text-center text-[#5E667B]">
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
                        <span className="text-[11px] text-[#8B93A7]">
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
                  <div className="rounded-lg border border-[#FF4D6D]/30 bg-[#181B24] p-3 text-[#FF4D6D]">
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider">Error Details</div>
                    <pre className="whitespace-pre-wrap font-mono text-xs">
                      {result.errorDetails || result.systemError || result.stderr}
                    </pre>
                  </div>
                )}

                {/* Standard Output */}
                {(result.stdout || result.output) && (
                  <div className="rounded-lg border border-[#252936] bg-[#11131A] p-3">
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#8B93A7]">
                      Standard Output
                    </div>
                    <pre className="whitespace-pre-wrap font-mono text-xs text-[#F5F7FA]">
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
