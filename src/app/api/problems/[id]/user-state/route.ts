import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Question } from "@/models/Question";
import { auth } from "@/lib/auth";
import { User } from "@/models/User";
import { Submission } from "@/models/Submission";
import { checkRateLimit } from "@/lib/rateLimit";
import { findNextUnsolvedProblem, normalizeProblemIdentifier } from "@/lib/problems";

/**
 * Dedicated private user state endpoint.
 * Returns only the authenticated user's personal progress, saved drafts/submissions,
 * and next problem recommendation.
 *
 * STRICT PRIVACY GUARANTEE:
 * - Requires active session. Returns 401 when unauthenticated.
 * - Headers: Cache-Control: private, no-store, no-cache, must-revalidate
 * - Header: Vary: Cookie
 * - Never cached in any shared or CDN edge cache.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        {
          status: 401,
          headers: {
            "Cache-Control": "private, no-store, no-cache, must-revalidate",
            Vary: "Cookie",
          },
        }
      );
    }

    const { id } = await params;
    const norm = normalizeProblemIdentifier(id);
    if (!norm.valid) {
      return NextResponse.json(
        { error: "Invalid problem identifier." },
        {
          status: 400,
          headers: {
            "Cache-Control": "private, no-store, no-cache, must-revalidate",
            Vary: "Cookie",
          },
        }
      );
    }

    const rateLimit = checkRateLimit(`user_state_${session.user.id}`, { limit: 120, windowMs: 60000 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again shortly." },
        {
          status: 429,
          headers: {
            "Cache-Control": "private, no-store, no-cache, must-revalidate",
            Vary: "Cookie",
          },
        }
      );
    }

    await connectToDatabase();

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
      .select("problemId phase title")
      .lean();

    if (!question) {
      return NextResponse.json(
        { error: "Problem not found." },
        {
          status: 404,
          headers: {
            "Cache-Control": "private, no-store, no-cache, must-revalidate",
            Vary: "Cookie",
          },
        }
      );
    }

    let isSolved = false;
    let isAttempted = false;
    let nextProblem: { problemId: string; title: string; phase: number } | null = null;
    let isAllSolved = false;

    const user = await User.findById(session.user.id).select("solvedProblems attemptedProblems");
    if (user) {
      isSolved = user.solvedProblems?.includes(question.problemId) || false;
      isAttempted = user.attemptedProblems?.includes(question.problemId) || false;

      try {
        const allQuestions = await Question.find({ isPublished: true })
          .select("problemId title phase slug")
          .sort({ problemId: 1 })
          .lean();
        const nextRes = findNextUnsolvedProblem(
          question.problemId,
          question.phase,
          allQuestions,
          user.solvedProblems || []
        );
        nextProblem = nextRes.nextProblem
          ? {
              problemId: nextRes.nextProblem.problemId,
              title: nextRes.nextProblem.title,
              phase: nextRes.nextProblem.phase,
            }
          : null;
        isAllSolved = nextRes.isAllSolved;
      } catch {
        // Non-blocking fallback
      }
    }

    // Fetch user's latest submission for this problem
    const lastSubmission = await Submission.findOne({
      userId: session.user.id,
      problemId: question.problemId,
    })
      .sort({ createdAt: -1 })
      .select("language code status runtime createdAt")
      .lean();

    return NextResponse.json(
      {
        userState: {
          isSolved,
          isAttempted,
          lastSubmission,
          nextProblem,
          isAllSolved,
        },
      },
      {
        headers: {
          "Cache-Control": "private, no-store, no-cache, must-revalidate",
          Vary: "Cookie",
        },
      }
    );
  } catch (error) {
    console.error("Private user state route error:", error);
    return NextResponse.json(
      { error: "Failed to load user state." },
      {
        status: 500,
        headers: {
          "Cache-Control": "private, no-store, no-cache, must-revalidate",
          Vary: "Cookie",
        },
      }
    );
  }
}
