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
    const tab = searchParams.get("tab") || searchParams.get("type") || "global"; // "global", "friends", "duel"
    const session = await auth();
    const currentUserId = session?.user?.id;

    const config = await SystemConfig.findOne({ key: "main" }).lean();
    const isFrozen = config?.leaderboardFrozen || false;

    // ── Duel Leaderboard ──────────────────────────────────────────
    if (tab === "duel") {
      // Base query: visible, not banned, and at least 3 completed duels
      const rawDuelists = await User.find({
        leaderboardVisible: true,
        isBanned: false,
        duelsPlayed: { $gte: 3 },
      })
        .select("username displayName image selectedTitle duelsPlayed duelsWon duelsLost role")
        .lean();

      // Compute win rate and sort server-side:
      // 1. duelsWon DESC
      // 2. winRate DESC
      // 3. duelsPlayed DESC
      // 4. username ASC
      const sortedDuelists = rawDuelists
        .map((u) => {
          const played = u.duelsPlayed || 0;
          const won = u.duelsWon || 0;
          const lost = u.duelsLost || 0;
          const winRate = played > 0 ? Math.round((won / played) * 100) : 0;
          return {
            ...u,
            played,
            won,
            lost,
            winRate,
          };
        })
        .sort((a, b) => {
          if (b.won !== a.won) return b.won - a.won;
          if (b.winRate !== a.winRate) return b.winRate - a.winRate;
          if (b.played !== a.played) return b.played - a.played;
          return a.username.localeCompare(b.username);
        });

      let currentUserRank: number | null = null;
      let personalDuelStats = null;

      if (currentUserId) {
        const currentUserDoc = await User.findById(currentUserId)
          .select("username displayName image selectedTitle duelsPlayed duelsWon duelsLost")
          .lean();

        if (currentUserDoc) {
          const played = currentUserDoc.duelsPlayed || 0;
          const won = currentUserDoc.duelsWon || 0;
          const lost = currentUserDoc.duelsLost || 0;
          const winRate = played > 0 ? Math.round((won / played) * 100) : 0;
          personalDuelStats = {
            duelsPlayed: played,
            duelsWon: won,
            duelsLost: lost,
            winRate,
            eligible: played >= 3,
          };
        }
      }

      const rankedDuelists = sortedDuelists.slice(0, 100).map((u, index) => {
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
          selectedTitle: u.selectedTitle || null,
          duelsWon: u.won,
          duelsPlayed: u.played,
          duelsLost: u.lost,
          winRate: u.winRate,
          role: u.role,
          isCurrentUser,
        };
      });

      return NextResponse.json({
        leaderboard: rankedDuelists,
        isFrozen,
        currentUserRank,
        personalDuelStats,
        tab: "duel",
      });
    }

    // ── Standard XP Leaderboard ────────────────────────────────────
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
      .select("username displayName image selectedTitle xp solvedProblems currentStreak role")
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
        selectedTitle: u.selectedTitle || null,
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
