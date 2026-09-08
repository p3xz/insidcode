import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { checkRateLimit, acquireSubmissionLock, releaseSubmissionLock } from "@/lib/rateLimit";
import { CodeSubmissionSchema } from "@/lib/validations";
import { Question } from "@/models/Question";
import { Submission } from "@/models/Submission";
import { executeCodeWithPiston } from "@/lib/piston";
import { calculateStreak } from "@/lib/streak";
import { checkAndAwardAchievements } from "@/lib/achievements";
import { SubmissionStatus } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const user = authResult.user;

    const rateLimit = checkRateLimit(`submit_${user._id}`, { limit: 12, windowMs: 60000 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many submission attempts. Please wait a moment before submitting again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parseResult = CodeSubmissionSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || "Invalid submission payload";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { problemId, language, code } = parseResult.data;

    // Acquire in-flight lock to prevent duplicate concurrent submissions
    const lockAcquired = acquireSubmissionLock(user._id.toString());
    if (!lockAcquired) {
      return NextResponse.json(
        { error: "A submission is already in progress. Please wait for the current submission to finish." },
        { status: 409 }
      );
    }

    try {
      const question = await Question.findOne({ problemId, isPublished: true });
      if (!question) {
        return NextResponse.json({ error: "Problem not found or unpublished." }, { status: 404 });
      }

    // Determine test suite (hidden test cases or fallback examples)
    const testSuite =
      question.hiddenTestCases && question.hiddenTestCases.length > 0
        ? question.hiddenTestCases
        : question.examples.map((ex) => ({ input: ex.input, expectedOutput: ex.output }));

    if (testSuite.length === 0) {
      return NextResponse.json(
        { error: "No test cases configured for this problem." },
        { status: 500 }
      );
    }

    let status: SubmissionStatus = "Accepted";
    let testsPassed = 0;
    let totalRuntime = 0;
    let errorDetails: string | undefined = undefined;

    // Execute test cases sequentially
    for (let i = 0; i < testSuite.length; i++) {
      const testCase = testSuite[i];
      const startTime = performance.now();

      const execResult = await executeCodeWithPiston(
        language,
        code,
        testCase.input
      );

      const endTime = performance.now();
      const elapsedSec = (endTime - startTime) / 1000;
      totalRuntime += elapsedSec;

      if (execResult.systemError) {
        status = "System Error";
        errorDetails = "Execution service error occurred.";
        break;
      }

      if (execResult.compilationError) {
        status = "Compilation Error";
        errorDetails = execResult.compilationError;
        break;
      }

      if (execResult.isTimeout) {
        status = "Time Limit Exceeded";
        errorDetails = "Time Limit Exceeded (10s)";
        break;
      }

      if (!execResult.success || execResult.runtimeError) {
        status = "Runtime Error";
        errorDetails = execResult.runtimeError || "Runtime execution failed.";
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

      const actual = normalize(execResult.stdout);
      const expected = normalize(testCase.expectedOutput);

      if (actual === expected) {
        testsPassed++;
      } else {
        status = "Wrong Answer";
        // Never reveal hidden input/expected output in errorDetails
        errorDetails = `Failed test case ${i + 1}`;
        break;
      }
    }

    const avgRuntime = Number((totalRuntime / Math.max(1, testsPassed + (status !== "Accepted" ? 1 : 0))).toFixed(3));

    let awardedXp = 0;
    const isFirstAcceptedSolve = status === "Accepted" && !user.solvedProblems.includes(problemId);

    // Update user statistics and progress
    user.totalSubmissions += 1;

    if (!user.attemptedProblems.includes(problemId)) {
      user.attemptedProblems.push(problemId);
    }

    if (status === "Accepted") {
      user.acceptedSubmissions += 1;

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
    });

    return NextResponse.json({
      submissionId: submission._id.toString(),
      status,
      runtime: avgRuntime,
      testsPassed,
      totalTests: testSuite.length,
      awardedXp,
      isFirstSolve: isFirstAcceptedSolve,
      currentStreak: user.currentStreak,
      totalXp: user.xp,
      errorDetails: status === "Compilation Error" ? errorDetails : undefined,
    });
    } finally {
      // Always release the in-flight lock regardless of outcome
      releaseSubmissionLock(user._id.toString());
    }
  } catch (error) {
    console.error("Submission processing error:", error);
    return NextResponse.json(
      { error: "Failed to process submission. Please try again." },
      { status: 500 }
    );
  }
}
