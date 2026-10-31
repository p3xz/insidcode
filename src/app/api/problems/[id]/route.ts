import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Question } from "@/models/Question";
import { checkRateLimit } from "@/lib/rateLimit";
import { normalizeProblemIdentifier } from "@/lib/problems";

/**
 * Public problem endpoint.
 * Serves public problem statement, examples, constraints, starter templates.
 * NEVER contains hidden test cases, expected outputs, or per-user data (userState).
 * Safe to cache publicly across all users and CDN edge nodes.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const norm = normalizeProblemIdentifier(id);

    if (!norm.valid) {
      return NextResponse.json({ error: "Invalid problem identifier." }, { status: 400 });
    }

    const clientIp = req.headers.get("x-forwarded-for") || "problems_anon";
    const rateLimit = checkRateLimit(`public_problem_${clientIp}`, { limit: 120, windowMs: 60000 });
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Rate limit exceeded. Please try again shortly." }, { status: 429 });
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
      .select("-hiddenTestCases")
      .lean();

    if (!question) {
      return NextResponse.json({ error: "Problem not found." }, { status: 404 });
    }

    return NextResponse.json(
      {
        problem: question,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error) {
    console.error("Public problem route error:", error);
    return NextResponse.json({ error: "Failed to load problem details." }, { status: 500 });
  }
}
