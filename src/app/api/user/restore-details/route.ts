import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Appeal } from "@/models/Appeal";
import { formatIST } from "@/lib/dateUtils";

export async function GET() {
  try {
    const authResult = await getAuthenticatedUser({ allowIncompleteOnboarding: true });
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const user = authResult.user;

    if (user.isBanned) {
      return NextResponse.json(
        { error: "Account is currently suspended.", isBanned: true },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const latestAppeal = await Appeal.findOne({ userId: user._id.toString() })
      .sort({ createdAt: -1 })
      .lean();

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
