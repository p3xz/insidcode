import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Appeal } from "@/models/Appeal";
import { User } from "@/models/User";
import { AdminAction } from "@/models/AdminAction";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminUser();
    if (!authResult.admin) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;
    await connectToDatabase();

    const appeal = await Appeal.findById(id).lean();
    if (!appeal) {
      return NextResponse.json({ error: "Appeal not found." }, { status: 404 });
    }

    const linkedUser = await User.findById(appeal.userId).select("username isBanned banReason xp").lean();

    return NextResponse.json({
      appeal: {
        id: appeal._id.toString(),
        userId: appeal.userId.toString(),
        username: appeal.username,
        email: appeal.email,
        banReason: appeal.banReason,
        reason: appeal.reason,
        statement: appeal.statement,
        status: appeal.status,
        reviewedAt: appeal.reviewedAt,
        reviewedBy: appeal.reviewedBy,
        decision: appeal.decision,
        createdAt: appeal.createdAt,
      },
      userState: linkedUser
        ? {
            isBanned: linkedUser.isBanned,
            banReason: linkedUser.banReason,
            xp: linkedUser.xp,
          }
        : null,
    });
  } catch (error) {
    console.error("[Admin Appeal Item] Fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch appeal." }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminUser();
    const admin = authResult.admin;
    if (!admin) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, decisionNotes } = body;

    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'APPROVE' or 'REJECT'." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const appeal = await Appeal.findById(id);
    if (!appeal) {
      return NextResponse.json({ error: "Appeal not found." }, { status: 404 });
    }

    // Guard against repeated decisions on already finalized appeals
    if (appeal.status !== "PENDING") {
      return NextResponse.json(
        {
          error: `This appeal has already been finalized as ${appeal.status}.`,
          status: appeal.status,
          reviewedBy: appeal.reviewedBy,
          reviewedAt: appeal.reviewedAt,
        },
        { status: 400 }
      );
    }

    const targetUser = await User.findById(appeal.userId);
    if (!targetUser) {
      return NextResponse.json({ error: "Associated user account record not found." }, { status: 404 });
    }

    const now = new Date();

    if (action === "APPROVE") {
      // 1. Atomically finalize appeal as APPROVED
      appeal.status = "APPROVED";
      appeal.reviewedBy = admin.username;
      appeal.reviewedAt = now;
      appeal.decision = decisionNotes || "Appeal approved by administrator. Account restored.";
      await appeal.save();

      // 2. Atomically restore user account and require legal re-consent before normal access
      targetUser.isBanned = false;
      targetUser.banReason = undefined;
      targetUser.bannedUntil = undefined;
      targetUser.privacyPolicyAccepted = false;
      targetUser.termsAccepted = false;
      targetUser.restoredAt = now;
      targetUser.requiresRestorationConsent = true;
      await targetUser.save();

      // 3. Record immutable audit action
      await AdminAction.create({
        adminId: admin._id.toString(),
        adminUsername: admin.username,
        action: "APPEAL_APPROVED",
        targetUserId: targetUser._id.toString(),
        targetUsername: targetUser.username,
        details: `Approved appeal ${appeal._id.toString()}. Suspension removed and account access restored.`,
      });

      return NextResponse.json({
        success: true,
        message: "Appeal approved successfully. Account access has been restored.",
        appeal: {
          id: appeal._id.toString(),
          status: "APPROVED",
          reviewedBy: admin.username,
          reviewedAt: now,
          decision: appeal.decision,
        },
        userState: {
          isBanned: false,
        },
      });
    } else {
      // action === "REJECT"
      // 1. Atomically finalize appeal as REJECTED
      appeal.status = "REJECTED";
      appeal.reviewedBy = admin.username;
      appeal.reviewedAt = now;
      appeal.decision = decisionNotes || "Appeal rejected by administrator. Suspension remains active.";
      await appeal.save();

      // 2. User account remains suspended (isBanned remains true)
      targetUser.isBanned = true;
      await targetUser.save();

      // 3. Record immutable audit action
      await AdminAction.create({
        adminId: admin._id.toString(),
        adminUsername: admin.username,
        action: "APPEAL_REJECTED",
        targetUserId: targetUser._id.toString(),
        targetUsername: targetUser.username,
        details: `Rejected appeal ${appeal._id.toString()}. Account remains suspended.`,
      });

      return NextResponse.json({
        success: true,
        message: "Appeal rejected. Account remains suspended.",
        appeal: {
          id: appeal._id.toString(),
          status: "REJECTED",
          reviewedBy: admin.username,
          reviewedAt: now,
          decision: appeal.decision,
        },
        userState: {
          isBanned: true,
        },
      });
    }
  } catch (error) {
    console.error("[Admin Appeal Item] PATCH error:", error);
    return NextResponse.json({ error: "Failed to process appeal decision." }, { status: 500 });
  }
}
