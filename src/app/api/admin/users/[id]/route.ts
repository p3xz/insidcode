import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { requireAdminUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Submission } from "@/models/Submission";
import { Appeal } from "@/models/Appeal";
import { AdminAction } from "@/models/AdminAction";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdminUser();
    if (!adminCheck.admin) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const rateLimit = checkRateLimit(`admin_user_detail_${adminCheck.admin._id.toString()}`, {
      limit: 120,
      windowMs: 60000,
    });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again shortly." },
        { status: 429 }
      );
    }

    const { id } = await params;
    await connectToDatabase();

    const user = await User.findById(id).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const [submissions, appeals, auditActions] = await Promise.all([
      Submission.find({ userId: id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("problemId status language runtime memory createdAt")
        .lean(),
      Appeal.find({ userId: id })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      AdminAction.find({ targetUserId: id })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const duelsPlayed = user.duelsPlayed || 0;
    const duelsWon = user.duelsWon || 0;
    const winRate = duelsPlayed > 0 ? Math.round((duelsWon / duelsPlayed) * 100) : 0;

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        image: user.image,
        provider: user.provider,
        role: user.role,
        xp: user.xp,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        lastActiveDate: user.lastActiveDate,
        solvedCount: user.solvedProblems?.length || 0,
        attemptedCount: user.attemptedProblems?.length || 0,
        duelRating: user.duelRating || 1000,
        duelPoints: user.duelPoints || 0,
        duelsPlayed,
        duelsWon,
        duelsLost: user.duelsLost || 0,
        winRate,
        isBanned: user.isBanned,
        banReason: user.banReason,
        bannedAt: user.bannedAt,
        bannedUntil: user.bannedUntil,
        leaderboardVisible: user.leaderboardVisible,
        selectedTitle: user.selectedTitle || null,
        languagePoints: user.languagePoints || {},
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        restoredAt: user.restoredAt,
      },
      recentSubmissions: submissions.map((s) => ({
        id: s._id.toString(),
        problemId: s.problemId,
        status: s.status,
        language: s.language,
        runtime: s.runtime,
        memory: s.memory,
        createdAt: s.createdAt,
      })),
      appeals: appeals.map((a) => ({
        id: a._id.toString(),
        status: a.status,
        reason: a.reason,
        statement: a.statement,
        reviewedBy: a.reviewedBy,
        reviewedAt: a.reviewedAt,
        decision: a.decision,
        createdAt: a.createdAt,
      })),
      auditActions: auditActions.map((act) => ({
        id: act._id.toString(),
        adminUsername: act.adminUsername,
        action: act.action,
        previousValue: act.previousValue,
        newValue: act.newValue,
        reason: act.reason,
        createdAt: act.createdAt,
      })),
    });
  } catch (error) {
    console.error("[Admin User Detail] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch user details." }, { status: 500 });
  }
}
