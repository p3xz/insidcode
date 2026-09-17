import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Appeal } from "@/models/Appeal";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdminUser();
    if (!authResult.admin) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await connectToDatabase();

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const query: Record<string, unknown> = {};

    if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      query.status = status;
    }

    if (search && search.trim().length > 0) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ username: regex }, { email: regex }, { reason: regex }];
    }

    const [appeals, pendingCount] = await Promise.all([
      Appeal.find(query).sort({ createdAt: -1 }).limit(100).lean(),
      Appeal.countDocuments({ status: "PENDING" }),
    ]);

    const formattedAppeals = appeals.map((a) => ({
      id: a._id.toString(),
      userId: a.userId?.toString(),
      username: a.username,
      email: a.email,
      banReason: a.banReason,
      reason: a.reason,
      statement: a.statement,
      status: a.status,
      reviewedAt: a.reviewedAt,
      reviewedBy: a.reviewedBy,
      decision: a.decision,
      createdAt: a.createdAt,
    }));

    return NextResponse.json({
      appeals: formattedAppeals,
      pendingCount,
    });
  } catch (error) {
    console.error("[Admin Appeals] Fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch appeals." }, { status: 500 });
  }
}
