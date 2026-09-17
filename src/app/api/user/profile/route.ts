import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { validateUsername } from "@/lib/username";
import { recordAbuseAttemptAndCheckEscalation } from "@/lib/moderation/usernameModeration";
import { UsernameSchema, DisplayNameSchema } from "@/lib/validations";
import { User } from "@/models/User";
import { Submission } from "@/models/Submission";
import { AdminAction } from "@/models/AdminAction";
import { z } from "zod";

const ProfilePatchSchema = z.object({
  username: UsernameSchema.optional(),
  displayName: DisplayNameSchema.optional(),
});

export async function GET() {
  try {
    const authResult = await getAuthenticatedUser();
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
        role: user.role,
        xp: user.xp,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        solvedCount: user.solvedProblems?.length || 0,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("[Profile API] GET error:", error);
    return NextResponse.json({ error: "Failed to load user profile." }, { status: 500 });
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

    const parseResult = ProfilePatchSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || "Invalid profile data";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { username: rawNewUsername, displayName } = parseResult.data;

    let usernameUpdated = false;

    if (typeof rawNewUsername === "string") {
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

      // If the username is different (or different casing)
      if (newUsername !== user.username) {
        // If changed to a different normalized name, check for collision
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

    if (typeof displayName === "string" && displayName.trim()) {
      user.displayName = displayName.trim();
    }

    await user.save();

    // If username was updated, cascade to past submissions and admin actions
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
      } catch (cascadeError) {
        console.error("[Profile API] Cascade update warning:", cascadeError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      username: user.username,
      displayName: user.displayName,
      user: {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: unknown) {
    // Handle duplicate key error from MongoDB if race condition occurs
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: number }).code === 11000) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
    }
    console.error("[Profile API] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
