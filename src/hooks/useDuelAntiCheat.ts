"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  computeInteractionProof,
  DUEL_MAX_UNFOCUSED_RATIO,
  DuelTelemetryPayload,
} from "@/lib/duelAntiCheatShared";

export interface AntiCheatWarningState {
  message: string;
  severity: "info" | "warning" | "danger";
  timestamp: number;
}

interface UseDuelAntiCheatOptions {
  roomStatus?: string;
  roundNumber: number;
  roundChallenge: string | null;
}

/**
 * Client-side Duel integrity telemetry collector:
 * - Tracks keyboard dynamics, backspaces, cadence pauses, and unexplained bulk insertions
 * - Tracks blocked external clipboard paste/drop attempts
 * - Measures true foreground vs unfocused time using Page Visibility + PerformanceTimeline + blur/focus
 * - Builds deterministic SHA-256 interaction proofs paired with server round challenges
 */
export function useDuelAntiCheat({
  roomStatus,
  roundNumber,
  roundChallenge,
}: UseDuelAntiCheatOptions) {
  const isActive = roomStatus === "ACTIVE";

  const metricsRef = useRef({
    roundStartedAtMs: 0,
    roundStartPerfMs: 0,
    keystrokes: 0,
    backspaces: 0,
    pasteBlockedCount: 0,
    pasteBlockedChars: 0,
    unexplainedBurstCount: 0,
    maxBurstChars: 0,
    focusLostCount: 0,
    blurredMs: 0,
    blurredSinceMs: null as number | null,
    idleGapsCount: 0,
    lastKeystrokeAtMs: 0,
    systemUpdateUntilMs: 0,
  });

  const challengeRef = useRef<string | null>(roundChallenge);
  useEffect(() => {
    challengeRef.current = roundChallenge;
  }, [roundChallenge]);

  const [warning, setWarning] = useState<AntiCheatWarningState | null>(null);
  const [pasteBlockedTotal, setPasteBlockedTotal] = useState(0);
  const [tabSwitchesTotal, setTabSwitchesTotal] = useState(0);
  const [unfocusedPercent, setUnfocusedPercent] = useState(0);

  // Reset per-round metrics cleanly whenever the Duel round advances
  useEffect(() => {
    const now = Date.now();
    const perfNow = typeof performance !== "undefined" ? performance.now() : 0;
    metricsRef.current = {
      roundStartedAtMs: now,
      roundStartPerfMs: perfNow,
      keystrokes: 0,
      backspaces: 0,
      pasteBlockedCount: 0,
      pasteBlockedChars: 0,
      unexplainedBurstCount: 0,
      maxBurstChars: 0,
      focusLostCount: 0,
      blurredMs: 0,
      blurredSinceMs: typeof document !== "undefined" && document.hidden ? now : null,
      idleGapsCount: 0,
      lastKeystrokeAtMs: 0,
      systemUpdateUntilMs: now + 600,
    };
    setWarning(null);
    setPasteBlockedTotal(0);
    setTabSwitchesTotal(0);
    setUnfocusedPercent(0);
  }, [roundNumber]);

  const dismissWarning = useCallback(() => {
    setWarning(null);
  }, []);

  /**
   * Prevents starter templates, resets, and language switches from counting as sudden bursts.
   */
  const markSystemCodeUpdate = useCallback(() => {
    metricsRef.current.systemUpdateUntilMs = Date.now() + 500;
  }, []);

  // Track window blur & visibility changes only while the duel round is ACTIVE
  useEffect(() => {
    if (!isActive || typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const enterBlur = () => {
      const m = metricsRef.current;
      if (m.blurredSinceMs === null) {
        m.blurredSinceMs = Date.now();
        m.focusLostCount += 1;
        setTabSwitchesTotal(m.focusLostCount);
      }
    };

    const leaveBlur = () => {
      const m = metricsRef.current;
      const now = Date.now();
      if (m.blurredSinceMs !== null) {
        m.blurredMs += Math.max(0, now - m.blurredSinceMs);
        m.blurredSinceMs = null;

        const elapsed = Math.max(1, now - m.roundStartedAtMs);
        const pct = Math.min(100, Math.round((m.blurredMs / elapsed) * 100));
        setUnfocusedPercent(pct);

        if (elapsed >= 10000 && m.blurredMs / elapsed > DUEL_MAX_UNFOCUSED_RATIO) {
          setWarning({
            message: `Integrity Alert: Window unfocused ${pct}% of active round. Staying tabbed out >70% voids Elo & Duel Points.`,
            severity: "danger",
            timestamp: now,
          });
        } else if (m.focusLostCount >= 2) {
          setWarning({
            message: `Focus warning (${m.focusLostCount} switches): Keep this Duel tab active to keep Elo valid.`,
            severity: "warning",
            timestamp: now,
          });
        }
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        enterBlur();
      } else {
        leaveBlur();
      }
    };

    if (document.hidden) {
      enterBlur();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", enterBlur);
    window.addEventListener("focus", leaveBlur);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", enterBlur);
      window.removeEventListener("focus", leaveBlur);
    };
  }, [isActive]);

  const handlePasteBlocked = useCallback((info: { chars: number; timestamp: number }) => {
    const m = metricsRef.current;
    m.pasteBlockedCount += 1;
    m.pasteBlockedChars += info.chars;
    setPasteBlockedTotal(m.pasteBlockedCount);

    setWarning({
      message:
        "External paste is disabled during active Duels. Type your solution directly in the editor (repeated attempts void Elo).",
      severity: m.pasteBlockedCount >= 2 ? "danger" : "warning",
      timestamp: info.timestamp,
    });
  }, []);

  const handleEditorKeystroke = useCallback((info: { isBackspace: boolean; timestamp: number }) => {
    const m = metricsRef.current;
    if (m.lastKeystrokeAtMs > 0 && info.timestamp - m.lastKeystrokeAtMs >= 1500) {
      m.idleGapsCount += 1;
    }
    m.lastKeystrokeAtMs = info.timestamp;
    m.keystrokes += 1;
    if (info.isBackspace) {
      m.backspaces += 1;
    }
  }, []);

  const handleEditorContentDelta = useCallback(
    (info: { insertedChars: number; deletedChars: number; timestamp: number }) => {
      const m = metricsRef.current;
      if (info.timestamp <= m.systemUpdateUntilMs) {
        return;
      }

      // Large single-tick text insertion outside normal typing cadence (e.g. DevTools setValue or drop bypass)
      if (info.insertedChars >= 35) {
        m.unexplainedBurstCount += 1;
        m.maxBurstChars = Math.max(m.maxBurstChars, info.insertedChars);
        if (info.insertedChars >= 80) {
          setWarning({
            message: `Unusual bulk code insertion detected (${info.insertedChars} chars). Manual typing is required in Duels.`,
            severity: "danger",
            timestamp: info.timestamp,
          });
        }
      }
    },
    []
  );

  /**
   * Computes current foreground time bounded safely by performance visibility-state API if supported,
   * combined with cross-browser visibility/blur accumulation.
   */
  const computeActiveWindowTimings = useCallback(() => {
    const now = Date.now();
    const m = metricsRef.current;
    const clientElapsedMs = Math.max(0, now - (m.roundStartedAtMs || now));

    const activeBlurDelta = m.blurredSinceMs !== null ? Math.max(0, now - m.blurredSinceMs) : 0;
    let totalBlurredMs = Math.min(clientElapsedMs, m.blurredMs + activeBlurDelta);

    // Feature-detect PerformanceTimeline visibility-state (Baseline Limited: Chrome 115+ / Edge 115+)
    if (typeof performance !== "undefined" && typeof performance.getEntriesByType === "function") {
      const entries = performance.getEntriesByType("visibility-state");
      if (entries.length > 0) {
        const perfNow = performance.now();
        const winStart = m.roundStartPerfMs;
        let timelineHiddenMs = 0;

        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          const segStart = Math.max(winStart, entry.startTime);
          const rawEnd = i + 1 < entries.length ? entries[i + 1].startTime : perfNow;
          const segEnd = Math.min(perfNow, rawEnd);
          if (segEnd > segStart && entry.name === "hidden") {
            timelineHiddenMs += segEnd - segStart;
          }
        }

        totalBlurredMs = Math.max(totalBlurredMs, Math.min(clientElapsedMs, timelineHiddenMs));
      }
    }

    const totalForegroundMs = Math.max(0, clientElapsedMs - totalBlurredMs);
    return {
      clientElapsedMs,
      blurredMs: Math.round(totalBlurredMs),
      foregroundMs: Math.round(totalForegroundMs),
    };
  }, []);

  /**
   * Builds cryptographically bound interaction telemetry payload for /api/duel/[roomCode]/submit.
   */
  const buildSubmissionTelemetry = useCallback(
    (code: string): DuelTelemetryPayload => {
      const m = metricsRef.current;
      const timings = computeActiveWindowTimings();

      return computeInteractionProof(challengeRef.current || "", code, {
        keystrokes: m.keystrokes,
        backspaces: m.backspaces,
        pasteBlockedCount: m.pasteBlockedCount,
        pasteBlockedChars: m.pasteBlockedChars,
        unexplainedBurstCount: m.unexplainedBurstCount,
        maxBurstChars: m.maxBurstChars,
        focusLostCount: m.focusLostCount,
        blurredMs: timings.blurredMs,
        foregroundMs: timings.foregroundMs,
        clientElapsedMs: timings.clientElapsedMs,
        idleGapsCount: m.idleGapsCount,
      });
    },
    [computeActiveWindowTimings]
  );

  return {
    warning,
    dismissWarning,
    pasteBlockedTotal,
    tabSwitchesTotal,
    unfocusedPercent,
    markSystemCodeUpdate,
    handlePasteBlocked,
    handleEditorKeystroke,
    handleEditorContentDelta,
    buildSubmissionTelemetry,
  };
}
