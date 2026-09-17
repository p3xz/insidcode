import { PROHIBITED_WORDS, SEVERE_SUBSTRINGS } from "./badWords";
import { isAllowlisted } from "./allowlist";
import { isReservedUsername } from "../username";
import { AdminAction } from "@/models/AdminAction";
import { User } from "@/models/User";
import { connectToDatabase } from "../mongodb";

export interface UsernameValidationResult {
  allowed: boolean;
  error?: string;
  reason?: string;
}

/**
 * Normalizes unicode strings by stripping diacritics and combining accents.
 */
function normalizeUnicode(str: string): string {
  return str
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Maps common leetspeak substitutions to standard Latin alphabetic characters.
 */
function normalizeLeetspeak(str: string): string {
  let s = str.toLowerCase();
  s = s.replace(/@/g, "a").replace(/4/g, "a");
  s = s.replace(/8/g, "b");
  s = s.replace(/3/g, "e");
  s = s.replace(/[1!|]/g, "i");
  s = s.replace(/0/g, "o");
  s = s.replace(/[5$]/g, "s");
  s = s.replace(/[7+]/g, "t");
  s = s.replace(/vv/g, "w");
  s = s.replace(/ph/g, "f");
  return s;
}

/**
 * Compresses 3 or more consecutive identical characters down to 1 or 2.
 * E.g. "fuuuuck" -> "fuck", "shiiiit" -> "shit"
 */
function compressRepeats(str: string): string {
  return str.replace(/(.)\1{2,}/g, "$1");
}

/**
 * Strips all delimiters, punctuation, and whitespace.
 */
function stripSeparators(str: string): string {
  return str.replace(/[^a-z0-9]/gi, "");
}

/**
 * Comprehensive server-side username moderation check.
 *
 * Normalizes for case, Unicode, leetspeak, separators, and character repetition
 * while honoring the legitimate false-positive allowlist.
 */
export function validateUsernameModeration(rawUsername: string): UsernameValidationResult {
  if (!rawUsername || typeof rawUsername !== "string") {
    return {
      allowed: false,
      error: "Username not allowed",
      reason: "This username violates the InsidCode Terms of Use or Username Policy. Please choose another username.",
    };
  }

  const username = rawUsername.trim();

  // 1. Length & alphanumeric validation
  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
    return {
      allowed: false,
      error: "Username must be 3-20 characters and contain only letters, numbers, and underscores.",
    };
  }

  // 2. Reserved platform identities
  if (isReservedUsername(username)) {
    return {
      allowed: false,
      error: "Username not allowed",
      reason: "This username is reserved by the platform. Please choose another username.",
    };
  }

  const lower = username.toLowerCase();

  // If the entire username is explicitly allowlisted (e.g. "class", "cockpit", "scunthorpe"), allow it immediately
  if (isAllowlisted(lower)) {
    return { allowed: true };
  }

  // 3. Prepare normalized variants for detection
  const unicodeClean = normalizeUnicode(lower);
  const leetClean = normalizeLeetspeak(unicodeClean);
  const strippedLeet = stripSeparators(leetClean);
  const compressedLeet = compressRepeats(strippedLeet);

  const variants = new Set<string>([
    lower,
    unicodeClean,
    stripSeparators(unicodeClean),
    compressRepeats(stripSeparators(unicodeClean)),
    leetClean,
    strippedLeet,
    compressedLeet,
  ]);

  // 4. Exact match check against prohibited words
  for (const variant of variants) {
    if (PROHIBITED_WORDS.has(variant)) {
      if (!isAllowlisted(variant)) {
        return {
          allowed: false,
          error: "Username not allowed",
          reason: "This username violates the InsidCode Terms of Use or Username Policy. Please choose another username.",
        };
      }
    }
  }

  // 5. Token-based inspection (split by underscores, numbers, or transitions)
  const tokens = lower.split(/[_0-9]+/).filter((t) => t.length >= 3);
  for (const token of tokens) {
    if (isAllowlisted(token)) {
      continue;
    }

    const tokenLeet = compressRepeats(normalizeLeetspeak(normalizeUnicode(token)));
    if (PROHIBITED_WORDS.has(token) || PROHIBITED_WORDS.has(tokenLeet)) {
      return {
        allowed: false,
        error: "Username not allowed",
        reason: "This username violates the InsidCode Terms of Use or Username Policy. Please choose another username.",
      };
    }
  }

  // 6. Severe substring / slur check (unless protected by allowlist)
  for (const severe of SEVERE_SUBSTRINGS) {
    if (strippedLeet.includes(severe)) {
      // Check if any allowlisted word encompasses this pattern
      let protectedByAllowlist = false;
      for (const token of tokens) {
        if (isAllowlisted(token) && token.includes(severe)) {
          protectedByAllowlist = true;
          break;
        }
      }

      if (!protectedByAllowlist) {
        return {
          allowed: false,
          error: "Username not allowed",
          reason: "This username violates the InsidCode Terms of Use or Username Policy. Please choose another username.",
        };
      }
    }
  }

  return { allowed: true };
}

