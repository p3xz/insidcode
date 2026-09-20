import { existsSync } from "node:fs";
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
} else if (existsSync(".env")) {
  process.loadEnvFile(".env");
}
import mongoose from "mongoose";
import { connectToDatabase } from "../src/lib/mongodb";
import { DuelRoom } from "../src/models/DuelRoom";
import { User } from "../src/models/User";
import { Question } from "../src/models/Question";
import { finalizeDuelMatch } from "../src/lib/duel";
import { calculateDuelElo, calculateExpectedScore, DEFAULT_DUEL_RATING, ELO_K_FACTOR } from "../src/lib/elo";
import { calculateDuelKd, calculateDuelWinRate } from "../src/lib/duelStats";

async function runEloTestSuite() {
  console.log("=================================================");
  console.log("    INSIDCODE ELO & DUEL STATS TEST SUITE       ");
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

  // ==========================================
  // PART 1: PURE ELO & STATS UTILITY TESTS
  // ==========================================
  console.log("--- PART 1: Pure Elo & Stats Utility Tests ---");

  // Test 1: 1000 vs 1000
  const match1 = calculateDuelElo(1000, 1000, "player1");
  assert(
    match1.player1NewRating === 1016 &&
      match1.player2NewRating === 984 &&
      match1.player1Delta === 16 &&
      match1.player2Delta === -16,
    "1000 vs 1000: P1 wins -> P1: 1016 (+16), P2: 984 (-16)",
    `Got P1: ${match1.player1NewRating}, P2: ${match1.player2NewRating}`
  );

  // Test 2: 1000 vs 1200 (Underdog P1 wins -> larger gain)
  const match2 = calculateDuelElo(1000, 1200, "player1");
  assert(
    match2.player1NewRating === 1024 &&
      match2.player2NewRating === 1176 &&
      match2.player1Delta === 24 &&
      match2.player2Delta === -24,
    "1000 vs 1200: Underdog P1 wins -> P1: 1024 (+24), P2: 1176 (-24)",
    `Got P1: ${match2.player1NewRating}, P2: ${match2.player2NewRating}`
  );

  // Test 3: 1200 vs 1000 (Favorite P1 wins -> smaller gain)
  const match3 = calculateDuelElo(1200, 1000, "player1");
  assert(
    match3.player1NewRating === 1208 &&
      match3.player2NewRating === 992 &&
      match3.player1Delta === 8 &&
      match3.player2Delta === -8,
    "1200 vs 1000: Favorite P1 wins -> P1: 1208 (+8), P2: 992 (-8)",
    `Got P1: ${match3.player1NewRating}, P2: ${match3.player2NewRating}`
  );

  // Test 4: Draw produces 0 rating change
  const matchDraw = calculateDuelElo(1150, 950, "draw");
  assert(
    matchDraw.player1NewRating === 1150 &&
      matchDraw.player2NewRating === 950 &&
      matchDraw.player1Delta === 0 &&
      matchDraw.player2Delta === 0,
    "Draw outcome leaves ratings completely unchanged (delta 0)",
    `Got P1: ${matchDraw.player1NewRating}, P2: ${matchDraw.player2NewRating}`
  );

  // Test 5: Clamping at 0 (Non-negative guarantee)
  const matchLow = calculateDuelElo(5, 5, "player2");
  assert(
    matchLow.player1NewRating === 0 && matchLow.player1Delta === -5,
    "Low rating losing is strictly clamped to >= 0 (no negative ratings: 5 - 16 -> 0, delta: -5)",
    `Got P1: ${matchLow.player1NewRating}, Delta: ${matchLow.player1Delta}`
  );

  // Test 6: Default starting fallback when undefined/null passed
  const matchDefault = calculateDuelElo(undefined, undefined, "player1");
  assert(
    matchDefault.player1NewRating === 1016 && matchDefault.player2NewRating === 984,
    "Undefined ratings safely default to 1000",
    `Got P1: ${matchDefault.player1NewRating}, P2: ${matchDefault.player2NewRating}`
  );

  // --- KD RATIO TESTS ---
  assert(calculateDuelKd(1, 0) === "∞", "KD: 1 win / 0 losses -> ∞", `Got ${calculateDuelKd(1, 0)}`);
  assert(calculateDuelKd(0, 0) === "—", "KD: 0 wins / 0 losses -> —", `Got ${calculateDuelKd(0, 0)}`);
  assert(calculateDuelKd(10, 5) === "2.00", "KD: 10 wins / 5 losses -> 2.00", `Got ${calculateDuelKd(10, 5)}`);
  assert(calculateDuelKd(28, 14) === "2.00", "KD: 28 wins / 14 losses -> 2.00", `Got ${calculateDuelKd(28, 14)}`);
  assert(calculateDuelKd(10, 10) === "1.00", "KD: 10 wins / 10 losses -> 1.00", `Got ${calculateDuelKd(10, 10)}`);
  assert(calculateDuelKd(5, 10) === "0.50", "KD: 5 wins / 10 losses -> 0.50", `Got ${calculateDuelKd(5, 10)}`);
  assert(calculateDuelKd(0, 5) === "0.00", "KD: 0 wins / 5 losses -> 0.00", `Got ${calculateDuelKd(0, 5)}`);

  // --- WIN RATE TESTS ---
  assert(calculateDuelWinRate(2, 3) === 66.7, "Win Rate: 2 wins / 3 played -> 66.7%", `Got ${calculateDuelWinRate(2, 3)}`);
  assert(calculateDuelWinRate(1, 2) === 50.0, "Win Rate: 1 win / 2 played -> 50.0%", `Got ${calculateDuelWinRate(1, 2)}`);
  assert(calculateDuelWinRate(0, 0) === 0, "Win Rate: 0 played -> 0%", `Got ${calculateDuelWinRate(0, 0)}`);
  assert(calculateDuelWinRate(10, 10) === 100.0, "Win Rate: 10 wins / 10 played -> 100.0%", `Got ${calculateDuelWinRate(10, 10)}`);

  // ==========================================
  // PART 2: DATABASE & INTEGRATION TESTS
  // ==========================================
  console.log("\n--- PART 2: Database Integration & Concurrency Tests ---");
  await connectToDatabase();

  const cleanupUserIds: string[] = [];
  const cleanupRoomCodes: string[] = [];

  try {
    const p1Id = new mongoose.Types.ObjectId().toString();
    const p2Id = new mongoose.Types.ObjectId().toString();
    cleanupUserIds.push(p1Id, p2Id);

    // 1. New user starts at 1000
    const testUser1 = await User.create({
      _id: p1Id,
      username: `elo_p1_${Date.now()}`,
      usernameNormalized: `elo_p1_${Date.now()}`,
      displayName: "Elo Tester 1",
      email: `elo1_${Date.now()}@test.dev`,
      provider: "credentials",
      providerAccountId: `test_${p1Id}`,
      role: "user",
      xp: 250,
      currentStreak: 4,
      longestStreak: 7,
      languagePoints: { python: 50, java: 100, cpp: 0, c: 0, javascript: 0 },
    });

    assert(testUser1.duelRating === 1000, "New user model default duelRating is 1000");

    // 2. Existing user without duelRating behaves as 1000
    const rawLegacyUser = await User.collection.insertOne({
      _id: new mongoose.Types.ObjectId(p2Id),
      username: `elo_p2_${Date.now()}`,
      usernameNormalized: `elo_p2_${Date.now()}`,
      displayName: "Legacy User No Elo",
      email: `elo2_${Date.now()}@test.dev`,
      provider: "credentials",
      providerAccountId: `test_${p2Id}`,
      role: "user",
      xp: 400,
      currentStreak: 2,
      longestStreak: 5,
      languagePoints: { python: 20, java: 30, cpp: 0, c: 0, javascript: 0 },
      duelsPlayed: 0,
      duelsWon: 0,
      duelsLost: 0,
    });
    assert(rawLegacyUser.acknowledged, "Legacy user inserted without duelRating field");

    // 3. Verify standard completed Duel updates both ratings
    const roomCode1 = `DUEL-ELOTEST1_${Date.now()}`.slice(0, 15).toUpperCase();
    cleanupRoomCodes.push(roomCode1);

    await DuelRoom.create({
      roomCode: roomCode1,
      difficulty: "Medium",
      rounds: 3,
      currentRound: 2,
      roundsData: [
        {
          roundNumber: 1,
          problemId: "001",
          problemTitle: "P1",
          difficulty: "Medium",
          winner: p1Id,
          player1Status: "SOLVED",
          player2Status: "CODING",
        },
        {
          roundNumber: 2,
          problemId: "002",
          problemTitle: "P2",
          difficulty: "Medium",
          winner: p1Id,
          player1Status: "SOLVED",
          player2Status: "CODING",
        },
      ],
      player1: {
        userId: p1Id,
        username: testUser1.username,
        displayName: testUser1.displayName,
        status: "SOLVED",
      },
      player2: {
        userId: p2Id,
        username: "legacy_user",
        displayName: "Legacy User",
        status: "CODING",
      },
      player1Score: 2,
      player2Score: 0,
      status: "FINISHED",
      winner: p1Id,
      finishedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    });

    const finalized1 = await finalizeDuelMatch(roomCode1);
    assert(finalized1 === true, "First finalizeDuelMatch succeeds on completed room");

    const [u1After, u2After, room1After] = await Promise.all([
      User.findById(p1Id),
      User.findById(p2Id),
      DuelRoom.findOne({ roomCode: roomCode1 }),
    ]);

    assert(u1After?.duelRating === 1016, "P1 (1000) won -> new rating is 1016 (+16)");
    assert(u2After?.duelRating === 984, "P2 (legacy 1000) lost -> new rating is 984 (-16)");
    assert(u1After?.duelsPlayed === 1 && u1After?.duelsWon === 1 && u1After?.duelsLost === 0, "P1 stats: 1 played, 1 won, 0 lost");
    assert(u2After?.duelsPlayed === 1 && u2After?.duelsWon === 0 && u2After?.duelsLost === 1, "P2 stats: 1 played, 0 won, 1 lost");
    assert(calculateDuelKd(u1After?.duelsWon || 0, u1After?.duelsLost || 0) === "∞", "P1 KD derived: 1W / 0L -> ∞");
    assert(calculateDuelKd(u2After?.duelsWon || 0, u2After?.duelsLost || 0) === "0.00", "P2 KD derived: 0W / 1L -> 0.00");
    assert(calculateDuelWinRate(u1After?.duelsWon || 0, u1After?.duelsPlayed || 0) === 100.0, "P1 Win Rate: 100.0%");
    assert(calculateDuelWinRate(u2After?.duelsWon || 0, u2After?.duelsPlayed || 0) === 0.0, "P2 Win Rate: 0.0%");
    assert(room1After?.eloApplied === true, "DuelRoom marked with eloApplied: true");
    assert(room1After?.player1RatingDelta === 16, "DuelRoom recorded player1RatingDelta: +16");
    assert(room1After?.player2RatingDelta === -16, "DuelRoom recorded player2RatingDelta: -16");

    // 4. Invariance of non-Duel stats: XP, Streak, Language Points
    assert(u1After?.xp === 250, "User XP unchanged (remains 250)");
    assert(u1After?.currentStreak === 4, "User currentStreak unchanged (remains 4)");
    assert(u1After?.longestStreak === 7, "User longestStreak unchanged (remains 7)");
    assert(u1After?.languagePoints?.java === 100, "User language points unchanged (Java remains 100)");

    // 5. Idempotency: Duplicate finalization call does not change Elo twice
    const finalizedAgain = await finalizeDuelMatch(roomCode1);
    assert(finalizedAgain === false, "Replay / duplicate finalizeDuelMatch returns false");

    const u1AfterReplay = await User.findById(p1Id);
    assert(u1AfterReplay?.duelRating === 1016, "Elo was NOT double-applied after replay attempt (still 1016)");

    // 6. Concurrency Stress Test: 5 concurrent finalization calls apply Elo exactly once
    const p3Id = new mongoose.Types.ObjectId().toString();
    const p4Id = new mongoose.Types.ObjectId().toString();
    cleanupUserIds.push(p3Id, p4Id);

    await Promise.all([
      User.create({
        _id: p3Id,
        username: `elo_p3_${Date.now()}`,
        usernameNormalized: `elo_p3_${Date.now()}`,
        displayName: "Concurrent P3",
        provider: "credentials",
        providerAccountId: `test_${p3Id}`,
        duelRating: 1000,
      }),
      User.create({
        _id: p4Id,
        username: `elo_p4_${Date.now()}`,
        usernameNormalized: `elo_p4_${Date.now()}`,
        displayName: "Concurrent P4",
        provider: "credentials",
        providerAccountId: `test_${p4Id}`,
        duelRating: 1000,
      }),
    ]);

    const roomCodeConcurrent = `DUEL-CONC_${Date.now()}`.slice(0, 15).toUpperCase();
    cleanupRoomCodes.push(roomCodeConcurrent);

    await DuelRoom.create({
      roomCode: roomCodeConcurrent,
      difficulty: "Medium",
      rounds: 3,
      currentRound: 2,
      roundsData: [],
      player1: { userId: p3Id, username: "p3", displayName: "P3", status: "SOLVED" },
      player2: { userId: p4Id, username: "p4", displayName: "P4", status: "CODING" },
      player1Score: 2,
      player2Score: 0,
      status: "FINISHED",
      winner: p3Id,
      finishedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    });

    const concurrentResults = await Promise.all([
      finalizeDuelMatch(roomCodeConcurrent),
      finalizeDuelMatch(roomCodeConcurrent),
      finalizeDuelMatch(roomCodeConcurrent),
      finalizeDuelMatch(roomCodeConcurrent),
      finalizeDuelMatch(roomCodeConcurrent),
    ]);

    const successCount = concurrentResults.filter((r) => r === true).length;
    const failCount = concurrentResults.filter((r) => r === false).length;

    assert(successCount === 1 && failCount === 4, "5 concurrent finalizations: Exactly 1 succeeded, 4 rejected", `Results: ${JSON.stringify(concurrentResults)}`);

    const u3AfterConc = await User.findById(p3Id);
    const u4AfterConc = await User.findById(p4Id);
    assert(u3AfterConc?.duelRating === 1016, "P3 received exactly one +16 Elo increment (1016)");
    assert(u4AfterConc?.duelRating === 984, "P4 received exactly one -16 Elo decrement (984)");

    // 7. Cancelled Room does not change Elo
    const roomCodeCancelled = `DUEL-CANC_${Date.now()}`.slice(0, 15).toUpperCase();
    cleanupRoomCodes.push(roomCodeCancelled);

    await DuelRoom.create({
      roomCode: roomCodeCancelled,
      difficulty: "Medium",
      rounds: 3,
      currentRound: 1,
      roundsData: [],
      player1: { userId: p1Id, username: "p1", displayName: "P1", status: "CODING" },
      status: "CANCELLED",
      cancelReason: "Creator left",
      expiresAt: new Date(Date.now() + 3600000),
    });

    const cancelFinalize = await finalizeDuelMatch(roomCodeCancelled);
    assert(cancelFinalize === false, "Cancelled room cannot be finalized (returns false)");

    // 8. Expired Waiting Room does not change Elo
    const roomCodeExpired = `DUEL-EXP_${Date.now()}`.slice(0, 15).toUpperCase();
    cleanupRoomCodes.push(roomCodeExpired);

    await DuelRoom.create({
      roomCode: roomCodeExpired,
      difficulty: "Medium",
      rounds: 3,
      currentRound: 1,
      roundsData: [],
      player1: { userId: p1Id, username: "p1", displayName: "P1", status: "CODING" },
      status: "EXPIRED",
      expiresAt: new Date(Date.now() - 10000),
    });

    const expireFinalize = await finalizeDuelMatch(roomCodeExpired);
    assert(expireFinalize === false, "Expired waiting room cannot be finalized (returns false)");

    // 9. Abandonment/Forfeit Win: P1 (1016) beats P2 (984) via active forfeit
    const roomCodeForfeit = `DUEL-FORF_${Date.now()}`.slice(0, 15).toUpperCase();
    cleanupRoomCodes.push(roomCodeForfeit);

    await DuelRoom.create({
      roomCode: roomCodeForfeit,
      difficulty: "Medium",
      rounds: 3,
      currentRound: 1,
      roundsData: [],
      player1: { userId: p1Id, username: "p1", displayName: "P1", status: "CODING" },
      player2: { userId: p2Id, username: "p2", displayName: "P2", status: "CODING" },
      status: "FINISHED",
      winner: p1Id, // P1 awarded victory
      cancelReason: "Player 2 forfeited the duel by leaving.",
      finishedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    });

    const forfeitFinalize = await finalizeDuelMatch(roomCodeForfeit);
    assert(forfeitFinalize === true, "Valid active abandonment victory finalized successfully");

    const [u1AfterForfeit, u2AfterForfeit] = await Promise.all([
      User.findById(p1Id),
      User.findById(p2Id),
    ]);

    // P1 was 1016, P2 was 984. Expected P1 win delta: +15, P2 delta: -15
    assert(
      (u1AfterForfeit?.duelRating || 0) > 1016,
      `P1 rating increased after forfeit win (New: ${u1AfterForfeit?.duelRating})`
    );
    assert(
      (u2AfterForfeit?.duelRating || 0) < 984,
      `P2 rating decreased after forfeit loss (New: ${u2AfterForfeit?.duelRating})`
    );

    // 10. Underdog Win: Lower-rated player beating higher-rated player gets larger gain
    const p5Id = new mongoose.Types.ObjectId().toString(); // Underdog 1000
    const p6Id = new mongoose.Types.ObjectId().toString(); // Favorite 1200
    cleanupUserIds.push(p5Id, p6Id);

    await Promise.all([
      User.create({
        _id: p5Id,
        username: `elo_p5_${Date.now()}`,
        usernameNormalized: `elo_p5_${Date.now()}`,
        displayName: "Underdog P5",
        provider: "credentials",
        providerAccountId: `test_${p5Id}`,
        duelRating: 1000,
      }),
      User.create({
        _id: p6Id,
        username: `elo_p6_${Date.now()}`,
        usernameNormalized: `elo_p6_${Date.now()}`,
        displayName: "Favorite P6",
        provider: "credentials",
        providerAccountId: `test_${p6Id}`,
        duelRating: 1200,
      }),
    ]);

    const roomCodeUnderdog = `DUEL-UND_${Date.now()}`.slice(0, 15).toUpperCase();
    cleanupRoomCodes.push(roomCodeUnderdog);

    await DuelRoom.create({
      roomCode: roomCodeUnderdog,
      difficulty: "Medium",
      rounds: 3,
      currentRound: 2,
      roundsData: [],
      player1: { userId: p5Id, username: "p5", displayName: "P5", status: "SOLVED" },
      player2: { userId: p6Id, username: "p6", displayName: "P6", status: "CODING" },
      player1Score: 2,
      player2Score: 0,
      status: "FINISHED",
      winner: p5Id, // Underdog wins
      finishedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    });

    await finalizeDuelMatch(roomCodeUnderdog);

    const [u5After, u6After] = await Promise.all([
      User.findById(p5Id),
      User.findById(p6Id),
    ]);

    assert(u5After?.duelRating === 1024, "Underdog (1000) beating 1200 gets +24 gain -> 1024");
    assert(u6After?.duelRating === 1176, "Favorite (1200) losing to 1000 receives -24 loss -> 1176");

  } finally {
    // Clean up test records
    if (cleanupUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: cleanupUserIds } });
    }
    if (cleanupRoomCodes.length > 0) {
      await DuelRoom.deleteMany({ roomCode: { $in: cleanupRoomCodes } });
    }
    console.log("\n[Cleaned up test data]");
  }

  console.log("\n=================================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runEloTestSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
