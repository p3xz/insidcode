/**
 * Isomorphic Duel Anti-Cheat Types, Time Floors, Risk Scoring & Hashing
 *
 * Zero Node-only dependencies so both browser hooks and server API routes
 * compute identical hashes, interaction proofs, and risk evaluations.
 */

export type DuelDifficulty = "Very Easy" | "Easy" | "Medium" | "Hard";

export type DuelIntegrityFlag =
  | "INVALID_INTERACTION_TOKEN"
  | "BELOW_TIME_FLOOR"
  | "ZERO_KEYSTROKE_BURST"
  | "IMPOSSIBLE_TYPING_VELOCITY"
  | "PASTE_ATTEMPTS"
  | "EXCESSIVE_TAB_SWITCH";

export type DuelIntegrityAction = "CLEAN" | "WARN" | "FLAG_AND_VOID_ELO" | "REJECT";

export interface DuelTelemetryPayload {
  roundChallenge: string;
  interactionDigest: string;
  codeHash: string;
  keystrokes: number;
  backspaces: number;
  pasteBlockedCount: number;
  pasteBlockedChars: number;
  unexplainedBurstCount: number;
  maxBurstChars: number;
  focusLostCount: number;
  blurredMs: number;
  foregroundMs: number;
  clientElapsedMs: number;
  idleGapsCount: number;
}

export interface DuelTelemetrySummary {
  keystrokes: number;
  backspaces: number;
  pasteBlockedCount: number;
  pasteBlockedChars: number;
  unexplainedBurstCount: number;
  maxBurstChars: number;
  focusLostCount: number;
  blurredMs: number;
  foregroundMs: number;
  solveDurationMs: number;
  changedChars: number;
  unfocusedRatio: number;
}

export interface DuelIntegrityVerdict {
  riskScore: number;
  flags: DuelIntegrityFlag[];
  action: DuelIntegrityAction;
  reasons: string[];
  elapsedSec: number;
  minFloorSec: number;
  remainingFloorSec: number;
  changedChars: number;
  unfocusedRatio: number;
}

/**
 * Difficulty-scaled minimum human reading & typing floor in seconds.
 */
export const DUEL_MIN_SOLVE_SECONDS: Record<DuelDifficulty, number> = {
  "Very Easy": 8,
  Easy: 15,
  Medium: 25,
  Hard: 40,
};

/**
 * Maximum ratio of unfocused/tabbed-out time allowed before voiding Elo & flagging match.
 */
export const DUEL_MAX_UNFOCUSED_RATIO = 0.7;

/**
 * Standard FIPS 180-4 synchronous SHA-256 returning lowercase hex.
 * Guarantees byte-for-byte parity between client browsers (including plain HTTP LAN testing)
 * and Node.js server validation without external packages.
 */
export function sha256HexSync(message: string): string {
  const bytes = new TextEncoder().encode(message);

  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);

  const H = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);

  const bitLen = bytes.length * 8;
  const paddedLen = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(bytes);
  padded[bytes.length] = 0x80;

  const view = new DataView(padded.buffer);
  const highBits = Math.floor(bitLen / 0x100000000);
  const lowBits = bitLen >>> 0;
  view.setUint32(paddedLen - 8, highBits, false);
  view.setUint32(paddedLen - 4, lowBits, false);

  const w = new Uint32Array(64);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));

  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = H;

    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    H[0] = (H[0] + a) >>> 0;
    H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0;
    H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0;
    H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0;
    H[7] = (H[7] + h) >>> 0;
  }

  return Array.from(H)
    .map((word) => word.toString(16).padStart(8, "0"))
    .join("");
}

/**
 * Canonical digest string shared by client proof generator and server validator.
 */
export function buildCanonicalInteractionString(params: {
  roundChallenge: string;
  codeHash: string;
  keystrokes: number;
  backspaces: number;
  pasteBlockedCount: number;
  unexplainedBurstCount: number;
  focusLostCount: number;
  blurredMs: number;
  clientElapsedMs: number;
}): string {
  return [
    "insidcode-duel-v1",
    params.roundChallenge,
    params.codeHash,
    Math.max(0, Math.round(params.keystrokes)),
    Math.max(0, Math.round(params.backspaces)),
    Math.max(0, Math.round(params.pasteBlockedCount)),
    Math.max(0, Math.round(params.unexplainedBurstCount)),
    Math.max(0, Math.round(params.focusLostCount)),
    Math.max(0, Math.round(params.blurredMs)),
    Math.max(0, Math.round(params.clientElapsedMs)),
  ].join(":");
}

