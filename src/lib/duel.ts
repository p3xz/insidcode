import crypto from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { DuelRoom } from "@/models/DuelRoom";
import { calculateDuelElo, DEFAULT_DUEL_RATING } from "@/lib/elo";
import { applyDuelPointDelta, WIN_DUEL_POINTS, LOSS_DUEL_POINTS } from "@/lib/duelRanks";

const CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * Generates a human-friendly, collision-safe room code.
 * Example: DUEL-782, DUEL-K49
 */
export async function generateUniqueRoomCode(): Promise<string> {
  await connectToDatabase();
  const MAX_ATTEMPTS = 10;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const bytes = crypto.randomBytes(3);
    let code = "";
    for (let i = 0; i < 3; i++) {
      code += CHARS[bytes[i] % CHARS.length];
    }
    const roomCode = `DUEL-${code}`;

    const exists = await DuelRoom.exists({ roomCode });
    if (!exists) {
      return roomCode;
    }
  }

  // Fallback with 4 chars if collisions occur
  const bytes = crypto.randomBytes(4);
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += CHARS[bytes[i] % CHARS.length];
  }
  return `DUEL-${code}`;
}

/**
 * Crash-safe and idempotent Duel finalization.
 * Atomically claims DuelRoom (finalizedAt: null -> Date, eloApplied: true)
 * and updates User duel statistics & Elo ratings exactly once.
 */
export async function finalizeDuelMatch(roomCode: string): Promise<boolean> {
  await connectToDatabase();
  const normalizedCode = roomCode.trim().toUpperCase();

  // Atomic claim: only succeed if finalizedAt is currently null and status is FINISHED
  const room = await DuelRoom.findOneAndUpdate(
    {
      roomCode: normalizedCode,
      status: "FINISHED",
      finalizedAt: null,
    },
    {
      $set: {
        finalizedAt: new Date(),
        eloApplied: true,
      },
    },
    { new: true }
  );

  if (!room) {
    // Already finalized, not finished, or claimed by a concurrent worker
    return false;
  }

  const p1Id = room.player1?.userId;
  const p2Id = room.player2?.userId;
  const winnerId = room.winner;

  if (!p1Id || !p2Id) {
    return false;
  }

  // Import User dynamically to avoid circular dependency
  const { User } = await import("@/models/User");

  try {
    const isP1Winner = winnerId === p1Id;
    const isP2Winner = winnerId === p2Id;
    const winnerOutcome = isP1Winner ? "player1" : isP2Winner ? "player2" : "draw";

    // Fetch existing user records for Elo & Points calculation
    const [p1User, p2User] = await Promise.all([
      User.findById(p1Id).select("duelRating duelPoints duelsPlayed duelsWon duelsLost"),
      User.findById(p2Id).select("duelRating duelPoints duelsPlayed duelsWon duelsLost"),
    ]);

    const p1CurrentRating = p1User?.duelRating ?? DEFAULT_DUEL_RATING;
    const p2CurrentRating = p2User?.duelRating ?? DEFAULT_DUEL_RATING;

    const eloResult = calculateDuelElo(p1CurrentRating, p2CurrentRating, winnerOutcome);

    // Duel Points calculation: Winner +25, Loser -10, minimum 0
    const p1CurrentPoints = p1User?.duelPoints ?? 0;
    const p2CurrentPoints = p2User?.duelPoints ?? 0;

    let p1PointsDelta = 0;
    let p2PointsDelta = 0;

    if (isP1Winner) {
      p1PointsDelta = WIN_DUEL_POINTS;
      p2PointsDelta = LOSS_DUEL_POINTS;
    } else if (isP2Winner) {
      p1PointsDelta = LOSS_DUEL_POINTS;
      p2PointsDelta = WIN_DUEL_POINTS;
    }

    const p1NewPoints = applyDuelPointDelta(p1CurrentPoints, p1PointsDelta);
    const p2NewPoints = applyDuelPointDelta(p2CurrentPoints, p2PointsDelta);

    const p1ActualPointsDelta = p1NewPoints - p1CurrentPoints;
    const p2ActualPointsDelta = p2NewPoints - p2CurrentPoints;

    // Update Player 1 statistics, Elo & Duel Points
    const p1Update = User.findByIdAndUpdate(p1Id, {
      $set: {
        duelRating: eloResult.player1NewRating,
        duelPoints: p1NewPoints,
      },
      $inc: {
        duelsPlayed: 1,
        duelsWon: isP1Winner ? 1 : 0,
        duelsLost: isP2Winner ? 1 : 0,
      },
    });

    // Update Player 2 statistics, Elo & Duel Points
    const p2Update = User.findByIdAndUpdate(p2Id, {
      $set: {
        duelRating: eloResult.player2NewRating,
        duelPoints: p2NewPoints,
      },
      $inc: {
        duelsPlayed: 1,
        duelsWon: isP2Winner ? 1 : 0,
        duelsLost: isP1Winner ? 1 : 0,
      },
    });

    // Record rating and point changes on the DuelRoom document for auditability
    const roomUpdate = DuelRoom.updateOne(
      { roomCode: normalizedCode },
      {
        $set: {
          player1RatingDelta: eloResult.player1Delta,
          player2RatingDelta: eloResult.player2Delta,
          player1PointsDelta: p1ActualPointsDelta,
          player2PointsDelta: p2ActualPointsDelta,
        },
      }
    );

    await Promise.all([p1Update, p2Update, roomUpdate]);

    return true;
  } catch (err) {
    console.error(`Error finalizing duel stats and Elo for room ${normalizedCode}:`, err);
    return false;
  }
}

