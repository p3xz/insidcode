import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthenticatedUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
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
    const rateLimit = checkRateLimit(`duel_create_${user._id.toString()}`, { limit: 20, windowMs: 60000 });
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Rate limit exceeded. Please try again shortly." }, { status: 429 });
    }
    const body = await req.json().catch(() => ({}));
    const rawProblemId = typeof body.problemId === "string" ? body.problemId.trim() : null;
    const rawDifficulty = body.difficulty;

    await connectToDatabase();

    let difficulty: "Very Easy" | "Easy" | "Medium" | "Hard";
    let rounds = 3;
    let roundsData: Array<{
      roundNumber: number;
      problemId: string;
      problemTitle: string;
      difficulty: "Very Easy" | "Easy" | "Medium" | "Hard";
      winner: null;
      player1Status: "CODING";
      player2Status: "CODING";
      player1TestsPassed: number;
      player2TestsPassed: number;
      player1TotalTests: number;
      player2TotalTests: number;
    }> = [];

    if (rawProblemId) {
      // ─── PER-PROBLEM DUEL ─────────────────────────────────────────
      // Server-authoritative problem lookup & difficulty derivation
      const targetQuestion = await Question.findOne({
        $or: [{ problemId: rawProblemId }, { slug: rawProblemId.toLowerCase() }],
        isPublished: true,
      })
        .select("problemId title difficulty")
        .lean();

      if (!targetQuestion) {
        return NextResponse.json(
          { error: `Problem "${rawProblemId}" not found or is not published.` },
          { status: 404 }
        );
      }

      // Authoritatively derive difficulty directly from the database record (ignore client input)
      difficulty = targetQuestion.difficulty as "Very Easy" | "Easy" | "Medium" | "Hard";
      rounds = 1;
      roundsData = [
        {
          roundNumber: 1,
          problemId: targetQuestion.problemId,
          problemTitle: targetQuestion.title,
          difficulty: targetQuestion.difficulty as "Very Easy" | "Easy" | "Medium" | "Hard",
          winner: null,
          player1Status: "CODING" as const,
          player2Status: "CODING" as const,
          player1TestsPassed: 0,
          player2TestsPassed: 0,
          player1TotalTests: 0,
          player2TotalTests: 0,
        },
      ];
    } else {
      // ─── STANDARD MATCHMAKING DUEL ─────────────────────────────────
      const validDifficulties = ["Very Easy", "Easy", "Medium", "Hard"] as const;
      difficulty = validDifficulties.includes(rawDifficulty) ? rawDifficulty : "Medium";

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

      rounds = 3;
      roundsData = selectedProblems.map((q, idx) => ({
        roundNumber: idx + 1,
        problemId: q.problemId,
        problemTitle: q.title,
        difficulty: q.difficulty as "Very Easy" | "Easy" | "Medium" | "Hard",
        winner: null,
        player1Status: "CODING" as const,
        player2Status: "CODING" as const,
        player1TestsPassed: 0,
        player2TestsPassed: 0,
        player1TotalTests: 0,
        player2TotalTests: 0,
      }));
    }

    const roomCode = await generateUniqueRoomCode();
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2-hour TTL

    const room = await DuelRoom.create({
      roomCode,
      difficulty,
      rounds,
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

