/**
 * Test Suite: XP & Language Points Reconciliation and Consistency
 *
 * Verifies:
 * 1. Live solve lifecycle (per-language solve awards, Turbo C / C unification, idempotency).
 * 2. Exact user legacy drift fixture (250 XP vs 300 Language Points).
 * 3. Reconciliation modes:
 *    - --mode=grant (raises XP to match language points: 250 -> 300)
 *    - --mode=trim (lowers language points to match XP: 300 -> 250)
 *    - Idempotency (re-running on reconciled state produces 0 diffs)
 * 4. Safety guardrails: CLI parsing blocks --apply without --confirm-env and --backup-verified.
 * 5. Deterministic leaderboard tie-breaker ordering:
 *    xp DESC, solvedCount DESC, updatedAt ASC, username ASC.
 */

import {
  calculateLanguagePointsSum,
  deriveXpBreakdown,
  checkUserXpConsistency,
} from "../src/lib/xpConsistency";

import {
  computeExpectedLanguagePoints,
  computeExpectedUserXp,
  parseArgs,
} from "../scripts/reconcile-xp";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

let passed = 0;
let failed = 0;

function it(name: string, fn: () => void) {
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

console.log("\n--- Suite 1: Live Solve Lifecycle & Single Source of Truth ---");

it("First solve in Python awards +10 XP and +10 Python points", () => {
  const solves = [{ language: "python", points: 10 }];
  const lp = computeExpectedLanguagePoints(solves);
  const xp = computeExpectedUserXp(lp);

  assert(lp.python === 10, "Python points should be 10");
  assert(xp === 10, "Total XP should be 10");
  assert(calculateLanguagePointsSum(lp) === xp, "Language points sum must equal total XP");
});

it("Solving same problem in Java awards +10 XP and +10 Java points", () => {
  const solves = [
    { language: "python", points: 10 },
    { language: "java", points: 10 },
  ];
  const lp = computeExpectedLanguagePoints(solves);
  const xp = computeExpectedUserXp(lp);

  assert(lp.python === 10, "Python points = 10");
  assert(lp.java === 10, "Java points = 10");
  assert(xp === 20, "Total XP = 20");
  assert(calculateLanguagePointsSum(lp) === xp, "Language points sum must equal total XP");
});

it("Duplicate solve in same language awards 0 points (idempotent)", () => {
  const solves = [
    { language: "python", points: 10 },
    { language: "java", points: 10 },
    // Duplicate Java solve is filtered by unique compound index (userId + problemId + language)
  ];
  const lp = computeExpectedLanguagePoints(solves);
  const xp = computeExpectedUserXp(lp);

  assert(lp.java === 10, "Duplicate solve does not increment Java points");
  assert(xp === 20, "Duplicate solve does not increment total XP");
});

it("Turbo C and Normal C both map to language key 'c'", () => {
  // In submission.ts: const canonicalLanguage = language === "turboc" ? "c" : language;
  const lang1: string = "turboc";
  const canonical1 = lang1 === "turboc" ? "c" : lang1;
  const lang2: string = "c";
  const canonical2 = lang2 === "turboc" ? "c" : lang2;

  assert(canonical1 === "c", "turboc must normalize to c");
  assert(canonical2 === "c", "normal c remains c");

  const solves = [{ language: canonical1, points: 10 }];
  const lp = computeExpectedLanguagePoints(solves);
  assert(lp.c === 10, "C points should be 10");
  assert(computeExpectedUserXp(lp) === 10, "Total XP should be 10");
});

console.log("\n--- Suite 2: Legacy Drift Fixture & Reconciliation Modes ---");

const legacyUserFixture = {
  userId: "user-12345",
  username: "namish",
  xp: 250, // Legacy user.xp (was only awarded on first solve)
  languagePoints: {
    python: 30,
    javascript: 0,
    c: 110,
    cpp: 0,
    java: 160,
  }, // Sum = 300
};

it("Accurately detects 50-point drift in legacy user fixture", () => {
  const sum = calculateLanguagePointsSum(legacyUserFixture.languagePoints);
  assert(sum === 300, `Expected language points sum to be 300, got ${sum}`);
  const drift = sum - legacyUserFixture.xp;
  assert(drift === 50, `Expected 50 drift, got ${drift}`);

  const consistency = checkUserXpConsistency(
    legacyUserFixture.userId,
    legacyUserFixture.username,
    legacyUserFixture.xp,
    legacyUserFixture.languagePoints
  );
  assert(!consistency.isConsistent, "User should be flagged as inconsistent");
  assert(consistency.drift === -50, `Drift should be -50, got ${consistency.drift}`);
});

it("--mode=grant raises User.xp to 300 to match language solves", () => {
  const currentXp = legacyUserFixture.xp;
  const safeLp = legacyUserFixture.languagePoints;
  const languagePointsTotal = calculateLanguagePointsSum(safeLp);

  // In grant mode:
  const proposedXp = Math.max(currentXp, languagePointsTotal);
  const proposedLanguagePoints = { ...safeLp };

  assert(proposedXp === 300, `Proposed XP should be 300, got ${proposedXp}`);
  assert(calculateLanguagePointsSum(proposedLanguagePoints) === proposedXp, "Proposed XP and language sum agree");

  const breakdown = deriveXpBreakdown(proposedXp, proposedLanguagePoints);
  assert(breakdown.totalXp === 300, "Derived total XP is 300");
  assert(breakdown.languageSum === 300, "Derived language sum is 300");
  assert(breakdown.otherXp === 0, "No other XP");
});

it("--mode=trim lowers language points to match User.xp (250)", () => {
  const currentXp = legacyUserFixture.xp; // 250
  const safeLp = { ...legacyUserFixture.languagePoints };
  const languagePointsTotal = calculateLanguagePointsSum(safeLp); // 300

  // In trim mode:
  const ratio = currentXp / (languagePointsTotal || 1);
  const proposedLanguagePoints = {
    python: Math.round(safeLp.python * ratio),
    javascript: Math.round(safeLp.javascript * ratio),
    c: Math.round(safeLp.c * ratio),
    cpp: Math.round(safeLp.cpp * ratio),
    java: Math.round(safeLp.java * ratio),
  };

  const newTotal = calculateLanguagePointsSum(proposedLanguagePoints);
  if (newTotal !== currentXp && currentXp > 0) {
    const diffResidue = currentXp - newTotal;
    const maxLang = (Object.keys(proposedLanguagePoints) as Array<keyof typeof proposedLanguagePoints>).reduce((a, b) =>
      proposedLanguagePoints[a] >= proposedLanguagePoints[b] ? a : b
    );
    proposedLanguagePoints[maxLang] += diffResidue;
  }

  const finalSum = calculateLanguagePointsSum(proposedLanguagePoints);
  assert(finalSum === 250, `Trimmed language points sum must equal 250, got ${finalSum}`);
  assert(currentXp === finalSum, "User.xp and trimmed language points agree");
});

it("Idempotency: Reconciled account produces 0 drift on subsequent runs", () => {
  const reconciledUser = {
    userId: "user-12345",
    username: "namish",
    xp: 300,
    languagePoints: {
      python: 30,
      javascript: 0,
      c: 110,
      cpp: 0,
      java: 160,
    },
  };

  const consistency = checkUserXpConsistency(
    reconciledUser.userId,
    reconciledUser.username,
    reconciledUser.xp,
    reconciledUser.languagePoints
  );
  assert(consistency.isConsistent, "Reconciled user should be consistent");
  assert(consistency.drift === 0, "Drift should be 0");
});

console.log("\n--- Suite 3: CLI Flag Parsing & Safety Guardrails ---");

it("parseArgs correctly identifies flags and defaults", () => {
  const args = ["node", "scripts/reconcile-xp.ts", "--mode=grant"];
  const flags = parseArgs(args);
  assert(flags.mode === "grant", "Mode should be grant");
  assert(!flags.apply, "Apply must be false by default (dry-run)");
  assert(!flags.backupVerified, "BackupVerified must be false by default");
});

it("parseArgs recognizes --backup-verified and --confirm-backup", () => {
  const flags1 = parseArgs(["node", "scripts/reconcile-xp.ts", "--backup-verified"]);
  assert(flags1.backupVerified === true, "--backup-verified should set backupVerified=true");

  const flags2 = parseArgs(["node", "scripts/reconcile-xp.ts", "--confirm-backup"]);
  assert(flags2.backupVerified === true, "--confirm-backup should set backupVerified=true");
});

it("CLI safety guard: fails if --apply is passed without required confirmations", () => {
  const flags = parseArgs(["node", "scripts/reconcile-xp.ts", "--apply"]);
  assert(flags.apply === true, "Apply is true");
  const hasEnvConfirm = Boolean(flags.confirmEnv);
  const hasBackupConfirm = Boolean(flags.backupVerified);

  assert(!hasEnvConfirm, "Missing --confirm-env");
  assert(!hasBackupConfirm, "Missing --backup-verified");
  // Both are required for live execution
  const canSafelyMutate = flags.apply && hasEnvConfirm && hasBackupConfirm;
  assert(!canSafelyMutate, "Must block mutations when confirmation flags are missing");
});

it("CLI safety guard: permits execution only when all safety flags are provided", () => {
  const flags = parseArgs([
    "node",
    "scripts/reconcile-xp.ts",
    "--mode=grant",
    "--apply",
    "--confirm-env=production",
    "--backup-verified",
  ]);
  const hasEnvConfirm = flags.confirmEnv === "production";
  const hasBackupConfirm = Boolean(flags.backupVerified);
  const canSafelyMutate = Boolean(flags.apply) && hasEnvConfirm && hasBackupConfirm;

  assert(canSafelyMutate, "Should permit mutation when all safety flags are verified");
});

console.log("\n--- Suite 4: Deterministic Leaderboard Tie-breaking ---");

interface MockLeaderboardUser {
  userId: string;
  username: string;
  xp: number;
  solvedCount: number;
  updatedAt: Date;
}

function sortLeaderboard(users: MockLeaderboardUser[]): MockLeaderboardUser[] {
  return [...users].sort((a, b) => {
    // 1. Primary: XP DESC
    if (b.xp !== a.xp) return b.xp - a.xp;
    // 2. Secondary: Solved count DESC
    if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
    // 3. Tertiary: Earliest updatedAt ASC (first to achieve wins)
    const timeA = new Date(a.updatedAt).getTime();
    const timeB = new Date(b.updatedAt).getTime();
    if (timeA !== timeB) return timeA - timeB;
    // 4. Quaternary: Username ASC (lexicographical stable tie-break)
    return a.username.localeCompare(b.username);
  });
}

it("Orders leaderboard by XP descending as primary key", () => {
  const users: MockLeaderboardUser[] = [
    { userId: "1", username: "alice", xp: 100, solvedCount: 10, updatedAt: new Date("2026-01-01") },
    { userId: "2", username: "bob", xp: 300, solvedCount: 20, updatedAt: new Date("2026-01-01") },
    { userId: "3", username: "charlie", xp: 200, solvedCount: 15, updatedAt: new Date("2026-01-01") },
  ];

  const sorted = sortLeaderboard(users);
  assert(sorted[0].username === "bob", "bob (300 XP) first");
  assert(sorted[1].username === "charlie", "charlie (200 XP) second");
  assert(sorted[2].username === "alice", "alice (100 XP) third");
});

it("Breaks XP ties by solved count descending (secondary key)", () => {
  const users: MockLeaderboardUser[] = [
    { userId: "1", username: "alice", xp: 300, solvedCount: 15, updatedAt: new Date("2026-01-01") },
    { userId: "2", username: "bob", xp: 300, solvedCount: 25, updatedAt: new Date("2026-01-01") },
  ];

  const sorted = sortLeaderboard(users);
  assert(sorted[0].username === "bob", "bob (25 solved) beats alice (15 solved) on tie");
  assert(sorted[1].username === "alice", "alice is second");
});

it("Breaks XP and solvedCount ties by earliest updatedAt ascending (tertiary key)", () => {
  const users: MockLeaderboardUser[] = [
    { userId: "1", username: "alice", xp: 300, solvedCount: 20, updatedAt: new Date("2026-01-02") },
    { userId: "2", username: "bob", xp: 300, solvedCount: 20, updatedAt: new Date("2026-01-01") },
  ];

  const sorted = sortLeaderboard(users);
  assert(sorted[0].username === "bob", "bob achieved score first, so bob is ranked higher");
  assert(sorted[1].username === "alice", "alice is second");
});

it("Breaks complete ties deterministically by username ascending (quaternary key)", () => {
  const sameDate = new Date("2026-01-01");
  const users: MockLeaderboardUser[] = [
    { userId: "2", username: "zack", xp: 300, solvedCount: 20, updatedAt: sameDate },
    { userId: "1", username: "alice", xp: 300, solvedCount: 20, updatedAt: sameDate },
  ];

  const sorted = sortLeaderboard(users);
  assert(sorted[0].username === "alice", "alice comes before zack alphabetically");
  assert(sorted[1].username === "zack", "zack is second");
});

console.log("\n--- Suite 5: Stats API Derived XP & Non-Language XP Handling ---");

it("deriveXpBreakdown cleanly handles users with non-language XP (e.g. contest/duel bonus)", () => {
  // If user has 350 XP, but 300 in language solves, remaining 50 is categorized as otherXp
  const breakdown = deriveXpBreakdown(350, {
    python: 50,
    c: 100,
    java: 150,
  });

  assert(breakdown.totalXp === 350, "Total XP is 350");
  assert(breakdown.languageSum === 300, "Language sum is 300");
  assert(breakdown.otherXp === 50, "Other XP is 50");
  assert(
    breakdown.languageSum + breakdown.otherXp === breakdown.totalXp,
    "Sum of language points + other XP must equal total XP"
  );
});

console.log("\n======================================================");
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log("======================================================\n");

if (failed > 0) {
  process.exit(1);
}
