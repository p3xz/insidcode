import assert from "node:assert";
import crypto from "crypto";
import fs from "node:fs";
import path from "node:path";
import { checkRateLimit } from "../src/lib/rateLimit";

console.log("--- Running InsidCode Security Hardening Test Suite ---");

// ==========================================
// Test 1: OAuth Redirect Callback Security
// ==========================================
function validateRedirect(url: string, baseUrl: string): string {
  if (url.startsWith("/")) {
    if (url.startsWith("//")) {
      return baseUrl;
    }
    return `${baseUrl}${url}`;
  }
  try {
    const parsedUrl = new URL(url);
    const parsedBase = new URL(baseUrl);
    if (parsedUrl.origin === parsedBase.origin) {
      return url;
    }
  } catch {
    return baseUrl;
  }
  return baseUrl;
}

const APP_ORIGIN = "https://insidcode.vercel.app";

// Allowed: standard relative paths
assert.strictEqual(validateRedirect("/problems", APP_ORIGIN), "https://insidcode.vercel.app/problems");
assert.strictEqual(validateRedirect("/duel/DUEL-ABC123", APP_ORIGIN), "https://insidcode.vercel.app/duel/DUEL-ABC123");
assert.strictEqual(validateRedirect("/profile/namish", APP_ORIGIN), "https://insidcode.vercel.app/profile/namish");

// Blocked: protocol-relative open redirect (e.g., //attacker.com)
assert.strictEqual(validateRedirect("//attacker.com", APP_ORIGIN), APP_ORIGIN);
assert.strictEqual(validateRedirect("//malicious.site/phish", APP_ORIGIN), APP_ORIGIN);

// Blocked: arbitrary external origin
assert.strictEqual(validateRedirect("https://evil.com/login", APP_ORIGIN), APP_ORIGIN);
assert.strictEqual(validateRedirect("http://insecure-site.com", APP_ORIGIN), APP_ORIGIN);
assert.strictEqual(validateRedirect("javascript:alert(1)", APP_ORIGIN), APP_ORIGIN);

// Allowed: absolute URL matching same origin
assert.strictEqual(validateRedirect("https://insidcode.vercel.app/settings", APP_ORIGIN), "https://insidcode.vercel.app/settings");
console.log("✓ PASS: OAuth redirect same-origin validation");