/**
 * Computes client/server proof payload deterministically from interaction telemetry and source code.
 */
export function computeInteractionProof(
  roundChallenge: string,
  code: string,
  metrics: Omit<DuelTelemetryPayload, "roundChallenge" | "interactionDigest" | "codeHash">
): DuelTelemetryPayload {
  const codeHash = sha256HexSync(code);
  const canonical = buildCanonicalInteractionString({
    roundChallenge,
    codeHash,
    keystrokes: metrics.keystrokes,
    backspaces: metrics.backspaces,
    pasteBlockedCount: metrics.pasteBlockedCount,
    unexplainedBurstCount: metrics.unexplainedBurstCount,
    focusLostCount: metrics.focusLostCount,
    blurredMs: metrics.blurredMs,
    clientElapsedMs: metrics.clientElapsedMs,
  });

  return {
    roundChallenge,
    codeHash,
    interactionDigest: sha256HexSync(canonical),
    keystrokes: Math.max(0, Math.round(metrics.keystrokes)),
    backspaces: Math.max(0, Math.round(metrics.backspaces)),
    pasteBlockedCount: Math.max(0, Math.round(metrics.pasteBlockedCount)),
    pasteBlockedChars: Math.max(0, Math.round(metrics.pasteBlockedChars)),
    unexplainedBurstCount: Math.max(0, Math.round(metrics.unexplainedBurstCount)),
    maxBurstChars: Math.max(0, Math.round(metrics.maxBurstChars)),
    focusLostCount: Math.max(0, Math.round(metrics.focusLostCount)),
    blurredMs: Math.max(0, Math.round(metrics.blurredMs)),
    foregroundMs: Math.max(0, Math.round(metrics.foregroundMs)),
    clientElapsedMs: Math.max(0, Math.round(metrics.clientElapsedMs)),
    idleGapsCount: Math.max(0, Math.round(metrics.idleGapsCount)),
  };
}

/**
 * Estimates net non-template characters authored by the player using prefix/suffix framing.
 * Ensures modifications inside starter templates are still measured accurately.
 */
export function computeCodeChangedChars(starterTemplate: string, submittedCode: string): number {
  const base = starterTemplate || "";
  const sub = submittedCode || "";
  if (!sub) return 0;
  if (!base) return sub.trim().length;

  let prefix = 0;
  const minLen = Math.min(base.length, sub.length);
  while (prefix < minLen && base.charCodeAt(prefix) === sub.charCodeAt(prefix)) {
    prefix++;
  }

  let suffix = 0;
  while (
    suffix < minLen - prefix &&
    base.charCodeAt(base.length - 1 - suffix) === sub.charCodeAt(sub.length - 1 - suffix)
  ) {
    suffix++;
  }

  return Math.max(0, sub.length - (prefix + suffix));
}

/**
 * Evaluates telemetry against anti-cheat heuristics and returns a structured integrity verdict.
 */
