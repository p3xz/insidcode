import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { DuelRoom } from "@/models/DuelRoom";
import { Question } from "@/models/Question";
import { finalizeDuelMatch } from "@/lib/duel";

const ROUND_DURATION_MS = 5 * 60 * 1000; // 5 minutes per round

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || "Unauthorized" }, { status: authResult.status || 401 });
    }

    const user = authResult.user;
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

    const currentUserId = user._id.toString();
    const isPlayer1 = room.player1.userId === currentUserId;
    const isPlayer2 = room.player2?.userId === currentUserId;

    if (!isPlayer1 && !isPlayer2) {
      return NextResponse.json({ error: "You are not a participant in this Duel." }, { status: 403 });
    }

    const now = new Date();
    let hasRoomUpdates = false;

    // Check TTL expiry for inactive rooms
    if (room.expiresAt && now > room.expiresAt && (room.status === "WAITING" || room.status === "COUNTDOWN" || room.status === "ACTIVE")) {
      room.status = "EXPIRED";
      room.cancelReason = "Duel room expired due to inactivity.";
      hasRoomUpdates = true;
    }

    // Transition COUNTDOWN -> ACTIVE
    if (room.status === "COUNTDOWN" && room.countdownEndsAt && now >= room.countdownEndsAt) {
      room.status = "ACTIVE";
      const r1 = room.roundsData[0];
      if (r1 && !r1.startedAt) {
        r1.startedAt = now;
        r1.endsAt = new Date(now.getTime() + ROUND_DURATION_MS);
      }
      hasRoomUpdates = true;
    }

    // Process round timer expiry if currently ACTIVE
    if (room.status === "ACTIVE") {
      const currentIdx = room.currentRound - 1;
      const currentRoundData = room.roundsData[currentIdx];

      if (currentRoundData && currentRoundData.endsAt && now >= currentRoundData.endsAt && !currentRoundData.finishedAt) {
        // Round timed out -> Draw
        currentRoundData.winner = "DRAW";
        currentRoundData.finishedAt = currentRoundData.endsAt;

        // Check for match completion (Best of 3 or max rounds reached)
        const isMatchOver =
          room.player1Score >= 2 ||
          room.player2Score >= 2 ||
          room.currentRound >= room.rounds;

        if (isMatchOver) {
          room.status = "FINISHED";
          room.winner =
            room.player1Score > room.player2Score
              ? room.player1.userId
              : room.player2Score > room.player1Score
              ? room.player2?.userId || null
              : null; // Draw
          room.finishedAt = now;
        } else {
          // Advance to next round
          room.currentRound += 1;
          const nextIdx = room.currentRound - 1;
          const nextRoundData = room.roundsData[nextIdx];
          if (nextRoundData) {
            nextRoundData.startedAt = now;
            nextRoundData.endsAt = new Date(now.getTime() + ROUND_DURATION_MS);
          }
        }
        hasRoomUpdates = true;
      }
    }

    if (hasRoomUpdates) {
      await room.save();
      if (room.status === "FINISHED") {
        await finalizeDuelMatch(normalizedCode);
      }
    }

    // Retrieve active round's problem
    const activeRoundData = room.roundsData[room.currentRound - 1];
    let problem = null;
    if (activeRoundData) {
      problem = await Question.findOne({ problemId: activeRoundData.problemId, isPublished: true })
        .select("problemId title slug phase difficulty description constraints examples starterTemplates xp")
        .lean();
    }

    // Safe sanitized opponent telemetry (NO code or test internals)
    const safePlayer1 = {
      userId: room.player1.userId,
      username: room.player1.username,
      displayName: room.player1.displayName,
      image: room.player1.image,
      status: activeRoundData?.player1Status || "CODING",
      testsPassed: activeRoundData?.player1TestsPassed || 0,
      totalTests: activeRoundData?.player1TotalTests || 0,
    };

    const safePlayer2 = room.player2
      ? {
          userId: room.player2.userId,
          username: room.player2.username,
          displayName: room.player2.displayName,
          image: room.player2.image,
          status: activeRoundData?.player2Status || "CODING",
          testsPassed: activeRoundData?.player2TestsPassed || 0,
          totalTests: activeRoundData?.player2TotalTests || 0,
        }
      : null;

    // Sanitize roundsData so future round problem IDs/titles are not exposed early
    const sanitizedRounds = room.roundsData.map((r, idx) => {
      const isRevealed = idx < room.currentRound;
      return {
        roundNumber: r.roundNumber,
        problemId: isRevealed ? r.problemId : "???",
        problemTitle: isRevealed ? r.problemTitle : "Upcoming Round",
        difficulty: r.difficulty,
        startedAt: r.startedAt,
        endsAt: r.endsAt,
        winner: r.winner,
        finishedAt: r.finishedAt,
      };
    });

    return NextResponse.json({
      room: {
        roomCode: room.roomCode,
        difficulty: room.difficulty,
        rounds: room.rounds,
        currentRound: room.currentRound,
        roundsData: sanitizedRounds,
        currentRoundData: activeRoundData
          ? {
              roundNumber: activeRoundData.roundNumber,
              problemId: activeRoundData.problemId,
              problemTitle: activeRoundData.problemTitle,
              difficulty: activeRoundData.difficulty,
              startedAt: activeRoundData.startedAt,
              endsAt: activeRoundData.endsAt,
              winner: activeRoundData.winner,
              finishedAt: activeRoundData.finishedAt,
            }
          : null,
        player1: safePlayer1,
        player2: safePlayer2,
        player1Score: room.player1Score,
        player2Score: room.player2Score,
        status: room.status,
        countdownEndsAt: room.countdownEndsAt,
        winner: room.winner,
        finishedAt: room.finishedAt,
        cancelReason: room.cancelReason,
        createdAt: room.createdAt,
      },
      problem,
      isPlayer1,
      isPlayer2,
      serverTime: now.toISOString(),
    });
  } catch (error) {
    console.error("Get duel status error:", error);
    return NextResponse.json({ error: "Failed to retrieve Duel state." }, { status: 500 });
  }
}
