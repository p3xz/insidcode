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

export interface PublicProblemData {
  problemId: string;
  title: string;
  slug: string;
  phase: number;
  difficulty: "Easy" | "Medium" | "Hard";
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
export async function getPublicProblem(
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
