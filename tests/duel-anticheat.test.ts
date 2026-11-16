/**
 * Test Suite: Duel Anti-Cheat Engine, Interaction Proofs, Time Floors & Guardrails
 */

import assert from "node:assert";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import {
  computeCodeChangedChars,
  computeInteractionProof,
  DUEL_MIN_SOLVE_SECONDS,
  evaluateDuelTelemetryIntegrity,
  mergeMonotonicTelemetry,
  sha256HexSync,
} from "../src/lib/duelAntiCheatShared";
import {
  issueDuelRoundChallenge,
  verifyDuelInteractionToken,
} from "../src/lib/duelAntiCheat";
import { buildAdminRoomIntegrity } from "../src/lib/duelSpectateAdmin";
import { DuelSubmissionSchema } from "../src/lib/validations";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed += 1;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${(err as Error).message}`);
    failed += 1;
  }
}

console.log("\n--- Suite 1: Synchronous SHA-256 Parity vs Node Crypto ---");

test("sha256HexSync matches Node native crypto SHA-256 across ASCII, code, and Unicode", () => {
  const samples = [
    "",
    "hello world",
    "def solve(n):\n    return n * 2\nprint(solve(5))",
    "αβγ 🚀 edge-case line1\r\nline2",
    "x".repeat(500),
  ];

  for (const s of samples) {
    const expected = crypto.createHash("sha256").update(s, "utf8").digest("hex");
    const actual = sha256HexSync(s);
    assert.strictEqual(actual, expected, `Hash mismatch for sample length ${s.length}`);
  }
});

console.log("\n--- Suite 2: HMAC Challenge Issuance & Anti-Bot Token Verification ---");

test("Valid challenge + client interaction proof verifies cleanly", () => {
  const startedAtMs = 1700000000000;
  const code = "n = int(input())\nprint(n + 1)\n";
  const challenge = issueDuelRoundChallenge({
    userId: "user_1",
    roomCode: "DUEL-ABC123",
    roundNumber: 1,
    startedAtMs,
  });

  const telemetry = computeInteractionProof(challenge, code, {
    keystrokes: 34,
    backspaces: 4,
    pasteBlockedCount: 0,
    pasteBlockedChars: 0,
    unexplainedBurstCount: 0,
    maxBurstChars: 0,
    focusLostCount: 0,
    blurredMs: 0,
    foregroundMs: 28000,
    clientElapsedMs: 28000,
    idleGapsCount: 2,
  });

  const check = verifyDuelInteractionToken({
    userId: "user_1",
    roomCode: "DUEL-ABC123",
    roundNumber: 1,
    expectedStartedAtMs: startedAtMs,
    submittedCode: code,
    telemetry,
  });

  assert.strictEqual(check.valid, true, check.reason);
});

test("Rejects forged challenge, mismatched user, tampered code, or tampered keystroke count", () => {
  const startedAtMs = 1700000000000;
  const code = "print('real human code')";
  const challenge = issueDuelRoundChallenge({
    userId: "user_1",
    roomCode: "DUEL-ABC123",
    roundNumber: 1,
    startedAtMs,
  });

  const validTelemetry = computeInteractionProof(challenge, code, {
    keystrokes: 25,
    backspaces: 2,
    pasteBlockedCount: 0,
    pasteBlockedChars: 0,
    unexplainedBurstCount: 0,
    maxBurstChars: 0,
    focusLostCount: 0,
    blurredMs: 0,
    foregroundMs: 20000,
    clientElapsedMs: 20000,
    idleGapsCount: 1,
  });

  // Wrong userId
  const wrongUser = verifyDuelInteractionToken({
    userId: "user_2",
    roomCode: "DUEL-ABC123",
    roundNumber: 1,
    expectedStartedAtMs: startedAtMs,
    submittedCode: code,
    telemetry: validTelemetry,
  });
  assert.strictEqual(wrongUser.valid, false, "Challenge must be bound to userId");

  // Tampered source code
  const tamperedCode = verifyDuelInteractionToken({
    userId: "user_1",
    roomCode: "DUEL-ABC123",
    roundNumber: 1,
    expectedStartedAtMs: startedAtMs,
    submittedCode: "print('AI pasted solution')",
    telemetry: validTelemetry,
  });
  assert.strictEqual(tamperedCode.valid, false, "Must reject when submitted code hash differs");

  // Tampered telemetry keystroke inflation without digest match
  const tamperedKeystrokes = verifyDuelInteractionToken({
    userId: "user_1",
    roomCode: "DUEL-ABC123",
    roundNumber: 1,
    expectedStartedAtMs: startedAtMs,
    submittedCode: code,
    telemetry: { ...validTelemetry, keystrokes: 500 },
  });
  assert.strictEqual(tamperedKeystrokes.valid, false, "Must reject modified telemetry metrics");
});

test("Zod DuelSubmissionSchema blocks raw API scripts omitting telemetry", () => {
  const botRequest = {
    problemId: "001",
    language: "python",
    code: "print(42)",
  };
  const parsed = DuelSubmissionSchema.safeParse(botRequest);
  assert.strictEqual(parsed.success, false, "Submit without telemetry must fail schema validation");
});

console.log("\n--- Suite 3: Difficulty-Scaled Minimum Time Floors ---");

test("Enforces exact difficulty floor thresholds before evaluation", () => {
  const starter = "def solve():\n    pass\n";
  const submitted = "def solve():\n    return int(input()) * 2\n";

  const makeValidProof = (elapsedMs: number) =>
    computeInteractionProof("1000.sig", submitted, {
      keystrokes: 35,
      backspaces: 2,
      pasteBlockedCount: 0,
      pasteBlockedChars: 0,
      unexplainedBurstCount: 0,
      maxBurstChars: 0,
      focusLostCount: 0,
      blurredMs: 0,
      foregroundMs: elapsedMs,
      clientElapsedMs: elapsedMs,
      idleGapsCount: 1,
    });

  const difficulties = ["Very Easy", "Easy", "Medium", "Hard"] as const;
  for (const diff of difficulties) {
    const floorSec = DUEL_MIN_SOLVE_SECONDS[diff];
    const tooFast = evaluateDuelTelemetryIntegrity({
      difficulty: diff,
      elapsedServerMs: (floorSec - 1) * 1000,
      starterTemplate: starter,
      submittedCode: submitted,
      telemetry: makeValidProof((floorSec - 1) * 1000),
      tokenValid: true,
    });
    assert.strictEqual(tooFast.action, "REJECT", `${diff} submitted under ${floorSec}s must REJECT`);
    assert.ok(tooFast.flags.includes("BELOW_TIME_FLOOR"));

    const allowed = evaluateDuelTelemetryIntegrity({
      difficulty: diff,
      elapsedServerMs: (floorSec + 2) * 1000,
      starterTemplate: starter,
      submittedCode: submitted,
      telemetry: makeValidProof((floorSec + 2) * 1000),
      tokenValid: true,
    });
    assert.strictEqual(allowed.action, "CLEAN", `${diff} above floor cleanly with human typing must be CLEAN`);
  }
});

console.log("\n--- Suite 4: Keystroke Dynamics, Paste Telemetry & Window Blur Tracking ---");

test("Normal human authoring produces CLEAN verdict", () => {
  const starter = "# starter\n";
  const code = "# starter\nn = int(input())\ns = sum(range(1, n + 1))\nprint(s)\n";
  const changed = computeCodeChangedChars(starter, code);
  assert.ok(changed > 40);

  const verdict = evaluateDuelTelemetryIntegrity({
    difficulty: "Medium",
    elapsedServerMs: 55000,
    starterTemplate: starter,
    submittedCode: code,
    telemetry: computeInteractionProof("c", code, {
      keystrokes: 85,
      backspaces: 12,
      pasteBlockedCount: 0,
      pasteBlockedChars: 0,
      unexplainedBurstCount: 0,
      maxBurstChars: 0,
      focusLostCount: 1,
      blurredMs: 4000,
      foregroundMs: 51000,
      clientElapsedMs: 55000,
      idleGapsCount: 3,
    }),
    tokenValid: true,
  });

  assert.strictEqual(verdict.action, "CLEAN");
  assert.strictEqual(verdict.flags.length, 0);
});

test("0-keystroke bulk insertion triggers ZERO_KEYSTROKE_BURST & FLAG_AND_VOID_ELO", () => {
  const starter = "# starter\n";
  const code = "def dijkstra(graph, start):\n    import heapq\n    dist = {start: 0}\n    pq = [(0, start)]\n    return dist\n";

  const verdict = evaluateDuelTelemetryIntegrity({
    difficulty: "Medium",
    elapsedServerMs: 32000,
    starterTemplate: starter,
    submittedCode: code,
    telemetry: computeInteractionProof("c", code, {
      keystrokes: 3,
      backspaces: 0,
      pasteBlockedCount: 0,
      pasteBlockedChars: 0,
      unexplainedBurstCount: 1,
      maxBurstChars: 105,
      focusLostCount: 1,
      blurredMs: 8000,
      foregroundMs: 24000,
      clientElapsedMs: 32000,
      idleGapsCount: 0,
    }),
    tokenValid: true,
  });

  assert.strictEqual(verdict.action, "FLAG_AND_VOID_ELO");
  assert.ok(verdict.flags.includes("ZERO_KEYSTROKE_BURST"));
  assert.ok(verdict.riskScore >= 60);
});

test("Excessive tab-switching (>70% unfocused) voids Elo cleanly", () => {
  const starter = "# starter\n";
  const code = "n = int(input())\nprint(n * n if n > 0 else 0)\n";

  const verdict = evaluateDuelTelemetryIntegrity({
    difficulty: "Easy",
    elapsedServerMs: 60000,
    starterTemplate: starter,
    submittedCode: code,
    telemetry: computeInteractionProof("c", code, {
      keystrokes: 45,
      backspaces: 5,
      pasteBlockedCount: 0,
      pasteBlockedChars: 0,
      unexplainedBurstCount: 0,
      maxBurstChars: 0,
      focusLostCount: 4,
      blurredMs: 48000, // 80% unfocused
      foregroundMs: 12000,
      clientElapsedMs: 60000,
      idleGapsCount: 1,
    }),
    tokenValid: true,
  });

  assert.strictEqual(verdict.action, "FLAG_AND_VOID_ELO");
  assert.ok(verdict.flags.includes("EXCESSIVE_TAB_SWITCH"));
  assert.ok(verdict.unfocusedRatio > 0.7);
});

test("Repeated blocked paste attempts accumulate risk & flag match", () => {
  const starter = "# starter\n";
  const code = "# starter\nprint(int(input()) + 1)\n";

  const verdict = evaluateDuelTelemetryIntegrity({
    difficulty: "Easy",
    elapsedServerMs: 30000,
    starterTemplate: starter,
    submittedCode: code,
    telemetry: computeInteractionProof("c", code, {
      keystrokes: 40,
      backspaces: 2,
      pasteBlockedCount: 3,
      pasteBlockedChars: 240,
      unexplainedBurstCount: 0,
      maxBurstChars: 0,
      focusLostCount: 0,
      blurredMs: 0,
      foregroundMs: 30000,
      clientElapsedMs: 30000,
      idleGapsCount: 1,
    }),
    tokenValid: true,
  });

  assert.strictEqual(verdict.action, "FLAG_AND_VOID_ELO");
  assert.ok(verdict.flags.includes("PASTE_ATTEMPTS"));
});

console.log("\n--- Suite 5: Scope & Integration Guardrails (Practice Isolation & Testing Freedom) ---");

test("Practice workspace does NOT restrict paste (duelMode not enabled in ProblemWorkspace)", () => {
  const workspaceCode = fs.readFileSync(
    path.join(process.cwd(), "src/components/problem/ProblemWorkspace.tsx"),
    "utf8"
  );
  assert.strictEqual(workspaceCode.includes("duelMode"), false, "Regular ProblemWorkspace must remain unrestricted");
  assert.strictEqual(workspaceCode.includes("onCopyCapture"), false, "Practice must allow copying questions");
  assert.strictEqual(workspaceCode.includes("useDuelAntiCheat"), false, "Practice must not load duel anti-cheat");

  const duelPageCode = fs.readFileSync(
    path.join(process.cwd(), "src/app/duel/[roomCode]/page.tsx"),
    "utf8"
  );
  assert.ok(duelPageCode.includes("duelMode={true}"), "DuelArenaPage must enable duelMode anti-cheat");
  assert.ok(
    duelPageCode.includes("WebkitTouchCallout") && duelPageCode.includes("onCopyCapture"),
    "DuelArenaPage must block copying questions across desktop & mobile"
  );

  const spectateCode = fs.readFileSync(
    path.join(process.cwd(), "src/app/duel/[roomCode]/spectate/page.tsx"),
    "utf8"
  );
  assert.ok(
    spectateCode.includes("WebkitTouchCallout") && spectateCode.includes("onCopyCapture"),
    "Spectator view must also prevent copying questions"
  );

  const editorCode = fs.readFileSync(
    path.join(process.cwd(), "src/components/editor/CodeEditor.tsx"),
    "utf8"
  );
  assert.ok(editorCode.includes("insertFromPaste"), "CodeEditor must guard mobile beforeinput insertFromPaste");
  assert.ok(editorCode.includes("nonWhitespaceChars >= 18"), "CodeEditor must guard against mobile keyboard clipboard dumps");
});

test("Duel create & join routes permit same-IP / new-account / rematch local testing as requested", () => {
  const createCode = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/duel/create/route.ts"),
    "utf8"
  );
  const joinCode = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/duel/join/route.ts"),
    "utf8"
  );
  assert.strictEqual(createCode.includes("solvedProblems.length"), false, "Must not block <5 solved accounts");
  assert.strictEqual(joinCode.includes("x-forwarded-for"), false, "Must not block shared-IP test accounts");
});

test("finalizeDuelMatch guards Elo updates behind !room.eloVoided", () => {
  const duelLib = fs.readFileSync(
    path.join(process.cwd(), "src/lib/duel.ts"),
    "utf8"
  );
  assert.ok(duelLib.includes("if (room.eloVoided)"), "finalizeDuelMatch must bypass Elo updates when voided");
});

test("mergeMonotonicTelemetry preserves warnings and violation counters across tab closes & reopens", () => {
  const serverPrior = {
    keystrokes: 22,
    backspaces: 3,
    pasteBlockedCount: 2,
    pasteBlockedChars: 140,
    unexplainedBurstCount: 1,
    maxBurstChars: 90,
    focusLostCount: 3,
    blurredMs: 42000,
    foregroundMs: 18000,
    idleGapsCount: 2,
    lastWarning: "External paste blocked (2 attempts).",
    lastWarningSeverity: "danger" as const,
    warningDismissed: false,
    lastCheckpointAtMs: 1700000050000,
  };

  // Fresh reopened tab starts with zeroed volatile counters
  const freshReopenTab = {
    keystrokes: 0,
    backspaces: 0,
    pasteBlockedCount: 0,
    pasteBlockedChars: 0,
    unexplainedBurstCount: 0,
    maxBurstChars: 0,
    focusLostCount: 0,
    blurredMs: 0,
    foregroundMs: 0,
    idleGapsCount: 0,
  };

  const merged = mergeMonotonicTelemetry(freshReopenTab, serverPrior);
  assert.strictEqual(merged.pasteBlockedCount, 2, "Must retain blocked paste count after tab reopen");
  assert.strictEqual(merged.focusLostCount, 3, "Must retain focus switch count");
  assert.strictEqual(merged.blurredMs, 42000, "Must retain prior blurred duration");
  assert.strictEqual(merged.lastWarning, serverPrior.lastWarning, "Active warnings must persist after tab close/reopen");

  const arenaCode = fs.readFileSync(
    path.join(process.cwd(), "src/app/duel/[roomCode]/page.tsx"),
    "utf8"
  );
  assert.ok(arenaCode.includes('addEventListener("selectstart"'), "Duel Arena must block selectstart outside editor");
  assert.ok(arenaCode.includes('addEventListener("copy"'), "Duel Arena must block document copy outside editor");
});

console.log("\n--- Suite 6: Admin Duel Spectating & Telemetry Isolation ---");

test("buildAdminRoomIntegrity surfaces live warnings, tab-away staleness, and omits source code", () => {
  const nowMs = 1_700_000_100_000;
  const startedAtMs = nowMs - 100_000;
  const snapshot = buildAdminRoomIntegrity(
    {
      status: "ACTIVE",
      currentRound: 1,
      integrityFlagged: true,
      eloVoided: true,
      integrityReasons: ["alice: Repeated blocked paste attempts"],
      player2: { userId: "u2" },
      roundsData: [
        {
          roundNumber: 1,
          problemId: "two-sum",
          difficulty: "Medium",
          startedAt: new Date(startedAtMs),
          player1Status: "CODING",
          player2Status: "CODING",
          player1RiskScore: 78,
          player2RiskScore: 0,
          player1IntegrityFlags: ["PASTE_ATTEMPT_SPAM"],
          player2IntegrityFlags: [],
          player1TelemetrySummary: {
            keystrokes: 42,
            backspaces: 5,
            pasteBlockedCount: 3,
            pasteBlockedChars: 210,
            focusLostCount: 2,
            blurredMs: 25_000,
            unexplainedBurstCount: 1,
            maxBurstChars: 96,
            lastWarning: "External paste blocked (3 attempts).",
            lastWarningSeverity: "danger",
            warningDismissed: false,
            lastCheckpointAtMs: nowMs - 15_000,
          },
          player2TelemetrySummary: {
            keystrokes: 90,
            backspaces: 10,
            pasteBlockedCount: 0,
            pasteBlockedChars: 0,
            focusLostCount: 0,
            blurredMs: 0,
            lastWarning: null,
            lastCheckpointAtMs: nowMs - 2_000,
          },
        },
      ],
    },
    nowMs
  );

  assert.strictEqual(snapshot.eloVoided, true);
  assert.strictEqual(snapshot.integrityFlagged, true);
  assert.strictEqual(snapshot.player1.lastWarning, "External paste blocked (3 attempts).");
  assert.strictEqual(snapshot.player1.lastWarningSeverity, "danger");
  assert.strictEqual(snapshot.player1.pasteBlockedCount, 3);
  assert.strictEqual(snapshot.player1.staleHeartbeatSec, 15, "Must detect stale closed/away tab heartbeat > 8s");
  assert.strictEqual(snapshot.player1.unfocusedPercent, 40, "Must include live away time (25s + 15s of 100s)");
  assert.strictEqual(snapshot.player2?.staleHeartbeatSec, null, "Active player heartbeat 2s ago must not be marked stale");
  assert.strictEqual(snapshot.player2?.lastWarning, null);

  const serializedKeys = JSON.stringify(snapshot);
  assert.strictEqual(serializedKeys.includes("submittedCode"), false);
  assert.strictEqual(serializedKeys.includes("starterTemplate"), false);
  assert.strictEqual(serializedKeys.includes("interactionProof"), false);
});

test("Spectate route and Admin Duels route strictly enforce admin-only telemetry access", () => {
  const spectateRoute = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/duel/[roomCode]/spectate/route.ts"),
    "utf8"
  );
  assert.ok(
    spectateRoute.includes('user.role === "admin"') && spectateRoute.includes("isAdmin ? buildAdminRoomIntegrity"),
    "Spectate API must gate adminIntegrity behind admin role check"
  );
  assert.ok(
    spectateRoute.includes("...(adminIntegrity ? { adminIntegrity } : {})"),
    "Non-admin spectators must not receive adminIntegrity telemetry field"
  );

  const adminDuelsRoute = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/admin/duels/route.ts"),
    "utf8"
  );
  assert.ok(
    adminDuelsRoute.includes("requireAdminUser()"),
    "Admin duels endpoint must enforce requireAdminUser()"
  );

  const spectatePage = fs.readFileSync(
    path.join(process.cwd(), "src/app/duel/[roomCode]/spectate/page.tsx"),
    "utf8"
  );
  assert.ok(
    spectatePage.includes("isAdmin && adminIntegrity") && spectatePage.includes("<AdminIntegrityPanel"),
    "Spectate page must only render AdminIntegrityPanel when adminIntegrity is provided"
  );
});

console.log("\n======================================================");
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log("======================================================\n");

if (failed > 0) {
  process.exit(1);
}
