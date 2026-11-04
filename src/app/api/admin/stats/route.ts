import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdminUser } from "@/lib/auth";
import { User } from "@/models/User";
import { Question } from "@/models/Question";
import { Submission } from "@/models/Submission";
import { Appeal } from "@/models/Appeal";
import { Feedback } from "@/models/Feedback";
import { DuelRoom } from "@/models/DuelRoom";

export async function GET() {
  try {
    const adminCheck = await requireAdminUser();
    if (!adminCheck.admin) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const rateLimit = checkRateLimit(`admin_stats_${adminCheck.admin._id.toString()}`, {
      limit: 60,
      windowMs: 60000,
    });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again shortly." },
        { status: 429 }
      );
    }

    await connectToDatabase();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgoStr = sevenDaysAgoDate.toISOString().slice(0, 10);

    const [
      totalUsers,
      bannedUsers,
      activeLast7Days,
      totalProblems,
      publishedProblems,
      totalSubmissions,
      acceptedSubmissions,
      submissionsToday,
      acceptedToday,
      openAppeals,
      unreadFeedback,
      duelsToday,
      xpAggResult,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isBanned: true }),
      User.countDocuments({ lastActiveDate: { $gte: sevenDaysAgoStr }, isBanned: false }),
      Question.countDocuments(),
      Question.countDocuments({ isPublished: true }),
      Submission.countDocuments(),
      Submission.countDocuments({ status: "Accepted" }),
      Submission.countDocuments({ createdAt: { $gte: startOfToday } }),
      Submission.countDocuments({ createdAt: { $gte: startOfToday }, status: "Accepted" }),
      Appeal.countDocuments({ status: "PENDING" }),
      Feedback.countDocuments({ status: "NEW" }),
      DuelRoom.countDocuments({ createdAt: { $gte: startOfToday } }),
      User.aggregate([{ $group: { _id: null, totalXp: { $sum: "$xp" } } }]),
    ]);

    const totalXpAwarded = xpAggResult[0]?.totalXp || 0;
    const activeUsers = totalUsers - bannedUsers;
    const acceptanceRateToday =
      submissionsToday > 0 ? Math.round((acceptedToday / submissionsToday) * 100) : 0;
    const overallAcceptanceRate =
      totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0;

    return NextResponse.json({
      stats: {
        totalUsers,
        activeUsers,
        bannedUsers,
        activeLast7Days,
        totalProblems,
        publishedProblems,
        totalSubmissions,
        acceptedSubmissions,
        submissionsToday,
        acceptedToday,
        acceptanceRateToday,
        overallAcceptanceRate,
        openAppeals,
        unreadFeedback,
        duelsToday,
        totalXpAwarded,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to load admin statistics." }, { status: 500 });
  }
}
