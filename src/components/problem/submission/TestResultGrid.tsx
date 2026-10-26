"use client";

import React from "react";
import { LazyMotion, domAnimation, m } from "motion/react";
import { CheckCircle2, XCircle, MinusCircle, Clock, ShieldCheck } from "lucide-react";
import { SubmissionStatus, IFailedTestCaseInfo } from "@/types";
import { useReducedMotion } from "@/components/ui/alert-utils/use-reduced-motion";

interface TestResultGridProps {
  isJudging: boolean;
  isSlowJudge?: boolean;
  queuePosition?: number | null;
  placeholderCount?: number;
  status?: SubmissionStatus;
  testsPassed?: number;
  totalTests?: number;
  failedTestCase?: IFailedTestCaseInfo;
}

type SlotOutcome = "passed" | "failed" | "skipped";

interface TestSlotItem {
  index: number;
  outcome: SlotOutcome;
}

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/**
 * Renders either:
 * - Phase 2 (Judging): Indeterminate cyan scan sweep + neutral empty test slots (never fake pass/fail).
 * - Phase 3 (Verdict Reveal): Real per-test results staggered ~60ms apart (capped at ~900ms total,
 *   or instant when >20 tests or `prefers-reduced-motion` is enabled).
 */
export function TestResultGrid({
  isJudging,
  isSlowJudge = false,
  queuePosition = null,
  placeholderCount = 4,
  status,
  testsPassed = 0,
  totalTests = 0,
  failedTestCase,
}: TestResultGridProps) {
  const reduced = useReducedMotion();

  if (isJudging) {
    const slotCount = Math.min(Math.max(placeholderCount, 3), 6);
    const statusText = queuePosition
      ? `Queued (#${queuePosition}) — waiting for execution slot…`
      : "Judging…";

    return (
      <LazyMotion features={domAnimation} strict>
        <div
          className="relative overflow-hidden rounded-lg border border-[#252936] bg-[#11131A] p-3.5"
          aria-busy="true"
        >
          {/* Indeterminate cyan sweep across header */}
          {!reduced && (
            <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-[#181B24]">
              <m.div
                className="h-full w-1/3 bg-gradient-to-r from-transparent via-[#22D3EE] to-transparent"
                initial={{ x: "-100%" }}
                animate={{ x: "300%" }}
                transition={{
                  duration: 1.35,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-[#22D3EE] animate-pulse" />
              <span className="text-xs font-semibold text-[#F5F7FA]">
                {statusText}
              </span>
            </div>
            <span className="text-[11px] text-[#8B93A7]">
              Running hidden test suite
            </span>
          </div>

          {/* Neutral empty test slots (no fake verdicts) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Array.from({ length: slotCount }, (_, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-md border border-[#252936] bg-[#181B24]/70 px-2.5 py-2 text-[11px] text-[#8B93A7] animate-pulse"
              >
                <span className="font-mono">Slot {idx + 1}</span>
                <span className="text-[10px] uppercase tracking-wider text-[#525A70]">
                  Pending
                </span>
              </div>
            ))}
          </div>

          {isSlowJudge && (
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#FBBF24]">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>Still judging, this can take a moment…</span>
            </div>
          )}
        </div>
      </LazyMotion>
    );
  }

  if (!totalTests || totalTests <= 0 || status === "Compilation Error" || status === "System Error") {
    return null;
  }

  const failedIndex =
    status === "Accepted"
      ? -1
      : failedTestCase?.testCaseIndex ?? (testsPassed < totalTests ? testsPassed + 1 : -1);

  const slots: TestSlotItem[] = Array.from({ length: totalTests }, (_, i) => {
    const testNum = i + 1;
    if (testNum <= testsPassed) {
      return { index: testNum, outcome: "passed" };
    }
    if (testNum === failedIndex) {
      return { index: testNum, outcome: "failed" };
    }
    return { index: testNum, outcome: "skipped" };
  });

  // Stagger ~60ms apart, cap total at ~850ms; reveal all at once beyond 20 tests or reduced motion
  const revealAllAtOnce = reduced || totalTests > 20;
  const stepDelay = revealAllAtOnce
    ? 0
    : Math.min(0.06, 0.85 / Math.max(1, totalTests));

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="rounded-lg border border-[#252936] bg-[#11131A] p-3">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#F5F7FA]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#22D3EE]" />
            <span>Test Case Breakdown</span>
          </div>
          <span className="font-mono text-[11px] text-[#8B93A7]">
            {testsPassed} / {totalTests} passed
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
          {slots.map((slot, idx) => {
            const isPassed = slot.outcome === "passed";
            const isFailed = slot.outcome === "failed";

            return (
              <m.div
                key={slot.index}
                initial={
                  revealAllAtOnce
                    ? { opacity: 1, y: 0, scale: 1 }
                    : { opacity: 0, y: 4, scale: 0.96 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={
                  revealAllAtOnce
                    ? { duration: 0 }
                    : {
                        duration: 0.18,
                        delay: idx * stepDelay,
                        ease: EASE_OUT,
                      }
                }
                className={`flex items-center justify-between rounded border px-2.5 py-1.5 text-[11px] font-mono ${
                  isPassed
                    ? "border-[#22C55E]/30 bg-[#22C55E]/10 text-[#4ADE80]"
                    : isFailed
                    ? "border-[#EF4444]/35 bg-[#EF4444]/10 text-[#F87171]"
                    : "border-[#252936] bg-[#181B24]/50 text-[#8B93A7]"
                }`}
              >
                <span>Test #{slot.index}</span>
                <span className="inline-flex items-center gap-1 font-sans text-[10px] font-semibold">
                  {isPassed ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span>Pass</span>
                    </>
                  ) : isFailed ? (
                    <>
                      <XCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span>Fail</span>
                    </>
                  ) : (
                    <>
                      <MinusCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span>Skip</span>
                    </>
                  )}
                </span>
              </m.div>
            );
          })}
        </div>
      </div>
    </LazyMotion>
  );
}