export function evaluateDuelTelemetryIntegrity(input: {
  difficulty: DuelDifficulty;
  elapsedServerMs: number;
  starterTemplate: string;
  submittedCode: string;
  telemetry: DuelTelemetryPayload;
  tokenValid: boolean;
}): DuelIntegrityVerdict {
  const flags: DuelIntegrityFlag[] = [];
  const reasons: string[] = [];
  let riskScore = 0;

  const minFloorSec = DUEL_MIN_SOLVE_SECONDS[input.difficulty] ?? 25;
  const elapsedSec = Math.max(0, input.elapsedServerMs / 1000);
  const remainingFloorSec = Math.max(0, Math.ceil(minFloorSec - elapsedSec));
  const changedChars = computeCodeChangedChars(input.starterTemplate, input.submittedCode);

  const safeElapsedMs = Math.max(input.elapsedServerMs, input.telemetry.clientElapsedMs, 1);
  const clampedBlurredMs = Math.min(input.telemetry.blurredMs, safeElapsedMs);
  const unfocusedRatio = Number((clampedBlurredMs / safeElapsedMs).toFixed(3));

  // 1. Anti-Bot Token / Session Signature Verification
  if (!input.tokenValid) {
    flags.push("INVALID_INTERACTION_TOKEN");
    reasons.push("Missing or invalid editor interaction token.");
    return {
      riskScore: 100,
      flags,
      action: "REJECT",
      reasons,
      elapsedSec,
      minFloorSec,
      remainingFloorSec,
      changedChars,
      unfocusedRatio,
    };
  }

  // 2. Difficulty-Scaled Minimum Time Floor
  if (elapsedSec < minFloorSec) {
    flags.push("BELOW_TIME_FLOOR");
    reasons.push(
      `Submitted in ${elapsedSec.toFixed(1)}s, below the ${minFloorSec}s minimum for ${input.difficulty} problems.`
    );
    return {
      riskScore: 75,
      flags,
      action: "REJECT",
      reasons,
      elapsedSec,
      minFloorSec,
      remainingFloorSec,
      changedChars,
      unfocusedRatio,
    };
  }

  // 3. Keystroke Dynamics & Burst Anomaly Detection
  const hasSignificantCode = changedChars >= 50;
  const expectedMinKeystrokes = Math.max(8, Math.floor(changedChars * 0.25));
  const hasLowKeystrokes = hasSignificantCode && input.telemetry.keystrokes < expectedMinKeystrokes;
  const hasMassiveUnexplainedBurst =
    input.telemetry.unexplainedBurstCount >= 1 && input.telemetry.maxBurstChars >= 80;

  if (hasLowKeystrokes || hasMassiveUnexplainedBurst) {
    flags.push("ZERO_KEYSTROKE_BURST");
    riskScore += 65;
    reasons.push(
      hasMassiveUnexplainedBurst
        ? `Large code insertion burst (${input.telemetry.maxBurstChars} chars) detected without normal typing.`
        : `Low editor keystroke count (${input.telemetry.keystrokes}) for ${changedChars} added characters.`
    );
  }

  // 4. Impossible Sustained Typing Velocity (>22 chars/sec across full solve window on 60+ chars)
  const charsPerSec = changedChars / Math.max(elapsedSec, 1);
  if (changedChars >= 60 && charsPerSec > 22) {
    flags.push("IMPOSSIBLE_TYPING_VELOCITY");
    riskScore += 45;
    reasons.push(`Sustained typing velocity (${charsPerSec.toFixed(1)} chars/s) exceeds human bounds.`);
  }

  // 5. Blocked External Clipboard Paste Telemetry
  if (input.telemetry.pasteBlockedCount > 0) {
    flags.push("PASTE_ATTEMPTS");
    const pastePenalty = Math.min(
      60,
      input.telemetry.pasteBlockedCount * 20 + (input.telemetry.pasteBlockedChars >= 100 ? 20 : 0)
    );
    riskScore += pastePenalty;
    reasons.push(
      `${input.telemetry.pasteBlockedCount} blocked external paste attempt(s) (${input.telemetry.pasteBlockedChars} chars).`
    );
  }

  // 6. Window Blur / Page Visibility Tracking (>70% unfocused)
  if (safeElapsedMs >= 10000 && unfocusedRatio > DUEL_MAX_UNFOCUSED_RATIO) {
    flags.push("EXCESSIVE_TAB_SWITCH");
    riskScore += 65;
    reasons.push(
      `Editor window unfocused ${Math.round(unfocusedRatio * 100)}% of active round (${input.telemetry.focusLostCount} switches).`
    );
  } else if (safeElapsedMs >= 15000 && unfocusedRatio > 0.45 && input.telemetry.focusLostCount >= 3) {
    riskScore += 25;
    reasons.push(
      `Elevated window switching (${Math.round(unfocusedRatio * 100)}% unfocused across ${input.telemetry.focusLostCount} switches).`
    );
  }

  riskScore = Math.min(100, riskScore);

  let action: DuelIntegrityAction = "CLEAN";
  if (riskScore >= 60) {
    action = "FLAG_AND_VOID_ELO";
  } else if (riskScore >= 30) {
    action = "WARN";
  }

  return {
    riskScore,
    flags,
    action,
    reasons,
    elapsedSec,
    minFloorSec,
    remainingFloorSec,
    changedChars,
    unfocusedRatio,
  };
}
