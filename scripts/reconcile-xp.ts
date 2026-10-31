/**
 * InsidCode XP Reconciliation Script
 *
 * Reconciles user.xp and user.languagePoints against server-authoritative
 * LanguageSolve records.
 *
 * SAFETY FIRST:
 * - Runs in DRY-RUN mode by default. Never mutates the database unless explicitly
 *   invoked with both `--apply` AND `--confirm-backup`.
 *
 * Usage:
 *   npx tsx scripts/reconcile-xp.ts                     # Dry run for all users
 *   npx tsx scripts/reconcile-xp.ts --user alice        # Dry run for a specific user
 *   npx tsx scripts/reconcile-xp.ts --apply --confirm-backup  # Apply fixes
 */

import { connectToDatabase } from "../src/lib/mongodb";
import { User } from "../src/models/User";
import { LanguageSolve } from "../src/models/LanguageSolve";

interface LanguagePointsBreakdown {
  python: number;
  javascript: number;
  c: number;
  cpp: number;
  java: number;
}

export interface UserReconciliationReport {
  userId: string;
  username: string;
  currentXp: number;
  expectedXp: number;
  currentLangPoints: LanguagePointsBreakdown;
  expectedLangPoints: LanguagePointsBreakdown;
  xpDifference: number;
  hasDrift: boolean;
}

export function computeExpectedLanguagePoints(
  solves: Array<{ language: string; points?: number }>
): LanguagePointsBreakdown {
  const result: LanguagePointsBreakdown = {
    python: 0,
    javascript: 0,
    c: 0,
    cpp: 0,
    java: 0,
  };

  for (const solve of solves) {
    const lang = solve.language as keyof LanguagePointsBreakdown;
    if (lang in result) {
      result[lang] += typeof solve.points === "number" ? solve.points : 10;
    }
  }

  return result;
}

export function computeExpectedUserXp(
  expectedLangPoints: LanguagePointsBreakdown,
  nonLanguageXpBonus = 0
): number {
  const sumLang =
    expectedLangPoints.python +
    expectedLangPoints.javascript +
    expectedLangPoints.c +
    expectedLangPoints.cpp +
    expectedLangPoints.java;
  return sumLang + nonLanguageXpBonus;
}

async function main() {
  const args = process.argv.slice(2);
  const isApply = args.includes("--apply");
  const isConfirmed = args.includes("--confirm-backup");
  const userIdx = args.indexOf("--user");
  const targetUserParam = userIdx !== -1 && args[userIdx + 1] ? args[userIdx + 1].trim().toLowerCase() : null;

  if (isApply && !isConfirmed) {
    console.error("\n❌ SAFETY CHECK FAILED: You supplied --apply without --confirm-backup.");
    console.error("To apply changes, run: npx tsx scripts/reconcile-xp.ts --apply --confirm-backup\n");
    process.exit(1);
  }

  const isDryRun = !isApply;

  console.log("\n=======================================================");
  if (isDryRun) {
    console.log("🔍 MODE: DRY-RUN (Read-only, no database mutations)");
  } else {
    console.log("⚠️  MODE: APPLY MUTATIONS (--confirm-backup verified)");
  }
  console.log("=======================================================\n");

  const mongooseInstance = await connectToDatabase();

  try {
    const query = targetUserParam
      ? {
          $or: [
            { usernameNormalized: targetUserParam },
            { email: targetUserParam },
            { username: targetUserParam },
          ],
        }
      : {};

    const users = await User.find(query);
    console.log(`Found ${users.length} user(s) to inspect.\n`);

    let auditedCount = 0;
    let driftCount = 0;
    let repairedCount = 0;

    for (const user of users) {
      auditedCount += 1;
      const solves = await LanguageSolve.find({ userId: user._id.toString() }).lean();
      const expectedLangPoints = computeExpectedLanguagePoints(solves);
      const expectedSolveXp = computeExpectedUserXp(expectedLangPoints, 0);

      const currentLangPoints: LanguagePointsBreakdown = {
        python: user.languagePoints?.python || 0,
        javascript: user.languagePoints?.javascript || 0,
        c: user.languagePoints?.c || 0,
        cpp: user.languagePoints?.cpp || 0,
        java: user.languagePoints?.java || 0,
      };

      const currentLangSum =
        currentLangPoints.python +
        currentLangPoints.javascript +
        currentLangPoints.c +
        currentLangPoints.cpp +
        currentLangPoints.java;

      const hasXpMismatch = user.xp !== expectedSolveXp;
      const hasLangMismatch = currentLangSum !== expectedSolveXp;

      if (hasXpMismatch || hasLangMismatch) {
        driftCount += 1;
        const diff = expectedSolveXp - user.xp;

        console.log(`🚨 User @${user.username} (ID: ${user._id})`);
        console.log(`   - Current User.xp:              ${user.xp}`);
        console.log(`   - LanguageSolve record sum:     ${expectedSolveXp}`);
        console.log(`   - User.languagePoints sum:      ${currentLangSum}`);
        console.log(`   - XP Discrepancy:               ${diff > 0 ? `+${diff}` : diff}`);
        console.log(`   - Current Language Breakdown:   ${JSON.stringify(currentLangPoints)}`);
        console.log(`   - Expected Language Breakdown:  ${JSON.stringify(expectedLangPoints)}`);

        if (isApply && isConfirmed) {
          user.xp = expectedSolveXp;
          user.languagePoints = expectedLangPoints;
          if (typeof user.markModified === "function") {
            user.markModified("languagePoints");
          }
          await user.save();
          repairedCount += 1;
          console.log(`   ✅ REPAIRED: user.xp updated to ${expectedSolveXp}`);
        } else {
          console.log(`   ℹ️ [DRY RUN] Would update user.xp to ${expectedSolveXp}`);
        }
        console.log("");
      }
    }

    console.log("-------------------------------------------------------");
    console.log(`Total users audited:   ${auditedCount}`);
    console.log(`Users with drift:      ${driftCount}`);
    if (isApply) {
      console.log(`Users repaired:        ${repairedCount}`);
    } else {
      console.log(`Pending repairs:       ${driftCount} (run with --apply --confirm-backup)`);
    }
    console.log("-------------------------------------------------------\n");
  } finally {
    await mongooseInstance.disconnect();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Reconciliation script encountered an error:", err);
    process.exit(1);
  });
}
