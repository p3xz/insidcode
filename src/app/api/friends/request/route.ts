import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { FriendRequest } from "@/models/FriendRequest";
import { User } from "@/models/User";
import { Notification } from "@/models/Notification";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const currentUserId = authResult.user._id.toString();

    const rateLimit = checkRateLimit(`friend_${currentUserId}`, { limit: 20, windowMs: 60000 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many friend requests. Please slow down." },
        { status: 429 }
      );
    }

    const { targetUserId, action, requestId } = await req.json();

    // 1. Send Friend Request
    if (action === "send") {
      if (!targetUserId || targetUserId === currentUserId) {
        return NextResponse.json({ error: "Invalid target user." }, { status: 400 });
      }

      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }

      const existing = await FriendRequest.findOne({
        $or: [
          { senderId: currentUserId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: currentUserId },
        ],
      });

      if (existing) {
        if (existing.status === "accepted") {
          return NextResponse.json({ error: "You are already friends." }, { status: 400 });
        }
        if (existing.status === "pending") {
          return NextResponse.json({ error: "A friend request is already pending." }, { status: 400 });
        }
        // If rejected, update to pending
        existing.status = "pending";
        existing.senderId = currentUserId;
        existing.receiverId = targetUserId;
        await existing.save();
      } else {
        await FriendRequest.create({
          senderId: currentUserId,
          receiverId: targetUserId,
          status: "pending",
        });
      }

      // Send in-app notification
      await Notification.create({
        userId: targetUserId,
        title: "New Friend Request",
        message: `${authResult.user.displayName} sent you a friend request.`,
        type: "friend_request",
        read: false,
        link: `/profile/${authResult.user.username}`,
      });

      return NextResponse.json({ success: true, message: "Friend request sent." });
    }

    // 2. Accept Friend Request
    if (action === "accept") {
      if (!requestId) {
        return NextResponse.json({ error: "Request ID is required." }, { status: 400 });
      }

      const friendReq = await FriendRequest.findOne({
        _id: requestId,
        receiverId: currentUserId,
        status: "pending",
      });

      if (!friendReq) {
        return NextResponse.json({ error: "Friend request not found or already processed." }, { status: 404 });
      }

      friendReq.status = "accepted";
      await friendReq.save();

      // Notify the sender
      await Notification.create({
        userId: friendReq.senderId,
        title: "Friend Request Accepted",
        message: `${authResult.user.displayName} accepted your friend request.`,
        type: "friend_request",
        read: false,
        link: `/profile/${authResult.user.username}`,
      });

      return NextResponse.json({ success: true, message: "Friend request accepted." });
    }

    // 3. Reject Friend Request
    if (action === "reject") {
      if (!requestId) {
        return NextResponse.json({ error: "Request ID is required." }, { status: 400 });
      }

      const friendReq = await FriendRequest.findOne({
        _id: requestId,
        receiverId: currentUserId,
        status: "pending",
      });

      if (!friendReq) {
        return NextResponse.json({ error: "Friend request not found." }, { status: 404 });
      }

      friendReq.status = "rejected";
      await friendReq.save();

      return NextResponse.json({ success: true, message: "Friend request rejected." });
    }

    // 4. Remove Friend
    if (action === "remove") {
      if (!targetUserId) {
        return NextResponse.json({ error: "Target user ID is required." }, { status: 400 });
      }

      await FriendRequest.deleteOne({
        $or: [
          { senderId: currentUserId, receiverId: targetUserId, status: "accepted" },
          { senderId: targetUserId, receiverId: currentUserId, status: "accepted" },
        ],
      });

      return NextResponse.json({ success: true, message: "Friend removed." });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("Friend request action error:", error);
    return NextResponse.json({ error: "Failed to process friend request." }, { status: 500 });
  }
}
