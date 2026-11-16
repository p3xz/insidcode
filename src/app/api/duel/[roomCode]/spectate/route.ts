import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { DuelRoom } from "@/models/DuelRoom";
import { checkRateLimit } from "@/lib/rateLimit";
import { recordSpectatorPresence } from "@/lib/spectatorTracker";
import {
  advanceSpectatedRoomClock,
  buildSpectatorRoomPayload,
} from "@/lib/duelSpectateServer";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Authentication required to spectate." },
        { status: authResult.status || 401 }
      );
    }

    const user = authResult.user;
    const currentUserId = user._id.toString();
    const { roomCode } = await params;

    if (!roomCode) {
      return NextResponse.json({ error: "Room code is required." }, { status: 400 });
    }

    const normalizedCode = roomCode.trim().toUpperCase();

    // Basic format validation
    if (!/^DUEL-[A-Z0-9]{3,8}$/.test(normalizedCode)) {
      return NextResponse.json({ error: "Invalid Duel room code format." }, { status: 400 });
    }

    // Rate limit spectator requests (60 req/min per spectator)
    const rateCheck = checkRateLimit(`spectate_${currentUserId}`, { limit: 60, windowMs: 60000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down.", remaining: 0 },
        { status: 429 }
      );
    }

    await connectToDatabase();

    const room = await DuelRoom.findOne({ roomCode: normalizedCode });
    if (!room) {
      return NextResponse.json({ error: "Duel room not found." }, { status: 404 });
    }

    if (room.status === "CANCELLED" || room.status === "EXPIRED") {
      return NextResponse.json(
        {
          error: `This Duel is no longer active (Status: ${room.status}).`,
          cancelReason: room.cancelReason,
          status: room.status,
        },
        { status: 400 }
      );
    }

    const isPlayer1 = room.player1?.userId === currentUserId;
    const isPlayer2 = room.player2?.userId === currentUserId;
    const isParticipant = isPlayer1 || isPlayer2;

    const now = new Date();
    await advanceSpectatedRoomClock(room, normalizedCode, now);

    // Record presence for non-participants (or participants spectating)
    const spectatorCount = recordSpectatorPresence(normalizedCode, currentUserId);

    const { room: roomPayload, problem } = await buildSpectatorRoomPayload(room);

    return NextResponse.json({
      room: roomPayload,
      problem,
      spectatorCount,
      isParticipant,
      isPlayer1,
      isPlayer2,
      serverTime: now.toISOString(),
    });
  } catch (error) {
    console.error("Spectator API error:", error);
    return NextResponse.json({ error: "Failed to retrieve spectator state." }, { status: 500 });
  }
}
