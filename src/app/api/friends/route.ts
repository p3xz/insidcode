import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { FriendRequest } from "@/models/FriendRequest";
import { User } from "@/models/User";

export async function GET() {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const currentUserId = authResult.user._id.toString();

    // Accepted friendships
    const friendships = await FriendRequest.find({
      $or: [{ senderId: currentUserId }, { receiverId: currentUserId }],
      status: "accepted",
    }).lean();

    const friendIds = friendships.map((f) =>
      f.senderId === currentUserId ? f.receiverId : f.senderId
    );

    const friends = await User.find({ _id: { $in: friendIds } })
      .select("username displayName image xp solvedProblems currentStreak role")
      .lean();

    // Incoming pending requests
    const incomingRequests = await FriendRequest.find({
      receiverId: currentUserId,
      status: "pending",
    }).lean();

    const incomingSenderIds = incomingRequests.map((r) => r.senderId);
    const incomingSenders = await User.find({ _id: { $in: incomingSenderIds } })
      .select("username displayName image xp")
      .lean();

    const incomingWithDetails = incomingRequests.map((req) => ({
      requestId: req._id.toString(),
      sender: incomingSenders.find((s) => s._id.toString() === req.senderId),
      createdAt: req.createdAt,
    }));

    // Outgoing pending requests
    const outgoingRequests = await FriendRequest.find({
      senderId: currentUserId,
      status: "pending",
    }).lean();

    const outgoingReceiverIds = outgoingRequests.map((r) => r.receiverId);
    const outgoingReceivers = await User.find({ _id: { $in: outgoingReceiverIds } })
      .select("username displayName image")
      .lean();

    const outgoingWithDetails = outgoingRequests.map((req) => ({
      requestId: req._id.toString(),
      receiver: outgoingReceivers.find((r) => r._id.toString() === req.receiverId),
      createdAt: req.createdAt,
    }));

    return NextResponse.json({
      friends: friends.map((f) => ({
        id: f._id.toString(),
        username: f.username,
        displayName: f.displayName,
        image: f.image,
        xp: f.xp,
        solvedCount: f.solvedProblems?.length || 0,
        currentStreak: f.currentStreak || 0,
        role: f.role,
      })),
      incomingRequests: incomingWithDetails,
      outgoingRequests: outgoingWithDetails,
    });
  } catch (error) {
    console.error("Friends route error:", error);
    return NextResponse.json({ error: "Failed to fetch friends." }, { status: 500 });
  }
}
