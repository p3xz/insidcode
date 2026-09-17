import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Appeal } from "@/models/Appeal";
import { checkRateLimit } from "@/lib/rateLimit";
import { z } from "zod";

const AppealSchema = z.object({
  appealReason: z
    .string()
    .min(3, "Appeal reason must be at least 3 characters")
    .max(120, "Appeal reason cannot exceed 120 characters"),
  additionalInfo: z
    .string()
    .min(20, "Please provide at least 20 characters of detail for your appeal")
    .max(3000, "Additional information cannot exceed 3000 characters"),
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const dbUser = await User.findById(session.user.id).select("username email isBanned banReason").lean();

    if (!dbUser) {
      return NextResponse.json({ error: "User record not found." }, { status: 404 });
    }

    if (!dbUser.isBanned) {
      return NextResponse.json({
        isBanned: false,
        hasAppeal: false,
        appeal: null,
      });
    }

    const latestAppeal = await Appeal.findOne({ userId: dbUser._id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      isBanned: true,
      hasAppeal: Boolean(latestAppeal),
      appeal: latestAppeal
        ? {
            id: latestAppeal._id.toString(),
            reason: latestAppeal.reason,
            statement: latestAppeal.statement,
            status: latestAppeal.status,
            createdAt: latestAppeal.createdAt,
            reviewedAt: latestAppeal.reviewedAt,
            decision: latestAppeal.decision,
          }
        : null,
    });
  } catch (error) {
    console.error("[Appeal] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch appeal status." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to submit an appeal." },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const dbUser = await User.findById(session.user.id);

    if (!dbUser) {
      return NextResponse.json(
        { error: "User account record not found." },
        { status: 404 }
      );
    }

    // Server-side authoritative verification: user MUST be currently suspended/banned
    if (!dbUser.isBanned) {
      return NextResponse.json(
        { error: "Forbidden. Only suspended accounts are eligible to submit an appeal." },
        { status: 403 }
      );
    }

    // Rate limiting: max 2 requests per 15 minutes per suspended account
    const rateLimitKey = `appeal_${dbUser._id.toString()}`;
    const rateLimit = checkRateLimit(rateLimitKey, {
      limit: 2,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: `Too many appeal requests. Please wait ${rateLimit.reset} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    // Check if an appeal already exists for this active suspension (PENDING or REJECTED)
    const existingAppeal = await Appeal.findOne({
      userId: dbUser._id,
      status: { $in: ["PENDING", "REJECTED"] },
    }).sort({ createdAt: -1 });

    if (existingAppeal) {
      return NextResponse.json(
        {
          error: "APPEAL_ALREADY_SUBMITTED",
          message: "An appeal has already been submitted for this suspension.",
          status: existingAppeal.status,
          appealId: existingAppeal._id.toString(),
          createdAt: existingAppeal.createdAt,
        },
        { status: 409 }
      );
    }

    const body = await req.json();
    const parseResult = AppealSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || "Invalid appeal payload.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { appealReason, additionalInfo } = parseResult.data;
    const username = dbUser.username || "Unknown Username";
    const userEmail = dbUser.email || "No email on record";
    const banReason = dbUser.banReason || "Administrative suspension";
    const timestamp = new Date().toUTCString();

    // 1. Store the appeal in MongoDB first (Atomic insertion)
    let newAppeal;
    try {
      newAppeal = await Appeal.create({
        userId: dbUser._id,
        username,
        email: userEmail,
        banReason,
        reason: appealReason,
        statement: additionalInfo,
        status: "PENDING",
      });
    } catch (createErr: unknown) {
      const mongoErr = createErr as { code?: number };
      if (mongoErr?.code === 11000) {
        return NextResponse.json(
          {
            error: "APPEAL_ALREADY_SUBMITTED",
            message: "An appeal has already been submitted for this suspension.",
          },
          { status: 409 }
        );
      }
      throw createErr;
    }

    // 2. Dispatch email notification safely to contactphoenixfy@gmail.com
    const resendApiKey = process.env.RESEND_API_KEY;
    const recipientEmail = "contactphoenixfy@gmail.com";

    if (resendApiKey) {
      try {
        const emailSubject = `[InsidCode Appeal] Suspension Appeal — @${username}`;
        const SENDER = "InsidCode Appeal <onboarding@resend.dev>";

        const htmlBody = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Suspension Appeal</title></head>
<body style="font-family:sans-serif;padding:20px;background:#f4f4f5;">
  <div style="max-width:600px;margin:0 auto;background:#fff;padding:24px;border-radius:6px;border:1px solid #e4e4e7;">
    <h2 style="margin:0 0 16px;color:#ef4444;">Suspension Appeal — @${escapeHtml(username)}</h2>
    <p><strong>Appeal ID:</strong> ${newAppeal._id.toString()}</p>
    <p><strong>Status:</strong> PENDING</p>
    <p><strong>Username:</strong> @${escapeHtml(username)}</p>
    <p><strong>Email:</strong> ${escapeHtml(userEmail)}</p>
    <p><strong>Recorded Ban Reason:</strong> ${escapeHtml(banReason)}</p>
    <p><strong>Appeal Reason:</strong> ${escapeHtml(appealReason)}</p>
    <p><strong>Statement:</strong></p>
    <div style="background:#f4f4f5;padding:12px;border-radius:4px;white-space:pre-wrap;font-family:monospace;font-size:13px;">${escapeHtml(additionalInfo)}</div>
    <p style="margin-top:16px;font-size:12px;color:#71717a;">Timestamp: ${escapeHtml(timestamp)}</p>
  </div>
</body></html>`;

        const resendPayload: {
          from: string;
          to: string;
          subject: string;
          html: string;
          reply_to?: string;
        } = {
          from: SENDER,
          to: recipientEmail,
          subject: emailSubject,
          html: htmlBody,
        };

        if (userEmail && userEmail.includes("@") && !userEmail.endsWith("@test.local")) {
          resendPayload.reply_to = userEmail;
        }

        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(resendPayload),
        });

        if (!resendResponse.ok) {
          const errText = await resendResponse.text().catch(() => "");
          console.warn("[Appeal Email] Resend delivery notice (appeal preserved in DB):", errText);
        }
      } catch (emailErr) {
        console.warn("[Appeal Email] Email delivery error (appeal preserved in DB):", emailErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Your appeal has been received and will be reviewed by the InsidCode team.",
        appealId: newAppeal._id.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Appeal] Submission error:", error);
    return NextResponse.json(
      { error: "Internal server error processing appeal." },
      { status: 500 }
    );
  }
}
