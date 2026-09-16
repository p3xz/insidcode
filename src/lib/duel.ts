import crypto from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { DuelRoom } from "@/models/DuelRoom";

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
 * Atomically marks DuelRoom.finalizedAt and updates User duel statistics exactly once.
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
      $set: { finalizedAt: new Date() },
    },
    { new: true }
  );

  if (!room) {
    // Already finalized or not finished
    return false;
  }

  const p1Id = room.player1?.userId;
  const p2Id = room.player2?.userId;
  const winnerId = room.winner;

  if (!p1Id || !p2Id) {
    return false;
  }

  // Import User dynamically or directly to avoid circular dependency
  const { User } = await import("@/models/User");

  try {
    const isP1Winner = winnerId === p1Id;
    const isP2Winner = winnerId === p2Id;

    // Update Player 1 statistics
    await User.findByIdAndUpdate(p1Id, {
      $inc: {
        duelsPlayed: 1,
        duelsWon: isP1Winner ? 1 : 0,
        duelsLost: isP2Winner ? 1 : 0,
      },
    });

    // Update Player 2 statistics
    await User.findByIdAndUpdate(p2Id, {
      $inc: {
        duelsPlayed: 1,
        duelsWon: isP2Winner ? 1 : 0,
        duelsLost: isP1Winner ? 1 : 0,
      },
    });

    return true;
  } catch (err) {
    console.error(`Error finalizing duel stats for room ${normalizedCode}:`, err);
    return false;
  }
}

