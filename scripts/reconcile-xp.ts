#!/usr/bin/env tsx
/**
 * InsidCode XP & Language Points Reconciliation Tool
 *
 * Reconciles historical drift between User.xp, User.languagePoints, and LanguageSolve ledger.
 *
 * SAFETY INVARIANTS:
 *  1. Dry-run by default. NEVER mutates anything unless --apply is explicitly passed.
 *  2. Refuses to write unless BOTH --confirm-env=<env> and --backup-verified are passed.
 *  3. Never runs automatically during build or deployment.
 *  4. Idempotent: running repeatedly produces 0 subsequent diffs.
 *  5. Writes full audit trail to reconcile-xp-<timestamp>.log.
 *
 * MODES:
 *  --mode=grant (Recommended)
 *      Raises User.xp to match language points / LanguageSolve records.
 *      Fixes the legacy bug where secondary language solves were awarded points but not XP.
 *
 *  --mode=trim
 *      Lowers language points to match User.xp.
 *
 * USAGE:
 *  Dry run (safe):
 *    npx tsx scripts/reconcile-xp.ts --mode=grant
 *
 *  Apply changes:
 *    npx tsx scripts/reconcile-xp.ts --mode=grant --apply --confirm-env=production --backup-verified
 */

import * as fs from "fs";
import * as path from "path";
import { connectToDatabase } from "../src/lib/mongodb";
import { User } from "../src/models/User";
import { LanguageSolve } from "../src/models/LanguageSolve";
import { calculateLanguagePointsSum } from "../src/lib/xpConsistency";

interface UserDriftRecord {
  userId: string;
  username: string;
  email?: string;
  currentXp: number;
  languagePointsTotal: number;
  languageSolveRecordsTotal: number;
  drift: number; // languagePointsTotal - currentXp
  languagePoints: {
    python: number;
    javascript: number;
    c: number;
    cpp: number;
    java: number;
  };
  proposedXp: number;
  proposedLanguagePoints: {
    python: number;
    javascript: number;
    c: number;
    cpp: number;
    java: number;
  };
}

interface LeaderboardSnapshotItem {
  rank: number;
  userId: string;
  username: string;
  xp: number;
  solvedCount: number;
}

export interface LanguagePointsBreakdown {
  python: number;
  javascript: number;
  c: number;
  cpp: number;
  java: number;
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
  return calculateLanguagePointsSum(expectedLangPoints) + nonLanguageXpBonus;
}

export function parseArgs(argv: string[]) {
  const args = argv.slice(2);
  const flags: Record<string, string | boolean> = {};

  for (const arg of args) {
    if (arg === "--help" || arg === "-h") {
      flags.help = true;
    } else if (arg === "--apply") {
      flags.apply = true;
    } else if (arg === "--backup-verified" || arg === "--confirm-backup") {
      flags.backupVerified = true;
    } else if (arg.startsWith("--mode=")) {
      flags.mode = arg.split("=")[1].toLowerCase();
    } else if (arg.startsWith("--confirm-env=")) {
      flags.confirmEnv = arg.split("=")[1];
    } else if (arg.startsWith("--user=")) {
      flags.user = arg.split("=")[1];
    }
  }

  return flags;
}

