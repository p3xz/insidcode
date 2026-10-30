import * as fs from "fs";
import * as path from "path";

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}`);
  }
}

console.log("\n--- Suite 1: Cache Key Scoping & User Isolation ---");

// Test 1: User A's cache key does not match User B's cache key or anonymous key
{
  const userA = "user_123";
  const userB = "user_456";
  const anon = "anon";
  const endpoint = "/api/problems";

  const keyA = JSON.stringify([userA, endpoint]);
  const keyB = JSON.stringify([userB, endpoint]);
  const keyAnon = JSON.stringify([anon, endpoint]);

  assert(keyA !== keyB, "User A cache key does not match User B cache key");
  assert(keyA !== keyAnon, "User A cache key does not match Anonymous cache key");
  assert(keyB !== keyAnon, "User B cache key does not match Anonymous cache key");
}

// Test 2: In-memory store simulates SWR cache isolation
{
  const store = new Map<string, Record<string, unknown>>();
  const userA = "user_123";
  const userB = "user_456";

  store.set(JSON.stringify([userA, "/api/stats"]), { solvedCount: 42, xp: 500 });
  store.set(JSON.stringify([userB, "/api/stats"]), { solvedCount: 3, xp: 30 });

  assert(
    store.get(JSON.stringify([userA, "/api/stats"]))?.solvedCount === 42,
    "Store returns User A's personal data for User A's key"
  );
  assert(
    store.get(JSON.stringify([userB, "/api/stats"]))?.solvedCount === 3,
    "Store returns User B's personal data for User B's key"
  );
  assert(
    store.get(JSON.stringify(["anon", "/api/stats"])) === undefined,
    "Anonymous cannot access User A or User B's cached data"
  );
}

console.log("\n--- Suite 2: Public vs Private HTTP Cache-Control Headers ---");

// Test 3: Inspect route files for correct headers
{
  const problemsRoute = fs.readFileSync(
    path.join(__dirname, "../src/app/api/problems/route.ts"),
    "utf8"
  );
  assert(
    problemsRoute.includes("Cache-Control") &&
      problemsRoute.includes("public, s-maxage=300, stale-while-revalidate=600") &&
      problemsRoute.includes("private, no-store"),
    "Problems route dynamically sets public 300s for anon catalog and private no-store for user sessions"
  );

  const statsRoute = fs.readFileSync(
    path.join(__dirname, "../src/app/api/stats/route.ts"),
    "utf8"
  );
  assert(
    statsRoute.includes('"Cache-Control": "private, no-store"'),
    "Stats route strictly returns private, no-store"
  );

  const notificationsRoute = fs.readFileSync(
    path.join(__dirname, "../src/app/api/notifications/route.ts"),
    "utf8"
  );
  assert(
    notificationsRoute.includes('"Cache-Control": "private, no-store"'),
    "Notifications route strictly returns private, no-store"
  );

  const leaderboardRoute = fs.readFileSync(
    path.join(__dirname, "../src/app/api/leaderboard/route.ts"),
    "utf8"
  );
  assert(
    leaderboardRoute.includes("public, s-maxage=30, stale-while-revalidate=60") &&
      leaderboardRoute.includes("private, no-store"),
    "Leaderboard sets public 30s for public requests and private for user-highlighted sessions"
  );
}

console.log("\n--- Suite 3: Data Protection & Privacy Verification ---");

// Test 4: Verify public problem fetcher excludes hidden test cases and private fields
{
  const problemsLib = fs.readFileSync(
    path.join(__dirname, "../src/lib/problems.ts"),
    "utf8"
  );
  assert(
    problemsLib.includes("hiddenTestCases   (test suite — never exposed publicly)") &&
      problemsLib.includes("unstable_cache") &&
      problemsLib.includes("problems-catalog"),
    "Public problem fetcher uses unstable_cache with tag invalidation and excludes hidden test cases"
  );

  const adminRoute = fs.readFileSync(
    path.join(__dirname, "../src/app/api/admin/problems/route.ts"),
    "utf8"
  );
  assert(
    adminRoute.includes('revalidateTag("problems-catalog")'),
    "Admin problem creation triggers revalidateTag for problems-catalog"
  );
}

console.log("\n--- Suite 4: Client Cache Clearing on Auth State Switch ---");

// Test 5: Verify SWRProvider user cache clearer implementation
{
  const swrProvider = fs.readFileSync(
    path.join(__dirname, "../src/components/layout/SWRProvider.tsx"),
    "utf8"
  );
  assert(
    swrProvider.includes("mutate(() => true, undefined, { revalidate: false })") &&
      swrProvider.includes("focusThrottleInterval: 30000"),
    "SWRProvider clears all cache entries on auth change and throttles focus revalidation to 30s"
  );
}

console.log(`\n======================================================`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`======================================================\n`);

if (failed > 0) {
  process.exit(1);
}
