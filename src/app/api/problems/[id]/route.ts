import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Question } from "@/models/Question";
import { auth } from "@/lib/auth";
import { User } from "@/models/User";
import { Submission } from "@/models/Submission";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Problem identifier is required." }, { status: 400 });
    }

    // Lookup by problemId or slug
    const question = await Question.findOne({
      $or: [{ problemId: id }, { slug: id.toLowerCase() }],
      isPublished: true,
    })
      .select("-hiddenTestCases")
      .lean();

    if (!question) {
      return NextResponse.json({ error: "Problem not found." }, { status: 404 });
    }

    const session = await auth();
    let isSolved = false;
    let isAttempted = false;
    let lastSubmission = null;

    if (session?.user?.id) {
      const user = await User.findById(session.user.id).select("solvedProblems attemptedProblems");
      if (user) {
        isSolved = user.solvedProblems?.includes(question.problemId) || false;
        isAttempted = user.attemptedProblems?.includes(question.problemId) || false;
      }

      // Fetch user's latest submission for this problem
      lastSubmission = await Submission.findOne({
        userId: session.user.id,
        problemId: question.problemId,
      })
        .sort({ createdAt: -1 })
        .select("language code status runtime createdAt")
        .lean();
    }

    return NextResponse.json({
      problem: question,
      userState: {
        isSolved,
        isAttempted,
        lastSubmission,
      },
    });
  } catch (error) {
    console.error("Single problem route error:", error);
    return NextResponse.json({ error: "Failed to load problem details." }, { status: 500 });
  }
}
