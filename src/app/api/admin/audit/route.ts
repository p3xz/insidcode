import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdminUser } from "@/lib/auth";
import { AdminAction } from "@/models/AdminAction";

const CATEGORY_MAP: Record<string, string[]> = {
  MODERATION: ["USER_BAN", "USER_UNBAN", "USER_SUSPENDED", "ROLE_CHANGE", "XP_ADJUSTMENT", "LEADERBOARD_VISIBILITY_CHANGE"],
  APPEALS: ["APPEAL_APPROVED", "APPEAL_REJECTED"],
  SECURITY: ["UNAUTHORIZED_ADMIN_ACTION"],
  LEADERBOARD: ["LEADERBOARD_FREEZE", "LEADERBOARD_UNFREEZE", "ANNOUNCEMENT_POST"],
  PROBLEMS: ["PROBLEM_CREATE", "PROBLEM_EDIT", "PROBLEM_DELETE"],
  SEEDER: ["SEED_USERS_RUN"],
  FEEDBACK: ["FEEDBACK_REVIEW"],
};

export async function GET(req: NextRequest) {
  try {
    const adminCheck = await requireAdminUser();
    if (!adminCheck.admin) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const rateLimit = checkRateLimit(`admin_audit_${adminCheck.admin._id.toString()}`, {
      limit: 120,
      windowMs: 60000,
    });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again shortly." },
        { status: 429 }
      );
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const action = searchParams.get("action");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};

    if (action && action.trim() && action !== "ALL") {
      query.action = action.trim();
    } else if (category && CATEGORY_MAP[category.toUpperCase()]) {
      query.action = { $in: CATEGORY_MAP[category.toUpperCase()] };
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [
        { adminUsername: regex },
        { targetUserId: regex },
        { targetProblemId: regex },
        { reason: regex },
        { action: regex },
      ];
    }

    const totalCount = await AdminAction.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    const logs = await AdminAction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l._id.toString(),
        adminId: l.adminId,
        adminUsername: l.adminUsername,
        action: l.action,
        targetUserId: l.targetUserId,
        targetProblemId: l.targetProblemId,
        previousValue: l.previousValue,
        newValue: l.newValue,
        reason: l.reason,
        metadata: l.metadata,
        createdAt: l.createdAt,
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Admin audit log error:", error);
    return NextResponse.json({ error: "Failed to load audit logs." }, { status: 500 });
  }
}
