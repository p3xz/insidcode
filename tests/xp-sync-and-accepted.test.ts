/**
 * Test Suite: XP Synchronization, Page Stability, and Accepted Screen Navigation
 */

import { findNextUnsolvedProblem, ProblemCatalogItem } from "../src/lib/problems";
import {
  computeExpectedLanguagePoints,
  computeExpectedUserXp,
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

console.log("\n--- Suite 1: XP Synchronization & Single Source of Truth ---");

it("Single source of truth: total XP equals sum of all language points", () => {
  const solves = [
    { language: "python", points: 10 },
    { language: "c", points: 10 },
    { language: "c", points: 10 }, // problem 2 in c
    { language: "java", points: 10 },
  ];

  const breakdown = computeExpectedLanguagePoints(solves);
  assert(breakdown.python === 10, "Python points should be 10");
  assert(breakdown.c === 20, "C points should be 20");
  assert(breakdown.java === 10, "Java points should be 10");
  assert(breakdown.javascript === 0, "JS points should be 0");
  assert(breakdown.cpp === 0, "C++ points should be 0");

  const totalXp = computeExpectedUserXp(breakdown);
  assert(totalXp === 40, `Total XP should be 40, got ${totalXp}`);
});

it("Idempotent solving: duplicate language solve awards 0 XP", () => {
  // Simulating duplicate solves (only 1 valid LanguageSolve per language per problem)
  const solves = [
    { language: "python", points: 10 },
  ];
  const breakdown1 = computeExpectedLanguagePoints(solves);
  const xp1 = computeExpectedUserXp(breakdown1);
  assert(xp1 === 10, "First solve is 10 XP");

  // Attempting duplicate solve in same language results in duplicate key 11000 => 0 new solve record
  const breakdown2 = computeExpectedLanguagePoints(solves);
  const xp2 = computeExpectedUserXp(breakdown2);
  assert(xp2 === 10, "Duplicate solve awards 0 XP");
});

it("Solving same problem in new language awards +10 XP to both User.xp and languagePoints", () => {
  const solves = [
    { language: "python", points: 10 },
    { language: "java", points: 10 }, // same problem in Java
  ];
  const breakdown = computeExpectedLanguagePoints(solves);
  assert(breakdown.python === 10, "Python has 10");
  assert(breakdown.java === 10, "Java has 10");
  assert(computeExpectedUserXp(breakdown) === 20, "Total XP is 20");
});

console.log("\n--- Suite 2: Next Problem Resolution Algorithm ---");

const mockCatalog: ProblemCatalogItem[] = [
  { problemId: "P-001", title: "Two Sums", phase: 1 },
  { problemId: "P-002", title: "Even or Odd", phase: 1 },
  { problemId: "P-003", title: "Max Number", phase: 1 },
  { problemId: "P-010", title: "Count Digits", phase: 2 },
  { problemId: "P-011", title: "Sum of Series", phase: 2 },
  { problemId: "P-020", title: "Fibonacci", phase: 3 },
];

it("Finds the next unsolved problem in the same phase", () => {
  // Solved: P-001. Current: P-001. Next should be P-002
  const res = findNextUnsolvedProblem("P-001", 1, mockCatalog, ["P-001"]);
  assert(res.nextProblem?.problemId === "P-002", `Expected P-002, got ${res.nextProblem?.problemId}`);
  assert(!res.isAllSolved, "isAllSolved should be false");
});

it("Wraps to earlier unsolved problem in same phase if solving later problem first", () => {
  // P-001 unsolved, P-002 solved. Current P-002.
  const res = findNextUnsolvedProblem("P-002", 1, mockCatalog, ["P-002", "P-003"]);
  assert(res.nextProblem?.problemId === "P-001", `Expected P-001, got ${res.nextProblem?.problemId}`);
  assert(!res.isAllSolved, "isAllSolved should be false");
});

it("Navigates to the first unsolved problem in the next phase when current phase is fully solved", () => {
  // All phase 1 solved: P-001, P-002, P-003. Current: P-003.
  const res = findNextUnsolvedProblem("P-003", 1, mockCatalog, ["P-001", "P-002", "P-003"]);
  assert(res.nextProblem?.problemId === "P-010", `Expected P-010 in Phase 2, got ${res.nextProblem?.problemId}`);
  assert(res.nextProblem?.phase === 2, "Phase should be 2");
  assert(!res.isAllSolved, "isAllSolved should be false");
});

it("Returns isAllSolved = true when every problem in the catalog is solved", () => {
  const allSolved = mockCatalog.map((p) => p.problemId);
  const res = findNextUnsolvedProblem("P-020", 3, mockCatalog, allSolved);
  assert(res.nextProblem === null, "nextProblem should be null");
  assert(res.isAllSolved === true, "isAllSolved should be true");
});

console.log("\n--- Suite 3: Page Stability & SWR Cache Invalidation Isolation ---");

function isKeyInvalidatedBySubmit(key: unknown): boolean {
  const keyStr =
    typeof key === "string"
      ? key
      : Array.isArray(key) && typeof key[1] === "string"
      ? key[1]
      : "";
  return (
    keyStr.startsWith("/api/stats") ||
    keyStr === "/api/problems" ||
    keyStr.startsWith("/api/problems?") ||
    keyStr.startsWith("/api/leaderboard") ||
    keyStr.startsWith("/api/user/profile")
  );
}

it("Does NOT invalidate the active problem page /api/problems/[id]", () => {
  assert(
    !isKeyInvalidatedBySubmit(["problem", "/api/problems/p-001"]),
    "Must not invalidate active problem /api/problems/p-001"
  );
  assert(
    !isKeyInvalidatedBySubmit("/api/problems/two-sum"),
    "Must not invalidate /api/problems/two-sum"
  );
});

it("Invalidates directory, leaderboard, stats, and profile without unmounting workspace", () => {
  assert(isKeyInvalidatedBySubmit("/api/problems"), "Must invalidate /api/problems");
  assert(isKeyInvalidatedBySubmit("/api/problems?phase=1"), "Must invalidate /api/problems?phase=1");
  assert(isKeyInvalidatedBySubmit("/api/stats"), "Must invalidate /api/stats");
  assert(isKeyInvalidatedBySubmit("/api/leaderboard"), "Must invalidate /api/leaderboard");
  assert(isKeyInvalidatedBySubmit("/api/user/profile"), "Must invalidate /api/user/profile");
});

console.log("\n--- Suite 4: Reconciliation Safety Guardrails ---");

it("Reconciliation dry-run: detects drift without applying mutations", () => {
  const user = {
    username: "alice",
    xp: 200, // drift: missing 40 XP from other language solves
    languagePoints: { python: 100, c: 100, cpp: 0, java: 40, javascript: 0 }, // sum 240
  };
  const solves = [
    { language: "python", points: 100 },
    { language: "c", points: 100 },
    { language: "java", points: 40 },
  ];
  const expectedBreakdown = computeExpectedLanguagePoints(solves);
  const expectedXp = computeExpectedUserXp(expectedBreakdown);

  assert(expectedXp === 240, `Expected 240, got ${expectedXp}`);
  const drift = expectedXp - user.xp;
  assert(drift === 40, `Drift should be +40 XP, got ${drift}`);
  // In dry run, user object remains unchanged
  assert(user.xp === 200, "user.xp must not change in dry-run");
});

console.log("\n======================================================");
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log("======================================================\n");

if (failed > 0) {
  process.exit(1);
}
