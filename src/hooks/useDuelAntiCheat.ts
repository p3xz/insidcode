"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  computeInteractionProof,
  DUEL_MAX_UNFOCUSED_RATIO,
  DuelTelemetryCheckpoint,
  DuelTelemetryPayload,
  mergeMonotonicTelemetry,
} from "@/lib/duelAntiCheatShared";

export interface AntiCheatWarningState {
  message: string;
  severity: "info" | "warning" | "danger";
  timestamp: number;
}

interface UseDuelAntiCheatOptions {
  roomCode?: string;
  userId?: string;
  roomStatus?: string;
  roundNumber: number;
  roundChallenge: string | null;
  roundStartedAt?: Date | string | null;
  serverTelemetry?: Partial<DuelTelemetryCheckpoint> | null;
}

function getTelemetryStorageKey(roomCode?: string, userId?: string, roundNumber?: number): string | null {
  if (!roomCode || !userId || !roundNumber) return null;
  return `duel_ac_v1:${roomCode.toUpperCase()}:${userId}:${roundNumber}`;
}

/**
 * Client-side Duel integrity telemetry collector with persistent cross-reload / tab-reopen continuity:
 * - Persists warnings, paste attempts, keystrokes, and blurred away-time in localStorage + server checkpoints
 * - Measures true closed-tab / away gaps when a tab is closed and reopened mid-round
 * - Prevents resetting warnings or counters on refresh or reopen
 * - Computes cryptographically bound interaction proofs for submission verification
 */
