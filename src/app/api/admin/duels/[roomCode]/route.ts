import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { DuelRoom } from "@/models/DuelRoom";
import { checkRateLimit } from "@/lib/rateLimit";
import { buildAdminRoomIntegrity } from "@/lib/duelSpectateAdmin";
import {
  advanceSpectatedRoomClock,
  buildSpectatorRoomPayload,
} from "@/lib/duelSpectateServer";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    const authResult = await requireAdminUser();
    if (!authResult.admin) {
      return NextResponse.json(
        { error: authResult.error || "Forbidden: Admin access required." },
        { status: authResult.status }
      );
    }

    const { roomCode } = await params;
    if (!roomCode) {
      return NextResponse.json({ error: "Room code is required." }, { status: 400 });
    }

    const normalizedCode = decodeURIComponent(roomCode).trim().toUpperCase();
    if (!/^DUEL-[A-Z0-9]{3,8}$/.test(normalizedCode)) {
      return NextResponse.json({ error: "Invalid Duel room code format." }, { status: 400 });
    }

    const rateCheck = checkRateLimit(`admin-spectate_${authResult.admin._id}`, {
      limit: 120,
      windowMs: 60000,
    });
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

    const now = new Date();
    await advanceSpectatedRoomClock(room, normalizedCode, now);

    const [{ room: roomPayload, problem }, adminIntegrity] = await Promise.all([
      buildSpectatorRoomPayload(room),
      Promise.resolve(buildAdminRoomIntegrity(room, now.getTime())),
    ]);

    return NextResponse.json({
      room: roomPayload,
      problem,
      adminIntegrity,
      serverTime: now.toISOString(),
    });
  } catch (error) {
    console.error("Admin duel spectate API error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve admin duel spectate state." },
      { status: 500 }
    );
  }
}
