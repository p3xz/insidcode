import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Question } from "@/models/Question";
import { Submission } from "@/models/Submission";
import { CURRICULUM_PHASES } from "@/lib/constants";
import { auth } from "@/lib/auth";
import { calculateDuelKd, calculateDuelWinRate } from "@/lib/duelStats";
import { getDuelRank, resolveUserChampionPosition } from "@/lib/duelRanks";

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
      .select("username displayName image xp currentStreak longestStreak solvedProblems totalSubmissions acceptedSubmissions createdAt role languagePoints selectedTitle duelsPlayed duelsWon duelsLost duelRating duelPoints")
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
    const duelsPlayed = targetUser.duelsPlayed || 0;
    const duelsWon = targetUser.duelsWon || 0;
    const duelsLost = targetUser.duelsLost || 0;
    const duelPoints = targetUser.duelPoints || 0;
    const duelRating = targetUser.duelRating ?? 1000;
    const duelWinRate = calculateDuelWinRate(duelsWon, duelsPlayed);
    const duelKd = calculateDuelKd(duelsWon, duelsLost);

    const championPosition = await resolveUserChampionPosition(targetUser._id.toString(), duelsPlayed);
    const resolvedRank = getDuelRank(duelPoints, championPosition);

    return NextResponse.json({
      profile: {
        id: targetUser._id.toString(),
        username: targetUser.username,
        displayName: targetUser.displayName,
        image: targetUser.image,
        selectedTitle: targetUser.selectedTitle || null,
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
        languagePoints: targetUser.languagePoints || {
          python: 0,
          javascript: 0,
          c: 0,
          cpp: 0,
          java: 0,
        },
        duelRating,
        duelPoints,
        duelRank: resolvedRank.rankName,
        duelRankTier: resolvedRank.tierName,
        duelRankDivision: resolvedRank.division,
        duelRankMinPoints: resolvedRank.minPoints,
        duelRankMaxPoints: resolvedRank.maxPoints,
        duelPointsToNextRank: resolvedRank.pointsToNextRank,
        duelNextRankName: resolvedRank.nextRankName,
        isChampion: resolvedRank.isChampion,
        duelChampionPosition: resolvedRank.championPosition,
        duelsPlayed,
        duelsWon,
        duelsLost,
        duelWinRate,
        duelKd,
        isOwnProfile,
      },
    });
  } catch (error) {
    console.error("Profile route error:", error);
    return NextResponse.json({ error: "Failed to load profile." }, { status: 500 });
  }
}
