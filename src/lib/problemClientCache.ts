import { PublicProblemData } from "@/lib/problems";

const STORAGE_PREFIX = "problem:v1:";
const STORAGE_INDEX_KEY = "problem:v1:__keys__";
const MAX_CACHED_PROBLEMS = 50;
const USER_STATE_TTL_MS = 30000; // 30 seconds

export interface UserProblemState {
  isSolved: boolean;
  isAttempted: boolean;
  lastSubmission?: {
    language?: string;
    code?: string;
    status?: string;
    runtime?: number;
    createdAt?: Date | string;
  } | null;
}

interface UserStateCacheEntry {
  state: UserProblemState;
  timestamp: number;
}

// In-memory memory stores (always available, even if sessionStorage/localStorage fail or during SSR)
const memoryPublicCache = new Map<string, PublicProblemData>();
const memoryUserStateCache = new Map<string, UserStateCacheEntry>();

/**
 * Strips any unexpected or sensitive fields, ensuring only public problem attributes are stored.
 * Never allows hiddenTestCases or expected outputs.
 */
export function sanitizePublicProblem(data: unknown): PublicProblemData | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;

  if (typeof d.problemId !== "string" || typeof d.title !== "string") {
    return null;
  }

  return {
    problemId: String(d.problemId),
    title: String(d.title),
    slug: String(d.slug || d.problemId).toLowerCase(),
    phase: typeof d.phase === "number" ? d.phase : 1,
    difficulty: (d.difficulty as PublicProblemData["difficulty"]) || "Easy",
    description: String(d.description || ""),
    constraints: Array.isArray(d.constraints) ? d.constraints.map(String) : [],
    examples: Array.isArray(d.examples)
      ? d.examples.map((ex: unknown) => {
          const e = (ex && typeof ex === "object" ? ex : {}) as Record<string, unknown>;
          return {
            input: String(e.input ?? ""),
            output: String(e.output ?? ""),
            explanation: e.explanation ? String(e.explanation) : undefined,
          };
        })
      : [],
    tags: Array.isArray(d.tags) ? d.tags.map(String) : [],
    xp: typeof d.xp === "number" ? d.xp : 20,
    starterTemplates:
      d.starterTemplates && typeof d.starterTemplates === "object"
        ? (d.starterTemplates as PublicProblemData["starterTemplates"])
        : {},
  };
}

/**
 * Retrieves the public problem payload from in-memory cache or sessionStorage.
 * Synchronous and instant (0 ms).
 */
export function getCachedPublicProblem(problemId: string): PublicProblemData | null {
  if (!problemId) return null;
  const normalizedId = problemId.trim().toLowerCase();

  // 1. Check in-memory cache first
  const inMemory = memoryPublicCache.get(normalizedId);
  if (inMemory) {
    return inMemory;
  }

  // 2. Check sessionStorage
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(`${STORAGE_PREFIX}${normalizedId}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const sanitized = sanitizePublicProblem(parsed);
    if (sanitized) {
      memoryPublicCache.set(normalizedId, sanitized);
      return sanitized;
    }
  } catch {
    // SessionStorage unavailable, disabled, or JSON parse failure - fallback gracefully to memory
  }

  return null;
}

/**
 * Saves the public problem payload into memory and sessionStorage (size-capped to 50 items).
 */
export function setCachedPublicProblem(problemId: string, data: PublicProblemData): void {
  if (!problemId || !data) return;
  const normalizedId = problemId.trim().toLowerCase();
  const sanitized = sanitizePublicProblem(data);
  if (!sanitized) return;

  // Store in memory
  memoryPublicCache.set(normalizedId, sanitized);

  // Store in sessionStorage
  if (typeof window === "undefined") return;

  try {
    const key = `${STORAGE_PREFIX}${normalizedId}`;
    window.sessionStorage.setItem(key, JSON.stringify(sanitized));

    // Maintain index for FIFO eviction if limit exceeded
    let keys: string[] = [];
    const rawIndex = window.sessionStorage.getItem(STORAGE_INDEX_KEY);
    if (rawIndex) {
      keys = JSON.parse(rawIndex);
    }
    keys = keys.filter((k) => k !== normalizedId);
    keys.push(normalizedId);

    while (keys.length > MAX_CACHED_PROBLEMS) {
      const oldest = keys.shift();
      if (oldest) {
        window.sessionStorage.removeItem(`${STORAGE_PREFIX}${oldest}`);
      }
    }
    window.sessionStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(keys));
  } catch {
    // Storage quota exceeded or private browsing restricted: degrades gracefully to memory
  }
}

/**
 * Retrieves cached per-user problem state (solved, attempted, last submission) from memory.
 * Returns null if not cached or expired (30 seconds TTL).
 */
export function getCachedUserState(
  userId: string | undefined,
  problemId: string
): UserProblemState | null {
  if (!userId || !problemId) return null;
  const key = `${userId.trim()}_${problemId.trim().toLowerCase()}`;
  const entry = memoryUserStateCache.get(key);

  if (!entry) return null;
  if (Date.now() - entry.timestamp > USER_STATE_TTL_MS) {
    memoryUserStateCache.delete(key);
    return null;
  }

  return entry.state;
}

/**
 * Sets per-user problem state in memory cache with current timestamp.
 */
export function setCachedUserState(
  userId: string | undefined,
  problemId: string,
  state: UserProblemState
): void {
  if (!userId || !problemId || !state) return;
  const key = `${userId.trim()}_${problemId.trim().toLowerCase()}`;
  memoryUserStateCache.set(key, {
    state,
    timestamp: Date.now(),
  });
}

/**
 * Clears user state cache completely. Called on logout or account switch.
 */
export function clearAllUserStateCache(): void {
  memoryUserStateCache.clear();
}

/**
 * Retrieves saved draft code for the specific user, problem, and language.
 */
export function getSavedDraft(
  userId: string | undefined,
  problemId: string,
  language: string
): string | null {
  if (typeof window === "undefined") return null;
  const userKey = userId ? `user_${userId}` : "anon";
  const storageKey = `draft_${userKey}_${problemId.trim().toLowerCase()}_${language.toLowerCase()}`;

  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

/**
 * Saves draft code for the specific user, problem, and language.
 */
export function setSavedDraft(
  userId: string | undefined,
  problemId: string,
  language: string,
  code: string
): void {
  if (typeof window === "undefined") return;
  const userKey = userId ? `user_${userId}` : "anon";
  const storageKey = `draft_${userKey}_${problemId.trim().toLowerCase()}_${language.toLowerCase()}`;

  try {
    window.localStorage.setItem(storageKey, code);
  } catch {
    // LocalStorage quota or private mode restriction
  }
}

/**
 * Removes saved draft code.
 */
export function removeSavedDraft(
  userId: string | undefined,
  problemId: string,
  language: string
): void {
  if (typeof window === "undefined") return;
  const userKey = userId ? `user_${userId}` : "anon";
  const storageKey = `draft_${userKey}_${problemId.trim().toLowerCase()}_${language.toLowerCase()}`;

  try {
    window.localStorage.removeItem(storageKey);
  } catch {}
}
