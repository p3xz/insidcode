import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Question } from "@/models/Question";
import { Submission } from "@/models/Submission";
import { CURRICULUM_PHASES } from "@/lib/constants";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    await connectToDatabase();
    const { username } = await params;

    if (!username) {
      return NextResponse.json({ error: "Username is required." }, { status: 400 });
    }

    const session = await auth();
    const currentUserId = session?.user?.id;

    const targetUser = await User.findOne({
      usernameNormalized: username.toLowerCase(),
      isBanned: false,
    })
      .select("username displayName image xp currentStreak longestStreak solvedProblems totalSubmissions acceptedSubmissions createdAt role")
      .lean();

    if (!targetUser) {
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }

    // Solved problems breakdown
    const solvedIds = targetUser.solvedProblems || [];
    const solvedQuestions = await Question.find({
      problemId: { $in: solvedIds },
      isPublished: true,
    })
      .select("problemId title slug difficulty phase")
      .lean();

    const easySolved = solvedQuestions.filter((q) => q.difficulty === "Easy").length;
    const mediumSolved = solvedQuestions.filter((q) => q.difficulty === "Medium").length;
    const hardSolved = solvedQuestions.filter((q) => q.difficulty === "Hard").length;

    const allPublished = await Question.find({ isPublished: true })
      .select("problemId difficulty phase")
      .lean();

    const phaseBreakdown = CURRICULUM_PHASES.map((phase) => {
      const totalInPhase = allPublished.filter((q) => q.phase === phase.id).length;
      const solvedInPhase = solvedQuestions.filter((q) => q.phase === phase.id).length;
      const percentage = totalInPhase > 0 ? Math.round((solvedInPhase / totalInPhase) * 100) : 0;
      return {
        phaseId: phase.id,
        title: phase.title,
        solved: solvedInPhase,
        total: totalInPhase,
        percentage,
      };
    });

    // Heatmap data: Last 365 days
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    const submissionsPastYear = await Submission.find({
      userId: targetUser._id.toString(),
      status: "Accepted",
      createdAt: { $gte: oneYearAgo },
    })
      .select("createdAt")
      .lean();

    const heatmap: Record<string, number> = {};
    for (const sub of submissionsPastYear) {
      const dateKey = sub.createdAt.toISOString().split("T")[0];
      heatmap[dateKey] = (heatmap[dateKey] || 0) + 1;
    }

    // Recent 8 public solves
    const recentSolves = await Submission.find({
      userId: targetUser._id.toString(),
      status: "Accepted",
    })
      .sort({ createdAt: -1 })
      .limit(8)
      .select("problemId problemTitle language runtime createdAt")
      .lean();

    const isOwnProfile = currentUserId ? targetUser._id.toString() === currentUserId : false;

    return NextResponse.json({
      profile: {
        id: targetUser._id.toString(),
        username: targetUser.username,
        displayName: targetUser.displayName,
        image: targetUser.image,
        xp: targetUser.xp,
        currentStreak: targetUser.currentStreak,
        longestStreak: targetUser.longestStreak,
        totalSolved: solvedIds.length,
        easySolved,
        mediumSolved,
        hardSolved,
        totalQuestions: allPublished.length,
        phaseBreakdown,
        heatmap,
        recentSolves,
        memberSince: targetUser.createdAt,
        role: targetUser.role,
        isOwnProfile,
      },
    });
  } catch (error) {
    console.error("Profile route error:", error);
    return NextResponse.json({ error: "Failed to load profile." }, { status: 500 });
  }
}
