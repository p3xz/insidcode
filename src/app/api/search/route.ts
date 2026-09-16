import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Question } from "@/models/Question";
import { User } from "@/models/User";
import { LIMITS } from "@/lib/constants";
import { checkRateLimit } from "@/lib/rateLimit";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const identifier = session?.user?.id || req.headers.get("x-forwarded-for") || "search_ip";
    const rateLimit = checkRateLimit(`search_${identifier}`, { limit: 40, windowMs: 60000 });
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim().slice(0, LIMITS.SEARCH_MAX);

    if (!query || query.length < 2) {
      return NextResponse.json({ problems: [], users: [] });
    }

    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const problems = await Question.find({
      isPublished: true,
      $or: [{ title: regex }, { problemId: regex }, { tags: regex }],
    })
      .select("problemId title slug difficulty phase")
      .limit(6)
      .lean();

    const users = await User.find({
      isBanned: false,
      $or: [{ username: regex }, { displayName: regex }],
    })
      .select("username displayName image xp")
      .limit(6)
      .lean();

    return NextResponse.json({
      problems: problems.map((p) => ({
        problemId: p.problemId,
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty,
        phase: p.phase,
      })),
      users: users.map((u) => ({
        username: u.username,
        displayName: u.displayName,
        image: u.image,
        xp: u.xp,
      })),
    });
  } catch (error) {
    console.error("Global search error:", error);
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }
}
