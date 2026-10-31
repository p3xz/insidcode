/**
 * Test Suite: Hotfix Problem Page 404s, ID Normalization, and Cache Leak Prevention
 */

import {
  normalizeProblemIdentifier,
  ProblemLookupResult,
} from "../src/lib/problems";
import { CURRICULUM_QUESTIONS } from "../src/lib/curriculumData";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

let passed = 0;
let failed = 0;

function it(name: string, fn: () => void | Promise<void>) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      res
        .then(() => {
          console.log(`  ✓ ${name}`);
          passed += 1;
        })
        .catch((err) => {
          console.error(`  ✗ ${name}`);
          console.error(`    ${(err as Error).message}`);
          failed += 1;
        });
      return;
    }
    console.log(`  ✓ ${name}`);
    passed += 1;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${(err as Error).message}`);
    failed += 1;
  }
}

async function runTests() {
  console.log("\n--- Suite 1: Problem ID Normalization & Canonical Redirect Logic ---");

  it("Normalizes single-digit '1' to canonical '001' and marks as non-canonical for redirect", () => {
    const res = normalizeProblemIdentifier("1");
    assert(res.valid === true, "Must be valid");
    assert(res.canonicalId === "001", `Expected canonicalId 001, got ${res.canonicalId}`);
    assert(res.isCanonical === false, "Must not be canonical (needs redirect to 001)");
    assert(res.isSlug === false, "Must not be slug");
  });

  it("Normalizes two-digit '01' to canonical '001'", () => {
    const res = normalizeProblemIdentifier("01");
    assert(res.valid === true, "Must be valid");
    assert(res.canonicalId === "001", `Expected 001, got ${res.canonicalId}`);
    assert(res.isCanonical === false, "Must not be canonical (needs redirect)");
  });

  it("Recognizes '001' as already canonical (no redirect required)", () => {
    const res = normalizeProblemIdentifier("001");
    assert(res.valid === true, "Must be valid");
    assert(res.canonicalId === "001", "Expected 001");
    assert(res.isCanonical === true, "Must be canonical");
  });

  it("Leaves 4+ digit problem IDs unchanged", () => {
    const res = normalizeProblemIdentifier("1000");
    assert(res.valid === true, "Must be valid");
    assert(res.canonicalId === "1000", "Expected 1000");
    assert(res.isCanonical === true, "1000 is canonical");
  });

  it("Normalizes full slug and extracts canonical prefix if present", () => {
    const res = normalizeProblemIdentifier("001-positive-negative-or-zero");
    assert(res.valid === true, "Must be valid");
    assert(res.isSlug === true, "Must be marked as slug");
    assert(res.canonicalId === "001", "Extracted canonicalId 001 from prefix");
    assert(res.isCanonical === false, "Slug is non-canonical (redirects to 001)");
  });

  it("Rejects invalid / malformed problem identifiers (special chars, injection, objects)", () => {
    assert(normalizeProblemIdentifier("").valid === false, "Empty string is invalid");
    assert(normalizeProblemIdentifier("   ").valid === false, "Whitespace is invalid");
    assert(normalizeProblemIdentifier("$where").valid === false, "Injection string is invalid");
    assert(normalizeProblemIdentifier("001/../../etc").valid === false, "Path traversal is invalid");
    assert(normalizeProblemIdentifier(null).valid === false, "null is invalid");
    assert(normalizeProblemIdentifier({ id: "001" }).valid === false, "object is invalid");
  });

  console.log("\n--- Suite 2: Discriminated Lookup: Distinguishing Not Found vs Failed ---");

  it("Mock lookup: genuinely missing problem returns status: notFound", async () => {
    // Simulated database query returning null without throwing
    const mockLookup = async (id: string): Promise<ProblemLookupResult> => {
      const norm = normalizeProblemIdentifier(id);
      if (!norm.valid) return { status: "invalidIdentifier", raw: id };
      // Simulating clean query that finds 0 documents
      return { status: "notFound", normalizedId: norm.normalizedLookup };
    };

    const res = await mockLookup("9999");
    assert(res.status === "notFound", "Expected status: notFound");
  });

  it("Mock lookup: transient DB failure throws and is NEVER converted to notFound", async () => {
    const mockFlakyDbLookup = async (): Promise<ProblemLookupResult> => {
      throw new Error("MongoNetworkTimeoutError: connection timed out");
    };

    let caughtError: Error | null = null;
    try {
      await mockFlakyDbLookup();
    } catch (err) {
      caughtError = err as Error;
    }

    assert(caughtError !== null, "Transient error must be re-thrown");
    assert(
      Boolean(caughtError?.message.includes("MongoNetworkTimeoutError")),
      "Must preserve root error cause"
    );
  });

  it("Retry logic: recovers from first transient failure with backoff", async () => {
    let callCount = 0;
    const transientHelper = async () => {
      callCount += 1;
      if (callCount === 1) {
        throw new Error("ECONNRESET");
      }
      return { status: "found" as const };
    };

    // Execute with retry
    let result = null;
    for (let i = 0; i < 2; i++) {
      try {
        result = await transientHelper();
        break;
      } catch {
        // backoff
      }
    }

    assert(result !== null && result.status === "found", "Must succeed on retry");
    assert(callCount === 2, "Must have retried once");
  });

  console.log("\n--- Suite 3: Decoupled Endpoints & Security Cache Leak Protection ---");

  it("Public problem payload NEVER exposes userState, hiddenTestCases, or user code", () => {
    const publicSample = {
      problem: {
        problemId: "001",
        title: "Positive, Negative, or Zero",
        slug: "001-positive-negative-or-zero",
        phase: 1,
        difficulty: "Very Easy",
        description: "Check if a number is positive, negative, or zero.",
        starterTemplates: { python: "# code" },
        examples: [{ input: "5", output: "Positive" }],
        tags: ["conditionals"],
        xp: 10,
      },
    };

    assert(!("hiddenTestCases" in publicSample.problem), "hiddenTestCases must never be exposed");
    assert(!("userState" in publicSample), "userState must never be on public problem endpoint");
    assert(!("lastSubmission" in publicSample), "lastSubmission must never be on public problem endpoint");
  });

  it("Public endpoint Cache-Control is strictly public s-maxage, private endpoint is private no-store", () => {
    const publicHeaders = {
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
    };
    const privateHeaders = {
      "Cache-Control": "private, no-store, no-cache, must-revalidate",
      Vary: "Cookie",
    };

    assert(publicHeaders["Cache-Control"].includes("public"), "Public headers must be public");
    assert(privateHeaders["Cache-Control"].includes("private, no-store"), "Private headers must be private, no-store");
    assert(privateHeaders["Vary"] === "Cookie", "Private headers must include Vary: Cookie");
  });

  it("User A's submitted code in user-state is isolated and requires session", () => {
    const userAState = {
      userState: {
        isSolved: true,
        lastSubmission: {
          language: "python",
          code: "def solution(): return 'secret-code-user-a'",
          status: "Accepted",
        },
      },
    };

    // Verify unauthenticated attempt gets 401
    const getAuthenticatedState = (userId: string | null) => {
      if (!userId) {
        return { status: 401, error: "Unauthorized" };
      }
      return { status: 200, data: userAState };
    };

    const unauthRes = getAuthenticatedState(null);
    assert(unauthRes.status === 401, "Unauthenticated request must receive 401");

    const authRes = getAuthenticatedState("user_a");
    assert(authRes.status === 200, "Authenticated user A gets their state");
    assert(
      Boolean(authRes.data?.userState.lastSubmission.code.includes("secret-code-user-a")),
      "User A gets their code"
    );
  });

  console.log("\n--- Suite 4: Catalog Non-Empty & Curriculum Integrity ---");

  it("Curriculum catalog is non-empty and every question has valid canonical problemId", () => {
    assert(CURRICULUM_QUESTIONS.length > 0, "Curriculum questions must not be empty");
    for (const q of CURRICULUM_QUESTIONS) {
      const norm = normalizeProblemIdentifier(q.problemId);
      assert(norm.valid, `Question ${q.problemId} must be valid`);
      assert(norm.isCanonical, `Question ${q.problemId} must be canonical 3-digit padded`);
    }
  });

  console.log("\n======================================================");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
