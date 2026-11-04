import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { requireAdminUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Feedback } from "@/models/Feedback";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdminUser();
    if (!authResult.admin) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const rateLimit = checkRateLimit(`admin_feedback_get_${authResult.admin._id.toString()}`, {
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

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};

    if (status && ["NEW", "IN_REVIEW", "RESOLVED"].includes(status.toUpperCase())) {
      query.status = status.toUpperCase();
    }

    if (type && type.trim()) {
      query.feedbackType = type.trim();
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ username: regex }, { email: regex }, { subject: regex }, { message: regex }];
    }

    const [totalCount, items, newCount, inReviewCount] = await Promise.all([
      Feedback.countDocuments(query),
      Feedback.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Feedback.countDocuments({ status: "NEW" }),
      Feedback.countDocuments({ status: "IN_REVIEW" }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      feedback: items.map((f) => ({
        id: f._id.toString(),
        userId: f.userId,
        username: f.username,
        email: f.email,
        feedbackType: f.feedbackType,
        subject: f.subject,
        message: f.message,
        status: f.status,
        adminNotes: f.adminNotes,
        reviewedBy: f.reviewedBy,
        reviewedAt: f.reviewedAt,
        createdAt: f.createdAt,
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
      counts: {
        new: newCount,
        inReview: inReviewCount,
      },
    });
  } catch (error) {
    console.error("[Admin Feedback] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch feedback." }, { status: 500 });
  }
}