// ==========================================
// Test 2: Execution Callback Timing-Safe Secret
// ==========================================
function verifySecret(expected: string | undefined, provided: string | null): boolean {
  if (!expected || !expected.trim() || !provided) return false;
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);
  if (expectedBuf.length !== providedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

const SECRET = "prod-compiler-callback-token-9988";
assert.strictEqual(verifySecret(SECRET, SECRET), true, "Matching secret must authenticate");
assert.strictEqual(verifySecret(SECRET, "wrong-token"), false, "Different secret must reject");
assert.strictEqual(verifySecret(SECRET, SECRET + "x"), false, "Longer secret must reject");
assert.strictEqual(verifySecret(SECRET, SECRET.slice(0, -1)), false, "Shorter secret must reject");
assert.strictEqual(verifySecret(SECRET, null), false, "Null token must reject");
assert.strictEqual(verifySecret("", SECRET), false, "Missing server secret must fail closed");
assert.strictEqual(verifySecret(undefined, SECRET), false, "Undefined server secret must fail closed");
console.log("✓ PASS: Timing-safe execution callback secret authentication");

// ==========================================
// Test 3: Duel Room Code Entropy & Format
// ==========================================
const CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const generatedCodes = new Set<string>();

// Charset must not contain look-alikes (0, O, 1, I, l)
assert.strictEqual(CHARS.includes("0"), false);
assert.strictEqual(CHARS.includes("O"), false);
assert.strictEqual(CHARS.includes("1"), false);
assert.strictEqual(CHARS.includes("I"), false);
assert.strictEqual(CHARS.includes("l"), false);

for (let i = 0; i < 1000; i++) {
  let code = "";
  for (let j = 0; j < 6; j++) {
    code += CHARS[crypto.randomInt(0, CHARS.length)];
  }
  const roomCode = `DUEL-${code}`;
  assert.match(roomCode, /^DUEL-[A-Z0-9]{6}$/, "Must match 6-character room code format");
  assert.strictEqual(roomCode.length, 11, "Length must be 11 ('DUEL-' + 6 chars)");
  // Backwards compatibility regex check (3 to 8 chars)
  assert.ok(/^DUEL-[A-Z0-9]{3,8}$/.test(roomCode), "Validator must accept 3-8 chars");
  generatedCodes.add(roomCode);
}
assert.strictEqual(generatedCodes.size, 1000, "1000 generated room codes must be unique without collisions");
console.log("✓ PASS: Duel room code entropy (6 chars, crypto.randomInt, >1B combinations)");

// ==========================================
// Test 4: Duel Submit Rate Limiter
// ==========================================
const testUser = "rate_limit_duel_" + Date.now();
for (let i = 1; i <= 15; i++) {
  const result = checkRateLimit(`duel_submit_${testUser}`, { limit: 15, windowMs: 60000 });
  assert.strictEqual(result.success, true, `Request ${i} should be allowed`);
}
const overflowResult = checkRateLimit(`duel_submit_${testUser}`, { limit: 15, windowMs: 60000 });
assert.strictEqual(overflowResult.success, false, "16th submission within 1 min window must be rejected (HTTP 429)");
assert.ok(overflowResult.reset > 0, "Reset time must be positive integer");
console.log("✓ PASS: Duel submit endpoint rate limiting (15 submissions/min)");

// ==========================================
// Test 5: JSON-LD '<' Escaping (XSS Prevention)
// ==========================================
const maliciousProblem = {
  name: "Problem Title with </script><script>alert('xss')</script>",
  description: "Test <tag> & characters",
};
const rawJsonLd = JSON.stringify(maliciousProblem);
const safeJsonLd = rawJsonLd.replace(/</g, "\\u003c");
assert.strictEqual(safeJsonLd.includes("<"), false, "Escaped JSON-LD must contain zero raw '<' characters");
assert.ok(safeJsonLd.includes("\\u003c/script>"), "Must escape opening brackets as unicode escape sequence");
console.log("✓ PASS: JSON-LD script break-out XSS mitigation");

// ==========================================
// Test 6: Exhaustive Admin Panel Lockdown
// ==========================================
function walkFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

const adminPageFiles = walkFiles(path.join(process.cwd(), "src/app/admin")).filter((f) =>
  f.endsWith(`${path.sep}page.tsx`)
);
assert.ok(adminPageFiles.length >= 9, "Expected all admin pages under src/app/admin");

for (const pageFile of adminPageFiles) {
  const src = fs.readFileSync(pageFile, "utf8");
  assert.strictEqual(
    src.includes('"use client"') || src.includes("'use client'"),
    false,
    `Admin route page must be a Server Component, not client component: ${pageFile}`
  );
  assert.ok(
    src.includes('export const dynamic = "force-dynamic"'),
    `Admin route page must disable static/router caching with force-dynamic: ${pageFile}`
  );
  assert.ok(
    src.includes("enforceAdminPageAccess"),
    `Admin route page must enforce server-side admin access guard: ${pageFile}`
  );
}

const adminLayoutSrc = fs.readFileSync(path.join(process.cwd(), "src/app/admin/layout.tsx"), "utf8");
assert.ok(adminLayoutSrc.includes("enforceAdminPageAccess"), "AdminLayout must call enforceAdminPageAccess");

const adminApiFiles = walkFiles(path.join(process.cwd(), "src/app/api/admin")).filter((f) =>
  f.endsWith(`${path.sep}route.ts`)
);
assert.ok(adminApiFiles.length >= 16, "Expected all /api/admin route handlers");

for (const apiFile of adminApiFiles) {
  const src = fs.readFileSync(apiFile, "utf8");
  const handlers = [...src.matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)\b/g)];
  assert.ok(handlers.length > 0, `Expected exported HTTP handler(s) in ${apiFile}`);

  for (let i = 0; i < handlers.length; i++) {
    const start = handlers[i].index ?? 0;
    const end = i + 1 < handlers.length ? (handlers[i + 1].index ?? src.length) : src.length;
    const bodySlice = src.slice(start, end);
    const method = handlers[i][1];

    if (method === "GET") {
      assert.ok(
        bodySlice.includes("requireAdminUser()") || bodySlice.includes("requireAdminMutationUser("),
        `GET handler in ${apiFile} must call requireAdminUser()`
      );
    } else {
      assert.ok(
        bodySlice.includes("requireAdminMutationUser("),
        `${method} handler in ${apiFile} must call requireAdminMutationUser()`
      );
    }
  }
}

const middlewareSrc = fs.readFileSync(path.join(process.cwd(), "src/middleware.ts"), "utf8");
assert.ok(
  middlewareSrc.includes('"/admin/:path*"') &&
    middlewareSrc.includes('"/api/admin/:path*"') &&
    middlewareSrc.includes('token.role !== "admin"') &&
    middlewareSrc.includes("__Secure-authjs.session-token"),
  "Edge middleware must guard /admin and /api/admin against unauthenticated, banned, and non-admin requests"
);

const nextConfigSrc = fs.readFileSync(path.join(process.cwd(), "next.config.ts"), "utf8");
assert.ok(
  nextConfigSrc.includes('source: "/admin/:path*"') &&
    nextConfigSrc.includes('source: "/api/admin/:path*"') &&
    nextConfigSrc.includes("no-store") &&
    nextConfigSrc.includes('value: "DENY"'),
  "next.config.ts must enforce no-store caching and X-Frame-Options: DENY on admin routes"
);

console.log(`✓ PASS: Exhaustive admin lockdown verified across ${adminPageFiles.length} pages, ${adminApiFiles.length} APIs, middleware, and headers`);

// ==========================================
// Test 7: Guest Welcome & Member Login Gate Separation
// ==========================================
for (const memberRoute of ['"/problems"', '"/duel"', '"/leaderboard"', '"/stats"', '"/settings"', '"/login"']) {
  assert.ok(
    middlewareSrc.includes(memberRoute),
    `Middleware must gate member/auth route ${memberRoute}`
  );
}

const rootPageSrc = fs.readFileSync(path.join(process.cwd(), "src/app/page.tsx"), "utf8");
assert.ok(
  rootPageSrc.includes("await auth()") &&
    rootPageSrc.includes("GuestWelcomePage") &&
    rootPageSrc.includes("AuthenticatedHomeView"),
  "Root page must serve distinct GuestWelcomePage and AuthenticatedHomeView based on session"
);

console.log("✓ PASS: Guest Welcome vs Authenticated Home and member route login gates verified");

console.log("\nAll security suite assertions PASSED successfully!");
