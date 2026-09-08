import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { auth } from "@/lib/auth";
import { LIMITS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await auth();
    const currentUserId = session?.user?.id;

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim().slice(0, LIMITS.SEARCH_MAX);

    if (!query) {
      return NextResponse.json({ users: [] });
    }

    const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {
      isBanned: false,
      $or: [{ username: searchRegex }, { displayName: searchRegex }],
    };

    if (currentUserId) {
      filter._id = { $ne: currentUserId };
    }

    const users = await User.find(filter)
      .select("username displayName image xp currentStreak solvedProblems")
      .limit(10)
      .lean();

    return NextResponse.json({
      users: users.map((u) => ({
        id: u._id.toString(),
        username: u.username,
        displayName: u.displayName,
        image: u.image,
        xp: u.xp,
        solvedCount: u.solvedProblems?.length || 0,
        currentStreak: u.currentStreak || 0,
      })),
    });
  } catch (error) {
    console.error("Friend search error:", error);
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }
}
