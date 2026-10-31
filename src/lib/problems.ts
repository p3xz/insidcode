/**
 * Server-safe problem fetcher.
 *
 * This module is ONLY imported by server components / generateMetadata.
 * It does NOT expose hiddenTestCases, and it does NOT include any user
 * authentication state — that stays in the API route.
 *
 * Fields intentionally excluded:
 *  - hiddenTestCases   (test suite — never exposed publicly)
 *  - starterTemplates  (returned separately to the client workspace)
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

/**
 * Fetches a single published problem by its slug or problemId.
 * Returns only fields safe to expose in server-rendered HTML.
 * Returns null if the problem does not exist or is not published.
 */
async function fetchPublicProblemInternal(
  idOrSlug: string
): Promise<PublicProblemData | null> {
  try {
    await connectToDatabase();

    const question = await Question.findOne({
      $or: [{ problemId: idOrSlug }, { slug: idOrSlug.toLowerCase() }],
      isPublished: true,
    })
      .select(
        "problemId title slug phase difficulty description constraints examples tags xp starterTemplates"
      )
      .lean<PublicProblemData>();

    return question ?? null;
  } catch {
    // In case of DB error during SSR, fall back gracefully — client will retry
    return null;
  }
}

/**
 * Fetches a single published problem by its slug or problemId.
 * Cached via Next.js unstable_cache with tag invalidation.
 */
export async function getPublicProblem(
  idOrSlug: string
): Promise<PublicProblemData | null> {
  const normalizedKey = idOrSlug.toLowerCase().trim();
  const getCached = unstable_cache(
    async () => fetchPublicProblemInternal(idOrSlug),
    [`problem-${normalizedKey}`],
    {
      revalidate: 600, // 10 minutes revalidation
      tags: ["problems-catalog", `problem-${normalizedKey}`],
    }
  );
  return getCached();
}

/**
 * Fetches all published problem slugs for sitemap generation.
 * Uses only the index-covered fields for efficiency.
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