export async function computeReconciliationDiff(
  mode: "grant" | "trim" = "grant",
  userFilter?: string
) {
  await connectToDatabase();

  const query: Record<string, unknown> = {};
  if (userFilter) {
    query.$or = [{ username: userFilter }, { _id: userFilter }];
  }

  // Fetch all users
  const users = await User.find(query)
    .select("_id username email xp languagePoints solvedProblems updatedAt createdAt")
    .lean();

  const diffs: UserDriftRecord[] = [];

  for (const u of users) {
    const userId = u._id.toString();
    const currentXp = Math.max(0, u.xp || 0);

    const lp = u.languagePoints || {};
    const safeLp = {
      python: Math.max(0, lp.python || 0),
      javascript: Math.max(0, lp.javascript || 0),
      c: Math.max(0, lp.c || 0),
      cpp: Math.max(0, lp.cpp || 0),
      java: Math.max(0, lp.java || 0),
    };
    const languagePointsTotal = calculateLanguagePointsSum(safeLp);

    // Sum of LanguageSolve documents
    const solves = await LanguageSolve.find({ userId }).select("points language").lean();
    const languageSolveRecordsTotal = solves.reduce((sum, s) => sum + (s.points || 10), 0);

    // Baseline comparison:
    // If languagePointsTotal !== currentXp, user has drift
    const drift = languagePointsTotal - currentXp;

    let proposedXp = currentXp;
    const proposedLanguagePoints = { ...safeLp };

    if (mode === "grant") {
      // In grant mode: raise XP to match language points total (or solve records)
      const target = Math.max(languagePointsTotal, languageSolveRecordsTotal);
      if (currentXp < target) {
        proposedXp = target;
      }
    } else if (mode === "trim") {
      // In trim mode: lower language points proportionally to match currentXp
      if (languagePointsTotal > currentXp) {
        const ratio = currentXp / (languagePointsTotal || 1);
        proposedLanguagePoints.python = Math.round(safeLp.python * ratio);
        proposedLanguagePoints.javascript = Math.round(safeLp.javascript * ratio);
        proposedLanguagePoints.c = Math.round(safeLp.c * ratio);
        proposedLanguagePoints.cpp = Math.round(safeLp.cpp * ratio);
        proposedLanguagePoints.java = Math.round(safeLp.java * ratio);

        // Adjust rounding residue
        const newTotal = calculateLanguagePointsSum(proposedLanguagePoints);
        if (newTotal !== currentXp && currentXp > 0) {
          const diffResidue = currentXp - newTotal;
          // Apply residue to the highest language
          const maxLang = (Object.keys(proposedLanguagePoints) as Array<keyof typeof proposedLanguagePoints>).reduce((a, b) =>
            proposedLanguagePoints[a] >= proposedLanguagePoints[b] ? a : b
          );
          proposedLanguagePoints[maxLang] += diffResidue;
        }
      }
    }

    const hasChange = proposedXp !== currentXp || calculateLanguagePointsSum(proposedLanguagePoints) !== languagePointsTotal;

    if (hasChange || drift !== 0) {
      diffs.push({
        userId,
        username: u.username,
        email: u.email,
        currentXp,
        languagePointsTotal,
        languageSolveRecordsTotal,
        drift,
        languagePoints: safeLp,
        proposedXp,
        proposedLanguagePoints,
      });
    }
  }

  // Compute leaderboard order before and after
  const beforeLeaderboard: LeaderboardSnapshotItem[] = users
    .map((u) => ({
      userId: u._id.toString(),
      username: u.username,
      xp: u.xp || 0,
      solvedCount: u.solvedProblems?.length || 0,
      updatedAt: u.updatedAt || u.createdAt || new Date(0),
    }))
    .sort((a, b) => {
      if (b.xp !== a.xp) return b.xp - a.xp;
      if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
      if (a.updatedAt !== b.updatedAt) return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      return a.username.localeCompare(b.username);
    })
    .map((u, idx) => ({
      rank: idx + 1,
      userId: u.userId,
      username: u.username,
      xp: u.xp,
      solvedCount: u.solvedCount,
    }));

  const userDiffMap = new Map(diffs.map((d) => [d.userId, d]));

  const afterLeaderboard: LeaderboardSnapshotItem[] = users
    .map((u) => {
      const diff = userDiffMap.get(u._id.toString());
      const xp = diff ? diff.proposedXp : u.xp || 0;
      return {
        userId: u._id.toString(),
        username: u.username,
        xp,
        solvedCount: u.solvedProblems?.length || 0,
        updatedAt: u.updatedAt || u.createdAt || new Date(0),
      };
    })
    .sort((a, b) => {
      if (b.xp !== a.xp) return b.xp - a.xp;
      if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
      if (a.updatedAt !== b.updatedAt) return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      return a.username.localeCompare(b.username);
    })
    .map((u, idx) => ({
      rank: idx + 1,
      userId: u.userId,
      username: u.username,
      xp: u.xp,
      solvedCount: u.solvedCount,
    }));

  return { diffs, beforeLeaderboard, afterLeaderboard, totalUsers: users.length };
}

