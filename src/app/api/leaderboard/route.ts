import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { FriendRequest } from "@/models/FriendRequest";
import { SystemConfig } from "@/models/SystemConfig";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab") || "global"; // "global" or "friends"
    const session = await auth();
    const currentUserId = session?.user?.id;

    const config = await SystemConfig.findOne({ key: "main" }).lean();
    const isFrozen = config?.leaderboardFrozen || false;

    // Base query: visible, not banned
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userQuery: any = {
      leaderboardVisible: true,
      isBanned: false,
    };

    if (tab === "friends") {
      if (!currentUserId) {
        return NextResponse.json(
          { error: "Authentication required to view friends leaderboard." },
          { status: 401 }
        );
      }

      // Find accepted friends
      const friendships = await FriendRequest.find({
        $or: [{ senderId: currentUserId }, { receiverId: currentUserId }],
        status: "accepted",
      }).lean();

      const friendUserIds = friendships.map((f) =>
        f.senderId === currentUserId ? f.receiverId : f.senderId
      );

      // Include self in friends leaderboard
      friendUserIds.push(currentUserId);
      userQuery._id = { $in: friendUserIds };
    }

    const rawUsers = await User.find(userQuery)
      .select("username displayName image xp solvedProblems currentStreak role")
      .sort({ xp: -1, solvedProblems: -1, currentStreak: -1 })
      .limit(100)
      .lean();

    let currentUserRank: number | null = null;

    const rankedUsers = rawUsers.map((u, index) => {
      const rank = index + 1;
      const isCurrentUser = currentUserId ? u._id.toString() === currentUserId : false;
      if (isCurrentUser) {
        currentUserRank = rank;
      }

      return {
        rank,
        id: u._id.toString(),
        username: u.username,
        displayName: u.displayName,
        image: u.image,
        xp: u.xp,
        solvedCount: u.solvedProblems?.length || 0,
        currentStreak: u.currentStreak || 0,
        role: u.role,
        isCurrentUser,
      };
    });

    return NextResponse.json({
      leaderboard: rankedUsers,
      isFrozen,
      frozenAt: config?.frozenAt,
      currentUserRank,
      tab,
    });
  } catch (error) {
    console.error("Leaderboard route error:", error);
    return NextResponse.json({ error: "Failed to load leaderboard." }, { status: 500 });
  }
}
