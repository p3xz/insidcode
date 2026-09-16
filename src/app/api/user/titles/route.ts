import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { AVAILABLE_TITLES, getUnlockedTitles, isTitleUnlocked } from "@/lib/titles";

export async function GET() {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: authResult.status || 401 }
      );
    }

    const user = authResult.user;
    await connectToDatabase();

    const unlockedSet = new Set(await getUnlockedTitles(user));

    const titles = AVAILABLE_TITLES.map((t) => ({
      ...t,
      unlocked: unlockedSet.has(t.title),
    }));

    return NextResponse.json({
      titles,
      selectedTitle: user.selectedTitle || null,
    });
  } catch (error) {
    console.error("Get titles error:", error);
    return NextResponse.json({ error: "Failed to load titles." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: authResult.status || 401 }
      );
    }


    const user = authResult.user;
    const body = await req.json();
    const title = body.title === null ? null : typeof body.title === "string" ? body.title.trim() : undefined;

    if (title === undefined) {
      return NextResponse.json({ error: "Most provide a valid title string or null to clear." }, { status: 400 });
    }

    await connectToDatabase();

    if (title === null || title === "") {
      user.selectedTitle = undefined;
      await user.save();
      return NextResponse.json({
        success: true,
        message: "Title cleared.",
        selectedTitle: null,
      });
    }

    // Server-authoritative unlock check
    const unlocked = await isTitleUnlocked(user, title);
    if (!unlocked) {
      return NextResponse.json(
        { error: "You have not unlocked this title yet." },
        { status: 400 }
      );
    }

    user.selectedTitle = title;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Title updated successfully.",
      selectedTitle: user.selectedTitle,
    });
  } catch (error) {
    console.error("Update title error:", error);
    return NextResponse.json({ error: "Failed to update title." }, { status: 500 });
  }
}
