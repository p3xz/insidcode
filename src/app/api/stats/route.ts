import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthenticatedUser } from "@/lib/auth";
import { Question } from "@/models/Question";
import { Submission } from "@/models/Submission";
import { CURRICULUM_PHASES } from "@/lib/constants";
import { calculateDuelKd, calculateDuelWinRate } from "@/lib/duelStats";
import { getDuelRank, resolveUserChampionPosition } from "@/lib/duelRanks";

export async function GET() {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const user = authResult.user;
    await connectToDatabase();

    const solvedIds = user.solvedProblems || [];

    // Solved questions details
    const solvedQuestions = await Question.find({
      problemId: { $in: solvedIds },
      isPublished: true,
    })
      .select("problemId difficulty phase")
      .lean();

    const easySolved = solvedQuestions.filter((q) => q.difficulty === "Easy").length;
    const mediumSolved = solvedQuestions.filter((q) => q.difficulty === "Medium").length;
    const hardSolved = solvedQuestions.filter((q) => q.difficulty === "Hard").length;

    // Total questions breakdown in platform
    const allPublished = await Question.find({ isPublished: true })
      .select("problemId difficulty phase")
      .lean();

    const totalEasy = allPublished.filter((q) => q.difficulty === "Easy").length;
    const totalMedium = allPublished.filter((q) => q.difficulty === "Medium").length;
    const totalHard = allPublished.filter((q) => q.difficulty === "Hard").length;

    // Phase breakdown
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

    // Acceptance rate
    const acceptanceRate =
      user.totalSubmissions > 0
        ? Math.round((user.acceptedSubmissions / user.totalSubmissions) * 100)
        : 0;

    // Heatmap data: Solves in the last 365 days
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    const submissionsPastYear = await Submission.find({
      userId: user._id.toString(),
      status: "Accepted",
      createdAt: { $gte: oneYearAgo },
    })
      .select("createdAt problemId")
      .lean();

    // Map by YYYY-MM-DD
    const heatmapMap: Record<string, number> = {};
    for (const sub of submissionsPastYear) {
      const dateKey = sub.createdAt.toISOString().split("T")[0];
      heatmapMap[dateKey] = (heatmapMap[dateKey] || 0) + 1;
    }

    // Recent 10 submissions
    const recentSubmissions = await Submission.find({
      userId: user._id.toString(),
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("problemId problemTitle language status runtime awardedXp createdAt")
      .lean();

    const duelsPlayed = user.duelsPlayed || 0;
    const duelsWon = user.duelsWon || 0;
    const duelsLost = user.duelsLost || 0;
    const duelPoints = user.duelPoints || 0;
    const duelRating = user.duelRating ?? 1000;
    const duelWinRate = calculateDuelWinRate(duelsWon, duelsPlayed);
    const duelKd = calculateDuelKd(duelsWon, duelsLost);

    const championPosition = await resolveUserChampionPosition(user._id.toString(), duelsPlayed);
    const resolvedRank = getDuelRank(duelPoints, championPosition);

    return NextResponse.json({
      stats: {
        totalSolved: solvedIds.length,
        totalQuestions: allPublished.length,
        easySolved,
        totalEasy,
        mediumSolved,
        totalMedium,
        hardSolved,
        totalHard,
        xp: user.xp,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        totalSubmissions: user.totalSubmissions,
        acceptedSubmissions: user.acceptedSubmissions,
        acceptanceRate,
        phaseBreakdown,
        heatmap: heatmapMap,
        recentSubmissions,
        languagePoints: user.languagePoints || {
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
      },
    });
  } catch (error) {
    console.error("Stats route error:", error);
    return NextResponse.json({ error: "Failed to load user statistics." }, { status: 500 });
  }
}
