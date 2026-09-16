import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { z } from "zod";

const FeedbackSchema = z.object({
  feedbackType: z.enum([
    "Bug Report",
    "Feature Request",
    "UI / Design",
    "Compiler / Execution",
    "Other",
  ]),
  subject: z
    .string()
    .min(3, "Subject must be at least 3 characters")
    .max(100, "Subject cannot exceed 100 characters"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message cannot exceed 2000 characters"),
  contactEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
});




export async function POST(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    const user = authResult.user;
    const identifier =
      user ? user._id.toString() : req.headers.get("x-forwarded-for") || "anonymous_ip";

    // Rate limiting: max 5 feedback submissions per 10 minutes
    const rateLimit = checkRateLimit(`feedback_${identifier}`, {
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Too many feedback submissions. Please wait ${rateLimit.reset} seconds before trying again.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parseResult = FeedbackSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || "Invalid feedback payload.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { feedbackType, subject, message, contactEmail } = parseResult.data;
    const emailSubject = `[InsidCode Feedback] ${feedbackType}: ${subject}`;
    const username = user?.username || "Anonymous Visitor";
    const displayEmail = contactEmail || "Not supplied";
    const timestamp = new Date().toUTCString();

    // RESEND_API_KEY is server-side only (never exposed to client, never logged)
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.error("[Feedback] RESEND_API_KEY is not configured. Email cannot be sent.");
      return NextResponse.json(
        { error: "Feedback service is temporarily unavailable. Please try again later." },
        { status: 500 }
      );
    }

    // FEEDBACK_TO_EMAIL controls the recipient address
    // Set to your verified address during testing, then switch to the production
    // destination once a real sending domain is verified in Resend.
    const recipientEmail = process.env.FEEDBACK_TO_EMAIL;

    if (!recipientEmail) {
      console.error("[Feedback] FEEDBACK_TO_EMAIL is not configured. Cannot determine recipient.");
      return NextResponse.json(
        { error: "Feedback service is temporarily unavailable. Please try again later." },
        { status: 500 }
      );
    }

    const SENDER = "InsidCode Feedback <onboarding@resend.dev>";

    const htmlBody = buildHtmlEmail({
      feedbackType,
      subject,
      username,
      displayEmail,
      message,
      timestamp,
    });

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

    if (contactEmail && contactEmail.trim().length > 0) {
      resendPayload.reply_to = contactEmail.trim();
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
      console.error("[Feedback] Resend rejected the request:", {
        provider: "resend",
        status: resendResponse.status,
        from: SENDER,
        to: recipientEmail,
        resendError: errText,
      });
      return NextResponse.json(
        { error: "Unable to send feedback. Please try again." },
        { status: 502 }
      );
    }

    const resendData = await resendResponse.json().catch(() => ({})) as { id?: string };
    console.log("[Feedback] Email dispatched successfully:", {
      provider: "resend",
      from: SENDER,
      to: recipientEmail,
      emailId: resendData.id ?? "unknown",
    });

    return NextResponse.json({ success: true, message: "Feedback sent successfully." });

  } catch (error) {
    console.error("Feedback route error:", error);
    return NextResponse.json(
      { error: "Unable to send feedback. Please try again." },
      { status: 500 }
    );
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

interface EmailParams {
  feedbackType: string;
  subject: string;
  username: string;
  displayEmail: string;
  message: string;
  timestamp: string;
}

function buildHtmlEmail(p: EmailParams): string {
  const cell = (label: string, value: string, mono = false, noBorder = false) =>
    `<tr><td style="padding:20px 0;${noBorder ? "" : "border-bottom:1px solid #e4e4e7;"}">
      <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.08em;color:#71717a;text-transform:uppercase;">${label}</p>
      <p style="margin:0;font-size:${mono ? "14" : "15"}px;${mono ? "font-family:monospace;" : ""}color:#09090b;">${value}</p>
    </td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>InsidCode Feedback</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:6px;overflow:hidden;border:1px solid #e4e4e7;">
        <tr>
          <td style="background:#09090b;padding:24px 32px;">
            <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.08em;color:#a1a1aa;text-transform:uppercase;">InsidCode</p>
            <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#ffffff;">Feedback</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${cell("Feedback Type", escapeHtml(p.feedbackType))}
              ${cell("Subject", escapeHtml(p.subject))}
              ${cell("Username", escapeHtml(p.username), true)}
              ${cell("Contact Email", escapeHtml(p.displayEmail), true)}
              <tr><td style="padding:20px 0;border-bottom:1px solid #e4e4e7;">
                <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.08em;color:#71717a;text-transform:uppercase;">Message</p>
                <p style="margin:0;font-size:13px;line-height:1.7;color:#18181b;white-space:pre-wrap;">${escapeHtml(p.message)}</p>
              </td></tr>
              ${cell("Timestamp", escapeHtml(p.timestamp), true, true)}
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f4f4f5;padding:16px 32px;border-top:1px solid #e4e4e7;">
            <p style="margin:0;font-size:11px;color:#a1a1aa;">Submitted via the InsidCode Feedback form.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
