"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { mutate } from "swr";
import { SubmissionStatus, IFailedTestCaseInfo } from "@/types";

export type SubmissionPhase =
  | "idle"
  | "submitting"
  | "judging"
  | "result"
  | "error";

export interface SubmissionApiResponse {
  submissionId: string;
  status: SubmissionStatus;
  runtime: number;
  testsPassed: number;
  totalTests: number;
  awardedXp: number;
  awardedLanguagePoints?: number;
  isFirstSolve: boolean;
  currentStreak: number;
  totalXp: number;
  errorDetails?: string;
  failedTestCase?: IFailedTestCaseInfo;
  isTurboCMode?: boolean;
  turboCHint?: string;
}

export interface SubmissionLifecycleResult extends SubmissionApiResponse {
  previousStreak: number;
  streakIncreased: boolean;
  isFirstCelebrationForId: boolean;
}

export interface SubmissionInfrastructureError {
  kind: "rate_limit" | "judge_busy" | "conflict" | "network";
  title: string;
  message: string;
  retryAfter?: number;
}

export interface ProgressUpdateEventDetail {
  submissionId: string;
  awardedXp: number;
  totalXp: number;
  previousStreak: number;
  currentStreak: number;
  streakIncreased: boolean;
}

export const USER_PROGRESS_UPDATED_EVENT = "insidcode:user-progress-updated";

interface UseSubmissionLifecycleOptions {
  currentUserStreak?: number;
  onAccepted?: (result: SubmissionLifecycleResult) => void;
  onOverlayDismissed?: () => void;
}

const SLOW_JUDGE_THRESHOLD_MS = 10_000;
const OVERLAY_AUTO_SETTLE_MS = 3_000;

