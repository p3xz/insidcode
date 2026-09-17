import { existsSync } from "node:fs";
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}
import { connectToDatabase } from "../src/lib/mongodb";
import { User } from "../src/models/User";
import { Question } from "../src/models/Question";
import { evaluateAndRecordSubmission } from "../src/lib/submission";
import mongoose from "mongoose";

async function runEvaluationTests() {
  console.log("=== STARTING WRONG ANSWER FEEDBACK & EVALUATOR TEST SUITE ===\n");
  await connectToDatabase();

  const testUserId = new mongoose.Types.ObjectId().toString();

  try {
    // 1. Create a temporary test user
    const testUser = await User.create({
      _id: testUserId,
      username: "eval_test_user",
      usernameNormalized: "eval_test_user",
      displayName: "Eval Test User",
      email: "eval_test@example.com",
      provider: "google",
      providerAccountId: `google_${testUserId}`,
      role: "user",
      xp: 100,
      currentStreak: 1,
      longestStreak: 5,
      solvedProblems: [],
      attemptedProblems: [],
      totalSubmissions: 0,
      acceptedSubmissions: 0,
      onboardingCompleted: true,
      privacyPolicyAccepted: true,
      termsAccepted: true,
    });

    const question1 = await Question.findOne({ problemId: "001" });
    if (!question1) {
      throw new Error("Question 001 ('Positive, Negative, or Zero') not found in database.");
    }
    console.log(`Auditing Problem 001: "${question1.title}"`);
    console.log(`Examples count: ${question1.examples.length}`);
    console.log(`Hidden test cases count: ${question1.hiddenTestCases.length}`);

    // TEST 1: Wrong case test (User outputs lowercase "positive" instead of "Positive" for input 5)
    console.log("\nTEST 1: Case Sensitivity & Feedback Verification (User outputs lowercase 'positive')");
    const wrongCaseCode = `
n = int(input())
if n > 0:
    print("positive")
elif n < 0:
    print("negative")
else:
    print("zero")
`;
    const res1 = await evaluateAndRecordSubmission(testUser, "001", "python", wrongCaseCode);
    console.log(`  Verdict: ${res1.status}`);
    console.log(`  Tests Passed: ${res1.testsPassed} / ${res1.totalTests}`);
    console.log(`  Error Details: ${res1.errorDetails}`);
    console.log(`  Failed Test Case:`, res1.failedTestCase);

    if (
      res1.status === "Wrong Answer" &&
      res1.testsPassed === 0 &&
      res1.failedTestCase &&
      res1.failedTestCase.testCaseIndex === 1 &&
      res1.failedTestCase.isPublic === true &&
      res1.failedTestCase.input === "5" &&
      res1.failedTestCase.expectedOutput === "Positive" &&
      res1.failedTestCase.actualOutput === "positive" &&
      res1.failedTestCase.remainingFailedCount === 3
    ) {
      console.log("  [PASS] Correctly detected Wrong Answer with comprehensive comparison feedback!");
    } else {
      throw new Error(`Test 1 Failed: Unexpected result ${JSON.stringify(res1)}`);
    }

    // TEST 2: Correct submission with exact casing ("Positive", "Negative", "Zero")
    console.log("\nTEST 2: Fully Correct Submission (Input: 5 -> 'Positive', -12 -> 'Negative', 0 -> 'Zero')");
    const correctCode = `
n = int(input())
if n > 0:
    print("Positive")
elif n < 0:
    print("Negative")
else:
    print("Zero")
`;
    const res2 = await evaluateAndRecordSubmission(testUser, "001", "python", correctCode);
    console.log(`  Verdict: ${res2.status}`);
    console.log(`  Tests Passed: ${res2.testsPassed} / ${res2.totalTests}`);
    console.log(`  Awarded XP: +${res2.awardedXp} XP`);

    if (res2.status === "Accepted" && res2.testsPassed === res2.totalTests && res2.awardedXp === 10) {
      console.log("  [PASS] All test cases passed with Accepted verdict and XP awarded!");
    } else {
      throw new Error(`Test 2 Failed: Unexpected result ${JSON.stringify(res2)}`);
    }

    // TEST 3: Compilation / Syntax Error Feedback
    console.log("\nTEST 3: Compilation Error Feedback");
    const syntaxErrorCode = `
def broken_syntax(
    print("missing closing paren"
`;
    const res3 = await evaluateAndRecordSubmission(testUser, "001", "python", syntaxErrorCode);
    console.log(`  Verdict: ${res3.status}`);
    console.log(`  Error Details: ${res3.errorDetails}`);

    if (res3.status === "Compilation Error" || res3.status === "Runtime Error") {
      console.log(`  [PASS] Error accurately caught as ${res3.status} with diagnostic: ${res3.errorDetails?.slice(0, 80)}...`);
    } else {
      throw new Error(`Test 3 Failed: Unexpected result ${JSON.stringify(res3)}`);
    }

    // TEST 4: Hidden test case failure (passes public example 5 -> Positive, but fails negative numbers)
    console.log("\nTEST 4: Hidden Test Case Failure (Passes Example 1, fails Hidden Test Case 2)");
    const partialCode = `
n = int(input())
if n == 5:
    print("Positive")
else:
    print("WrongOutput")
`;
    const res4 = await evaluateAndRecordSubmission(testUser, "001", "python", partialCode);
    console.log(`  Verdict: ${res4.status}`);
    console.log(`  Tests Passed: ${res4.testsPassed} / ${res4.totalTests}`);
    console.log(`  Failed Test Case:`, res4.failedTestCase);

    if (
      res4.status === "Wrong Answer" &&
      res4.testsPassed === 1 &&
      res4.failedTestCase &&
      res4.failedTestCase.testCaseIndex === 2 &&
      res4.failedTestCase.isPublic === false &&
      res4.failedTestCase.expectedOutput === undefined // Hidden test cases must not expose expected output!
    ) {
      console.log("  [PASS] Hidden test case failed cleanly without exposing confidential expected answers!");
    } else {
      throw new Error(`Test 4 Failed: Hidden test case leak or mismatch: ${JSON.stringify(res4)}`);
    }

    // Teardown test user
    await User.deleteOne({ _id: testUserId });
    console.log("\n=== ALL EVALUATOR & WRONG ANSWER FEEDBACK TESTS PASSED! ===");
    process.exit(0);
  } catch (err) {
    console.error("Test Suite Failed:", err);
    await User.deleteOne({ _id: testUserId });
    process.exit(1);
  }
}

runEvaluationTests();