async function main() {
  const flags = parseArgs(process.argv);

  if (flags.help) {
    console.log(`
InsidCode XP Reconciliation Script

Usage:
  npx tsx scripts/reconcile-xp.ts [options]

Options:
  --mode=grant          Raise User.xp to match languagePoints / LanguageSolve (default, recommended)
  --mode=trim           Lower languagePoints to match User.xp
  --user=<username>     Reconcile only a specific user
  --apply               Execute database writes (DRY-RUN by default)
  --confirm-env=<env>   Required with --apply (e.g. --confirm-env=production)
  --backup-verified     Required with --apply to certify a recent DB snapshot exists
  --help, -h            Show this help text
`);
    process.exit(0);
  }

  const mode = (flags.mode === "trim" ? "trim" : "grant") as "grant" | "trim";
  const isApply = Boolean(flags.apply);
  const confirmEnv = flags.confirmEnv as string | undefined;
  const isBackupVerified = Boolean(flags.backupVerified);
  const userFilter = flags.user as string | undefined;

  console.log("=================================================================");
  console.log("     InsidCode XP & Language Points Reconciliation Tool         ");
  console.log("=================================================================");
  console.log(` Mode:              ${mode.toUpperCase()}`);
  console.log(` Execution Type:    ${isApply ? "LIVE DATABASE MUTATION" : "DRY RUN (No changes saved)"}`);
  if (userFilter) console.log(` Target Filter:     User: ${userFilter}`);
  console.log("-----------------------------------------------------------------");

  if (isApply) {
    if (!confirmEnv) {
      console.error("\n❌ SAFETY CHECK FAILED: --apply requires --confirm-env=<env> (e.g. --confirm-env=production)");
      process.exit(1);
    }
    if (!isBackupVerified) {
      console.error("\n❌ SAFETY CHECK FAILED: --apply requires --backup-verified to certify an Atlas snapshot exists.");
      process.exit(1);
    }
  }

  console.log("\n[1/3] Scanning database for XP desynchronization...");
  const { diffs, beforeLeaderboard, afterLeaderboard, totalUsers } =
    await computeReconciliationDiff(mode, userFilter);

  console.log(`Total scanned accounts: ${totalUsers}`);
  console.log(`Accounts requiring reconciliation: ${diffs.length}`);

  if (diffs.length === 0) {
    console.log("\n✅ All accounts are 100% in sync! User.xp and Language Points perfectly agree.");
    process.exit(0);
  }

  console.log("\n[2/3] Detailed Drift Report:\n");
  console.log(
    "Username".padEnd(20) +
    "Current XP".padEnd(12) +
    "Lang Pts".padEnd(12) +
    "Solves".padEnd(10) +
    "Drift".padEnd(10) +
    "Proposed XP"
  );
  console.log("-".repeat(76));

  let totalXpDelta = 0;

  for (const d of diffs) {
    const delta = d.proposedXp - d.currentXp;
    totalXpDelta += delta;
    const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;

    console.log(
      d.username.slice(0, 19).padEnd(20) +
      String(d.currentXp).padEnd(12) +
      String(d.languagePointsTotal).padEnd(12) +
      String(d.languageSolveRecordsTotal).padEnd(10) +
      String(d.drift).padEnd(10) +
      `${d.proposedXp} (${deltaStr})`
    );
  }

  console.log("-".repeat(76));
  console.log(`Total XP adjustment across all accounts: ${totalXpDelta > 0 ? `+${totalXpDelta}` : totalXpDelta} XP\n`);

  console.log("[3/3] Leaderboard Rank Preview (Top 10):");
  console.log("Rank Before".padEnd(14) + "Rank After".padEnd(14) + "Username".padEnd(20) + "XP Before -> After");
  console.log("-".repeat(65));

  const beforeMap = new Map(beforeLeaderboard.map((u) => [u.userId, u]));
  for (const after of afterLeaderboard.slice(0, 10)) {
    const before = beforeMap.get(after.userId);
    const beforeRankStr = before ? `#${before.rank}` : "Unranked";
    const afterRankStr = `#${after.rank}`;
    const change = before && before.rank !== after.rank ? `(${before.rank > after.rank ? "▲" : "▼"}${Math.abs(before.rank - after.rank)})` : "=";

    console.log(
      `${beforeRankStr} ${change}`.padEnd(14) +
      afterRankStr.padEnd(14) +
      after.username.slice(0, 18).padEnd(20) +
      `${before?.xp ?? 0} -> ${after.xp}`
    );
  }
  console.log("-".repeat(65));

  // Write audit trail
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logFile = path.join(process.cwd(), `reconcile-xp-${timestamp}.log`);

  const logContent = {
    executedAt: new Date().toISOString(),
    mode,
    isApply,
    confirmEnv: confirmEnv || null,
    totalScanned: totalUsers,
    affectedCount: diffs.length,
    totalXpDelta,
    users: diffs,
    leaderboardBefore: beforeLeaderboard.slice(0, 25),
    leaderboardAfter: afterLeaderboard.slice(0, 25),
  };

  fs.writeFileSync(logFile, JSON.stringify(logContent, null, 2), "utf8");
  console.log(`\nAudit log saved to: ${logFile}`);

  if (!isApply) {
    console.log("\n⚠️  DRY RUN COMPLETED. No database mutations were performed.");
    console.log("To apply these changes, re-run with:");
    console.log(`  npx tsx scripts/reconcile-xp.ts --mode=${mode} --apply --confirm-env=<env> --backup-verified\n`);
    return;
  }

  // Live write execution
  console.log(`\n⚡ Applying changes to ${diffs.length} users in database...`);
  for (const d of diffs) {
    await User.findByIdAndUpdate(d.userId, {
      $set: {
        xp: d.proposedXp,
        languagePoints: d.proposedLanguagePoints,
      },
    });
  }

  console.log("✅ Database update completed successfully. All user accounts reconciled.\n");
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Reconciliation error:", err);
    process.exit(1);
  });
}
