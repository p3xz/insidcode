import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { UsernameSchema, DisplayNameSchema } from "@/lib/validations";
import { isReservedUsername } from "@/lib/username";
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

    if (rawNewUsername !== undefined) {
      const newUsername = rawNewUsername.trim();

      // Check if username meets format rules
      if (!/^[A-Za-z0-9_]{3,20}$/.test(newUsername)) {
        return NextResponse.json(
          { error: "Username must be 3-20 characters and contain only letters, numbers, and underscores." },
          { status: 400 }
        );
      }

      // Check if username is reserved
      if (isReservedUsername(newUsername)) {
        return NextResponse.json(
          { error: "This username is reserved and cannot be used." },
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

    if (displayName !== undefined && displayName.trim()) {
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
