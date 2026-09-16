import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { checkRateLimit, acquireSubmissionLock, releaseSubmissionLock } from "@/lib/rateLimit";
import { CodeSubmissionSchema } from "@/lib/validations";
import { evaluateAndRecordSubmission } from "@/lib/submission";

export async function POST(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const user = authResult.user;

    const rateLimit = checkRateLimit(`submit_${user._id}`, { limit: 12, windowMs: 60000 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many submission attempts. Please wait a moment before submitting again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parseResult = CodeSubmissionSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || "Invalid submission payload";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { problemId, language, code } = parseResult.data;

    // Acquire in-flight lock to prevent duplicate concurrent submissions
    const lockAcquired = acquireSubmissionLock(user._id.toString());
    if (!lockAcquired) {
      return NextResponse.json(
        { error: "A submission is already in progress. Please wait for the current submission to finish." },
        { status: 409 }
      );
    }

    try {
      const result = await evaluateAndRecordSubmission(user, problemId, language, code);

      return NextResponse.json({
        ...result,
        languagePoints: user.languagePoints,
      });
    } catch (evalError: unknown) {
      const msg = evalError instanceof Error ? evalError.message : "Problem evaluation failed.";
      if (msg.includes("Problem not found")) {
        return NextResponse.json({ error: msg }, { status: 404 });
      }
      return NextResponse.json({ error: msg }, { status: 500 });
    } finally {
      // Always release the in-flight lock regardless of outcome
      releaseSubmissionLock(user._id.toString());
    }
  } catch (error) {
    console.error("Submission processing error:", error);
    return NextResponse.json(
      { error: "Failed to process submission. Please try again." },
      { status: 500 }
    );
  }
}
