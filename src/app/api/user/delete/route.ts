import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { User } from "@/models/User";
import { Submission } from "@/models/Submission";
import { FriendRequest } from "@/models/FriendRequest";
import { Notification } from "@/models/Notification";

export async function POST(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const user = authResult.user;
    const body = await req.json();

    if (body.confirmation !== "DELETE") {
      return NextResponse.json(
        { error: 'Confirmation failed. You must explicitly type "DELETE" to permanently remove your account.' },
        { status: 400 }
      );
    }

    // Protection: do not allow the sole admin to delete their account if no other admin exists
    if (user.role === "admin") {
      const otherAdminsCount = await User.countDocuments({
        role: "admin",
        _id: { $ne: user._id },
        isBanned: false,
      });

      if (otherAdminsCount === 0) {
        return NextResponse.json(
          {
            error:
              "Cannot delete the sole administrator account. Transfer admin role to another user first to prevent an ownerless platform.",
          },
          { status: 400 }
        );
      }
    }

    const userId = user._id.toString();

    // Remove user friendships
    await FriendRequest.deleteMany({
      $or: [{ senderId: userId }, { receiverId: userId }],
    });

    // Remove user notifications
    await Notification.deleteMany({ userId });

    // Anonymize/delete submissions
    await Submission.deleteMany({ userId });

    // Delete user account
    await User.findByIdAndDelete(userId);

    return NextResponse.json({
      success: true,
      message: "Account and associated data permanently deleted.",
    });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json({ error: "Failed to delete account." }, { status: 500 });
  }
}
