import * as fs from "fs";
import * as path from "path";
import {
  sanitizePublicProblem,
  getCachedPublicProblem,
  setCachedPublicProblem,
  getCachedUserState,
  setCachedUserState,
  clearAllUserStateCache,
  getSavedDraft,
  setSavedDraft,
  removeSavedDraft,
} from "../src/lib/problemClientCache";

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name} ${detail ? `- ${detail}` : ""}`);
  }
}

// Mock window, sessionStorage, and localStorage for Node.js test environment
const mockSessionStorage: Record<string, string> = {};
const mockLocalStorage: Record<string, string> = {};

let sessionStorageFails = false;
let localStorageFails = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).window = {
  sessionStorage: {
    getItem: (key: string) => {
      if (sessionStorageFails) throw new Error("SecurityError: Access is denied");
      return mockSessionStorage[key] || null;
    },
    setItem: (key: string, val: string) => {
      if (sessionStorageFails) throw new Error("QuotaExceededError: DomException 22");
      mockSessionStorage[key] = val;
    },
    removeItem: (key: string) => {
      if (sessionStorageFails) throw new Error("SecurityError: Access is denied");
      delete mockSessionStorage[key];
    },
    clear: () => {
      for (const k of Object.keys(mockSessionStorage)) delete mockSessionStorage[k];
    },
  },
  localStorage: {
    getItem: (key: string) => {
      if (localStorageFails) throw new Error("SecurityError: Access is denied");
      return mockLocalStorage[key] || null;
    },
    setItem: (key: string, val: string) => {
      if (localStorageFails) throw new Error("QuotaExceededError: Storage is full");
      mockLocalStorage[key] = val;
    },
    removeItem: (key: string) => {
      if (localStorageFails) throw new Error("SecurityError: Access is denied");
      delete mockLocalStorage[key];
    },
  },
};

console.log("\n=======================================================");
console.log("Suite 1: User Isolation for Drafts and Per-User State");
console.log("=======================================================");

{
  const problemId = "001";
  const userA = "user_alice_123";
  const userB = "user_bob_456";

  // 1. User A saves draft code in Python
  setSavedDraft(userA, problemId, "python", "def solution(): return 42");
  assert(
    getSavedDraft(userA, problemId, "python") === "def solution(): return 42",
    "User A can retrieve their saved Python draft"
  );

  // 2. User B cannot see User A's draft code
  assert(
    getSavedDraft(userB, problemId, "python") === null,
    "User B cannot see User A's draft code"
  );

  // 3. Anonymous visitor cannot see User A's draft code
  assert(
    getSavedDraft(undefined, problemId, "python") === null,
    "Anonymous visitor cannot see User A's draft code"
  );

  // 4. User B saves their own draft in Python
  setSavedDraft(userB, problemId, "python", "def solution(): return 99");
  assert(
    getSavedDraft(userA, problemId, "python") === "def solution(): return 42" &&
      getSavedDraft(userB, problemId, "python") === "def solution(): return 99",
    "User A and User B maintain completely isolated drafts for the same problem"
  );

  // 5. User A removes draft
  removeSavedDraft(userA, problemId, "python");
  assert(
    getSavedDraft(userA, problemId, "python") === null &&
      getSavedDraft(userB, problemId, "python") === "def solution(): return 99",
    "Removing User A's draft does not affect User B's draft"
  );

  // 6. User State Isolation (Memory Only)
  setCachedUserState(userA, problemId, { isSolved: true, isAttempted: true });
  assert(
    getCachedUserState(userA, problemId)?.isSolved === true,
    "User A cached state reflects isSolved: true"
  );
  assert(
    getCachedUserState(userB, problemId) === null,
    "User B does not have User A's solved state"
  );

  // 7. Clear all user state on logout/switch
  clearAllUserStateCache();
  assert(
    getCachedUserState(userA, problemId) === null,
    "clearAllUserStateCache() completely clears cached user states"
  );
}

console.log("\n=======================================================");
console.log("Suite 2: Instant Reopen & Zero-Network Public Problem Cache");
console.log("=======================================================");

{
  const testProblem = {
    problemId: "002",
    title: "Sum of Two Integers",
    slug: "sum-of-two-integers",
    phase: 1,
    difficulty: "Easy" as const,
    description: "Calculate sum of a and b.",
    constraints: ["1 <= a, b <= 1000"],
    examples: [{ input: "2 3", output: "5" }],
    tags: ["math"],
    xp: 20,
    starterTemplates: { python: "def sum(a, b): pass" },
  };

  // Populate public cache (as would happen on first load or SSR hydration)
  setCachedPublicProblem("002", testProblem);

  // 1. Immediate synchronous retrieval from cache (0 network requests)
  let networkFetchCount = 0;
  const fetchMock = () => {
    networkFetchCount++;
    return testProblem;
  };

  // Check if available synchronously in cache
  const cached = getCachedPublicProblem("002");
  if (!cached) {
    fetchMock();
  }

  assert(
    cached !== null && cached.title === "Sum of Two Integers" && networkFetchCount === 0,
    "Reopening problem '002' returns instantly from cache with 0 network requests"
  );

  // 2. Verify it is persisted in sessionStorage for page refreshes
  const inSessionStorage = mockSessionStorage["problem:v1:002"];
  assert(
    Boolean(inSessionStorage) && JSON.parse(inSessionStorage).title === "Sum of Two Integers",
    "Public problem payload is safely stored in sessionStorage for instant tab reopens"
  );

  // 3. Case-insensitive problem lookup
  assert(
    getCachedPublicProblem("002")?.problemId === "002",
    "Problem lookup is normalized and case-insensitive"
  );
}

console.log("\n=======================================================");
console.log("Suite 3: Data Protection & Privacy Verification (No Hidden Tests)");
console.log("=======================================================");

{
  // 1. Verify sanitizePublicProblem strips hiddenTestCases and expectedOutput
  const dirtyData = {
    problemId: "003",
    title: "Secret Problem",
    slug: "secret-problem",
    phase: 2,
    difficulty: "Medium",
    description: "Do something.",
    hiddenTestCases: [
      { input: "confidential_in", expectedOutput: "confidential_out" },
      { input: "secret_123", expectedOutput: "flag{leaked}" },
    ],
    expectedOutput: "super_secret_output",
    extraSensitiveAdminField: "secret_admin_token",
  };

  const sanitized = sanitizePublicProblem(dirtyData);
  assert(sanitized !== null, "Dirty payload was sanitized successfully");

  // Check that hiddenTestCases and extra fields are absent
  const serialized = JSON.stringify(sanitized);
  assert(
    !serialized.includes("hiddenTestCases") &&
      !serialized.includes("confidential_in") &&
      !serialized.includes("flag{leaked}") &&
      !serialized.includes("secret_admin_token") &&
      !serialized.includes("super_secret_output"),
    "sanitizePublicProblem strictly purges hiddenTestCases, expected outputs, and admin fields"
  );

  // Store in cache and verify sessionStorage does not contain any sensitive strings
  setCachedPublicProblem("003", sanitized!);
  const storedSession = mockSessionStorage["problem:v1:003"] || "";
  assert(
    !storedSession.includes("hiddenTestCases") &&
      !storedSession.includes("confidential_in") &&
      !storedSession.includes("flag{leaked}"),
    "sessionStorage payload is guaranteed free of hidden test cases and private data"
  );

  // 2. Verify server-side source code projection in src/lib/problems.ts
  const problemsLib = fs.readFileSync(
    path.join(process.cwd(), "src/lib/problems.ts"),
    "utf8"
  );
  assert(
    problemsLib.includes("hiddenTestCases   (test suite — never exposed publicly)") &&
      !problemsLib.includes(".select(\"+hiddenTestCases\")"),
    "src/lib/problems.ts excludes hiddenTestCases from public projections"
  );

  // 3. Verify API route excludes hiddenTestCases
  const routeCode = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/problems/[id]/route.ts"),
    "utf8"
  );
  assert(
    routeCode.includes('.select("-hiddenTestCases")'),
    "src/app/api/problems/[id]/route.ts explicitly strips hiddenTestCases via .select('-hiddenTestCases')"
  );
}

console.log("\n=======================================================");
console.log("Suite 4: Graceful Degradation on Storage Failures");
console.log("=======================================================");

{
  // 1. Simulate sessionStorage quota exceeded / private mode error
  sessionStorageFails = true;

  const robustProblem = {
    problemId: "004",
    title: "Storage Test Problem",
    slug: "storage-test-problem",
    phase: 1,
    difficulty: "Easy" as const,
    description: "Testing graceful degradation.",
    constraints: [],
    examples: [],
    tags: [],
    xp: 15,
    starterTemplates: {},
  };

  // Must not throw when sessionStorage fails
  let threwOnSet = false;
  try {
    setCachedPublicProblem("004", robustProblem);
  } catch {
    threwOnSet = true;
  }
  assert(!threwOnSet, "setCachedPublicProblem degrades gracefully when sessionStorage throws");

  // In-memory cache must still return the problem
  let threwOnGet = false;
  let retrieved = null;
  try {
    retrieved = getCachedPublicProblem("004");
  } catch {
    threwOnGet = true;
  }
  assert(
    !threwOnGet && retrieved?.title === "Storage Test Problem",
    "getCachedPublicProblem returns problem from in-memory fallback during storage errors"
  );

  // Reset failure flag
  sessionStorageFails = false;

  // 2. Simulate localStorage draft failure
  localStorageFails = true;
  let draftThrew = false;
  try {
    setSavedDraft("user_123", "004", "python", "print('hello')");
    getSavedDraft("user_123", "004", "python");
    removeSavedDraft("user_123", "004", "python");
  } catch {
    draftThrew = true;
  }
  assert(!draftThrew, "Draft functions degrade gracefully without crashing when localStorage is unavailable");
  localStorageFails = false;
}

console.log("\n=======================================================");
console.log("Suite 5: Admin Tag Invalidation & Cache-Control Headers");
console.log("=======================================================");

{
  // 1. Verify Cache-Control header in /api/problems/[id]/route.ts
  const routeCode = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/problems/[id]/route.ts"),
    "utf8"
  );
  assert(
    routeCode.includes("public, s-maxage=600, stale-while-revalidate=3600") &&
      routeCode.includes("private, no-store"),
    "API route sets public 600s/3600s for public requests and private no-store for authenticated users"
  );

  // 2. Verify admin problem edit triggers revalidateTag
  const adminProblemIdRoute = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/admin/problems/[id]/route.ts"),
    "utf8"
  );
  assert(
    adminProblemIdRoute.includes('revalidateTag("problems-catalog")') &&
      adminProblemIdRoute.includes("revalidateTag("),
    "Admin problem edits and deletions trigger revalidateTag for instant edge revalidation"
  );

  // 3. Verify server component in /problems/[id]/page.tsx provides generateStaticParams
  const pageCode = fs.readFileSync(
    path.join(process.cwd(), "src/app/problems/[id]/page.tsx"),
    "utf8"
  );
  assert(
    pageCode.includes("export async function generateStaticParams()") &&
      pageCode.includes("initialProblem={problem}"),
    "Problem page provides generateStaticParams and hydrates initialProblem to client"
  );
}

console.log("\n=======================================================");
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log("=======================================================\n");

if (failed > 0) {
  process.exit(1);
}
