/**
 * Server-safe problem fetcher and identifier normalization.
 *
 * This module is imported by server components, API routes, and metadata generators.
 * It strictly excludes hiddenTestCases and per-user state (userState).
 *
 * Fields intentionally excluded:
 *  - hiddenTestCases   (test suite — never exposed publicly)
 */

import { connectToDatabase } from "@/lib/mongodb";
import { Question } from "@/models/Question";
import { unstable_cache } from "next/cache";
import { DifficultyLevel } from "@/types";

export interface PublicProblemData {
  problemId: string;
  title: string;
  slug: string;
  phase: number;
  difficulty: DifficultyLevel;
  description: string;
  constraints: string[];
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  tags: string[];
  xp: number;
  starterTemplates: {
    python?: string;
    javascript?: string;
    c?: string;
    cpp?: string;
    java?: string;
  };
}

export interface NormalizedProblemIdentifier {
  valid: boolean;
  canonicalId?: string; // e.g. "001"
  normalizedLookup: string; // "001" or "001-positive-negative-or-zero"
  isCanonical: boolean; // true if already in canonical "001" format
  isSlug: boolean;
  raw: string;
}

/**
 * Strict ID normalization:
 * - Numeric strings (e.g. "1", "01", "23"): padded to at least 3 digits ("001", "023"). 4+ digits unchanged.
 * - Slugs: lowercase letters, digits, and hyphens matching ^[a-z0-9-]+$ (max 120 chars).
 * - Anything else: marked invalid (no raw injection or complex objects reach queries).
 */
export function normalizeProblemIdentifier(input: unknown): NormalizedProblemIdentifier {
  if (typeof input !== "string") {
    return { valid: false, normalizedLookup: "", isCanonical: false, isSlug: false, raw: String(input ?? "") };
  }

  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 120) {
    return { valid: false, normalizedLookup: "", isCanonical: false, isSlug: false, raw: trimmed };
  }

  // 1. Numeric ID
  if (/^\d+$/.test(trimmed)) {
    const canonicalId = trimmed.length < 3 ? trimmed.padStart(3, "0") : trimmed;
    const isCanonical = trimmed === canonicalId;
    return {
      valid: true,
      canonicalId,
      normalizedLookup: canonicalId,
      isCanonical,
      isSlug: false,
      raw: trimmed,
    };
  }

  // 2. Slug
  const slugCandidate = trimmed.toLowerCase();
  if (/^[a-z0-9-]+$/.test(slugCandidate)) {
    const prefixMatch = slugCandidate.match(/^(\d+)-/);
    let canonicalId: string | undefined;
    if (prefixMatch) {
      const num = prefixMatch[1];
      canonicalId = num.length < 3 ? num.padStart(3, "0") : num;
    }
    return {
      valid: true,
      canonicalId,
      normalizedLookup: slugCandidate,
      isCanonical: false,
      isSlug: true,
      raw: trimmed,
    };
  }

  return { valid: false, normalizedLookup: "", isCanonical: false, isSlug: false, raw: trimmed };
}

export type ProblemLookupResult =
  | { status: "found"; problem: PublicProblemData }
  | { status: "notFound"; normalizedId: string }
  | { status: "invalidIdentifier"; raw: string };

class ProblemNotFoundSentinel extends Error {
  constructor(public normalizedId: string) {
    super(`Problem "${normalizedId}" not found in database.`);
    this.name = "ProblemNotFoundSentinel";
  }
}

/**
 * Executes a function with quick retries and backoff for transient DB/network issues.
 */
