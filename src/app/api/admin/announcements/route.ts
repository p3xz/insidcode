import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdminUser } from "@/lib/auth";
import { SystemConfig } from "@/models/SystemConfig";
import { Notification } from "@/models/Notification";
import { User } from "@/models/User";
import { AdminAction } from "@/models/AdminAction";
import { AdminAnnouncementSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const adminCheck = await requireAdminUser();
    if (!adminCheck.admin) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const admin = adminCheck.admin;
    const body = await req.json();

    const parseResult = AdminAnnouncementSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || "Invalid announcement schema";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { active, title, message } = parseResult.data;

    await connectToDatabase();
    let config = await SystemConfig.findOne({ key: "main" });

    if (!config) {
      config = await SystemConfig.create({
        key: "main",
        announcement: {
          active,
          title,
          message,
          updatedAt: new Date(),
        },
      });
    } else {
      config.announcement = {
        active,
        title,
        message,
        updatedAt: new Date(),
      };
      await config.save();
    }

    // If active and broadcast is requested, create notifications for all non-banned users
    if (active && body.broadcastInApp) {
      const users = await User.find({ isBanned: false }).select("_id").lean();
      const notifications = users.map((u) => ({
        userId: u._id.toString(),
        title: `Announcement: ${title}`,
        message,
        type: "announcement" as const,
        read: false,
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    await AdminAction.create({
      adminId: admin._id.toString(),
      adminUsername: admin.username,
      action: "ANNOUNCEMENT_POST",
      newValue: JSON.stringify({ active, title, message }),
      reason: "Admin posted global announcement",
    });

    return NextResponse.json({
      success: true,
      message: "Announcement updated successfully.",
      announcement: config.announcement,
    });
  } catch (error) {
    console.error("Admin announcement error:", error);
    return NextResponse.json({ error: "Failed to update announcement." }, { status: 500 });
  }
}
