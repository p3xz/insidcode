import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
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

    // Rate limiting: max 2 appeals per 15 minutes per suspended account
    const rateLimitKey = `appeal_${dbUser._id.toString()}`;
    const rateLimit = checkRateLimit(rateLimitKey, {
      limit: 2,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: `Too many appeal submissions. Please wait ${rateLimit.reset} seconds before submitting again.`,
        },
        { status: 429 }
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
    const banReason = dbUser.banReason || "Not recorded";
    const timestamp = new Date().toUTCString();

    const resendApiKey = process.env.RESEND_API_KEY;
    const recipientEmail = process.env.FEEDBACK_TO_EMAIL;

    if (!resendApiKey || !recipientEmail) {
      console.error("[Appeal] Resend configuration missing (RESEND_API_KEY or FEEDBACK_TO_EMAIL).");
      return NextResponse.json(
        { error: "Appeal service is temporarily unavailable. Please try again later." },
        { status: 500 }
      );
    }

    const emailSubject = `[InsidCode Appeal] Account Suspension Appeal - @${username}`;
    const SENDER = "InsidCode Appeal <onboarding@resend.dev>";

    const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Account Suspension Appeal</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:6px;overflow:hidden;border:1px solid #e4e4e7;">
        <tr>
          <td style="background:#09090b;padding:24px 32px;">
            <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#ef4444;text-transform:uppercase;">URGENT • REVIEW REQUIRED</p>
            <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#ffffff;">Account Suspension Appeal</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:16px 0;border-bottom:1px solid #e4e4e7;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.08em;color:#71717a;text-transform:uppercase;">Account Username</p>
                  <p style="margin:0;font-size:15px;font-family:monospace;font-weight:600;color:#09090b;">@${escapeHtml(username)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 0;border-bottom:1px solid #e4e4e7;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.08em;color:#71717a;text-transform:uppercase;">Account Email</p>
                  <p style="margin:0;font-size:14px;font-family:monospace;color:#09090b;">${escapeHtml(userEmail)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 0;border-bottom:1px solid #e4e4e7;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.08em;color:#71717a;text-transform:uppercase;">Recorded Ban Reason</p>
                  <p style="margin:0;font-size:13px;color:#dc2626;">${escapeHtml(banReason)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 0;border-bottom:1px solid #e4e4e7;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.08em;color:#71717a;text-transform:uppercase;">Appeal Category / Reason</p>
                  <p style="margin:0;font-size:14px;font-weight:600;color:#09090b;">${escapeHtml(appealReason)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 0;border-bottom:1px solid #e4e4e7;">
                  <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.08em;color:#71717a;text-transform:uppercase;">User Statement & Additional Details</p>
                  <p style="margin:0;font-size:13px;line-height:1.7;color:#18181b;white-space:pre-wrap;">${escapeHtml(additionalInfo)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 0;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.08em;color:#71717a;text-transform:uppercase;">Timestamp</p>
                  <p style="margin:0;font-size:13px;font-family:monospace;color:#71717a;">${escapeHtml(timestamp)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f4f4f5;padding:16px 32px;border-top:1px solid #e4e4e7;">
            <p style="margin:0;font-size:11px;color:#a1a1aa;">Submitted securely via the InsidCode Suspended User Appeal portal.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

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
      console.error("[Appeal] Resend rejected appeal email:", {
        status: resendResponse.status,
        error: errText,
      });
      return NextResponse.json(
        { error: "Unable to deliver appeal notification. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your appeal has been received and will be reviewed by the InsidCode team.",
    });
  } catch (error) {
    console.error("[Appeal] Submission error:", error);
    return NextResponse.json(
      { error: "Internal server error processing appeal." },
      { status: 500 }
    );
  }
}
