import type { DuelTelemetryCheckpoint } from "@/lib/duelAntiCheatShared";

const STALE_HEARTBEAT_THRESHOLD_MS = 8000;

export type WarningSeverity = "info" | "warning" | "danger";

export interface TelemetrySummaryLike extends Partial<DuelTelemetryCheckpoint> {
  solveDurationMs?: number;
  changedChars?: number;
  unfocusedRatio?: number;
  lastWarning?: string | null;
  lastWarningSeverity?: WarningSeverity;
  warningDismissed?: boolean;
  lastCheckpointAtMs?: number;
}

export interface SpectateRoundLike {
  roundNumber: number;
  problemId: string;
  difficulty?: string;
  startedAt?: Date | string | null;
  player1Status?: string;
  player2Status?: string;
  player1IntegrityFlags?: string[];
  player2IntegrityFlags?: string[];
  player1RiskScore?: number;
  player2RiskScore?: number;
  player1TelemetrySummary?: TelemetrySummaryLike | null;
  player2TelemetrySummary?: TelemetrySummaryLike | null;
}

export interface SpectateRoomLike {
  status: string;
  currentRound: number;
  roundStartedAt?: Date | string | null;
  createdAt?: Date | string | null;
  player2?: { userId?: string } | null;
  integrityFlagged?: boolean;
  eloVoided?: boolean;
  integrityReasons?: string[];
  roundsData?: SpectateRoundLike[];
}

export interface AdminPlayerIntegritySnapshot {
  keystrokes: number;
  backspaces: number;
  pasteBlockedCount: number;
  pasteBlockedChars: number;
  focusLostCount: number;
  blurredMs: number;
  liveAwayMs: number;
  effectiveBlurredMs: number;
  unfocusedPercent: number;
  unexplainedBurstCount: number;
  maxBurstChars: number;
  riskScore: number;
  integrityFlags: string[];
  lastWarning: string | null;
  lastWarningSeverity: WarningSeverity | null;
  warningDismissed: boolean;
  lastCheckpointAtMs: number | null;
  staleHeartbeatSec: number | null;
}

export interface AdminRoundIntegritySummary {
  roundNumber: number;
  problemId: string;
  difficulty: string | null;
  player1: AdminPlayerIntegritySnapshot;
  player2: AdminPlayerIntegritySnapshot | null;
}

export interface AdminRoomIntegritySnapshot {
  integrityFlagged: boolean;
  eloVoided: boolean;
  integrityReasons: string[];
  activeRound: number;
  player1: AdminPlayerIntegritySnapshot;
  player2: AdminPlayerIntegritySnapshot | null;
  rounds: AdminRoundIntegritySummary[];
}

