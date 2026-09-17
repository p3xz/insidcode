import { IUser, SubmissionStatus, IFailedTestCaseInfo } from "@/types";
import { Question } from "@/models/Question";
import { Submission } from "@/models/Submission";
import { LanguageSolve } from "@/models/LanguageSolve";
import { executeCodeOnlineCompilerSync } from "@/lib/onlinecompiler";
import { calculateStreak } from "@/lib/streak";
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

    // Output comparison with whitespace and newline normalization
    const normalize = (str: string) =>
      str
        .replace(/\r\n/g, "\n")
        .trim()
        .split("\n")
        .map((line) => line.trimEnd())
        .join("\n");

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
              actualOutput: execResult.stdout ? execResult.stdout.trim() : "(empty output)",
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
  const isFirstAcceptedSolve = status === "Accepted" && !user.solvedProblems.includes(problemId);

  // Update user statistics and progress
  user.totalSubmissions += 1;

  if (!user.attemptedProblems.includes(problemId)) {
    user.attemptedProblems.push(problemId);
  }

  if (status === "Accepted") {
    user.acceptedSubmissions += 1;

    // Handle per-language points (+10 per unique problem + language solve)
    try {
      await LanguageSolve.create({
        userId: user._id.toString(),
        problemId: question.problemId,
        language,
        points: 10,
      });
      awardedLanguagePoints = 10;
      if (!user.languagePoints) {
        user.languagePoints = { python: 0, javascript: 0, c: 0, cpp: 0, java: 0 };
      }
      const langKey = language as keyof typeof user.languagePoints;
      if (langKey in user.languagePoints) {
        user.languagePoints[langKey] = (user.languagePoints[langKey] || 0) + 10;
      }
    } catch (err: unknown) {
      // E11000 duplicate key error indicates (userId, problemId, language) already awarded points
      const mongoErr = err as { code?: number };
      if (mongoErr?.code === 11000) {
        awardedLanguagePoints = 0;
      } else {
        console.error("LanguageSolve insertion error:", err);
      }
    }

    if (isFirstAcceptedSolve) {
      awardedXp = question.xp;
      user.xp += awardedXp;
      user.solvedProblems.push(problemId);

      // Calculate streak
      const streakResult = calculateStreak(
        user.currentStreak,
        user.longestStreak,
        user.lastActiveDate
      );
      user.currentStreak = streakResult.currentStreak;
      user.longestStreak = streakResult.longestStreak;
      user.lastActiveDate = streakResult.lastActiveDate;

      // Check achievements
      await checkAndAwardAchievements(user, question.difficulty, question.phase);
    }
  }

  await user.save();

  // Create submission record
  const submission = await Submission.create({
    userId: user._id.toString(),
    username: user.username,
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
    currentStreak: user.currentStreak,
    totalXp: user.xp,
    errorDetails: status !== "Accepted" ? errorDetails : undefined,
    failedTestCase: status === "Wrong Answer" ? failedTestCase : undefined,
  };
}
