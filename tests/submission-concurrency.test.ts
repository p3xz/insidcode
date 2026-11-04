import assert from "node:assert";

/**
 * Unit test simulating concurrent submission evaluations for the same user and problem.
 * Tests that atomic conditional update guarantees XP is credited exactly once.
 */

interface MockUser {
  _id: string;
  xp: number;
  solvedProblems: string[];
  attemptedProblems: string[];
  totalSubmissions: number;
  acceptedSubmissions: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: string;
}

// Simulates MongoDB document-level atomic lock and conditional execution
class MockMongoCollection {
  private user: MockUser;
  private locked: boolean = false;

  constructor(user: MockUser) {
    this.user = JSON.parse(JSON.stringify(user));
  }

  // Atomically executes findOneAndUpdate with lock simulation
  async findOneAndUpdate(
    filter: { _id: string; solvedProblems?: { $ne: string }; lastActiveDate?: { $ne: string } },
    update: {
      $inc?: { xp?: number; totalSubmissions?: number; acceptedSubmissions?: number };
      $addToSet?: { solvedProblems?: string; attemptedProblems?: string };
      $set?: { currentStreak?: number; longestStreak?: number; lastActiveDate?: string };
    }
  ): Promise<MockUser | null> {
    // Acquire mutex (atomic document lock in MongoDB engine)
    while (this.locked) {
      await new Promise((resolve) => setTimeout(resolve, 1));
    }
    this.locked = true;

    try {
      if (this.user._id !== filter._id) {
        return null;
      }

      if (filter.solvedProblems && filter.solvedProblems.$ne) {
        if (this.user.solvedProblems.includes(filter.solvedProblems.$ne)) {
          return null; // Condition not met!
        }
      }

      if (filter.lastActiveDate && filter.lastActiveDate.$ne) {
        if (this.user.lastActiveDate === filter.lastActiveDate.$ne) {
          return null; // Condition not met!
        }
      }

      // Apply $inc
      if (update.$inc) {
        if (update.$inc.xp) this.user.xp += update.$inc.xp;
        if (update.$inc.totalSubmissions) this.user.totalSubmissions += update.$inc.totalSubmissions;
        if (update.$inc.acceptedSubmissions) this.user.acceptedSubmissions += update.$inc.acceptedSubmissions;
      }

      // Apply $addToSet
      if (update.$addToSet) {
        if (update.$addToSet.solvedProblems && !this.user.solvedProblems.includes(update.$addToSet.solvedProblems)) {
          this.user.solvedProblems.push(update.$addToSet.solvedProblems);
        }
        if (update.$addToSet.attemptedProblems && !this.user.attemptedProblems.includes(update.$addToSet.attemptedProblems)) {
          this.user.attemptedProblems.push(update.$addToSet.attemptedProblems);
        }
      }

      // Apply $set
      if (update.$set) {
        if (update.$set.currentStreak !== undefined) this.user.currentStreak = update.$set.currentStreak;
        if (update.$set.longestStreak !== undefined) this.user.longestStreak = update.$set.longestStreak;
        if (update.$set.lastActiveDate !== undefined) this.user.lastActiveDate = update.$set.lastActiveDate;
      }

      return JSON.parse(JSON.stringify(this.user));
    } finally {
      this.locked = false;
    }
  }

  getUser(): MockUser {
    return JSON.parse(JSON.stringify(this.user));
  }
}

async function simulateEvaluation(
  mockDb: MockMongoCollection,
  userId: string,
  problemId: string,
  questionXp: number
): Promise<{ awardedXp: number; isFirstSolve: boolean }> {
  const firstSolveUpdate = await mockDb.findOneAndUpdate(
    {
      _id: userId,
      solvedProblems: { $ne: problemId },
    },
    {
      $inc: {
        xp: questionXp,
        totalSubmissions: 1,
        acceptedSubmissions: 1,
      },
      $addToSet: {
        solvedProblems: problemId,
        attemptedProblems: problemId,
      },
    }
  );

  if (firstSolveUpdate) {
    return { awardedXp: questionXp, isFirstSolve: true };
  } else {
    // Problem was already solved; increment submissions without awarding XP
    await mockDb.findOneAndUpdate(
      { _id: userId },
      {
        $inc: { totalSubmissions: 1, acceptedSubmissions: 1 },
        $addToSet: { attemptedProblems: problemId },
      }
    );
    return { awardedXp: 0, isFirstSolve: false };
  }
}

async function runTest() {
  const initialUser: MockUser = {
    _id: "user_test_123",
    xp: 100,
    solvedProblems: ["problem-1"],
    attemptedProblems: ["problem-1"],
    totalSubmissions: 5,
    acceptedSubmissions: 2,
    currentStreak: 1,
    longestStreak: 1,
    lastActiveDate: "2026-10-26",
  };

  const db = new MockMongoCollection(initialUser);
  const problemToSolve = "problem-2";
  const questionXp = 50;

  // Run 10 concurrent evaluations for the exact same user and problem
  const results = await Promise.all([
    simulateEvaluation(db, initialUser._id, problemToSolve, questionXp),
    simulateEvaluation(db, initialUser._id, problemToSolve, questionXp),
    simulateEvaluation(db, initialUser._id, problemToSolve, questionXp),
    simulateEvaluation(db, initialUser._id, problemToSolve, questionXp),
    simulateEvaluation(db, initialUser._id, problemToSolve, questionXp),
    simulateEvaluation(db, initialUser._id, problemToSolve, questionXp),
    simulateEvaluation(db, initialUser._id, problemToSolve, questionXp),
    simulateEvaluation(db, initialUser._id, problemToSolve, questionXp),
    simulateEvaluation(db, initialUser._id, problemToSolve, questionXp),
    simulateEvaluation(db, initialUser._id, problemToSolve, questionXp),
  ]);

  const firstSolves = results.filter((r) => r.isFirstSolve);
  const totalAwardedXp = results.reduce((sum, r) => sum + r.awardedXp, 0);
  const finalUser = db.getUser();

  // Assertions:
  // 1. Exactly one request was recognized as first solve
  assert.strictEqual(firstSolves.length, 1, "Exactly one evaluation must be marked as firstSolve");
  // 2. Exactly questionXp (50) was awarded in total across all 10 concurrent requests
  assert.strictEqual(totalAwardedXp, questionXp, "Total awarded XP must equal exactly questionXp");
  // 3. Final user XP must be initial (100) + 50 = 150
  assert.strictEqual(finalUser.xp, 150, "User final XP must be 150");
  // 4. problem-2 should appear in solvedProblems exactly once
  const occurrences = finalUser.solvedProblems.filter((p) => p === problemToSolve).length;
  assert.strictEqual(occurrences, 1, "problemToSolve must appear exactly once in solvedProblems");
  // 5. Total submissions must be 5 + 10 = 15
  assert.strictEqual(finalUser.totalSubmissions, 15, "Total submissions must increment for every evaluation");

  console.log("PASS: Concurrent submission evaluation test - XP awarded exactly once across 10 concurrent requests!");
}

runTest().catch((err) => {
  console.error("FAIL: Concurrent submission evaluation test", err);
  process.exit(1);
});
