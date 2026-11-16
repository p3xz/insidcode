import crypto from "crypto";
import { NextRequest } from "next/server";
import { AdminAction } from "@/models/AdminAction";
import { connectToDatabase } from "@/lib/mongodb";
import {
  buildCanonicalInteractionString,
  DuelIntegrityVerdict,
  DuelTelemetryPayload,
  sha256HexSync,
} from "./duelAntiCheatShared";

function getChallengeSecret(): string {
  const secret =
    process.env.DUEL_ANTI_CHEAT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET;

  if (!secret || !secret.trim()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[Duel Anti-Cheat] Missing server secret (DUEL_ANTI_CHEAT_SECRET or NEXTAUTH_SECRET) in production."
      );
    }
    return "insidcode-duel-anticheat-dev-secret";
  }

  return secret;
}

/**
 * Issues a per-user, per-round HMAC challenge bound cleanly to round start time.
 * Prevents external API scripts from submitting without loading the active Duel session.
 */
export function issueDuelRoundChallenge(params: {
  userId: string;
  roomCode: string;
  roundNumber: number;
  startedAtMs: number;
}): string {
  const secret = getChallengeSecret();
  const payload = `${params.userId}:${params.roomCode.toUpperCase()}:${params.roundNumber}:${params.startedAtMs}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${params.startedAtMs}.${sig}`;
}

/**
 * Timing-safe string hex equality check.
 */
function timingSafeEqualStr(a: string, b: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verifies that:
 *  1. The roundChallenge HMAC matches the authenticated player, room, round, and server startedAtMs.
 *  2. The client telemetry's codeHash equals the actual SHA-256 of the submitted code.
 *  3. The interactionDigest binds the challenge, codeHash, and Monaco telemetry metrics.
 */
export function verifyDuelInteractionToken(params: {
  userId: string;
  roomCode: string;
  roundNumber: number;
  expectedStartedAtMs: number;
  submittedCode: string;
  telemetry?: DuelTelemetryPayload | null;
}): { valid: boolean; reason?: string } {
  const { telemetry } = params;
  if (!telemetry || typeof telemetry.roundChallenge !== "string" || typeof telemetry.interactionDigest !== "string") {
    return { valid: false, reason: "Missing editor telemetry challenge token." };
  }

  const parts = telemetry.roundChallenge.split(".");
  if (parts.length !== 2) {
    return { valid: false, reason: "Malformed challenge token." };
  }

  const [rawStartedMs, sigHex] = parts;
  const parsedStartedMs = Number(rawStartedMs);
  if (!Number.isFinite(parsedStartedMs) || parsedStartedMs !== params.expectedStartedAtMs) {
    return { valid: false, reason: "Challenge timestamp mismatch (stale round token)." };
  }

  const expectedChallenge = issueDuelRoundChallenge({
    userId: params.userId,
    roomCode: params.roomCode,
    roundNumber: params.roundNumber,
    startedAtMs: params.expectedStartedAtMs,
  });

  const expectedSig = expectedChallenge.split(".")[1] || "";
  if (!timingSafeEqualStr(sigHex, expectedSig)) {
    return { valid: false, reason: "Invalid challenge HMAC signature." };
  }

  const expectedCodeHash = sha256HexSync(params.submittedCode);
  if (!timingSafeEqualStr(telemetry.codeHash, expectedCodeHash)) {
    return { valid: false, reason: "Submitted source hash mismatch." };
  }

  const canonical = buildCanonicalInteractionString({
    roundChallenge: telemetry.roundChallenge,
    codeHash: expectedCodeHash,
    keystrokes: telemetry.keystrokes,
    backspaces: telemetry.backspaces,
    pasteBlockedCount: telemetry.pasteBlockedCount,
    unexplainedBurstCount: telemetry.unexplainedBurstCount,
    focusLostCount: telemetry.focusLostCount,
    blurredMs: telemetry.blurredMs,
    clientElapsedMs: telemetry.clientElapsedMs,
  });
  const expectedDigest = sha256HexSync(canonical);

  if (!timingSafeEqualStr(telemetry.interactionDigest, expectedDigest)) {
    return { valid: false, reason: "Interaction proof digest mismatch." };
  }

  return { valid: true };
}

/**
 * Writes a permanent, non-blocking audit trail record to AdminAction when anti-cheat triggers.
 * Does NOT ban the account automatically; surfaces evidence in /admin/audit.
 */
export async function recordDuelAntiCheatAudit(params: {
  req?: NextRequest;
  roomCode: string;
  roundNumber: number;
  problemId: string;
  userId: string;
  username: string;
  verdict: DuelIntegrityVerdict;
  telemetry: DuelTelemetryPayload;
}): Promise<void> {
  try {
    await connectToDatabase();

    const evidenceParts = [
      `Room: ${params.roomCode} R${params.roundNumber} (${params.problemId})`,
      `Risk: ${params.verdict.riskScore}/100`,
      `Flags: ${params.verdict.flags.join(", ")}`,
      `Elapsed: ${params.verdict.elapsedSec.toFixed(1)}s`,
      `Keystrokes: ${params.telemetry.keystrokes}`,
      `Bursts: ${params.telemetry.unexplainedBurstCount} (max ${params.telemetry.maxBurstChars}c)`,
      `BlockedPastes: ${params.telemetry.pasteBlockedCount}`,
      `Unfocused: ${Math.round(params.verdict.unfocusedRatio * 100)}% (${params.telemetry.focusLostCount} switches)`,
    ];

    await AdminAction.create({
      adminId: "system",
      adminUsername: "AntiCheat",
      action: "DUEL_ANTI_CHEAT_FLAG",
      targetUserId: params.userId,
      targetProblemId: params.problemId,
      previousValue: "eloVoided: false",
      newValue: JSON.stringify({
        username: params.username,
        roomCode: params.roomCode,
        roundNumber: params.roundNumber,
        riskScore: params.verdict.riskScore,
        flags: params.verdict.flags,
        eloVoided: params.verdict.action === "FLAG_AND_VOID_ELO",
      }),
      reason: params.verdict.reasons.join(" | ") || "Automated Duel anti-cheat alert triggered.",
      metadata: {
        category: "SECURITY",
        roomCode: params.roomCode,
        roundNumber: params.roundNumber,
        user: params.username,
        riskScore: params.verdict.riskScore,
        flags: params.verdict.flags,
        evidence: evidenceParts.join(" · "),
        telemetry: {
          keystrokes: params.telemetry.keystrokes,
          backspaces: params.telemetry.backspaces,
          pasteBlockedCount: params.telemetry.pasteBlockedCount,
          pasteBlockedChars: params.telemetry.pasteBlockedChars,
          unexplainedBurstCount: params.telemetry.unexplainedBurstCount,
          maxBurstChars: params.telemetry.maxBurstChars,
          focusLostCount: params.telemetry.focusLostCount,
          blurredMs: params.telemetry.blurredMs,
          foregroundMs: params.telemetry.foregroundMs,
          solveDurationSec: Number(params.verdict.elapsedSec.toFixed(2)),
          changedChars: params.verdict.changedChars,
          unfocusedRatio: params.verdict.unfocusedRatio,
        },
        userAgent: params.req?.headers.get("user-agent") || "unknown",
        detectedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[Duel Anti-Cheat] Error writing audit entry:", err);
  }
}
