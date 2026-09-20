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
import { finalizeDuelMatch } from "../src/lib/duel";
import {
  DUEL_RANKS,
  applyDuelPointDelta,
  getNormalDuelRank,
  getDuelRank,
  getTop3ChampionUserIds,
  resolveUserChampionPosition,
} from "../src/lib/duelRanks";

async function runDuelPointsAndRanksTestSuite() {
  console.log("=================================================");
  console.log(" INSIDCODE DUEL POINTS & RANK PROGRESSION TESTS  ");
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
  // PART 1: DUEL POINT DELTA CALCULATION
  // ==========================================
  console.log("--- PART 1: Pure Duel Point Delta Tests ---");

  assert(applyDuelPointDelta(0, 25) === 25, "0 DP + 25 -> 25 DP");
  assert(applyDuelPointDelta(100, 25) === 125, "100 DP + 25 -> 125 DP");
  assert(applyDuelPointDelta(50, -10) === 40, "50 DP - 10 -> 40 DP");
  assert(applyDuelPointDelta(5, -10) === 0, "5 DP - 10 -> clamped to 0 DP");
  assert(applyDuelPointDelta(0, -10) === 0, "0 DP - 10 -> clamped to 0 DP");
  assert(applyDuelPointDelta(100, 0) === 100, "Draw 0 delta -> unchanged 100 DP");
  assert(applyDuelPointDelta(undefined, 25) === 25, "Undefined starting DP defaults to 0 + 25 -> 25 DP");

  // ==========================================
  // PART 2: ALL 24 RANK TIERS AND THRESHOLDS
  // ==========================================
  console.log("\n--- PART 2: All 24 Rank Tiers & Threshold Tests ---");

  assert(DUEL_RANKS.length === 24, "Total rank tiers configured is exactly 24");

  const tierExpectations: Array<{ points: number; expectedTier: number; expectedName: string; nextRank?: string | null; pointsToNext?: number | null }> = [
    { points: 0, expectedTier: 1, expectedName: "Noob I", nextRank: "Noob II", pointsToNext: 100 },
    { points: 99, expectedTier: 1, expectedName: "Noob I", nextRank: "Noob II", pointsToNext: 1 },
    { points: 100, expectedTier: 2, expectedName: "Noob II", nextRank: "Noob III", pointsToNext: 100 },
    { points: 199, expectedTier: 2, expectedName: "Noob II", nextRank: "Noob III", pointsToNext: 1 },
    { points: 200, expectedTier: 3, expectedName: "Noob III", nextRank: "Rookie I", pointsToNext: 100 },
    { points: 299, expectedTier: 3, expectedName: "Noob III", nextRank: "Rookie I", pointsToNext: 1 },
    { points: 300, expectedTier: 4, expectedName: "Rookie I", nextRank: "Rookie II", pointsToNext: 100 },
    { points: 399, expectedTier: 4, expectedName: "Rookie I", nextRank: "Rookie II", pointsToNext: 1 },
    { points: 400, expectedTier: 5, expectedName: "Rookie II", nextRank: "Rookie III", pointsToNext: 100 },
    { points: 499, expectedTier: 5, expectedName: "Rookie II", nextRank: "Rookie III", pointsToNext: 1 },
    { points: 500, expectedTier: 6, expectedName: "Rookie III", nextRank: "Challenger I", pointsToNext: 100 },
    { points: 599, expectedTier: 6, expectedName: "Rookie III", nextRank: "Challenger I", pointsToNext: 1 },
    { points: 600, expectedTier: 7, expectedName: "Challenger I", nextRank: "Challenger II", pointsToNext: 100 },
    { points: 699, expectedTier: 7, expectedName: "Challenger I", nextRank: "Challenger II", pointsToNext: 1 },
    { points: 700, expectedTier: 8, expectedName: "Challenger II", nextRank: "Challenger III", pointsToNext: 100 },
    { points: 799, expectedTier: 8, expectedName: "Challenger II", nextRank: "Challenger III", pointsToNext: 1 },
    { points: 800, expectedTier: 9, expectedName: "Challenger III", nextRank: "Contender I", pointsToNext: 100 },
    { points: 899, expectedTier: 9, expectedName: "Challenger III", nextRank: "Contender I", pointsToNext: 1 },
    { points: 900, expectedTier: 10, expectedName: "Contender I", nextRank: "Contender II", pointsToNext: 100 },
    { points: 999, expectedTier: 10, expectedName: "Contender I", nextRank: "Contender II", pointsToNext: 1 },
    { points: 1000, expectedTier: 11, expectedName: "Contender II", nextRank: "Contender III", pointsToNext: 100 },
    { points: 1099, expectedTier: 11, expectedName: "Contender II", nextRank: "Contender III", pointsToNext: 1 },
    { points: 1100, expectedTier: 12, expectedName: "Contender III", nextRank: "Duelist I", pointsToNext: 100 },
    { points: 1199, expectedTier: 12, expectedName: "Contender III", nextRank: "Duelist I", pointsToNext: 1 },
    { points: 1200, expectedTier: 13, expectedName: "Duelist I", nextRank: "Duelist II", pointsToNext: 100 },
    { points: 1299, expectedTier: 13, expectedName: "Duelist I", nextRank: "Duelist II", pointsToNext: 1 },
    { points: 1300, expectedTier: 14, expectedName: "Duelist II", nextRank: "Duelist III", pointsToNext: 100 },
    { points: 1399, expectedTier: 14, expectedName: "Duelist II", nextRank: "Duelist III", pointsToNext: 1 },
    { points: 1400, expectedTier: 15, expectedName: "Duelist III", nextRank: "Elite Duelist I", pointsToNext: 100 },
    { points: 1499, expectedTier: 15, expectedName: "Duelist III", nextRank: "Elite Duelist I", pointsToNext: 1 },
    { points: 1500, expectedTier: 16, expectedName: "Elite Duelist I", nextRank: "Elite Duelist II", pointsToNext: 100 },
    { points: 1599, expectedTier: 16, expectedName: "Elite Duelist I", nextRank: "Elite Duelist II", pointsToNext: 1 },
    { points: 1600, expectedTier: 17, expectedName: "Elite Duelist II", nextRank: "Elite Duelist III", pointsToNext: 100 },
    { points: 1699, expectedTier: 17, expectedName: "Elite Duelist II", nextRank: "Elite Duelist III", pointsToNext: 1 },
    { points: 1700, expectedTier: 18, expectedName: "Elite Duelist III", nextRank: "Apex I", pointsToNext: 100 },
    { points: 1799, expectedTier: 18, expectedName: "Elite Duelist III", nextRank: "Apex I", pointsToNext: 1 },
    { points: 1800, expectedTier: 19, expectedName: "Apex I", nextRank: "Apex II", pointsToNext: 100 },
    { points: 1899, expectedTier: 19, expectedName: "Apex I", nextRank: "Apex II", pointsToNext: 1 },
    { points: 1900, expectedTier: 20, expectedName: "Apex II", nextRank: "Apex III", pointsToNext: 100 },
    { points: 1999, expectedTier: 20, expectedName: "Apex II", nextRank: "Apex III", pointsToNext: 1 },
    { points: 2000, expectedTier: 21, expectedName: "Apex III", nextRank: "Legend I", pointsToNext: 100 },
    { points: 2099, expectedTier: 21, expectedName: "Apex III", nextRank: "Legend I", pointsToNext: 1 },
    { points: 2100, expectedTier: 22, expectedName: "Legend I", nextRank: "Legend II", pointsToNext: 100 },
    { points: 2199, expectedTier: 22, expectedName: "Legend I", nextRank: "Legend II", pointsToNext: 1 },
    { points: 2200, expectedTier: 23, expectedName: "Legend II", nextRank: "Champion", pointsToNext: 100 },
    { points: 2299, expectedTier: 23, expectedName: "Legend II", nextRank: "Champion", pointsToNext: 1 },
    { points: 2300, expectedTier: 24, expectedName: "Champion", nextRank: null, pointsToNext: null },
    { points: 9999, expectedTier: 24, expectedName: "Champion", nextRank: null, pointsToNext: null },
  ];

  for (const item of tierExpectations) {
    const res = getNormalDuelRank(item.points);
    assert(
      res.tier === item.expectedTier &&
        res.rankName === item.expectedName &&
        res.nextRankName === item.nextRank &&
        res.pointsToNextRank === item.pointsToNext,
      `DP ${item.points} -> Tier ${item.expectedTier} (${item.expectedName}), Next: ${item.nextRank} (${item.pointsToNext} DP)`,
      `Got Tier ${res.tier} (${res.rankName}), Next: ${res.nextRankName} (${res.pointsToNextRank} DP)`
    );
  }

  // ==========================================
  // PART 3: DATABASE CHAMPION LOGIC TESTS
  // ==========================================
  console.log("\n--- PART 3: Database & Champion Logic Tests ---");
  await connectToDatabase();

  const cleanupUserIds: string[] = [];
  const cleanupRoomCodes: string[] = [];

  try {
    const u1Id = new mongoose.Types.ObjectId().toString(); // Top 1: 3000 DP, 10 duels
    const u2Id = new mongoose.Types.ObjectId().toString(); // Top 2: 2500 DP, 8 duels
    const u3Id = new mongoose.Types.ObjectId().toString(); // Top 3: 2000 DP, 5 duels
    const u4Id = new mongoose.Types.ObjectId().toString(); // Top 4: 1900 DP, 6 duels (Not champion initially)
    const uLowGamesId = new mongoose.Types.ObjectId().toString(); // 5000 DP, only 2 duels (< 3 duels -> NOT champion)
    const uBannedId = new mongoose.Types.ObjectId().toString(); // 4000 DP, 10 duels, isBanned: true (NOT champion)

    cleanupUserIds.push(u1Id, u2Id, u3Id, u4Id, uLowGamesId, uBannedId);

    await User.create([
      {
        _id: u1Id,
        username: `c1_${Date.now()}`.slice(0, 20),
        usernameNormalized: `c1_${Date.now()}`.slice(0, 20),
        displayName: "Champion One",
        provider: "credentials",
        providerAccountId: `test_${u1Id}`,
        duelPoints: 3000,
        duelsPlayed: 10,
        duelsWon: 10,
        duelsLost: 0,
        duelRating: 1200,
        isBanned: false,
      },
      {
        _id: u2Id,
        username: `c2_${Date.now()}`.slice(0, 20),
        usernameNormalized: `c2_${Date.now()}`.slice(0, 20),
        displayName: "Champion Two",
        provider: "credentials",
        providerAccountId: `test_${u2Id}`,
        duelPoints: 2500,
        duelsPlayed: 8,
        duelsWon: 7,
        duelsLost: 1,
        duelRating: 1150,
        isBanned: false,
      },
      {
        _id: u3Id,
        username: `c3_${Date.now()}`.slice(0, 20),
        usernameNormalized: `c3_${Date.now()}`.slice(0, 20),
        displayName: "Champion Three",
        provider: "credentials",
        providerAccountId: `test_${u3Id}`,
        duelPoints: 2000,
        duelsPlayed: 5,
        duelsWon: 4,
        duelsLost: 1,
        duelRating: 1100,
        isBanned: false,
      },
      {
        _id: u4Id,
        username: `c4_${Date.now()}`.slice(0, 20),
        usernameNormalized: `c4_${Date.now()}`.slice(0, 20),
        displayName: "Contender Four",
        provider: "credentials",
        providerAccountId: `test_${u4Id}`,
        duelPoints: 1900,
        duelsPlayed: 6,
        duelsWon: 4,
        duelsLost: 2,
        duelRating: 1050,
        isBanned: false,
      },
      {
        _id: uLowGamesId,
        username: `cl_${Date.now()}`.slice(0, 20),
        usernameNormalized: `cl_${Date.now()}`.slice(0, 20),
        displayName: "Low Games Player",
        provider: "credentials",
        providerAccountId: `test_${uLowGamesId}`,
        duelPoints: 5000,
        duelsPlayed: 2, // < 3 duels -> Ineligible for Champion
        duelsWon: 2,
        duelsLost: 0,
        duelRating: 1300,
        isBanned: false,
      },
      {
        _id: uBannedId,
        username: `cb_${Date.now()}`.slice(0, 20),
        usernameNormalized: `cb_${Date.now()}`.slice(0, 20),
        displayName: "Banned High Rank",
        provider: "credentials",
        providerAccountId: `test_${uBannedId}`,
        duelPoints: 4000,
        duelsPlayed: 10,
        duelsWon: 10,
        duelsLost: 0,
        duelRating: 1250,
        isBanned: true, // Banned -> Ineligible for Champion
      },
    ]);

    const top3Ids = await getTop3ChampionUserIds();
    
    assert(top3Ids.includes(u1Id), "Top 1 eligible user is in top 3 Champions");
    assert(top3Ids.includes(u2Id), "Top 2 eligible user is in top 3 Champions");
    assert(top3Ids.includes(u3Id), "Top 3 eligible user is in top 3 Champions");
    assert(!top3Ids.includes(u4Id), "Rank #4 user is NOT in top 3 Champions");
    assert(!top3Ids.includes(uLowGamesId), "User with only 2 duels played is excluded from Champion status");
    assert(!top3Ids.includes(uBannedId), "Banned user is excluded from Champion status");

    const pos1 = await resolveUserChampionPosition(u1Id, top3Ids);
    const pos2 = await resolveUserChampionPosition(u2Id, top3Ids);
    const pos3 = await resolveUserChampionPosition(u3Id, top3Ids);
    const pos4 = await resolveUserChampionPosition(u4Id, top3Ids);

    assert(pos1 === 1, "User 1 receives Champion #1 position");
    assert(pos2 === 2, "User 2 receives Champion #2 position");
    assert(pos3 === 3, "User 3 receives Champion #3 position");
    assert(pos4 === null, "User 4 receives null Champion position");

    // Check full getDuelRank outputs
    const rankInfo1 = getDuelRank(3000, pos1);
    assert(rankInfo1.isChampion === true, "User 1 has isChampion = true");
    assert(rankInfo1.rankName === "Champion #1", "User 1 rankName is 'Champion #1'");
    assert(rankInfo1.pointsToNextRank === null, "Champion has pointsToNextRank = null");
    assert(rankInfo1.nextRankName === null, "Champion has nextRankName = null");

    const rankInfo4 = getDuelRank(1900, pos4);
    assert(rankInfo4.isChampion === false, "User 4 has isChampion = false");
    assert(rankInfo4.rankName === "Apex II", `User 4 rankName is 'Apex II' (Got: ${rankInfo4.rankName})`);

    // Dynamic Overtaking: User 4 gains points to 2200 and overtakes User 3
    await User.findByIdAndUpdate(u4Id, { duelPoints: 2200 });
    const updatedTop3 = await getTop3ChampionUserIds();
    const updatedPos4 = await resolveUserChampionPosition(u4Id, updatedTop3);
    const updatedPos3 = await resolveUserChampionPosition(u3Id, updatedTop3);

    assert(updatedPos4 === 3, "User 4 dynamically becomes Champion #3 after overtaking User 3 in Duel Points");
    assert(updatedPos3 === null, "User 3 dynamically drops to normal rank (Legend I) after being overtaken");

    // ==========================================
    // PART 4: MATCH FINALIZATION & POINT ATOMICITY
    // ==========================================
    console.log("\n--- PART 4: Match Finalization & Point Atomicity Tests ---");

    const matchP1 = new mongoose.Types.ObjectId().toString(); // 100 DP
    const matchP2 = new mongoose.Types.ObjectId().toString(); // 5 DP (will test clamping)
    cleanupUserIds.push(matchP1, matchP2);

    await User.create([
      {
        _id: matchP1,
        username: `mp1_${Date.now()}`.slice(0, 20),
        usernameNormalized: `mp1_${Date.now()}`.slice(0, 20),
        displayName: "Match P1",
        provider: "credentials",
        providerAccountId: `test_${matchP1}`,
        duelPoints: 100,
        duelRating: 1000,
      },
      {
        _id: matchP2,
        username: `mp2_${Date.now()}`.slice(0, 20),
        usernameNormalized: `mp2_${Date.now()}`.slice(0, 20),
        displayName: "Match P2",
        provider: "credentials",
        providerAccountId: `test_${matchP2}`,
        duelPoints: 5, // < 10 DP -> will test non-negative floor
        duelRating: 1000,
      },
    ]);

    const roomCodePoints = `DUEL-PTS_${Date.now()}`.slice(0, 15).toUpperCase();
    cleanupRoomCodes.push(roomCodePoints);

    await DuelRoom.create({
      roomCode: roomCodePoints,
      difficulty: "Easy",
      rounds: 3,
      currentRound: 2,
      roundsData: [],
      player1: { userId: matchP1, username: "p1", displayName: "P1", status: "SOLVED" },
      player2: { userId: matchP2, username: "p2", displayName: "P2", status: "CODING" },
      player1Score: 2,
      player2Score: 0,
      status: "FINISHED",
      winner: matchP1, // P1 wins -> +25 DP; P2 loses -> -10 DP (clamped to 0)
      finishedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    });

    await finalizeDuelMatch(roomCodePoints);

    const [uMatchP1After, uMatchP2After, finalizedRoom] = await Promise.all([
      User.findById(matchP1),
      User.findById(matchP2),
      DuelRoom.findOne({ roomCode: roomCodePoints }),
    ]);

    assert(uMatchP1After?.duelPoints === 125, `Winner gained +25 DP: 100 -> 125 DP (Got: ${uMatchP1After?.duelPoints})`);
    assert(uMatchP2After?.duelPoints === 0, `Loser clamped to 0 DP: 5 - 10 -> 0 DP (Got: ${uMatchP2After?.duelPoints})`);
    assert(finalizedRoom?.player1PointsDelta === 25, `Room recorded player1PointsDelta = +25 (Got: ${finalizedRoom?.player1PointsDelta})`);
    assert(finalizedRoom?.player2PointsDelta === -5, `Room recorded player2PointsDelta = -5 (clamped applied change, Got: ${finalizedRoom?.player2PointsDelta})`);

    // Idempotency: Calling finalize again does nothing
    await finalizeDuelMatch(roomCodePoints);
    const uMatchP1After2 = await User.findById(matchP1);
    assert(uMatchP1After2?.duelPoints === 125, "Idempotent: Second finalize call does not double-award DP");

  } finally {
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

runDuelPointsAndRanksTestSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
