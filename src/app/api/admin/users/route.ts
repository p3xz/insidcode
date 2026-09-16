import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdminUser } from "@/lib/auth";
import { requireAdminMutationUser } from "@/lib/security";
import { User } from "@/models/User";
import { AdminAction } from "@/models/AdminAction";
import { AdminUserUpdateSchema } from "@/lib/validations";
import { LIMITS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const adminCheck = await requireAdminUser();
    if (!adminCheck.admin) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter"); // "banned", "admin", "all"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};

    if (filter === "banned") {
      query.isBanned = true;
    } else if (filter === "admin") {
      query.role = "admin";
    }

    if (search.trim()) {
      const sanitized = search.trim().slice(0, LIMITS.SEARCH_MAX);
      const regex = new RegExp(sanitized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ username: regex }, { displayName: regex }, { email: regex }];
    }

    const totalCount = await User.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    const users = await User.find(query)
      .select("username displayName email image provider role xp currentStreak longestStreak solvedProblems isBanned banReason bannedAt bannedUntil leaderboardVisible createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      users: users.map((u) => ({
        id: u._id.toString(),
        username: u.username,
        displayName: u.displayName,
        email: u.email,
        image: u.image,
        provider: u.provider,
        role: u.role,
        xp: u.xp,
        currentStreak: u.currentStreak,
        longestStreak: u.longestStreak,
        solvedCount: u.solvedProblems?.length || 0,
        isBanned: u.isBanned,
        banReason: u.banReason,
        bannedAt: u.bannedAt,
        bannedUntil: u.bannedUntil,
        leaderboardVisible: u.leaderboardVisible,
        createdAt: u.createdAt,
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Admin get users error:", error);
    return NextResponse.json({ error: "Failed to load users list." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminCheck = await requireAdminMutationUser(req, "USER_MODERATION_MUTATION");
    if (!adminCheck.admin) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const currentAdmin = adminCheck.admin;
    const body = await req.json();

    const parseResult = AdminUserUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || "Invalid user update parameters";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { userId, isBanned, banReason, bannedUntil, leaderboardVisible, xpChange, xpReason, role } =
      parseResult.data;

    await connectToDatabase();
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found." }, { status: 404 });
    }

    // Protection: Prevent admin from removing their own admin status if they are the only admin
    if (role && role === "user" && targetUser._id.toString() === currentAdmin._id.toString()) {
      const otherAdmins = await User.countDocuments({
        role: "admin",
        _id: { $ne: currentAdmin._id },
        isBanned: false,
      });

      if (otherAdmins === 0) {
        return NextResponse.json(
          { error: "Cannot revoke admin role from the sole administrator." },
          { status: 400 }
        );
      }
    }

    // Ban / Unban modification
    if (typeof isBanned === "boolean") {
      const prevBanned = targetUser.isBanned;
      targetUser.isBanned = isBanned;
      targetUser.banReason = isBanned ? banReason || "Administrative suspension" : undefined;
      targetUser.bannedAt = isBanned ? new Date() : undefined;
      targetUser.bannedUntil = isBanned && bannedUntil ? new Date(bannedUntil) : undefined;

      await AdminAction.create({
        adminId: currentAdmin._id.toString(),
        adminUsername: currentAdmin.username,
        action: isBanned ? "USER_BAN" : "USER_UNBAN",
        targetUserId: targetUser._id.toString(),
        previousValue: `isBanned: ${prevBanned}`,
        newValue: `isBanned: ${isBanned}, reason: ${targetUser.banReason || "None"}`,
        reason: banReason || (isBanned ? "Admin ban" : "Admin unban"),
      });
    }

    // Role modification
    if (role && role !== targetUser.role) {
      const prevRole = targetUser.role;
      targetUser.role = role;

      await AdminAction.create({
        adminId: currentAdmin._id.toString(),
        adminUsername: currentAdmin.username,
        action: "ROLE_CHANGE",
        targetUserId: targetUser._id.toString(),
        previousValue: `role: ${prevRole}`,
        newValue: `role: ${role}`,
        reason: `Role changed from ${prevRole} to ${role}`,
      });
    }

    // Leaderboard visibility toggle
    if (typeof leaderboardVisible === "boolean") {
      const prevVis = targetUser.leaderboardVisible;
      targetUser.leaderboardVisible = leaderboardVisible;

      await AdminAction.create({
        adminId: currentAdmin._id.toString(),
        adminUsername: currentAdmin.username,
        action: "LEADERBOARD_VISIBILITY_CHANGE",
        targetUserId: targetUser._id.toString(),
        previousValue: `visible: ${prevVis}`,
        newValue: `visible: ${leaderboardVisible}`,
        reason: "Leaderboard visibility adjusted",
      });
    }

    // Manual XP change (requires reason)
    if (typeof xpChange === "number" && xpChange !== 0) {
      if (!xpReason || !xpReason.trim()) {
        return NextResponse.json(
          { error: "A detailed reason is mandatory for manual XP adjustments." },
          { status: 400 }
        );
      }

      const prevXp = targetUser.xp;
      const newXp = Math.max(0, prevXp + xpChange);
      targetUser.xp = newXp;

      await AdminAction.create({
        adminId: currentAdmin._id.toString(),
        adminUsername: currentAdmin.username,
        action: "XP_ADJUSTMENT",
        targetUserId: targetUser._id.toString(),
        previousValue: `xp: ${prevXp}`,
        newValue: `xp: ${newXp} (diff: ${xpChange > 0 ? `+${xpChange}` : xpChange})`,
        reason: xpReason,
      });
    }

    await targetUser.save();

    return NextResponse.json({
      success: true,
      message: "User updated successfully.",
      user: {
        id: targetUser._id.toString(),
        username: targetUser.username,
        role: targetUser.role,
        xp: targetUser.xp,
        isBanned: targetUser.isBanned,
        banReason: targetUser.banReason,
        leaderboardVisible: targetUser.leaderboardVisible,
      },
    });
  } catch (error) {
    console.error("Admin update user error:", error);
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}