export function useDuelAntiCheat({
  roomCode,
  userId,
  roomStatus,
  roundNumber,
  roundChallenge,
  roundStartedAt,
  serverTelemetry,
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
    lastWarning: null as string | null,
    lastWarningSeverity: "warning" as "info" | "warning" | "danger",
    warningDismissed: false,
    lastCheckpointAtMs: 0,
  });

  const challengeRef = useRef<string | null>(roundChallenge);
  const roomCodeRef = useRef<string | undefined>(roomCode);
  const userIdRef = useRef<string | undefined>(userId);
  const roundNumberRef = useRef<number>(roundNumber);
  const isActiveRef = useRef<boolean>(isActive);
  const hydratedRoundKeyRef = useRef<string | null>(null);
  const lastServerSyncAtRef = useRef<number>(0);

  useEffect(() => {
    challengeRef.current = roundChallenge;
    roomCodeRef.current = roomCode;
    userIdRef.current = userId;
    roundNumberRef.current = roundNumber;
    isActiveRef.current = isActive;
  }, [roundChallenge, roomCode, userId, roundNumber, isActive]);

  const [warning, setWarning] = useState<AntiCheatWarningState | null>(null);
  const [pasteBlockedTotal, setPasteBlockedTotal] = useState(0);
  const [tabSwitchesTotal, setTabSwitchesTotal] = useState(0);
  const [unfocusedPercent, setUnfocusedPercent] = useState(0);

  const computeServerRoundStartMs = useCallback((): number => {
    if (roundStartedAt) {
      const parsed = new Date(roundStartedAt).getTime();
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return metricsRef.current.roundStartedAtMs || Date.now();
  }, [roundStartedAt]);

  const computeCurrentTimings = useCallback(() => {
    const now = Date.now();
    const m = metricsRef.current;
    const startedMs = m.roundStartedAtMs || computeServerRoundStartMs();
    const clientElapsedMs = Math.max(0, now - startedMs);

    const activeBlurDelta = m.blurredSinceMs !== null ? Math.max(0, now - m.blurredSinceMs) : 0;
    let totalBlurredMs = Math.min(clientElapsedMs, m.blurredMs + activeBlurDelta);

    // Feature-detect PerformanceTimeline visibility-state (Chrome 115+ / Edge 115+)
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
  }, [computeServerRoundStartMs]);

  const persistLocalCheckpoint = useCallback(() => {
    if (typeof window === "undefined") return;
    const key = getTelemetryStorageKey(
      roomCodeRef.current,
      userIdRef.current,
      roundNumberRef.current
    );
    if (!key) return;

    const m = metricsRef.current;
    const now = Date.now();
    m.lastCheckpointAtMs = now;
    const timings = computeCurrentTimings();

    const snapshot: DuelTelemetryCheckpoint = {
      keystrokes: m.keystrokes,
      backspaces: m.backspaces,
      pasteBlockedCount: m.pasteBlockedCount,
      pasteBlockedChars: m.pasteBlockedChars,
      unexplainedBurstCount: m.unexplainedBurstCount,
      maxBurstChars: m.maxBurstChars,
      focusLostCount: m.focusLostCount,
      blurredMs: timings.blurredMs,
      foregroundMs: timings.foregroundMs,
      idleGapsCount: m.idleGapsCount,
      lastWarning: m.lastWarning,
      lastWarningSeverity: m.lastWarningSeverity,
      warningDismissed: m.warningDismissed,
      lastCheckpointAtMs: now,
    };

    try {
      localStorage.setItem(key, JSON.stringify(snapshot));
    } catch {
      // Safe fallback in storage-restricted contexts
    }
  }, [computeCurrentTimings]);

  const syncServerTelemetry = useCallback(
    (options?: { useBeacon?: boolean; force?: boolean }) => {
      if (!isActiveRef.current || !roomCodeRef.current || !challengeRef.current) return;

      const now = Date.now();
      if (!options?.force && !options?.useBeacon && now - lastServerSyncAtRef.current < 800) {
        return;
      }
      lastServerSyncAtRef.current = now;

      const m = metricsRef.current;
      const timings = computeCurrentTimings();
      const bodyObj = {
        roundChallenge: challengeRef.current,
        keystrokes: m.keystrokes,
        backspaces: m.backspaces,
        pasteBlockedCount: m.pasteBlockedCount,
        pasteBlockedChars: m.pasteBlockedChars,
        unexplainedBurstCount: m.unexplainedBurstCount,
        maxBurstChars: m.maxBurstChars,
        focusLostCount: m.focusLostCount,
        blurredMs: timings.blurredMs,
        foregroundMs: timings.foregroundMs,
        idleGapsCount: m.idleGapsCount,
        lastWarning: m.lastWarning,
        lastWarningSeverity: m.lastWarningSeverity,
        warningDismissed: m.warningDismissed,
      };

      const url = `/api/duel/${encodeURIComponent(roomCodeRef.current)}/telemetry`;
      const jsonStr = JSON.stringify(bodyObj);

      if (options?.useBeacon && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        try {
          const blob = new Blob([jsonStr], { type: "application/json" });
          if (navigator.sendBeacon(url, blob)) {
            return;
          }
        } catch {
          // Fall through to keepalive fetch
        }
      }

      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonStr,
        keepalive: Boolean(options?.useBeacon),
      }).catch(() => {
        // Non-blocking telemetry checkpoint
      });
    },
    [computeCurrentTimings]
  );

  // Cleanly initialize & hydrate telemetry per round (merges localStorage + server checkpoint across tab reopens)
  useEffect(() => {
    const now = Date.now();
    const perfNow = typeof performance !== "undefined" ? performance.now() : 0;
    const roundStartMs = roundStartedAt
      ? new Date(roundStartedAt).getTime() || now
      : now;

    const sessionKey = `${roomCode || ""}:${userId || ""}:${roundNumber}`;
    if (hydratedRoundKeyRef.current !== sessionKey) {
      hydratedRoundKeyRef.current = sessionKey;

      let localSaved: Partial<DuelTelemetryCheckpoint> | null = null;
      if (typeof window !== "undefined") {
        const storageKey = getTelemetryStorageKey(roomCode, userId, roundNumber);
        if (storageKey) {
          try {
            const raw = localStorage.getItem(storageKey);
            if (raw) {
              localSaved = JSON.parse(raw) as Partial<DuelTelemetryCheckpoint>;
            }
          } catch {
            localSaved = null;
          }
        }
      }

      const merged = mergeMonotonicTelemetry(localSaved, serverTelemetry);
      let extraClosedGapMs = 0;
      let extraClosedSwitches = 0;
      let restoredWarning = merged.warningDismissed ? null : merged.lastWarning || null;
      let restoredSeverity: "info" | "warning" | "danger" = merged.lastWarningSeverity || "warning";

      // If this round previously had an active checkpoint and user closed/left for >4.5s before reopening
      if (isActive && merged.lastCheckpointAtMs && now - merged.lastCheckpointAtMs > 4500) {
        extraClosedGapMs = Math.max(0, now - merged.lastCheckpointAtMs);
        extraClosedSwitches = 1;
        const totalSwitchesAfterReopen = merged.focusLostCount + 1;
        const totalBlurredAfterReopen = merged.blurredMs + extraClosedGapMs;
        const totalElapsedSinceStart = Math.max(1, now - roundStartMs);
        const pct = Math.min(100, Math.round((totalBlurredAfterReopen / totalElapsedSinceStart) * 100));

        restoredSeverity =
          pct > 70 || totalSwitchesAfterReopen >= 3 ? "danger" : "warning";
        restoredWarning = `Focus warning: Duel tab was closed/inactive for ${Math.round(
          extraClosedGapMs / 1000
        )}s (${totalSwitchesAfterReopen} switches · ${pct}% unfocused). Closing and reopening tabs is logged.`;
      }

      const nextBlurredMs = merged.blurredMs + extraClosedGapMs;
      const nextFocusLost = merged.focusLostCount + extraClosedSwitches;
      const elapsedSinceStart = Math.max(1, now - roundStartMs);
      const nextPct = Math.min(100, Math.round((nextBlurredMs / elapsedSinceStart) * 100));

      metricsRef.current = {
        roundStartedAtMs: roundStartMs,
        roundStartPerfMs: perfNow,
        keystrokes: merged.keystrokes,
        backspaces: merged.backspaces,
        pasteBlockedCount: merged.pasteBlockedCount,
        pasteBlockedChars: merged.pasteBlockedChars,
        unexplainedBurstCount: merged.unexplainedBurstCount,
        maxBurstChars: merged.maxBurstChars,
        focusLostCount: nextFocusLost,
        blurredMs: nextBlurredMs,
        blurredSinceMs: typeof document !== "undefined" && document.hidden ? now : null,
        idleGapsCount: merged.idleGapsCount,
        lastKeystrokeAtMs: 0,
        systemUpdateUntilMs: now + 600,
        lastWarning: restoredWarning,
        lastWarningSeverity: restoredSeverity,
        warningDismissed: extraClosedSwitches > 0 ? false : Boolean(merged.warningDismissed),
        lastCheckpointAtMs: now,
      };

      setPasteBlockedTotal(merged.pasteBlockedCount);
      setTabSwitchesTotal(nextFocusLost);
      setUnfocusedPercent(nextPct);
      setWarning(
        restoredWarning
          ? { message: restoredWarning, severity: restoredSeverity, timestamp: now }
          : null
      );

      persistLocalCheckpoint();
      if (extraClosedSwitches > 0) {
        syncServerTelemetry({ force: true });
      }
      return;
    }

    // Subsequent poll: keep serverTelemetry synced monotonically if server arrived after mount
    metricsRef.current.roundStartedAtMs = roundStartMs;
    if (serverTelemetry) {
      const m = metricsRef.current;
      const beforePaste = m.pasteBlockedCount;
      const beforeFocus = m.focusLostCount;
      m.keystrokes = Math.max(m.keystrokes, serverTelemetry.keystrokes ?? 0);
      m.backspaces = Math.max(m.backspaces, serverTelemetry.backspaces ?? 0);
      m.pasteBlockedCount = Math.max(m.pasteBlockedCount, serverTelemetry.pasteBlockedCount ?? 0);
      m.pasteBlockedChars = Math.max(m.pasteBlockedChars, serverTelemetry.pasteBlockedChars ?? 0);
      m.unexplainedBurstCount = Math.max(m.unexplainedBurstCount, serverTelemetry.unexplainedBurstCount ?? 0);
      m.maxBurstChars = Math.max(m.maxBurstChars, serverTelemetry.maxBurstChars ?? 0);
      m.focusLostCount = Math.max(m.focusLostCount, serverTelemetry.focusLostCount ?? 0);
      m.blurredMs = Math.max(m.blurredMs, serverTelemetry.blurredMs ?? 0);

      if (m.pasteBlockedCount !== beforePaste) setPasteBlockedTotal(m.pasteBlockedCount);
      if (m.focusLostCount !== beforeFocus) setTabSwitchesTotal(m.focusLostCount);
      if (!m.lastWarning && !m.warningDismissed && serverTelemetry.lastWarning && !serverTelemetry.warningDismissed) {
        m.lastWarning = serverTelemetry.lastWarning;
        m.lastWarningSeverity = serverTelemetry.lastWarningSeverity || "warning";
        setWarning({
          message: serverTelemetry.lastWarning,
          severity: m.lastWarningSeverity,
          timestamp: now,
        });
      }
    }
  }, [
    roomCode,
    userId,
    roundNumber,
    roundStartedAt,
    isActive,
    serverTelemetry,
    persistLocalCheckpoint,
    syncServerTelemetry,
  ]);

  const setActiveWarning = useCallback(
    (msg: string, severity: "info" | "warning" | "danger", timestamp: number) => {
      metricsRef.current.lastWarning = msg;
      metricsRef.current.lastWarningSeverity = severity;
      metricsRef.current.warningDismissed = false;
      setWarning({ message: msg, severity, timestamp });
      persistLocalCheckpoint();
      syncServerTelemetry({ force: true });
    },
    [persistLocalCheckpoint, syncServerTelemetry]
  );

  const dismissWarning = useCallback(() => {
    metricsRef.current.lastWarning = null;
    metricsRef.current.warningDismissed = true;
    setWarning(null);
    persistLocalCheckpoint();
    syncServerTelemetry({ force: true });
  }, [persistLocalCheckpoint, syncServerTelemetry]);

  const markSystemCodeUpdate = useCallback(() => {
    metricsRef.current.systemUpdateUntilMs = Date.now() + 600;
  }, []);

  const isSystemCodeUpdate = useCallback(() => {
    return Date.now() <= metricsRef.current.systemUpdateUntilMs;
  }, []);

  const reportQuestionCopyAttempt = useCallback(() => {
    setActiveWarning(
      "Copying problem statements is disabled during active Duels across desktop and mobile.",
      "warning",
      Date.now()
    );
  }, [setActiveWarning]);

  // Track window blur, visibility changes, tab closes (pagehide), and periodic heartbeats
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
        persistLocalCheckpoint();
        syncServerTelemetry({ useBeacon: true });
      }
    };

    const leaveBlur = () => {
      const m = metricsRef.current;
      const now = Date.now();
      if (m.blurredSinceMs !== null) {
        m.blurredMs += Math.max(0, now - m.blurredSinceMs);
        m.blurredSinceMs = null;

        const startedMs = m.roundStartedAtMs || now;
        const elapsed = Math.max(1, now - startedMs);
        const pct = Math.min(100, Math.round((m.blurredMs / elapsed) * 100));
        setUnfocusedPercent(pct);

        if (elapsed >= 10000 && m.blurredMs / elapsed > DUEL_MAX_UNFOCUSED_RATIO) {
          setActiveWarning(
            `Integrity Alert: Window unfocused ${pct}% of active round. Staying tabbed out >70% voids Elo & Duel Points.`,
            "danger",
            now
          );
        } else if (m.focusLostCount >= 2) {
          setActiveWarning(
            `Focus warning (${m.focusLostCount} switches): Keep this Duel tab active to keep Elo valid.`,
            "warning",
            now
          );
        } else {
          persistLocalCheckpoint();
          syncServerTelemetry();
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

    const onPageHide = () => {
      enterBlur();
      persistLocalCheckpoint();
      syncServerTelemetry({ useBeacon: true });
    };

    if (document.hidden) {
      enterBlur();
    }

    const heartbeatId = setInterval(() => {
      persistLocalCheckpoint();
      syncServerTelemetry();
    }, 3000);

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", enterBlur);
    window.addEventListener("focus", leaveBlur);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      clearInterval(heartbeatId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", enterBlur);
      window.removeEventListener("focus", leaveBlur);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [isActive, persistLocalCheckpoint, syncServerTelemetry, setActiveWarning]);

  const handlePasteBlocked = useCallback(
    (info: { chars: number; timestamp: number }) => {
      const m = metricsRef.current;
      m.pasteBlockedCount += 1;
      m.pasteBlockedChars += info.chars;
      setPasteBlockedTotal(m.pasteBlockedCount);

      setActiveWarning(
        `External paste is disabled during active Duels (${m.pasteBlockedCount} attempt${
          m.pasteBlockedCount > 1 ? "s" : ""
        }). Type directly in the editor (repeated attempts void Elo).`,
        m.pasteBlockedCount >= 2 ? "danger" : "warning",
        info.timestamp
      );
    },
    [setActiveWarning]
  );

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

      if (
        info.insertedChars > 0 &&
        info.insertedChars <= 14 &&
        info.timestamp - m.lastKeystrokeAtMs > 40
      ) {
        if (m.lastKeystrokeAtMs > 0 && info.timestamp - m.lastKeystrokeAtMs >= 1500) {
          m.idleGapsCount += 1;
        }
        m.lastKeystrokeAtMs = info.timestamp;
        m.keystrokes += Math.min(info.insertedChars, 10);
        return;
      }

      if (info.insertedChars >= 35) {
        m.unexplainedBurstCount += 1;
        m.maxBurstChars = Math.max(m.maxBurstChars, info.insertedChars);
        if (info.insertedChars >= 80) {
          setActiveWarning(
            `Unusual bulk code insertion detected (${info.insertedChars} chars). Manual typing is required in Duels.`,
            "danger",
            info.timestamp
          );
        } else {
          persistLocalCheckpoint();
          syncServerTelemetry();
        }
      }
    },
    [persistLocalCheckpoint, syncServerTelemetry, setActiveWarning]
  );

  const buildSubmissionTelemetry = useCallback(
    (code: string): DuelTelemetryPayload => {
      const m = metricsRef.current;
      const timings = computeCurrentTimings();

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
    [computeCurrentTimings]
  );

  return {
    warning,
    dismissWarning,
    pasteBlockedTotal,
    tabSwitchesTotal,
    unfocusedPercent,
    markSystemCodeUpdate,
    isSystemCodeUpdate,
    reportQuestionCopyAttempt,
    handlePasteBlocked,
    handleEditorKeystroke,
    handleEditorContentDelta,
    buildSubmissionTelemetry,
  };
}
