import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthenticatedUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Question } from "@/models/Question";
import { DuelRoom } from "@/models/DuelRoom";
import { generateUniqueRoomCode } from "@/lib/duel";

export async function POST(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || "Unauthorized" }, { status: authResult.status || 401 });
    }

    const user = authResult.user;
    const body = await req.json().catch(() => ({}));
    const rawDifficulty = body.difficulty;

    const validDifficulties = ["Easy", "Medium", "Hard"] as const;
    const difficulty = validDifficulties.includes(rawDifficulty) ? rawDifficulty : "Medium";

    await connectToDatabase();

    // Select 3 problems matching the requested difficulty
    const matchingQuestions = await Question.find({ difficulty, isPublished: true })
      .select("problemId title difficulty")
      .lean();

    if (!matchingQuestions || matchingQuestions.length === 0) {
      return NextResponse.json(
        { error: `No published problems found for ${difficulty} difficulty.` },
        { status: 400 }
      );
    }

    // Cryptographically uniform Fisher-Yates shuffle to pick 3 distinct problems
    const shuffled = [...matchingQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selectedProblems = [];
    for (let i = 0; i < 3; i++) {
      selectedProblems.push(shuffled[i % shuffled.length]);
    }

    const roundsData = selectedProblems.map((q, idx) => ({
      roundNumber: idx + 1,
      problemId: q.problemId,
      problemTitle: q.title,
      difficulty: q.difficulty,
      winner: null,
      player1Status: "CODING" as const,
      player2Status: "CODING" as const,
      player1TestsPassed: 0,
      player2TestsPassed: 0,
      player1TotalTests: 0,
      player2TotalTests: 0,
    }));

    const roomCode = await generateUniqueRoomCode();
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2-hour TTL

    const room = await DuelRoom.create({
      roomCode,
      difficulty,
      rounds: 3,
      currentRound: 1,
      roundsData,
      player1: {
        userId: user._id.toString(),
        username: user.username,
        displayName: user.displayName || user.username,
        image: user.image,
        status: "CODING",
      },
      player1Score: 0,
      player2Score: 0,
      status: "WAITING",
      expiresAt,
    });

    return NextResponse.json({
      success: true,
      roomCode: room.roomCode,
      room,
    });
  } catch (error) {
    console.error("Create duel room error:", error);
    return NextResponse.json({ error: "Failed to create Duel room. Please try again." }, { status: 500 });
  }
}
