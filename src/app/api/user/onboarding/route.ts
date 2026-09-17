import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { validateUsername } from "@/lib/username";
import { recordAbuseAttemptAndCheckEscalation } from "@/lib/moderation/usernameModeration";
import { OnboardingSchema } from "@/lib/validations";
import { LEGAL_VERSIONS } from "@/lib/constants";
import { User } from "@/models/User";
import { Submission } from "@/models/Submission";
import { AdminAction } from "@/models/AdminAction";

export async function GET() {
  try {
    const authResult = await getAuthenticatedUser({ allowIncompleteOnboarding: true });
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const user = authResult.user;

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        image: user.image,
        onboardingCompleted: Boolean(user.onboardingCompleted),
        privacyPolicyAccepted: Boolean(user.privacyPolicyAccepted),
        termsAccepted: Boolean(user.termsAccepted),
      },
    });
  } catch (error) {
    console.error("[Onboarding API] GET error:", error);
    return NextResponse.json({ error: "Failed to load onboarding profile." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser({ allowIncompleteOnboarding: true });
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const user = authResult.user;
    const body = await req.json();

    // Server-side strict consent verification
    if (body.consent !== true) {
      return NextResponse.json(
        { error: "You must agree to the Privacy Policy and Terms of Use to continue." },
        { status: 400 }
      );
    }

    const parseResult = OnboardingSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || "Invalid onboarding submission data.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { username: rawUsername, displayName: rawDisplayName } = parseResult.data;
    const newUsername = rawUsername.trim();

    // Authoritative server-side username moderation check
    const moderation = validateUsername(newUsername);
    if (!moderation.allowed) {
      const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || undefined;
      const escalation = await recordAbuseAttemptAndCheckEscalation({
        userId: user._id.toString(),
        username: newUsername,
        ip: clientIp,
      });

      if (escalation.escalated) {
        return NextResponse.json(
          {
            error: "Username not allowed",
            message: "This username violates the InsidCode Terms of Use or Username Policy. Your account has been suspended due to repeated policy violations.",
            suspended: true,
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          error: "Username not allowed",
          message: "This username violates the InsidCode Terms of Use or Username Policy. Please choose another username.",
        },
        { status: 400 }
      );
    }

    const normalizedNew = newUsername.toLowerCase();
    const currentNormalized = (user.usernameNormalized || user.username).toLowerCase();

    // Check if another user owns this username
    if (normalizedNew !== currentNormalized) {
      const existing = await User.findOne({
        usernameNormalized: normalizedNew,
        _id: { $ne: user._id },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Username is already taken." },
          { status: 409 }
        );
      }
    }

    const usernameChanged = newUsername !== user.username;

    // Apply updates
    user.username = newUsername;
    user.usernameNormalized = normalizedNew;
    if (rawDisplayName && rawDisplayName.trim()) {
      user.displayName = rawDisplayName.trim();
    }

    // Apply legal consent and mark onboarding complete
    user.privacyPolicyAccepted = true;
    user.termsAccepted = true;
    user.privacyPolicyVersion = LEGAL_VERSIONS.PRIVACY_POLICY;
    user.termsVersion = LEGAL_VERSIONS.TERMS_OF_USE;
    user.acceptedAt = new Date();
    user.onboardingCompleted = true;

    await user.save();

    // Cascade username change if applicable
    if (usernameChanged) {
      try {
        await Submission.updateMany(
          { userId: user._id.toString() },
          { $set: { username: user.username } }
        );

        if (user.role === "admin") {
          await AdminAction.updateMany(
            { adminId: user._id.toString() },
            { $set: { adminUsername: user.username } }
          );
        }
      } catch (cascadeError) {
        console.error("[Onboarding API] Cascade update warning:", cascadeError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Onboarding completed successfully.",
      user: {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName,
        onboardingCompleted: true,
      },
    });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: number }).code === 11000) {
      return NextResponse.json({ error: "Username is already taken." }, { status: 409 });
    }
    console.error("[Onboarding API] POST error:", error);
    return NextResponse.json({ error: "Failed to complete onboarding." }, { status: 500 });
  }
}
