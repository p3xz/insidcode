import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Appeal } from "@/models/Appeal";
import { formatIST } from "@/lib/dateUtils";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User record not found." }, { status: 404 });
    }

    const latestAppeal = await Appeal.findOne({ userId: user._id.toString() })
      .sort({ createdAt: -1 })
      .lean();

    // If appeal is approved, ensure user is marked as unbanned and requiring consent
    if (latestAppeal && latestAppeal.status === "APPROVED" && user.isBanned) {
      user.isBanned = false;
      user.requiresRestorationConsent = true;
      if (!user.restoredAt) {
        user.restoredAt = latestAppeal.reviewedAt ? new Date(latestAppeal.reviewedAt) : new Date();
      }
      await user.save();
    }

    if (user.isBanned && (!latestAppeal || latestAppeal.status !== "APPROVED")) {
      return NextResponse.json(
        { error: "Account is currently suspended.", isBanned: true },
        { status: 403 }
      );
    }

    const isRestored = Boolean(
      (latestAppeal && latestAppeal.status === "APPROVED") ||
      user.restoredAt ||
      user.requiresRestorationConsent
    );

    const restorationDate = user.restoredAt
      ? formatIST(user.restoredAt)
      : latestAppeal?.reviewedAt
      ? formatIST(latestAppeal.reviewedAt)
      : formatIST(user.updatedAt);

    const needsConsent = Boolean(!user.privacyPolicyAccepted || !user.termsAccepted);

    return NextResponse.json({
      isRestored,
      username: user.username,
      restorationDate,
      appealStatus: latestAppeal?.status === "APPROVED" ? "APPROVED" : isRestored ? "APPROVED" : "NONE",
      needsConsent,
      onboardingCompleted: Boolean(user.onboardingCompleted),
    });
  } catch (error) {
    console.error("[Restore Details] Error:", error);
    return NextResponse.json({ error: "Failed to fetch account restoration details." }, { status: 500 });
  }
}
