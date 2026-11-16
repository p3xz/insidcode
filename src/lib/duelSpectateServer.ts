import type { HydratedDocument } from "mongoose";
import type { IDuelRoom } from "@/types";
import { Question } from "@/models/Question";
import { finalizeDuelMatch } from "@/lib/duel";

export const SPECTATE_ROUND_DURATION_MS = 5 * 60 * 1000;

/**
 * Advances TTL expiry, countdown -> ACTIVE transitions, and round timeout transitions
 * for a fetched DuelRoom document, persisting and finalizing Elo if needed.
 */
export async function advanceSpectatedRoomClock(
  room: HydratedDocument<IDuelRoom>,
  normalizedCode: string,
  now: Date
): Promise<void> {
  let hasRoomUpdates = false;

  if (
    room.expiresAt &&
    now > room.expiresAt &&
    (room.status === "WAITING" || room.status === "COUNTDOWN" || room.status === "ACTIVE")
  ) {
    room.status = "EXPIRED";
    room.cancelReason = "Duel room expired due to inactivity.";
    hasRoomUpdates = true;
  }

  if (room.status === "COUNTDOWN" && room.countdownEndsAt && now >= room.countdownEndsAt) {
    room.status = "ACTIVE";
    const r1 = room.roundsData[0];
    if (r1 && !r1.startedAt) {
      r1.startedAt = now;
      r1.endsAt = new Date(now.getTime() + SPECTATE_ROUND_DURATION_MS);
    }
    hasRoomUpdates = true;
  }

  if (room.status === "ACTIVE") {
    const currentIdx = room.currentRound - 1;
    const currentRoundData = room.roundsData[currentIdx];

    if (
      currentRoundData &&
      currentRoundData.endsAt &&
      now >= currentRoundData.endsAt &&
      !currentRoundData.finishedAt
    ) {
      currentRoundData.winner = "DRAW";
      currentRoundData.finishedAt = currentRoundData.endsAt;

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
            : null;
        room.finishedAt = now;
      } else {
        room.currentRound += 1;
        const nextIdx = room.currentRound - 1;
        const nextRoundData = room.roundsData[nextIdx];
        if (nextRoundData) {
          nextRoundData.startedAt = now;
          nextRoundData.endsAt = new Date(now.getTime() + SPECTATE_ROUND_DURATION_MS);
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
}

/**
 * Builds the sanitized room & problem payload for spectating views.
 * Never includes source code drafts, hidden test cases, starter templates, or anti-cheat tokens.
 */
export async function buildSpectatorRoomPayload(room: HydratedDocument<IDuelRoom>) {
  const activeRoundData = room.roundsData[room.currentRound - 1] || null;

  let problem = null;
  if (activeRoundData) {
    problem = await Question.findOne({ problemId: activeRoundData.problemId, isPublished: true })
      .select("problemId title slug phase difficulty description constraints examples xp")
      .lean();
  }

  const safePlayer1 = {
    userId: room.player1.userId,
    username: room.player1.username,
    displayName: room.player1.displayName,
    image: room.player1.image,
    status: activeRoundData?.player1Status || "CODING",
    testsPassed: activeRoundData?.player1TestsPassed || 0,
    totalTests: activeRoundData?.player1TotalTests || 0,
    runtime: activeRoundData?.player1Runtime || null,
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
        runtime: activeRoundData?.player2Runtime || null,
      }
    : null;

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

  return {
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
  };
}
