import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { validateUsername } from "@/lib/username";
import { recordAbuseAttemptAndCheckEscalation } from "@/lib/moderation/usernameModeration";
import { ProfileUpdateSchema } from "@/lib/validations";
import { User } from "@/models/User";
import { Submission } from "@/models/Submission";
import { AdminAction } from "@/models/AdminAction";

export async function GET() {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const user = authResult.user;

    return NextResponse.json({
      user: {
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        image: user.image,
        provider: user.provider,
        role: user.role,
        leaderboardVisible: user.leaderboardVisible,
        preferences: user.preferences || {
          editorFontSize: 14,
          minimap: false,
          defaultLanguage: "python",
          reducedMotion: false,
          soundEnabled: false,
        },
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json({ error: "Failed to load user settings." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const user = authResult.user;
    const body = await req.json();

    const parseResult = ProfileUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || "Invalid settings input";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { username: rawNewUsername, displayName, preferences } = parseResult.data;

    let usernameUpdated = false;

    if (rawNewUsername !== undefined) {
      const newUsername = rawNewUsername.trim();
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

      if (newUsername !== user.username) {
        if (normalizedNew !== currentNormalized) {
          const existing = await User.findOne({
            usernameNormalized: normalizedNew,
            _id: { $ne: user._id },
          });

          if (existing) {
            return NextResponse.json(
              { error: "Username is already taken" },
              { status: 409 }
            );
          }
        }

        user.username = newUsername;
        user.usernameNormalized = normalizedNew;
        usernameUpdated = true;
      }
    }

    if (displayName) {
      user.displayName = displayName.trim();
    }

    if (preferences) {
      user.preferences = {
        ...user.preferences,
        ...preferences,
      };
    }

    if (typeof body.leaderboardVisible === "boolean") {
      user.leaderboardVisible = body.leaderboardVisible;
    }

    await user.save();

    if (usernameUpdated) {
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
      } catch (cascadeErr) {
        console.error("Cascade update error:", cascadeErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully.",
      user: {
        username: user.username,
        displayName: user.displayName,
        leaderboardVisible: user.leaderboardVisible,
        preferences: user.preferences,
      },
    });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: number }).code === 11000) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
    }
    console.error("Update settings error:", error);
    return NextResponse.json({ error: "Failed to update settings." }, { status: 500 });
  }
}
