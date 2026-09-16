import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { DuelRoom } from "@/models/DuelRoom";
import { CodeSubmissionSchema } from "@/lib/validations";
import { evaluateAndRecordSubmission } from "@/lib/submission";
import { acquireSubmissionLock, releaseSubmissionLock } from "@/lib/rateLimit";
import { finalizeDuelMatch } from "@/lib/duel";

const ROUND_DURATION_MS = 5 * 60 * 1000; // 5 minutes per round

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

    const body = await req.json();
    const parseResult = CodeSubmissionSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || "Invalid submission payload";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { problemId, language, code } = parseResult.data;

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

    const roundIdx = room.currentRound - 1;
    const activeRound = room.roundsData[roundIdx];

    if (!activeRound) {
      return NextResponse.json({ error: "Invalid active round state." }, { status: 400 });
    }

    if (activeRound.problemId !== problemId) {
      return NextResponse.json({ error: "Submitted problem does not match the active Duel round problem." }, { status: 400 });
    }

    const now = new Date();

    // Auto-advance COUNTDOWN to ACTIVE if countdown timestamp has passed
    if (room.status === "COUNTDOWN" && room.countdownEndsAt && now >= room.countdownEndsAt) {
      room.status = "ACTIVE";
      if (!activeRound.startedAt) {
        activeRound.startedAt = now;
        activeRound.endsAt = new Date(now.getTime() + ROUND_DURATION_MS);
      }
      await room.save();
    }

    if (room.status !== "ACTIVE") {
      return NextResponse.json(
        { error: `Duel is not currently active (Status: ${room.status}).` },
        { status: 400 }
      );
    }

    if (activeRound.endsAt && now >= activeRound.endsAt) {
      return NextResponse.json(
        { error: "Current round time limit has expired." },
        { status: 400 }
      );
    }

    const lockAcquired = acquireSubmissionLock(currentUserId);
    if (!lockAcquired) {
      return NextResponse.json(
        { error: "A submission is already being evaluated. Please wait." },
        { status: 409 }
      );
    }

    try {
      // Evaluate submission using shared server-authoritative evaluator
      const evalResult = await evaluateAndRecordSubmission(user, problemId, language, code);

      const playerPrefix = isPlayer1 ? "player1" : "player2";
      let isRoundWinner = false;

      if (evalResult.status === "Accepted") {
        // Atomic race-condition safe round win condition:
        // 1. Room is ACTIVE
        // 2. Matching current round
        // 3. Current active round has no winner yet ($elemMatch on roundNumber + winner: null)
        // 4. Server time is strictly before round endsAt
        const updatedRoom = await DuelRoom.findOneAndUpdate(
          {
            roomCode: normalizedCode,
            status: "ACTIVE",
            currentRound: room.currentRound,
            roundsData: {
              $elemMatch: {
                roundNumber: room.currentRound,
                winner: null,
                endsAt: { $gt: new Date() },
              },
            },
          },
          {
            $set: {
              "roundsData.$.winner": currentUserId,
              "roundsData.$.finishedAt": new Date(),
              [`roundsData.$.${playerPrefix}Status`]: "SOLVED",
              [`roundsData.$.${playerPrefix}SubmittedAt`]: new Date(),
              [`roundsData.$.${playerPrefix}TestsPassed`]: evalResult.testsPassed,
              [`roundsData.$.${playerPrefix}TotalTests`]: evalResult.totalTests,
              [`roundsData.$.${playerPrefix}Runtime`]: evalResult.runtime,
            },
            $inc: {
              [isPlayer1 ? "player1Score" : "player2Score"]: 1,
            },
          },
          { new: true }
        );

        if (updatedRoom) {
          isRoundWinner = true;

          // Check if match is won (Best of 3: first to 2 wins, or after 3 rounds)
          const isMatchOver =
            updatedRoom.player1Score >= 2 ||
            updatedRoom.player2Score >= 2 ||
            updatedRoom.currentRound >= updatedRoom.rounds;

          if (isMatchOver) {
            updatedRoom.status = "FINISHED";
            updatedRoom.winner =
              updatedRoom.player1Score > updatedRoom.player2Score
                ? updatedRoom.player1.userId
                : updatedRoom.player2Score > updatedRoom.player1Score
                ? updatedRoom.player2?.userId || null
                : null;
            updatedRoom.finishedAt = new Date();
            await updatedRoom.save();
            await finalizeDuelMatch(normalizedCode);
          } else {
            // Advance to next round immediately
            updatedRoom.currentRound += 1;
            const nextIdx = updatedRoom.currentRound - 1;
            const nextRound = updatedRoom.roundsData[nextIdx];
            if (nextRound) {
              nextRound.startedAt = new Date();
              nextRound.endsAt = new Date(Date.now() + ROUND_DURATION_MS);
            }
            await updatedRoom.save();
          }
        } else {
          isRoundWinner = false;
        }
      } else {
        // Non-accepted submission: Update telemetry without ending the round
        await DuelRoom.findOneAndUpdate(
          {
            roomCode: normalizedCode,
            currentRound: room.currentRound,
            "roundsData.roundNumber": room.currentRound,
          },
          {
            $set: {
              [`roundsData.$.${playerPrefix}Status`]: "SUBMITTED",
              [`roundsData.$.${playerPrefix}SubmittedAt`]: new Date(),
              [`roundsData.$.${playerPrefix}TestsPassed`]: evalResult.testsPassed,
              [`roundsData.$.${playerPrefix}TotalTests`]: evalResult.totalTests,
              [`roundsData.$.${playerPrefix}Runtime`]: evalResult.runtime,
            },
          }
        );
      }

      const currentRoomState = await DuelRoom.findOne({ roomCode: normalizedCode });

      return NextResponse.json({
        submission: evalResult,
        isRoundWinner,
        currentRound: currentRoomState?.currentRound || 1,
        player1Score: currentRoomState?.player1Score || 0,
        player2Score: currentRoomState?.player2Score || 0,
        duelStatus: currentRoomState?.status || "ACTIVE",
        winner: currentRoomState?.winner || null,
        languagePoints: user.languagePoints,
      });
    } finally {
      releaseSubmissionLock(currentUserId);
    }
  } catch (error) {
    console.error("Duel submission error:", error);
    return NextResponse.json({ error: "Failed to evaluate duel submission." }, { status: 500 });
  }
}