function toTimestampMs(value?: Date | string | null): number | null {
  if (!value) return null;
  const ms = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function toNonNegativeInt(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function sanitizeStringArray(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

/**
 * Computes a live, spectator-safe integrity snapshot for one player in a round.
 * Never includes source code drafts, interaction tokens, or hidden test cases.
 */
export function buildAdminPlayerIntegritySnapshot(params: {
  summary?: TelemetrySummaryLike | null;
  integrityFlags?: string[];
  riskScore?: number;
  playerStatus?: string;
  roomStatus: string;
  isActiveRound: boolean;
  startedAtMs: number | null;
  nowMs: number;
}): AdminPlayerIntegritySnapshot {
  const {
    summary,
    integrityFlags,
    riskScore,
    playerStatus = "CODING",
    roomStatus,
    isActiveRound,
    startedAtMs,
    nowMs,
  } = params;

  const s = summary || {};
  const blurredMs = toNonNegativeInt(s.blurredMs);
  const lastCheckpointAtMs =
    typeof s.lastCheckpointAtMs === "number" && Number.isFinite(s.lastCheckpointAtMs) && s.lastCheckpointAtMs > 0
      ? Math.round(s.lastCheckpointAtMs)
      : null;

  const isLiveCoding = roomStatus === "ACTIVE" && isActiveRound && playerStatus === "CODING";
  const sinceCheckpointMs = lastCheckpointAtMs !== null ? Math.max(0, nowMs - lastCheckpointAtMs) : 0;
  const isStale = isLiveCoding && lastCheckpointAtMs !== null && sinceCheckpointMs > STALE_HEARTBEAT_THRESHOLD_MS;

  const liveAwayMs = isStale ? sinceCheckpointMs : 0;
  const staleHeartbeatSec = isStale ? Math.floor(sinceCheckpointMs / 1000) : null;

  const solveDurationMs =
    typeof s.solveDurationMs === "number" && Number.isFinite(s.solveDurationMs) && s.solveDurationMs > 0
      ? Math.round(s.solveDurationMs)
      : null;

  const elapsedMs =
    solveDurationMs ??
    (roomStatus === "ACTIVE" && isActiveRound && startedAtMs !== null ? Math.max(0, nowMs - startedAtMs) : 0);

  const rawEffectiveBlurredMs = blurredMs + liveAwayMs;
  const effectiveBlurredMs = elapsedMs > 0 ? Math.min(elapsedMs, rawEffectiveBlurredMs) : rawEffectiveBlurredMs;

  const unfocusedPercent =
    typeof s.unfocusedRatio === "number" && Number.isFinite(s.unfocusedRatio) && s.unfocusedRatio > 0 && !isLiveCoding
      ? Math.min(100, Math.round(s.unfocusedRatio * 100))
      : elapsedMs > 0
      ? Math.min(100, Math.round((effectiveBlurredMs / elapsedMs) * 100))
      : 0;

  const severity: WarningSeverity | null =
    s.lastWarningSeverity === "danger" ||
    s.lastWarningSeverity === "warning" ||
    s.lastWarningSeverity === "info"
      ? s.lastWarningSeverity
      : typeof s.lastWarning === "string" && s.lastWarning.trim().length > 0
      ? "warning"
      : null;

  return {
    keystrokes: toNonNegativeInt(s.keystrokes),
    backspaces: toNonNegativeInt(s.backspaces),
    pasteBlockedCount: toNonNegativeInt(s.pasteBlockedCount),
    pasteBlockedChars: toNonNegativeInt(s.pasteBlockedChars),
    focusLostCount: toNonNegativeInt(s.focusLostCount),
    blurredMs,
    liveAwayMs,
    effectiveBlurredMs,
    unfocusedPercent,
    unexplainedBurstCount: toNonNegativeInt(s.unexplainedBurstCount),
    maxBurstChars: toNonNegativeInt(s.maxBurstChars),
    riskScore: toNonNegativeInt(riskScore),
    integrityFlags: sanitizeStringArray(integrityFlags),
    lastWarning: typeof s.lastWarning === "string" && s.lastWarning.trim().length > 0 ? s.lastWarning : null,
    lastWarningSeverity: severity,
    warningDismissed: Boolean(s.warningDismissed),
    lastCheckpointAtMs,
    staleHeartbeatSec,
  };
}

/**
 * Builds the full admin-only integrity view across active and past rounds for a DuelRoom.
 */
export function buildAdminRoomIntegrity(
  room: SpectateRoomLike,
  nowMs: number = Date.now()
): AdminRoomIntegritySnapshot {
  const roundsList = Array.isArray(room.roundsData) ? room.roundsData : [];
  const hasPlayer2 = Boolean(room.player2 && room.player2.userId);
  const fallbackStartedAtMs = toTimestampMs(room.roundStartedAt) ?? toTimestampMs(room.createdAt);

  const buildRoundSide = (rd: SpectateRoundLike, side: 1 | 2): AdminPlayerIntegritySnapshot => {
    const isActiveRound = rd.roundNumber === room.currentRound;
    const roundStartedAtMs = toTimestampMs(rd.startedAt) ?? (isActiveRound ? fallbackStartedAtMs : null);
    return buildAdminPlayerIntegritySnapshot({
      summary: side === 1 ? rd.player1TelemetrySummary : rd.player2TelemetrySummary,
      integrityFlags: side === 1 ? rd.player1IntegrityFlags : rd.player2IntegrityFlags,
      riskScore: side === 1 ? rd.player1RiskScore : rd.player2RiskScore,
      playerStatus: side === 1 ? rd.player1Status : rd.player2Status,
      roomStatus: room.status,
      isActiveRound,
      startedAtMs: roundStartedAtMs,
      nowMs,
    });
  };

  const rounds: AdminRoundIntegritySummary[] = roundsList.map((rd) => ({
    roundNumber: rd.roundNumber,
    problemId: rd.problemId,
    difficulty: typeof rd.difficulty === "string" ? rd.difficulty : null,
    player1: buildRoundSide(rd, 1),
    player2: hasPlayer2 ? buildRoundSide(rd, 2) : null,
  }));

  const currentRoundSummary =
    rounds.find((r) => r.roundNumber === room.currentRound) ?? rounds[rounds.length - 1] ?? null;

  const emptySnapshot = buildAdminPlayerIntegritySnapshot({
    roomStatus: room.status,
    isActiveRound: false,
    startedAtMs: null,
    nowMs,
  });

  return {
    integrityFlagged: Boolean(room.integrityFlagged),
    eloVoided: Boolean(room.eloVoided),
    integrityReasons: sanitizeStringArray(room.integrityReasons),
    activeRound: room.currentRound || 1,
    player1: currentRoundSummary?.player1 ?? emptySnapshot,
    player2: hasPlayer2 ? (currentRoundSummary?.player2 ?? emptySnapshot) : null,
    rounds,
  };
}
