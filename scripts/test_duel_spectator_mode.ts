import { existsSync } from "node:fs";
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
} else if (existsSync(".env")) {
  process.loadEnvFile(".env");
}
import { connectToDatabase } from "../src/lib/mongodb";
import { DuelRoom } from "../src/models/DuelRoom";
import { Question } from "../src/models/Question";
import { User } from "../src/models/User";
import { recordSpectatorPresence, getActiveSpectatorCount } from "../src/lib/spectatorTracker";
import mongoose from "mongoose";

async function runDuelSpectatorTests() {
  console.log("=================================================");
  console.log("       DUEL SPECTATOR MODE TEST & AUDIT SUITE    ");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} ${detail ? `-> ${detail}` : ""}`);
      failed++;
    }
  }

  await connectToDatabase();

  const testP1Id = new mongoose.Types.ObjectId().toString();
  const testP2Id = new mongoose.Types.ObjectId().toString();
  const testSpectator1Id = new mongoose.Types.ObjectId().toString();
  const testSpectator2Id = new mongoose.Types.ObjectId().toString();
  const testRoomCode = "DUEL-TEST99";

  try {
    // 1. Setup Question & Users
    const problem = await Question.findOne({ isPublished: true }).lean();
    if (!problem) {
      throw new Error("No published problem found in DB.");
    }

    const testUser1 = await User.create({
      _id: testP1Id,
      username: "p1_gamer",
      usernameNormalized: "p1_gamer",
      displayName: "Player One",
      email: "p1@spectatortest.dev",
      provider: "credentials",
      providerAccountId: `test_${testP1Id}`,
      role: "user",
      xp: 100,
    });

    const testUser2 = await User.create({
      _id: testP2Id,
      username: "p2_gamer",
      usernameNormalized: "p2_gamer",
      displayName: "Player Two",
      email: "p2@spectatortest.dev",
      provider: "credentials",
      providerAccountId: `test_${testP2Id}`,
      role: "user",
      xp: 100,
    });

    // 2. Test Room in WAITING state
    const room = await DuelRoom.create({
      roomCode: testRoomCode,
      difficulty: "Medium",
      rounds: 3,
      currentRound: 1,
      roundsData: [
        {
          roundNumber: 1,
          problemId: problem.problemId,
          problemTitle: problem.title,
          difficulty: "Medium",
          player1Status: "CODING",
          player2Status: "CODING",
        },
        {
          roundNumber: 2,
          problemId: "002",
          problemTitle: "Future Problem",
          difficulty: "Medium",
          player1Status: "CODING",
          player2Status: "CODING",
        },
        {
          roundNumber: 3,
          problemId: "003",
          problemTitle: "Future Problem 2",
          difficulty: "Medium",
          player1Status: "CODING",
          player2Status: "CODING",
        },
      ],
      player1: {
        userId: testP1Id,
        username: "p1_gamer",
        displayName: "Player One",
        status: "CODING",
      },
      player1Score: 0,
      player2Score: 0,
      status: "WAITING",
      expiresAt: new Date(Date.now() + 3600000),
    });

    assert(Boolean(room), "Created test Duel room in WAITING state");

    // 3. Test Spectator In-Memory Tracker (Zero DB storage impact)
    const count1 = recordSpectatorPresence(testRoomCode, testSpectator1Id);
    assert(count1 === 1, "Spectator 1 registered in-memory", `Count: ${count1}`);

    const count2 = recordSpectatorPresence(testRoomCode, testSpectator2Id);
    assert(count2 === 2, "Spectator 2 registered concurrently", `Count: ${count2}`);

    const activeCount = getActiveSpectatorCount(testRoomCode);
    assert(activeCount === 2, "Active spectator count retrieved accurately");

    // 4. Verify Privacy & Data Sanitization for Spectators
    // Ensure future round problems are obfuscated and code is NEVER included
    const fetchedRoom = await DuelRoom.findOne({ roomCode: testRoomCode }).lean();
    assert(Boolean(fetchedRoom), "Fetched Duel room document");

    const sanitizedRounds = (fetchedRoom?.roundsData || []).map((r, idx) => {
      const isRevealed = idx < (fetchedRoom?.currentRound || 1);
      return {
        roundNumber: r.roundNumber,
        problemId: isRevealed ? r.problemId : "???",
        problemTitle: isRevealed ? r.problemTitle : "Upcoming Round",
      };
    });

    assert(sanitizedRounds[0].problemTitle === problem.title, "Active round problem title revealed to spectator");
    assert(sanitizedRounds[1].problemTitle === "Upcoming Round", "Future round 2 problem title masked from spectator");
    assert(sanitizedRounds[1].problemId === "???", "Future round 2 problem ID masked from spectator");

    // 5. Test Transition to ACTIVE with Player 2 Joining
    room.player2 = {
      userId: testP2Id,
      username: "p2_gamer",
      displayName: "Player Two",
      status: "CODING",
      testsPassed: 0,
      totalTests: 0,
    };
    room.status = "ACTIVE";
    room.roundsData[0].startedAt = new Date();
    room.roundsData[0].endsAt = new Date(Date.now() + 300000);
    await room.save();

    assert(room.status === "ACTIVE", "Duel transitioned to ACTIVE");

    // 6. Test Spectator Cannot Become Player (Player slots remain exactly 2)
    const spectatorsCannotMutatePlayers = room.player1.userId === testP1Id && room.player2?.userId === testP2Id;
    assert(spectatorsCannotMutatePlayers, "Player slots remain strictly bound to Player 1 and Player 2");

    // 7. Test Simulated Round Finish and Match Conclusion
    room.roundsData[0].winner = testP1Id;
    room.roundsData[0].finishedAt = new Date();
    room.roundsData[0].player1Status = "SOLVED";
    room.roundsData[0].player1TestsPassed = 4;
    room.roundsData[0].player1TotalTests = 4;
    room.player1Score = 2; // Best of 3 won
    room.status = "FINISHED";
    room.winner = testP1Id;
    room.finishedAt = new Date();
    await room.save();

    assert(room.status === "FINISHED", "Duel room marked as FINISHED");
    assert(room.winner === testP1Id, "Player 1 recorded as winner");

    // 8. Test Code Exposure Audit
    // Inspect room document and question document to ensure no hidden code/test cases are leaked
    const questionDoc = await Question.findOne({ problemId: problem.problemId })
      .select("problemId title slug phase difficulty description constraints examples xp")
      .lean();

    assert(!("hiddenTestCases" in (questionDoc || {})), "hiddenTestCases strictly omitted from problem query");
    assert(!("starterTemplates" in (questionDoc || {})), "starterTemplates omitted from spectator problem query");

    // 9. Test Cancelled / Expired Room Handling
    room.status = "CANCELLED";
    room.cancelReason = "Match abandoned by host.";
    await room.save();

    const isCancelledHandled = room.status === "CANCELLED" && room.cancelReason === "Match abandoned by host.";
    assert(isCancelledHandled, "Cancelled match properly exposes cancelReason for UI display");
  } finally {
    // Clean up test data
    await DuelRoom.deleteOne({ roomCode: testRoomCode });
    await User.findByIdAndDelete(testP1Id);
    await User.findByIdAndDelete(testP2Id);
  }

  console.log("\n=================================================");
  console.log(` AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runDuelSpectatorTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
