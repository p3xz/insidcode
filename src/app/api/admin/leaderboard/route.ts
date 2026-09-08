import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdminUser } from "@/lib/auth";
import { SystemConfig } from "@/models/SystemConfig";
import { AdminAction } from "@/models/AdminAction";

export async function POST(req: NextRequest) {
  try {
    const adminCheck = await requireAdminUser();
    if (!adminCheck.admin) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const admin = adminCheck.admin;
    const { freeze } = await req.json();

    if (typeof freeze !== "boolean") {
      return NextResponse.json({ error: "Freeze state boolean is required." }, { status: 400 });
    }

    await connectToDatabase();
    let config = await SystemConfig.findOne({ key: "main" });

    if (!config) {
      config = await SystemConfig.create({
        key: "main",
        leaderboardFrozen: freeze,
        frozenAt: freeze ? new Date() : undefined,
      });
    } else {
      config.leaderboardFrozen = freeze;
      config.frozenAt = freeze ? new Date() : undefined;
      await config.save();
    }

    await AdminAction.create({
      adminId: admin._id.toString(),
      adminUsername: admin.username,
      action: freeze ? "LEADERBOARD_FREEZE" : "LEADERBOARD_UNFREEZE",
      newValue: `frozen: ${freeze}`,
      reason: freeze ? "Admin froze public leaderboard rankings" : "Admin unfroze leaderboard",
    });

    return NextResponse.json({
      success: true,
      message: freeze ? "Leaderboard rankings frozen." : "Leaderboard rankings unfrozen.",
      leaderboardFrozen: config.leaderboardFrozen,
      frozenAt: config.frozenAt,
    });
  } catch (error) {
    console.error("Admin leaderboard control error:", error);
    return NextResponse.json({ error: "Failed to update leaderboard freeze state." }, { status: 500 });
  }
}