// ── In-Memory Abuse & Repeated Attempt Tracker ────────────────────────
// Window: 10 minutes (600,000 ms), Threshold: 5 rejected attempts
const ABUSE_WINDOW_MS = 10 * 60 * 1000;
const ABUSE_THRESHOLD = 5;

interface AbuseEntry {
  attempts: number[];
}

const abuseTracker = new Map<string, AbuseEntry>();

// Clean up stale abuse entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of abuseTracker.entries()) {
      entry.attempts = entry.attempts.filter((ts) => now - ts < ABUSE_WINDOW_MS);
      if (entry.attempts.length === 0) {
        abuseTracker.delete(key);
      }
    }
  }, 300000);
}

/**
 * Records a rejected username moderation event to the database immutable audit log.
 * Crucial: Never records the exact prohibited word itself in logs.
 */
export async function recordModerationEvent({
  userId,
  username,
  ip,
}: {
  userId?: string;
  username: string;
  ip?: string;
}): Promise<void> {
  try {
    await connectToDatabase();

    await AdminAction.create({
      adminId: "system",
      adminUsername: "System (Automated)",
      action: "USERNAME_REJECTED",
      targetUserId: userId || undefined,
      reason: "Username violates naming policy",
      metadata: {
        category: "ABUSIVE_USERNAME",
        source: "AUTOMATED",
        user: `@${username}`,
        detectedAt: new Date().toISOString(),
        ip: ip ? ip.slice(0, 45) : undefined,
      },
    });
  } catch (err) {
    console.error("[Moderation] Failed to record moderation event:", err);
  }
}

/**
 * Tracks rejected username attempts and automatically escalates to suspension
 * if repeated abusive attempts exceed the threshold within 10 minutes.
 */
export async function recordAbuseAttemptAndCheckEscalation({
  userId,
  username,
  ip,
}: {
  userId?: string;
  username: string;
  ip?: string;
}): Promise<{ escalated: boolean; reason?: string }> {
  // Always log the lightweight moderation event
  await recordModerationEvent({ userId, username, ip });

  const trackerKey = userId || ip || username;
  const now = Date.now();
  const entry = abuseTracker.get(trackerKey) || { attempts: [] };

  entry.attempts = entry.attempts.filter((ts) => now - ts < ABUSE_WINDOW_MS);
  entry.attempts.push(now);
  abuseTracker.set(trackerKey, entry);

  if (entry.attempts.length >= ABUSE_THRESHOLD) {
    // Escalate to automated account suspension if authenticated user exists
    if (userId) {
      try {
        await connectToDatabase();
        const user = await User.findById(userId);
        if (user && !user.isBanned) {
          user.isBanned = true;
          user.banReason = "Automated escalation: repeated attempts to bypass username naming restrictions";
          user.bannedAt = new Date();
          await user.save();

          await AdminAction.create({
            adminId: "system",
            adminUsername: "System (Automated)",
            action: "USER_BAN",
            targetUserId: userId,
            previousValue: "ACTIVE",
            newValue: "SUSPENDED",
            reason: "Automated escalation: repeated attempts to bypass username naming restrictions",
            metadata: {
              category: "ABUSIVE_USERNAME",
              source: "AUTOMATED",
              user: `@${user.username}`,
              detectedAt: new Date().toISOString(),
              trigger: "REPEATED_ATTEMPTS_THRESHOLD_EXCEEDED",
              evidence: `${entry.attempts.length} rejected naming violations within 10 minutes`,
            },
          });

          return {
            escalated: true,
            reason: "Account suspended due to repeated prohibited username attempts.",
          };
        }
      } catch (escErr) {
        console.error("[Moderation] Escalation error:", escErr);
      }
    }
  }

  return { escalated: false };
}