export function useSubmissionLifecycle(
  options: UseSubmissionLifecycleOptions = {}
) {
  const { currentUserStreak = 0, onAccepted, onOverlayDismissed } = options;

  const [phase, setPhase] = useState<SubmissionPhase>("idle");
  const [isSlowJudge, setIsSlowJudge] = useState(false);
  const [result, setResult] = useState<SubmissionLifecycleResult | null>(null);
  const [infraError, setInfraError] =
    useState<SubmissionInfrastructureError | null>(null);
  const [showAcceptedOverlay, setShowAcceptedOverlay] = useState(false);
  const [announcement, setAnnouncement] = useState<string>("");

  const inFlightRef = useRef(false);
  const celebratedIdsRef = useRef<Set<string>>(new Set());
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestStreakRef = useRef<number>(currentUserStreak);

  useEffect(() => {
    if (currentUserStreak > latestStreakRef.current) {
      latestStreakRef.current = currentUserStreak;
    }
  }, [currentUserStreak]);

  const clearTimers = useCallback(() => {
    if (slowTimerRef.current) {
      clearTimeout(slowTimerRef.current);
      slowTimerRef.current = null;
    }
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
    if (autoSettleTimerRef.current) {
      clearTimeout(autoSettleTimerRef.current);
      autoSettleTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const skipOverlay = useCallback(() => {
    if (autoSettleTimerRef.current) {
      clearTimeout(autoSettleTimerRef.current);
      autoSettleTimerRef.current = null;
    }
    setShowAcceptedOverlay((wasOpen) => {
      if (wasOpen) {
        onOverlayDismissed?.();
      }
      return false;
    });
  }, [onOverlayDismissed]);

  const resetLifecycle = useCallback(() => {
    clearTimers();
    setPhase("idle");
    setIsSlowJudge(false);
    setResult(null);
    setInfraError(null);
    setShowAcceptedOverlay(false);
    setAnnouncement("");
  }, [clearTimers]);

  const submit = useCallback(
    async (
      requestFn: () => Promise<Response>
    ): Promise<SubmissionLifecycleResult | null> => {
      // Hard synchronous guard against rapid double-clicks
      if (inFlightRef.current) {
        return null;
      }

      inFlightRef.current = true;
      clearTimers();
      setIsSlowJudge(false);
      setResult(null);
      setInfraError(null);
      setShowAcceptedOverlay(false);
      setAnnouncement("Submitting solution for evaluation.");

      // Phase 1: Press (0ms -> 140ms) -> Phase 2: Judging
      setPhase("submitting");
      phaseTimerRef.current = setTimeout(() => {
        if (inFlightRef.current) {
          setPhase("judging");
        }
      }, 140);

      // Slow judge timer (~10s)
      slowTimerRef.current = setTimeout(() => {
        if (inFlightRef.current) {
          setIsSlowJudge(true);
        }
      }, SLOW_JUDGE_THRESHOLD_MS);

      try {
        const res = await requestFn();
        const data = await res.json().catch(() => ({}));

        clearTimers();
        setIsSlowJudge(false);

        if (!res.ok) {
          if (res.status === 429) {
            const retryAfterHeader = res.headers.get("Retry-After");
            const retryAfter =
              Number(retryAfterHeader || data.retryAfter || data.reset) ||
              undefined;
            const message =
              data.message ||
              data.error ||
              "Too many submission attempts. Please wait a moment before submitting again.";
            setInfraError({
              kind: "rate_limit",
              title: "Rate limit reached",
              message,
              retryAfter,
            });
            setPhase("error");
            setAnnouncement(`Submission rate limited. ${message}`);
            return null;
          }

          if (res.status === 409) {
            const message =
              data.error ||
              "A submission is already in progress. Please wait for it to finish.";
            setInfraError({
              kind: "conflict",
              title: "Submission already in progress",
              message,
            });
            setPhase("error");
            setAnnouncement(message);
            return null;
          }

          const message =
            data.message ||
            data.error ||
            "The judge could not evaluate your submission right now. Your progress and stats were not affected.";
          setInfraError({
            kind: "judge_busy",
            title: "Judge is temporarily unavailable",
            message,
          });
          setPhase("error");
          setAnnouncement(`Submission error. ${message}`);
          return null;
        }

        // Check if 200 payload returned a System Error verdict (e.g. compiler circuit breaker or upstream outage)
        if (data.status === "System Error") {
          const message =
            data.errorDetails ||
            "Judge is busy, try again shortly. Your submission stats were not affected.";
          setInfraError({
            kind: "judge_busy",
            title: "Judge is busy, try again shortly",
            message,
          });
          setPhase("error");
          setAnnouncement(`Judge busy. ${message}`);
          return null;
        }

        const submissionId = String(
          data.submissionId || `sub_${Date.now()}`
        );
        const previousStreak = latestStreakRef.current;
        const returnedStreak =
          typeof data.currentStreak === "number"
            ? data.currentStreak
            : previousStreak;
        const streakIncreased = returnedStreak > previousStreak;
        if (returnedStreak > latestStreakRef.current) {
          latestStreakRef.current = returnedStreak;
        }

        const isFirstCelebrationForId =
          !celebratedIdsRef.current.has(submissionId);
        celebratedIdsRef.current.add(submissionId);

        const lifecycleResult: SubmissionLifecycleResult = {
          submissionId,
          status: data.status as SubmissionStatus,
          runtime: typeof data.runtime === "number" ? data.runtime : 0,
          testsPassed:
            typeof data.testsPassed === "number" ? data.testsPassed : 0,
          totalTests:
            typeof data.totalTests === "number" ? data.totalTests : 0,
          awardedXp:
            typeof data.awardedXp === "number" ? data.awardedXp : 0,
          awardedLanguagePoints:
            typeof data.awardedLanguagePoints === "number"
              ? data.awardedLanguagePoints
              : 0,
          isFirstSolve: Boolean(data.isFirstSolve),
          currentStreak: returnedStreak,
          totalXp: typeof data.totalXp === "number" ? data.totalXp : 0,
          errorDetails: data.errorDetails,
          failedTestCase: data.failedTestCase,
          previousStreak,
          streakIncreased,
          isFirstCelebrationForId,
        };

        setResult(lifecycleResult);
        setPhase("result");

        if (lifecycleResult.status === "Accepted") {
          const xpPart =
            lifecycleResult.awardedXp > 0
              ? ` Earned ${lifecycleResult.awardedXp} XP.`
              : "";
          setAnnouncement(
            `Accepted! ${lifecycleResult.testsPassed} of ${lifecycleResult.totalTests} tests passed.${xpPart}`
          );

          if (isFirstCelebrationForId) {
            setShowAcceptedOverlay(true);
            autoSettleTimerRef.current = setTimeout(() => {
              setShowAcceptedOverlay(false);
              onOverlayDismissed?.();
            }, OVERLAY_AUTO_SETTLE_MS);

            // Dispatch real progress event for Navbar XP / streak counter
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent<ProgressUpdateEventDetail>(
                  USER_PROGRESS_UPDATED_EVENT,
                  {
                    detail: {
                      submissionId,
                      awardedXp: lifecycleResult.awardedXp,
                      totalXp: lifecycleResult.totalXp,
                      previousStreak,
                      currentStreak: returnedStreak,
                      streakIncreased,
                    },
                  }
                )
              );

              // Invalidate SWR caches for stats, problem directory, and user state
              mutate(
                (key) =>
                  Array.isArray(key) &&
                  typeof key[1] === "string" &&
                  (key[1].startsWith("/api/stats") ||
                    key[1].startsWith("/api/problems") ||
                    key[1].startsWith("/api/leaderboard")),
                undefined,
                { revalidate: true }
              );
            }
          }

          onAccepted?.(lifecycleResult);
        } else {
          setAnnouncement(
            `${lifecycleResult.status}. ${lifecycleResult.testsPassed} of ${lifecycleResult.totalTests} tests passed.`
          );
        }

        return lifecycleResult;
      } catch {
        clearTimers();
        setIsSlowJudge(false);
        const message =
          "Could not reach the submission server. Check your connection and try again.";
        setInfraError({
          kind: "network",
          title: "Network error during submission",
          message,
        });
        setPhase("error");
        setAnnouncement(message);
        return null;
      } finally {
        inFlightRef.current = false;
      }
    },
    [clearTimers, onAccepted, onOverlayDismissed]
  );

  return {
    phase,
    isSubmittingOrJudging: phase === "submitting" || phase === "judging",
    isSlowJudge,
    result,
    infraError,
    showAcceptedOverlay,
    announcement,
    submit,
    skipOverlay,
    resetLifecycle,
  };
}
