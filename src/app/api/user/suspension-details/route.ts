import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { AdminAction } from "@/models/AdminAction";
import { Appeal } from "@/models/Appeal";
import { ISuspensionDetails } from "@/types";
import { formatIST } from "@/lib/dateUtils";

function sanitizeReason(rawReason?: string): string {
  if (!rawReason || typeof rawReason !== "string") {
    return "Account restricted due to security policy violations.";
  }

  // Remove IP addresses, internal paths, rule names, and stack traces
  let sanitized = rawReason
    .replace(/\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g, "[REDACTED]")
    .replace(/\bRULE_[A-Z0-9_]+\b/g, "Unauthorized activity")
    .replace(/\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_\-\.\/]+/g, "[REDACTED]")
    .trim();

  if (sanitized.length > 200) {
    sanitized = sanitized.slice(0, 200) + "...";
  }

  return sanitized || "Account restricted due to security policy violations.";
}

function getSafeTrigger(actionName?: string, reason?: string): string {
  const text = `${actionName || ""} ${reason || ""}`.toLowerCase();

  if (text.includes("unauthorized") || text.includes("admin") || text.includes("mutation")) {
    return "Multiple unauthorized access attempts detected.";
  }
  if (text.includes("rate") || text.includes("spam") || text.includes("flood")) {
    return "Automated request rate anomaly detected.";
  }
  if (text.includes("tamper") || text.includes("cheat") || text.includes("integrity")) {
    return "Platform integrity invariant violated.";
  }
  if (text.includes("moderation") || text.includes("manual") || text.includes("admin ban")) {
    return "Administrative moderation review action.";
  }

  return "Multiple unauthorized access attempts detected.";
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
    const user = await User.findById(session.user.id)
      .select("username email isBanned banReason bannedAt updatedAt")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User record not found." }, { status: 404 });
    }

    // Query active or latest appeal
    const latestAppeal = await Appeal.findOne({ userId: user._id.toString() })
      .sort({ createdAt: -1 })
      .lean();

    let appealStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED" = "NONE";
    let appealLabel = "Not submitted";

    if (latestAppeal) {
      appealStatus = latestAppeal.status as "PENDING" | "APPROVED" | "REJECTED";
      if (appealStatus === "PENDING") {
        appealLabel = "Pending review";
      } else if (appealStatus === "APPROVED") {
        appealLabel = "Approved";
      } else if (appealStatus === "REJECTED") {
        appealLabel = "Rejected";
      }
    }

    // Locate the specific suspension / security audit events for this user
    const auditActions = await AdminAction.find({
      targetUserId: user._id.toString(),
      action: {
        $in: [
          "USER_BAN",
          "UNAUTHORIZED_ADMIN_ACTION",
          "SECURITY_SUSPENSION",
          "SUSPENSION",
        ],
      },
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    const primaryAction = auditActions[0];

    // Determine Source and Admin attribution
    let source = "Automated";
    let admin = "System";

    if (primaryAction) {
      if (
        primaryAction.action === "USER_BAN" &&
        primaryAction.adminUsername &&
        primaryAction.adminUsername.toLowerCase() !== "system" &&
        primaryAction.adminId !== "system"
      ) {
        source = "Admin";
        admin = `@${primaryAction.adminUsername}`;
      } else {
        source = "Automated";
        admin = "System";
      }
    } else if (user.banReason && user.banReason.toLowerCase().includes("admin")) {
      source = "Admin";
      admin = "Administrator";
    }

    // Determine timestamp
    const detectedDate = primaryAction?.createdAt
      ? new Date(primaryAction.createdAt)
      : user.bannedAt
      ? new Date(user.bannedAt)
      : user.updatedAt
      ? new Date(user.updatedAt)
      : new Date();

    const detectedAt = detectedDate.toISOString();
    const formattedDate = formatIST(detectedDate);

    // Determine safe user-facing reason and trigger
    const rawReason = primaryAction?.reason || user.banReason || "Unauthorized access attempts";
    const reason = sanitizeReason(rawReason);
    const trigger = getSafeTrigger(primaryAction?.action, rawReason);

    // Build safe related event reference tokens (SEC-XXXXXX)
    const relatedEvents: string[] = [];
    if (primaryAction?._id) {
      relatedEvents.push(`SEC-${primaryAction._id.toString().slice(-6).toUpperCase()}`);
    }
    if (auditActions.length > 1 && auditActions[1]?._id) {
      relatedEvents.push(`SEC-${auditActions[1]._id.toString().slice(-6).toUpperCase()}`);
    }
    if (relatedEvents.length === 0) {
      relatedEvents.push(`SEC-${user._id.toString().slice(-6).toUpperCase()}`);
    }

    const previousAccountState = "ACTIVE";
    const newAccountState =
      appealStatus === "APPROVED" && !user.isBanned ? "RESTORED" : "SUSPENDED";

    const responseData: ISuspensionDetails = {
      user: `@${user.username}`,
      action: "SUSPENDED",
      source,
      reason,
      detectedAt,
      formattedDate,
      previousAccountState,
      newAccountState,
      trigger,
      evidence: "Available to the InsidCode administrative team.",
      relatedEvents,
      admin,
      appeal: appealLabel,
      appealStatus,
    };

    return NextResponse.json({
      isBanned: Boolean(user.isBanned),
      details: responseData,
    });
  } catch (error) {
    console.error("[Suspension Details] Error fetching suspension event:", error);
    return NextResponse.json(
      { error: "Failed to load suspension event details." },
      { status: 500 }
    );
  }
}
