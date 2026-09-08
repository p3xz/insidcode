import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdminUser } from "@/lib/auth";
import { AdminAction } from "@/models/AdminAction";

export async function GET(req: NextRequest) {
  try {
    const adminCheck = await requireAdminUser();
    if (!adminCheck.admin) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const action = searchParams.get("action");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (action) {
      query.action = action;
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
        adminUsername: l.adminUsername,
        action: l.action,
        targetUserId: l.targetUserId,
        targetProblemId: l.targetProblemId,
        previousValue: l.previousValue,
        newValue: l.newValue,
        reason: l.reason,
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
