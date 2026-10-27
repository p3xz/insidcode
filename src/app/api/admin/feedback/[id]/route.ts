import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { requireAdminMutationUser } from "@/lib/security";
import { connectToDatabase } from "@/lib/mongodb";
import { Feedback } from "@/models/Feedback";
import { AdminAction } from "@/models/AdminAction";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdminMutationUser(req, "FEEDBACK_STATUS_UPDATE");
    if (!adminCheck.admin) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const admin = adminCheck.admin;

    const rateLimit = checkRateLimit(`admin_feedback_mut_${admin._id.toString()}`, {
      limit: 30,
      windowMs: 60000,
    });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again shortly." },
        { status: 429 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { status, adminNotes } = body;

    if (status && !["NEW", "IN_REVIEW", "RESOLVED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'NEW', 'IN_REVIEW', or 'RESOLVED'." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const item = await Feedback.findById(id);

    if (!item) {
      return NextResponse.json({ error: "Feedback item not found." }, { status: 404 });
    }

    const prevStatus = item.status;
    if (status) item.status = status;
    if (typeof adminNotes === "string") item.adminNotes = adminNotes.trim();
    item.reviewedBy = admin.username;
    item.reviewedAt = new Date();

    await item.save();

    await AdminAction.create({
      adminId: admin._id.toString(),
      adminUsername: admin.username,
      action: "FEEDBACK_REVIEW",
      previousValue: `status: ${prevStatus}`,
      newValue: `status: ${item.status}`,
      reason: adminNotes || `Feedback updated to ${item.status}`,
      metadata: {
        feedbackId: item._id.toString(),
        subject: item.subject,
        type: item.feedbackType,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Feedback updated successfully.",
      feedback: {
        id: item._id.toString(),
        status: item.status,
        adminNotes: item.adminNotes,
        reviewedBy: item.reviewedBy,
        reviewedAt: item.reviewedAt,
      },
    });
  } catch (error) {
    console.error("[Admin Feedback] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update feedback item." }, { status: 500 });
  }
}
