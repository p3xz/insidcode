import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { requireAdminUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { AdminAction } from "@/models/AdminAction";
import { Submission } from "@/models/Submission";

export async function GET() {
  try {
    const adminCheck = await requireAdminUser();
    if (!adminCheck.admin) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const rateLimit = checkRateLimit(`admin_act_${adminCheck.admin._id.toString()}`, {
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

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const [securityViolations, recentBans, highVelocitySubmissions] = await Promise.all([
      AdminAction.find({ action: "UNAUTHORIZED_ADMIN_ACTION" })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      AdminAction.find({ action: { $in: ["USER_BAN", "USER_SUSPENDED"] } })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      Submission.aggregate([
        { $match: { createdAt: { $gte: twoHoursAgo } } },
        { $group: { _id: "$userId", count: { $sum: 1 }, username: { $first: "$username" } } },
        { $match: { count: { $gte: 15 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]),
    ]);

    return NextResponse.json({
      activity: {
        securityViolations: securityViolations.map((v) => ({
          id: v._id.toString(),
          targetUserId: v.targetUserId,
          reason: v.reason,
          details: v.newValue,
          metadata: v.metadata,
          createdAt: v.createdAt,
        })),
        recentBans: recentBans.map((b) => ({
          id: b._id.toString(),
          adminUsername: b.adminUsername,
          targetUserId: b.targetUserId,
          reason: b.reason,
          createdAt: b.createdAt,
        })),
        highVelocityUsers: highVelocitySubmissions.map((h) => ({
          userId: h._id,
          username: h.username || "Unknown",
          submissionsLast2Hours: h.count,
        })),
      },
    });
  } catch (error) {
    console.error("[Admin Activity] GET error:", error);
    return NextResponse.json({ error: "Failed to load activity telemetry." }, { status: 500 });
  }
}
