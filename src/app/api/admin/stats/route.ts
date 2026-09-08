import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdminUser } from "@/lib/auth";
import { User } from "@/models/User";
import { Question } from "@/models/Question";
import { Submission } from "@/models/Submission";

export async function GET() {
  try {
    const adminCheck = await requireAdminUser();
    if (!adminCheck.admin) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    await connectToDatabase();

    const [
      totalUsers,
      bannedUsers,
      totalProblems,
      publishedProblems,
      totalSubmissions,
      acceptedSubmissions,
      xpAggResult,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isBanned: true }),
      Question.countDocuments(),
      Question.countDocuments({ isPublished: true }),
      Submission.countDocuments(),
      Submission.countDocuments({ status: "Accepted" }),
      User.aggregate([{ $group: { _id: null, totalXp: { $sum: "$xp" } } }]),
    ]);

    const totalXpAwarded = xpAggResult[0]?.totalXp || 0;
    const activeUsers = totalUsers - bannedUsers;

    return NextResponse.json({
      stats: {
        totalUsers,
        activeUsers,
        bannedUsers,
        totalProblems,
        publishedProblems,
        totalSubmissions,
        acceptedSubmissions,
        totalXpAwarded,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to load admin statistics." }, { status: 500 });
  }
}