async function withTransientRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 150): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((res) => setTimeout(res, delayMs * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError;
}

/**
 * Fetches a single published problem directly from MongoDB.
 * Never exposes hiddenTestCases or per-user state.
 * Throws on database or connection errors so they are never conflated with 404s.
 */
export async function fetchPublicProblemInternal(
  lookupKey: string
): Promise<PublicProblemData | null> {
  await connectToDatabase();

  const norm = normalizeProblemIdentifier(lookupKey);
  if (!norm.valid) {
    return null;
  }

  const queryConditions: Array<{ problemId?: string; slug?: string }> = [
    { problemId: norm.normalizedLookup },
  ];

  if (norm.canonicalId && norm.canonicalId !== norm.normalizedLookup) {
    queryConditions.push({ problemId: norm.canonicalId });
  }

  if (norm.isSlug) {
    queryConditions.push({ slug: norm.normalizedLookup });
  }

  const question = await Question.findOne({
    $or: queryConditions,
    isPublished: true,
  })
    .select(
      "problemId title slug phase difficulty description constraints examples tags xp starterTemplates"
    )
    .lean<PublicProblemData>();

  return question ?? null;
}

/**
 * Fetches a single published problem by its slug or problemId with discriminated result.
 * Cached via Next.js unstable_cache with tag invalidation.
 * GUARANTEE: Never caches null or transient errors. Uses versioned cache key "problem-v2"
 * to immediately bypass any historical poisoned cache entries.
 */
export async function getPublicProblem(
  idOrSlug: string
): Promise<ProblemLookupResult> {
  const norm = normalizeProblemIdentifier(idOrSlug);
  if (!norm.valid) {
    return { status: "invalidIdentifier", raw: idOrSlug };
  }

  const { normalizedLookup } = norm;

  // unstable_cache only stores genuine "found" problem objects.
  // If not found, ProblemNotFoundSentinel is thrown, preventing unstable_cache from writing null.
  const getCached = unstable_cache(
    async () => {
      const result = await withTransientRetry(() =>
        fetchPublicProblemInternal(normalizedLookup)
      );
      if (!result) {
        throw new ProblemNotFoundSentinel(normalizedLookup);
      }
      return result;
    },
    [`problem-v2-${normalizedLookup}`],
    {
      revalidate: 600, // 10 minutes revalidation
      tags: ["problems-catalog", `problem-v2-${normalizedLookup}`],
    }
  );

  try {
    const problem = await getCached();
    return { status: "found", problem };
  } catch (err) {
    if (err instanceof ProblemNotFoundSentinel) {
      return { status: "notFound", normalizedId: normalizedLookup };
    }
    // Transient database / connection errors are thrown to trigger the retryable error card
    throw err;
  }
}

/**
 * Fetches all published problem slugs for sitemap generation.
 */
export async function getAllPublishedProblemSlugs(): Promise<
  Array<{ slug: string; updatedAt: Date }>
> {
  try {
    await connectToDatabase();

    const problems = await Question.find({ isPublished: true })
      .select("slug updatedAt")
      .lean<Array<{ slug: string; updatedAt: Date }>>();

    return problems;
  } catch {
    return [];
  }
}

export interface ProblemCatalogItem {
  problemId: string;
  title: string;
  phase: number;
  slug?: string;
}

/**
 * Finds the next unsolved problem in catalog order:
 * 1. Next unsolved problem in the same phase (after current, then wrapping in phase)
 * 2. If all in phase solved, first unsolved in subsequent phases (ascending)
 * 3. If all problems solved, returns isAllSolved: true
 */
export function findNextUnsolvedProblem(
  currentProblemId: string,
  currentPhase: number,
  allProblems: ProblemCatalogItem[],
  solvedProblemIds: string[]
): { nextProblem: ProblemCatalogItem | null; isAllSolved: boolean } {
  const solvedSet = new Set(solvedProblemIds);
  const unsolved = allProblems.filter((p) => !solvedSet.has(p.problemId));

  if (unsolved.length === 0) {
    return { nextProblem: null, isAllSolved: true };
  }

  // 1. Unsolved problems in the current phase
  const samePhaseUnsolved = unsolved.filter((p) => p.phase === currentPhase);
  if (samePhaseUnsolved.length > 0) {
    const sortedSamePhase = [...samePhaseUnsolved].sort((a, b) =>
      a.problemId.localeCompare(b.problemId, undefined, { numeric: true })
    );
    const nextInSamePhase = sortedSamePhase.find(
      (p) => p.problemId.localeCompare(currentProblemId, undefined, { numeric: true }) > 0
    );
    if (nextInSamePhase) {
      return { nextProblem: nextInSamePhase, isAllSolved: false };
    }
    return { nextProblem: sortedSamePhase[0], isAllSolved: false };
  }

  // 2. Next phases in ascending order (with wraparound)
  const allPhases = Array.from(new Set(allProblems.map((p) => p.phase))).sort((a, b) => a - b);
  const higherPhases = allPhases.filter((ph) => ph > currentPhase);
  const lowerPhases = allPhases.filter((ph) => ph < currentPhase);
  const orderedPhases = [...higherPhases, ...lowerPhases];

  for (const ph of orderedPhases) {
    const phaseUnsolved = unsolved
      .filter((p) => p.phase === ph)
      .sort((a, b) => a.problemId.localeCompare(b.problemId, undefined, { numeric: true }));
    if (phaseUnsolved.length > 0) {
      return { nextProblem: phaseUnsolved[0], isAllSolved: false };
    }
  }

  return { nextProblem: unsolved[0], isAllSolved: false };
}
