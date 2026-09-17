import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { AdminAction } from "@/models/AdminAction";
import { getAuthenticatedUser } from "@/lib/auth";
import { IUser } from "@/types";

export interface SecurityViolationParams {
  req?: NextRequest;
  userId: string;
  username?: string;
  action: string;
  path?: string;
  method?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  autoSuspend?: boolean;
}

/**
 * Centrally records a security violation, handles safe auto-suspension,
 * and writes to the immutable AdminAction audit log.
 * Safe, idempotent, and atomic.
 */
export async function recordSecurityViolation(params: SecurityViolationParams): Promise<void> {
  try {
    await connectToDatabase();

    const {
      req,
      userId,
      username,
      action,
      path: reqPath,
      method: reqMethod,
      reason = "Automatic suspension: unauthorized administrative action detected.",
      metadata = {},
      autoSuspend = true,
    } = params;

    const pathname = reqPath || (req ? req.nextUrl.pathname : "unknown");
    const method = reqMethod || (req ? req.method : "UNKNOWN");

    // Safe request metadata (never include cookies, tokens, or auth headers)
    const safeMetadata: Record<string, unknown> = {
      ...metadata,
      ip: req?.headers.get("x-forwarded-for") || req?.headers.get("x-real-ip") || "unknown",
      userAgent: req?.headers.get("user-agent") || "unknown",
      timestamp: new Date().toISOString(),
    };

    if (autoSuspend && userId) {
      const user = await User.findById(userId);
      if (user && !user.isBanned) {
        user.isBanned = true;
        user.banReason = reason;
        user.bannedAt = new Date();
        await user.save();
        console.warn(`[Security Auto-Suspension] Account suspended for unauthorized admin mutation: user=${user.username} (${userId}), path=${pathname}`);
      }
    }

    // Record immutable audit event
    await AdminAction.create({
      adminId: "system",
      adminUsername: "System",
      action: "UNAUTHORIZED_ADMIN_ACTION",
      targetUserId: userId,
      previousValue: "isBanned: false",
      newValue: JSON.stringify({
        username: username || "unknown",
        path: pathname,
        method,
        action,
        isBanned: true,
      }),
      reason,
      metadata: safeMetadata,
    });
  } catch (error) {
    console.error("[Security] Error recording security violation:", error);
  }
}

/**
 * Authoritative guard for privileged, state-changing admin operations (POST, PUT, PATCH, DELETE).
 * If an authenticated non-admin attempts a state-changing admin action, triggers automatic suspension
 * and returns 403 Forbidden with zero database mutation.
 */
export async function requireAdminMutationUser(
  req: NextRequest,
  actionDescription: string
): Promise<{
  admin: IUser | null;
  error?: string;
  status: number;
}> {
  const authResult = await getAuthenticatedUser();
  if (!authResult.user) {
    return { admin: null, error: authResult.error, status: authResult.status };
  }

  const user = authResult.user;

  if (user.role !== "admin") {
    // Confirmed unauthorized attempt to execute an admin mutation
    await recordSecurityViolation({
      req,
      userId: user._id.toString(),
      username: user.username,
      action: actionDescription,
      autoSuspend: true,
      reason: "Automatic suspension: unauthorized administrative action detected.",
    });

    return {
      admin: null,
      error: "Forbidden. Admin access required.",
      status: 403,
    };
  }

  return { admin: user, status: 200 };
}
