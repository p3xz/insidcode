import { existsSync } from "node:fs";
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
} else if (existsSync(".env")) {
  process.loadEnvFile(".env");
}
import { connectToDatabase } from "../src/lib/mongodb";
import { validateUsername } from "../src/lib/username";
import { recordModerationEvent, recordAbuseAttemptAndCheckEscalation } from "../src/lib/moderation/usernameModeration";
import { isAllowlisted } from "../src/lib/moderation/allowlist";
import { User } from "../src/models/User";
import { AdminAction } from "../src/models/AdminAction";
import mongoose from "mongoose";

async function runModerationTests() {
  console.log("=================================================");
  console.log("      USERNAME MODERATION & TOS AUDIT SUITE      ");
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

  // 1. Normal usernames
  const validUsernames = ["alice_dev", "coder99", "namish_yadav", "john_doe", "algorithm_pro", "dev_master"];
  for (const u of validUsernames) {
    const res = validateUsername(u);
    assert(res.allowed === true, `Normal username: "${u}" accepted`, res.error);
  }

  // 2. Clearly prohibited usernames
  const badUsernames = ["fuck", "shit", "bitch", "asshole", "motherfucker", "whore", "slut", "chutiya", "bhosdike", "pendejo"];
  for (const b of badUsernames) {
    const res = validateUsername(b);
    assert(res.allowed === false, `Prohibited username: "${b}" rejected`, `Got allowed: ${res.allowed}`);
  }

  // 3. Case variations
  const caseVariations = ["FuCk", "sHiT", "BITCH", "AssHole", "ChutIya", "bHosdike"];
  for (const cv of caseVariations) {
    const res = validateUsername(cv);
    assert(res.allowed === false, `Case variation: "${cv}" detected and rejected`);
  }

  // 4. Separator & Obfuscation variations
  const obfuscations = ["f_u_c_k", "f-u-c-k", "fuuuuuck", "shiiiit", "@sshole", "5hit", "b!tch", "b_1_t_c_h", "f4ck"];
  for (const ob of obfuscations) {
    const res = validateUsername(ob);
    assert(res.allowed === false, `Obfuscated username: "${ob}" detected and rejected`);
  }

  // 5. Reserved platform usernames
  const reserved = ["admin", "administrator", "insidcode", "system", "root", "moderator", "support", "staff"];
  for (const r of reserved) {
    const res = validateUsername(r);
    assert(res.allowed === false, `Reserved username: "${r}" rejected`);
  }

  // 6. False-Positive / Allowlist Verification (Scunthorpe Problem)
  const allowlistCandidates = [
    "class",
    "classic",
    "passport",
    "compass",
    "assembly",
    "assassin",
    "button",
    "cockpit",
    "peacock",
    "document",
    "docker",
    "cucumber",
    "analyst",
    "analytics",
    "analyze",
    "title",
    "identity",
    "competition",
    "partition",
    "shift",
    "snapshot",
    "scunthorpe",
  ];
  for (const a of allowlistCandidates) {
    const res = validateUsername(a);
    assert(res.allowed === true, `Allowlisted candidate: "${a}" accepted without false-positive`, res.error);
  }

  // 7. Test Database & Escalation Flow
  await connectToDatabase();
  const testUserId = new mongoose.Types.ObjectId().toString();

  try {
    const testUser = await User.create({
      _id: testUserId,
      username: "moderation_test_user",
      usernameNormalized: "moderation_test_user",
      displayName: "Moderation Test User",
      email: "modtest@testinternal.dev",
      provider: "credentials",
      providerAccountId: `test_${testUserId}`,
      role: "user",
      xp: 0,
      isBanned: false,
    });

    // 8. Test single rejected moderation event (Must NOT ban, but logs event without leaking word)
    const initialActionsCount = await AdminAction.countDocuments({ targetUserId: testUserId });
    const singleAttempt = await recordAbuseAttemptAndCheckEscalation({
      userId: testUserId,
      username: "bad_name_1",
    });

    assert(singleAttempt.escalated === false, "Single violation does not ban user");
    const updatedUser = await User.findById(testUserId);
    assert(updatedUser?.isBanned === false, "User remains active after 1 attempt");

    const newActions = await AdminAction.find({ targetUserId: testUserId, action: "USERNAME_REJECTED" });
    assert(newActions.length >= 1, "Moderation event recorded in AdminAction");
    assert(!newActions[0]?.reason?.includes("fuck") && !newActions[0]?.reason?.includes("shit"), "Prohibited bad word is NOT leaked in reason/logs");

    // 9. Repeated abuse escalation (Simulate 5 attempts)
    for (let i = 2; i <= 5; i++) {
      await recordAbuseAttemptAndCheckEscalation({
        userId: testUserId,
        username: `bad_name_${i}`,
      });
    }

    const escalatedUser = await User.findById(testUserId);
    assert(escalatedUser?.isBanned === true, "User successfully escalated to SUSPENDED after 5 repeated attempts");
    assert(escalatedUser?.banReason?.includes("repeated attempts"), "Suspension reason accurately recorded");

    const banAction = await AdminAction.findOne({ targetUserId: testUserId, action: "USER_BAN" });
    assert(Boolean(banAction), "Automated USER_BAN event recorded in immutable ledger");
  } finally {
    // Clean up test records
    await User.findByIdAndDelete(testUserId);
    await AdminAction.deleteMany({ targetUserId: testUserId });
  }

  console.log("\n=================================================");
  console.log(` AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runModerationTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
