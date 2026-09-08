import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Question } from "@/models/Question";
import { auth } from "@/lib/auth";
import { User } from "@/models/User";
import { CURRICULUM_PHASES, LIMITS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const phaseParam = searchParams.get("phase");
    const difficultyParam = searchParams.get("difficulty");
    const statusParam = searchParams.get("status"); // solved, unsolved, all
    const searchParam = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      LIMITS.MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get("limit") || `${LIMITS.DEFAULT_PAGE_SIZE}`, 10))
    );

    // Get current user solve list if logged in
    const session = await auth();
    let userSolvedProblems: string[] = [];
    let userAttemptedProblems: string[] = [];

    if (session?.user?.id) {
      const user = await User.findById(session.user.id).select("solvedProblems attemptedProblems");
      if (user) {
        userSolvedProblems = user.solvedProblems || [];
        userAttemptedProblems = user.attemptedProblems || [];
      }
    }

    // Build filter query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { isPublished: true };

    if (phaseParam && parseInt(phaseParam, 10) >= 1 && parseInt(phaseParam, 10) <= 6) {
      query.phase = parseInt(phaseParam, 10);
    }

    if (difficultyParam && ["Easy", "Medium", "Hard"].includes(difficultyParam)) {
      query.difficulty = difficultyParam;
    }

    if (statusParam === "solved") {
      query.problemId = { $in: userSolvedProblems };
    } else if (statusParam === "unsolved") {
      query.problemId = { $nin: userSolvedProblems };
    }

    if (searchParam.trim()) {
      const sanitizedSearch = searchParam.trim().slice(0, LIMITS.SEARCH_MAX);
      const searchRegex = new RegExp(sanitizedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [
        { title: searchRegex },
        { problemId: searchRegex },
        { tags: searchRegex },
      ];
    }

    const totalCount = await Question.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    const questions = await Question.find(query)
      .select("problemId title slug phase difficulty tags xp createdAt")
      .sort({ problemId: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Attach solved/attempted status
    const enrichedQuestions = questions.map((q) => ({
      ...q,
      isSolved: userSolvedProblems.includes(q.problemId),
      isAttempted: userAttemptedProblems.includes(q.problemId),
    }));

    // Calculate phase progress breakdown
    const allPublished = await Question.find({ isPublished: true })
      .select("problemId phase")
      .lean();

    const phaseStats = CURRICULUM_PHASES.map((phase) => {
      const phaseQuestions = allPublished.filter((q) => q.phase === phase.id);
      const total = phaseQuestions.length;
      const solved = phaseQuestions.filter((q) => userSolvedProblems.includes(q.problemId)).length;
      const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;

      return {
        phaseId: phase.id,
        title: phase.title,
        description: phase.description,
        total,
        solved,
        percentage,
      };
    });

    const totalPublished = allPublished.length;
    const totalSolved = allPublished.filter((q) => userSolvedProblems.includes(q.problemId)).length;
    const overallPercentage = totalPublished > 0 ? Math.round((totalSolved / totalPublished) * 100) : 0;

    return NextResponse.json({
      questions: enrichedQuestions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
      stats: {
        totalPublished,
        totalSolved,
        overallPercentage,
        phases: phaseStats,
      },
    });
  } catch (error) {
    console.error("Problems list route error:", error);
    return NextResponse.json({ error: "Failed to load problems directory." }, { status: 500 });
  }
}
