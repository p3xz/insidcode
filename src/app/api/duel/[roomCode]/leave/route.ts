import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { DuelRoom } from "@/models/DuelRoom";

import { finalizeDuelMatch } from "@/lib/duel";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || "Unauthorized" }, { status: authResult.status || 401 });
    }

    const user = authResult.user;
    const currentUserId = user._id.toString();
    const { roomCode } = await params;

    if (!roomCode) {
      return NextResponse.json({ error: "Room code is required." }, { status: 400 });
    }

    const normalizedCode = roomCode.trim().toUpperCase();

    await connectToDatabase();

    const room = await DuelRoom.findOne({ roomCode: normalizedCode });
    if (!room) {
      return NextResponse.json({ error: "Duel room not found." }, { status: 404 });
    }

    const isPlayer1 = room.player1.userId === currentUserId;
    const isPlayer2 = room.player2?.userId === currentUserId;

    if (!isPlayer1 && !isPlayer2) {
      return NextResponse.json({ error: "You are not a participant in this Duel." }, { status: 403 });
    }

    if (room.status === "WAITING") {
      if (isPlayer1) {
        // Player 1 cancels the room
        room.status = "CANCELLED";
        room.cancelReason = "Creator cancelled the waiting room.";
        await room.save();
        return NextResponse.json({ success: true, message: "Duel room cancelled." });
      } else if (isPlayer2) {
        // Player 2 leaves; room reverts to waiting for player 1
        room.player2 = undefined;
        await room.save();
        return NextResponse.json({ success: true, message: "Left Duel room." });
      }
    } else if (room.status === "COUNTDOWN") {
      // If either player leaves during countdown, cancel the duel so it does not start a one-player duel
      room.status = "CANCELLED";
      room.cancelReason = "A player disconnected during countdown.";
      await room.save();
      return NextResponse.json({ success: true, message: "Duel cancelled." });
    } else if (room.status === "ACTIVE") {
      // Forfeit active match: award victory to remaining player
      const opponentId = isPlayer1 ? room.player2?.userId : room.player1.userId;
      room.status = "FINISHED";
      room.winner = opponentId || null;
      room.finishedAt = new Date();
      room.cancelReason = `${user.displayName || user.username} forfeited the duel by leaving.`;
      await room.save();
      await finalizeDuelMatch(normalizedCode);
      return NextResponse.json({ success: true, message: "Forfeited the active duel." });
    } else {
      // FINISHED, CANCELLED, or EXPIRED
      return NextResponse.json({ success: true, message: "Duel is already finished or closed." });
    }
  } catch (error) {
    console.error("Leave duel error:", error);
    return NextResponse.json({ error: "Failed to leave Duel room." }, { status: 500 });
  }
}
