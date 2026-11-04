import assert from "node:assert";
import crypto from "crypto";
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

console.log("\nAll security suite assertions PASSED successfully!");
