import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { DuelRoom } from "@/models/DuelRoom";

export async function POST(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || "Unauthorized" }, { status: authResult.status || 401 });
    }

    const user = authResult.user;
    const body = await req.json();
    const { roomCode } = body;

    if (!roomCode || typeof roomCode !== "string") {
      return NextResponse.json({ error: "Room code is required." }, { status: 400 });
    }

    const normalizedCode = roomCode.trim().toUpperCase();

    await connectToDatabase();

    const existingRoom = await DuelRoom.findOne({ roomCode: normalizedCode });
    if (!existingRoom) {
      return NextResponse.json({ error: "Duel room not found. Check the room code." }, { status: 404 });
    }

    if (existingRoom.status !== "WAITING") {
      if (existingRoom.status === "ACTIVE" || existingRoom.status === "COUNTDOWN") {
        return NextResponse.json({ error: "Duel is already in progress." }, { status: 400 });
      }
      if (existingRoom.status === "FINISHED") {
        return NextResponse.json({ error: "Duel has already finished." }, { status: 400 });
      }
      if (existingRoom.status === "CANCELLED" || existingRoom.status === "EXPIRED") {
        return NextResponse.json({ error: "This Duel room is no longer active." }, { status: 400 });
      }
    }

    if (existingRoom.player1.userId === user._id.toString()) {
      return NextResponse.json({ error: "You cannot join your own Duel as Player 2." }, { status: 400 });
    }

    if (existingRoom.player2) {
      return NextResponse.json({ error: "Duel room is full (2/2 players)." }, { status: 400 });
    }

    if (new Date() > existingRoom.expiresAt) {
      return NextResponse.json({ error: "Duel room has expired." }, { status: 400 });
    }

    const now = new Date();
    const countdownDurationMs = 5000; // 5-second countdown
    const countdownEndsAt = new Date(now.getTime() + countdownDurationMs);
    const roundStartedAt = countdownEndsAt;
    const ROUND_DURATION_MS = 5 * 60 * 1000; // 5 minutes per round
    const roundEndsAt = new Date(roundStartedAt.getTime() + ROUND_DURATION_MS);

    const player2Data = {
      userId: user._id.toString(),
      username: user.username,
      displayName: user.displayName || user.username,
      image: user.image,
      status: "CODING" as const,
    };

    // Initialize round 1 startedAt and endsAt
    if (existingRoom.roundsData && existingRoom.roundsData.length > 0) {
      existingRoom.roundsData[0].startedAt = roundStartedAt;
      existingRoom.roundsData[0].endsAt = roundEndsAt;
    }

    const updatedRoom = await DuelRoom.findOneAndUpdate(
      {
        roomCode: normalizedCode,
        status: "WAITING",
        $or: [{ player2: { $exists: false } }, { player2: null }],
      },
      {
        $set: {
          player2: player2Data,
          status: "COUNTDOWN",
          countdownEndsAt,
          currentRound: 1,
          roundsData: existingRoom.roundsData,
        },
      },
      { new: true }
    );

    if (!updatedRoom) {
      return NextResponse.json(
        { error: "Failed to join room. It may have already started or been cancelled." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      roomCode: updatedRoom.roomCode,
    });
  } catch (error) {
    console.error("Join duel error:", error);
    return NextResponse.json({ error: "Failed to join Duel room. Please try again." }, { status: 500 });
  }
}
