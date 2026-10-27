import { IUser, SubmissionStatus, IFailedTestCaseInfo } from "@/types";
import { User } from "@/models/User";
import { Question } from "@/models/Question";
import { Submission } from "@/models/Submission";
import { LanguageSolve } from "@/models/LanguageSolve";
import { executeCodeOnlineCompilerSync } from "@/lib/onlinecompiler";
import { calculateStreak, getTodayDateString } from "@/lib/streak";
import { checkAndAwardAchievements } from "@/lib/achievements";

export interface SubmissionEvaluationResult {
  submissionId: string;
  status: SubmissionStatus;
  runtime: number;
  testsPassed: number;
  totalTests: number;
  awardedXp: number;
  awardedLanguagePoints: number;
  isFirstSolve: boolean;
  currentStreak: number;
  totalXp: number;
  errorDetails?: string;
  failedTestCase?: IFailedTestCaseInfo;
}

/**
 * Shared, server-authoritative submission evaluator used by standard problem submissions and duels.
 */
export async function evaluateAndRecordSubmission(
  user: IUser,
  problemId: string,
  language: "python" | "javascript" | "c" | "cpp" | "java",
  code: string
): Promise<SubmissionEvaluationResult> {
  const question = await Question.findOne({ problemId, isPublished: true });
  if (!question) {
    throw new Error("Problem not found or unpublished.");
  }

  // Determine test suite (hidden test cases or fallback examples)
  const testSuite =
    question.hiddenTestCases && question.hiddenTestCases.length > 0
      ? question.hiddenTestCases
      : question.examples.map((ex) => ({ input: ex.input, expectedOutput: ex.output }));

  if (testSuite.length === 0) {
    throw new Error("No test cases configured for this problem.");
  }

  let status: SubmissionStatus = "Accepted";
  let testsPassed = 0;
  let totalRuntime = 0;
  let errorDetails: string | undefined = undefined;
  let failedTestCase: IFailedTestCaseInfo | undefined = undefined;

  // Execute test cases sequentially
  for (let i = 0; i < testSuite.length; i++) {
    const testCase = testSuite[i];
    const startTime = performance.now();

    const execResult = await executeCodeOnlineCompilerSync(language, code, testCase.input);

    const endTime = performance.now();
    const elapsedSec = (endTime - startTime) / 1000;
    totalRuntime += elapsedSec;

    if (execResult.systemError) {
      status = "System Error";
      errorDetails = execResult.systemError || "Execution infrastructure service error occurred.";
      break;
    }

    if (execResult.compilationError) {
      status = "Compilation Error";
      errorDetails = execResult.compilationError;
      break;
    }

    if (execResult.isTimeout) {
      status = "Time Limit Exceeded";
      errorDetails = "Time Limit Exceeded (30s execution limit reached).";
      break;
    }

    if (!execResult.success || execResult.runtimeError) {
      status = "Runtime Error";
      errorDetails = execResult.runtimeError || execResult.stderr || "Runtime execution failed.";
      break;
    }

    // Output comparison with whitespace, newline, and case normalization
    const normalize = (str: unknown) =>
      String(str ?? "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .trim()
        .split("\n")
        .map((line) => line.trimEnd())
        .join("\n")
        .toLowerCase();

    const actual = normalize(execResult.stdout || "");
    const expected = normalize(testCase.expectedOutput || "");

    if (actual === expected) {
      testsPassed++;
    } else {
      status = "Wrong Answer";

      // A test case is public if it matches an example in question.examples
      // or if no hiddenTestCases existed and testSuite was built from examples.
      const isPublic =
        Boolean(
          question.examples &&
          question.examples.some(
            (ex) =>
              normalize(ex.input) === normalize(testCase.input) &&
              normalize(ex.output) === normalize(testCase.expectedOutput)
          )
        ) || (question.hiddenTestCases.length === 0 && i < question.examples.length);

      const remainingFailed = Math.max(0, testSuite.length - (i + 1));

      failedTestCase = {
        testCaseIndex: i + 1,
        isPublic,
        ...(isPublic
          ? {
              input: testCase.input,
              expectedOutput: testCase.expectedOutput,
              actualOutput: (execResult.stdout ? execResult.stdout.trim() : "(empty output)").slice(0, 1000),
            }
          : {}),
        remainingFailedCount: remainingFailed,
      };

      errorDetails = isPublic
        ? `Test Case ${i + 1} Failed: Output mismatch`
        : `A hidden test case failed.`;
      break;
    }
  }

  const avgRuntime = Number(
    (totalRuntime / Math.max(1, testsPassed + (status !== "Accepted" ? 1 : 0))).toFixed(3)
  );

  let awardedXp = 0;
  let awardedLanguagePoints = 0;
  let isFirstAcceptedSolve = false;
  let activeUser = user;

  if (status === "Accepted") {
    // 1. Handle per-language points (+10 per unique problem + language solve)
    try {
      await LanguageSolve.create({
        userId: user._id.toString(),
        problemId: question.problemId,
        language,
        points: 10,
      });
      awardedLanguagePoints = 10;
    } catch (err: unknown) {
      // E11000 duplicate key error indicates (userId, problemId, language) already awarded points
      const mongoErr = err as { code?: number };
      if (mongoErr?.code !== 11000) {
        console.error("LanguageSolve insertion error:", err);
      }
    }

    // 2. Atomic first-solve XP award and concurrency control
    // Atomically claim first solve only if problemId is not already in solvedProblems
    const firstSolveUpdate = await User.findOneAndUpdate(
      {
        _id: user._id,
        solvedProblems: { $ne: problemId },
      },
      {
        $inc: {
          xp: question.xp,
          totalSubmissions: 1,
          acceptedSubmissions: 1,
          ...(awardedLanguagePoints > 0 ? { [`languagePoints.${language}`]: awardedLanguagePoints } : {}),
        },
        $addToSet: {
          solvedProblems: problemId,
          attemptedProblems: problemId,
        },
      },
      { new: true }
    );

    if (firstSolveUpdate) {
      isFirstAcceptedSolve = true;
      awardedXp = question.xp;
      activeUser = firstSolveUpdate;

      // Check achievements for first solve
      await checkAndAwardAchievements(activeUser, question.difficulty, question.phase);
    } else {
      isFirstAcceptedSolve = false;
      awardedXp = 0;
      const subsequentUpdate = await User.findByIdAndUpdate(
        user._id,
        {
          $inc: {
            totalSubmissions: 1,
            acceptedSubmissions: 1,
            ...(awardedLanguagePoints > 0 ? { [`languagePoints.${language}`]: awardedLanguagePoints } : {}),
          },
          $addToSet: { attemptedProblems: problemId },
        },
        { new: true }
      );
      if (subsequentUpdate) {
        activeUser = subsequentUpdate;
      }
    }

    // 3. Concurrency-safe streak update
    const today = getTodayDateString();
    if (activeUser.lastActiveDate !== today) {
      const streakResult = calculateStreak(
        activeUser.currentStreak,
        activeUser.longestStreak,
        activeUser.lastActiveDate
      );

      // Atomically update streak only if lastActiveDate is not already updated to today
      const streakUpdate = await User.findOneAndUpdate(
        {
          _id: activeUser._id,
          lastActiveDate: { $ne: today },
        },
        {
          $set: {
            currentStreak: streakResult.currentStreak,
            longestStreak: streakResult.longestStreak,
            lastActiveDate: streakResult.lastActiveDate,
          },
        },
        { new: true }
      );

      if (streakUpdate) {
        activeUser = streakUpdate;
      }
    }
  } else {
    // Non-accepted submission: atomically increment totalSubmissions and record attemptedProblems
    const nonAcceptedUpdate = await User.findByIdAndUpdate(
      user._id,
      {
        $inc: { totalSubmissions: 1 },
        $addToSet: { attemptedProblems: problemId },
      },
      { new: true }
    );
    if (nonAcceptedUpdate) {
      activeUser = nonAcceptedUpdate;
    }
  }

  // Create submission record
  const submission = await Submission.create({
    userId: activeUser._id.toString(),
    username: activeUser.username,
    problemId: question.problemId,
    problemTitle: question.title,
    language,
    code,
    status,
    runtime: avgRuntime,
    errorDetails,
    testsPassed,
    totalTests: testSuite.length,
    awardedXp,
    awardedLanguagePoints,
  });

  return {
    submissionId: submission._id.toString(),
    status,
    runtime: avgRuntime,
    testsPassed,
    totalTests: testSuite.length,
    awardedXp,
    awardedLanguagePoints,
    isFirstSolve: isFirstAcceptedSolve,
    currentStreak: activeUser.currentStreak,
    totalXp: activeUser.xp,
    errorDetails: status !== "Accepted" ? errorDetails : undefined,
    failedTestCase: status === "Wrong Answer" ? failedTestCase : undefined,
  };
}
