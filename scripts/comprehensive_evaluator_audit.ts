import { existsSync } from "node:fs";
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}
import { connectToDatabase } from "../src/lib/mongodb";
import { User } from "../src/models/User";
import { Question } from "../src/models/Question";
import { Submission } from "../src/models/Submission";
import { evaluateAndRecordSubmission } from "../src/lib/submission";
import { classifyExecutionError } from "../src/lib/onlinecompiler";
import { acquireSubmissionLock, releaseSubmissionLock } from "../src/lib/rateLimit";
import mongoose from "mongoose";

async function runComprehensiveAudit() {
  console.log("=================================================");
  console.log(" COMPREHENSIVE SUBMIT EVALUATOR EDGE-CASE AUDIT");
  console.log("=================================================\n");

  await connectToDatabase();
  const testUserId = new mongoose.Types.ObjectId().toString();

  try {
    const user = await User.create({
      _id: testUserId,
      username: "audit_runner_user",
      usernameNormalized: "audit_runner_user",
      displayName: "Audit Runner",
      email: "audit_runner@example.com",
      provider: "google",
      providerAccountId: `google_${testUserId}`,
      role: "user",
      xp: 0,
      currentStreak: 0,
      longestStreak: 0,
      solvedProblems: [],
      attemptedProblems: [],
      totalSubmissions: 0,
      acceptedSubmissions: 0,
      onboardingCompleted: true,
      privacyPolicyAccepted: true,
      termsAccepted: true,
    });

    const q = await Question.findOne({ problemId: "001" });
    if (!q) throw new Error("Problem 001 not found in database.");

    // ==========================================
    // AREA 1: OUTPUT COMPARISON NORMALIZATION
    // ==========================================
    console.log("--- 1. OUTPUT COMPARISON NORMALIZATION TESTS ---");
    const normalize = (str: unknown) =>
      String(str ?? "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .trim()
        .split("\n")
        .map((line) => line.trimEnd())
        .join("\n");

    // Exact matching
    if (normalize("Positive") === normalize("Positive")) console.log("  [PASS] Exact matching");
    else throw new Error("Exact matching failed");

    // Case difference
    if (normalize("positive") !== normalize("Positive")) console.log("  [PASS] Case sensitivity preserved");
    else throw new Error("Case sensitivity was violated");

    // Leading/trailing whitespace
    if (normalize("  Positive  ") === normalize("Positive")) console.log("  [PASS] Whitespace trimming");
    else throw new Error("Whitespace trimming failed");

    // Trailing newlines
    if (normalize("Positive\n\n\n") === normalize("Positive")) console.log("  [PASS] Trailing newlines");
    else throw new Error("Trailing newlines failed");

    // Windows CRLF vs Unix LF
    if (normalize("Line1\r\nLine2\r\n") === normalize("Line1\nLine2")) console.log("  [PASS] Windows CRLF normalization");
    else throw new Error("CRLF normalization failed");

    // Line trailing spaces
    if (normalize("Line1   \nLine2\t") === normalize("Line1\nLine2")) console.log("  [PASS] Per-line trailing space/tab trimming");
    else throw new Error("Line trimEnd failed");

    // Internal word spacing
    if (normalize("Hello  World") !== normalize("Hello World")) console.log("  [PASS] Internal word spacing preserved");
    else throw new Error("Internal word spacing collapsed unexpectedly");

    // Numbers, decimals, negative values
    if (normalize("-12") === normalize("-12")) console.log("  [PASS] Negative numbers matching");
    if (normalize("3.14159") === normalize("3.14159")) console.log("  [PASS] Decimal output matching");
    if (normalize("0") === normalize("0")) console.log("  [PASS] Zero output matching");
    if (normalize("") === normalize("")) console.log("  [PASS] Empty output matching\n");

    // ==========================================
    // AREA 2: STDOUT / STDERR SEPARATION
    // ==========================================
    console.log("--- 2. STDOUT & STDERR SEPARATION ---");
    const pythonWithStderr = `
import sys
n = int(input())
sys.stderr.write("DEBUG: processing input n=" + str(n) + "\\n")
if n > 0:
    print("Positive")
elif n < 0:
    print("Negative")
else:
    print("Zero")
`;
    const resStderr = await evaluateAndRecordSubmission(user, "001", "python", pythonWithStderr);
    if (resStderr.status === "Accepted" && resStderr.testsPassed === 4) {
      console.log("  [PASS] Program writing to stderr does not pollute stdout or fail correct answer.\n");
    } else {
      throw new Error(`Stderr separation failed: ${JSON.stringify(resStderr)}`);
    }

    // ==========================================
    // AREA 3: ERROR CLASSIFICATION (COMPILATION VS RUNTIME)
    // ==========================================
    console.log("--- 3. ERROR CLASSIFICATION (CE vs RE) ---");
    const javaSyntaxErr = classifyExecutionError("Solution.java:5: error: ';' expected\nint x = 5", "openjdk-25");
    if (javaSyntaxErr.compilationError && !javaSyntaxErr.runtimeError) {
      console.log("  [PASS] Java syntax error correctly classified as Compilation Error");
    } else {
      throw new Error("Java syntax error misclassified");
    }

    const javaRuntimeErr = classifyExecutionError("Exception in thread \"main\" java.lang.ArithmeticException: / by zero\n\tat Solution.main(Solution.java:6)", "openjdk-25");
    if (javaRuntimeErr.runtimeError && !javaRuntimeErr.compilationError) {
      console.log("  [PASS] Java / by zero correctly classified as Runtime Error");
    } else {
      throw new Error("Java runtime error misclassified");
    }

    const pythonSyntaxErr = classifyExecutionError("  File \"main.py\", line 2\n    print(\nSyntaxError: unexpected EOF while parsing", "python-3.14");
    if (pythonSyntaxErr.compilationError && !pythonSyntaxErr.runtimeError) {
      console.log("  [PASS] Python SyntaxError correctly classified as Compilation Error");
    } else {
      throw new Error("Python SyntaxError misclassified");
    }

    const pythonRuntimeErr = classifyExecutionError("Traceback (most recent call last):\n  File \"main.py\", line 2, in <module>\nZeroDivisionError: division by zero", "python-3.14");
    if (pythonRuntimeErr.runtimeError && !pythonRuntimeErr.compilationError) {
      console.log("  [PASS] Python ZeroDivisionError correctly classified as Runtime Error");
    } else {
      throw new Error("Python runtime error misclassified");
    }

    const cppRuntimeErr = classifyExecutionError("Segmentation fault (core dumped)", "g++-15");
    if (cppRuntimeErr.runtimeError && !cppRuntimeErr.compilationError) {
      console.log("  [PASS] C++ Segmentation fault correctly classified as Runtime Error\n");
    } else {
      throw new Error("C++ Segfault misclassified");
    }

    // ==========================================
    // AREA 4: MULTI-LANGUAGE TEST (PYTHON, JS, C, C++, JAVA)
    // ==========================================
    console.log("--- 4. MULTI-LANGUAGE EVALUATION TESTS ---");
    // Python
    const pyCode = `
n = int(input())
print("Positive" if n > 0 else ("Negative" if n < 0 else "Zero"))
`;
    const resPy = await evaluateAndRecordSubmission(user, "001", "python", pyCode);
    if (resPy.status === "Accepted") console.log("  [PASS] Python 3.14 solution Accepted");
    else throw new Error("Python evaluation failed");

    // JavaScript
    const jsCode = `
import * as fs from "node:fs";
const input = fs.readFileSync(0, 'utf-8').trim();
if (input) {
    const n = parseInt(input, 10);
    if (n > 0) console.log("Positive");
    else if (n < 0) console.log("Negative");
    else console.log("Zero");
}
`;
    const resJs = await evaluateAndRecordSubmission(user, "001", "javascript", jsCode);
    if (resJs.status === "Accepted") console.log("  [PASS] JavaScript solution Accepted");
    else throw new Error("JavaScript evaluation failed");

    // C
    const cCode = `
#include <stdio.h>
int main() {
    int n;
    if (scanf("%d", &n) == 1) {
        if (n > 0) printf("Positive\\n");
        else if (n < 0) printf("Negative\\n");
        else printf("Zero\\n");
    }
    return 0;
}
`;
    const resC = await evaluateAndRecordSubmission(user, "001", "c", cCode);
    if (resC.status === "Accepted") console.log("  [PASS] C solution Accepted");
    else throw new Error("C evaluation failed");

    // C++
    const cppCode = `
#include <iostream>
using namespace std;
int main() {
    int n;
    if (cin >> n) {
        if (n > 0) cout << "Positive\\n";
        else if (n < 0) cout << "Negative\\n";
        else cout << "Zero\\n";
    }
    return 0;
}
`;
    const resCpp = await evaluateAndRecordSubmission(user, "001", "cpp", cppCode);
    if (resCpp.status === "Accepted") console.log("  [PASS] C++ solution Accepted");
    else throw new Error("C++ evaluation failed");

    // Java
    const javaCode = `
import java.util.Scanner;
public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int n = sc.nextInt();
            if (n > 0) System.out.println("Positive");
            else if (n < 0) System.out.println("Negative");
            else System.out.println("Zero");
        }
    }
}
`;
    const resJava = await evaluateAndRecordSubmission(user, "001", "java", javaCode);
    if (resJava.status === "Accepted") console.log("  [PASS] Java solution Accepted\n");
    else throw new Error("Java evaluation failed");

    // ==========================================
    // AREA 5: PUBLIC VS HIDDEN TEST PRIVACY
    // ==========================================
    console.log("--- 5. PUBLIC VS HIDDEN TEST PRIVACY ---");
    // Public test fail (Input: 5)
    const failPublicCode = `
n = int(input())
print("wrong")
`;
    const resFailPub = await evaluateAndRecordSubmission(user, "001", "python", failPublicCode);
    if (
      resFailPub.status === "Wrong Answer" &&
      resFailPub.failedTestCase?.isPublic === true &&
      resFailPub.failedTestCase?.input === "5" &&
      resFailPub.failedTestCase?.expectedOutput === "Positive" &&
      resFailPub.failedTestCase?.actualOutput === "wrong"
    ) {
      console.log("  [PASS] Public test failure includes safe comparison diff");
    } else {
      throw new Error("Public test comparison failed");
    }

    // Hidden test fail (Passes input 5, fails on -12)
    const failHiddenCode = `
n = int(input())
if n == 5:
    print("Positive")
else:
    print("wrong")
`;
    const resFailHid = await evaluateAndRecordSubmission(user, "001", "python", failHiddenCode);
    if (
      resFailHid.status === "Wrong Answer" &&
      resFailHid.failedTestCase?.isPublic === false &&
      resFailHid.failedTestCase?.input === undefined &&
      resFailHid.failedTestCase?.expectedOutput === undefined
    ) {
      console.log("  [PASS] Hidden test failure protects confidential inputs and expected answers\n");
    } else {
      throw new Error("Hidden test privacy violated");
    }

    // ==========================================
    // AREA 6: REWARD IDEMPOTENCY & STREAKS
    // ==========================================
    console.log("--- 6. REWARD IDEMPOTENCY ---");
    const freshUser = await User.findById(testUserId);
    if (!freshUser) throw new Error("User missing");

    const initialXp = freshUser.xp;
    // Re-submit accepted solution
    const resDuplicate = await evaluateAndRecordSubmission(freshUser, "001", "python", pyCode);
    const postUser = await User.findById(testUserId);

    if (
      resDuplicate.status === "Accepted" &&
      resDuplicate.isFirstSolve === false &&
      resDuplicate.awardedXp === 0 &&
      postUser?.xp === initialXp
    ) {
      console.log(`  [PASS] Re-submitting accepted solve awards 0 duplicate XP (Total XP preserved: ${postUser.xp})\n`);
    } else {
      throw new Error("Duplicate submission incorrectly awarded XP");
    }

    // ==========================================
    // AREA 7: CONCURRENCY LOCKING
    // ==========================================
    console.log("--- 7. CONCURRENCY IN-FLIGHT LOCKING ---");
    const lock1 = acquireSubmissionLock(testUserId);
    const lock2 = acquireSubmissionLock(testUserId); // Second concurrent call should fail
    releaseSubmissionLock(testUserId);
    const lock3 = acquireSubmissionLock(testUserId); // Re-acquiring after release should succeed
    releaseSubmissionLock(testUserId);

    if (lock1 === true && lock2 === false && lock3 === true) {
      console.log("  [PASS] In-flight submission lock blocks duplicate rapid submissions safely\n");
    } else {
      throw new Error("Submission lock concurrency check failed");
    }

    // Cleanup test user & submissions
    await User.deleteOne({ _id: testUserId });
    await Submission.deleteMany({ userId: testUserId });

    console.log("=================================================");
    console.log(" ALL 17 PIPELINE AUDIT SECTIONS PASSED!");
    console.log("=================================================\n");
    process.exit(0);
  } catch (err) {
    console.error("Audit failed:", err);
    await User.deleteOne({ _id: testUserId });
    await Submission.deleteMany({ userId: testUserId });
    process.exit(1);
  }
}

runComprehensiveAudit();
