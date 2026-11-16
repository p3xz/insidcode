import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { connectToDatabase } from "@/lib/mongodb";
import { DuelRoom } from "@/models/DuelRoom";
import { DuelTelemetryCheckpointSchema } from "@/lib/validations";
import { verifyRoundChallengeSignature } from "@/lib/duelAntiCheat";
import {
  DuelTelemetryCheckpoint,
  mergeMonotonicTelemetry,
} from "@/lib/duelAntiCheatShared";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: authResult.status || 401 }
      );
    }

    const user = authResult.user;
    const currentUserId = user._id.toString();
    const rateLimit = checkRateLimit(`duel_telemetry_${currentUserId}`, {
      limit: 60,
      windowMs: 60000,
    });
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
    }

    const { roomCode } = await params;
    const normalizedCode = (roomCode || "").trim().toUpperCase();
    if (!/^DUEL-[A-Z0-9]{3,8}$/.test(normalizedCode)) {
      return NextResponse.json({ error: "Invalid duel room code." }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const parsed = DuelTelemetryCheckpointSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid telemetry payload." }, { status: 400 });
    }

    const incoming = parsed.data;
    await connectToDatabase();

    const room = await DuelRoom.findOne({ roomCode: normalizedCode });
    if (!room) {
      return NextResponse.json({ error: "Duel room not found." }, { status: 404 });
    }

    const isPlayer1 = room.player1.userId === currentUserId;
    const isPlayer2 = room.player2?.userId === currentUserId;
    if (!isPlayer1 && !isPlayer2) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (room.status !== "ACTIVE") {
      return NextResponse.json({ success: true, ignored: true });
    }

    const activeRound = room.roundsData?.[room.currentRound - 1];
    if (!activeRound || !activeRound.startedAt) {
      return NextResponse.json({ success: true, ignored: true });
    }

    const expectedStartedAtMs = new Date(activeRound.startedAt).getTime();
    const sigCheck = verifyRoundChallengeSignature({
      userId: currentUserId,
      roomCode: normalizedCode,
      roundNumber: room.currentRound,
      expectedStartedAtMs,
      roundChallenge: incoming.roundChallenge,
    });
    if (!sigCheck.valid) {
      return NextResponse.json({ error: "Invalid round challenge." }, { status: 403 });
    }

    const playerPrefix = isPlayer1 ? "player1" : "player2";
    const existingSummary = (
      isPlayer1 ? activeRound.player1TelemetrySummary : activeRound.player2TelemetrySummary
    ) as Partial<DuelTelemetryCheckpoint> | undefined;

    const nowMs = Date.now();
    const merged = mergeMonotonicTelemetry(existingSummary, {
      ...incoming,
      lastCheckpointAtMs: nowMs,
    });

    await DuelRoom.updateOne(
      {
        roomCode: normalizedCode,
        currentRound: room.currentRound,
        "roundsData.roundNumber": room.currentRound,
      },
      {
        $set: {
          [`roundsData.$.${playerPrefix}TelemetrySummary`]: {
            ...(existingSummary || {}),
            ...merged,
            lastCheckpointAtMs: nowMs,
          },
        },
      }
    );

    return NextResponse.json({
      success: true,
      telemetry: merged,
    });
  } catch (error) {
    console.error("Duel telemetry checkpoint error:", error);
    return NextResponse.json({ error: "Failed to persist telemetry." }, { status: 500 });
  }
}
