import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { AdminAction } from "@/models/AdminAction";
import { LEGAL_VERSIONS } from "@/lib/constants";
import { z } from "zod";

const RestoreConsentSchema = z.object({
  consent: z.literal(true, {
    errorMap: () => ({ message: "You must explicitly agree to the Privacy Policy and Terms of Use." }),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser({ allowIncompleteOnboarding: true });
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const authUser = authResult.user;

    if (authUser.isBanned) {
      return NextResponse.json(
        { error: "Account is suspended. Cannot accept terms.", isBanned: true },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parseResult = RestoreConsentSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || "Valid legal consent required.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findById(authUser._id);
    if (!user) {
      return NextResponse.json({ error: "User record not found." }, { status: 404 });
    }

    const now = new Date();

    // Atomically record legal consent and clear restoration requirement
    user.privacyPolicyAccepted = true;
    user.termsAccepted = true;
    user.privacyPolicyVersion = LEGAL_VERSIONS.PRIVACY_POLICY;
    user.termsVersion = LEGAL_VERSIONS.TERMS_OF_USE;
    user.acceptedAt = now;
    user.requiresRestorationConsent = false;
    user.onboardingCompleted = true;
    await user.save();

    // Record immutable audit action
    await AdminAction.create({
      adminId: user._id.toString(),
      adminUsername: user.username,
      action: "USER_RESTORE_CONSENT_ACKNOWLEDGED",
      targetUserId: user._id.toString(),
      targetUsername: user.username,
      newValue: JSON.stringify({
        privacyPolicyAccepted: true,
        termsAccepted: true,
        privacyPolicyVersion: LEGAL_VERSIONS.PRIVACY_POLICY,
        termsVersion: LEGAL_VERSIONS.TERMS_OF_USE,
        acceptedAt: now.toISOString(),
      }),
      reason: "User acknowledged Terms of Use and Privacy Policy following suspension appeal restoration.",
    });

    return NextResponse.json({
      success: true,
      message: "Legal consent successfully recorded. Account access has been fully restored.",
    });
  } catch (error) {
    console.error("[Restore Consent API] Error:", error);
    return NextResponse.json({ error: "Failed to record legal consent." }, { status: 500 });
  }
}
