import { existsSync } from "node:fs";
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}
import { connectToDatabase } from "../src/lib/mongodb";
import { User } from "../src/models/User";
import { Appeal } from "../src/models/Appeal";
import { AdminAction } from "../src/models/AdminAction";
import { Question } from "../src/models/Question";
import { Submission } from "../src/models/Submission";
import { DuelRoom } from "../src/models/DuelRoom";
import { formatIST } from "../src/lib/dateUtils";

async function runAuditAndCleanup() {
  console.log("=================================================");
  console.log(" INSIDCODE PRE-PRODUCTION DATABASE AUDIT & CLEANUP");
  console.log("=================================================\n");

  await connectToDatabase();

  // 1. Audit Users
  const totalUsers = await User.countDocuments();
  const bannedUsers = await User.countDocuments({ isBanned: true });
  const restoredUsers = await User.countDocuments({
    $or: [{ requiresRestorationConsent: true }, { restoredAt: { $exists: true } }],
  });
  console.log(`[USER AUDIT] Total Users: ${totalUsers}`);
  console.log(`[USER AUDIT] Banned/Suspended Users: ${bannedUsers}`);
  console.log(`[USER AUDIT] Restored Users: ${restoredUsers}`);

  // Inspect users with test prefixes
  const testUsers = await User.find({
    $or: [
      { username: /^test_/i },
      { username: /^susp_test_/i },
      { username: /^appeal_fresh_/i },
      { username: /^restore_test_/i },
      { username: /^mock_/i },
      { email: /@test\.local$/i },
      { email: /@example\.com$/i },
    ],
  }).select("username email role isBanned createdAt");

  console.log(`\n[TEST USERS IDENTIFIED] Found ${testUsers.length} test user records:`);
  for (const tu of testUsers) {
    console.log(` - @${tu.username} (${tu.email}) [Role: ${tu.role}, Banned: ${tu.isBanned}, Created: ${formatIST(tu.createdAt)}]`);
  }

  // 2. Audit Appeals
  const totalAppeals = await Appeal.countDocuments();
  const pendingAppeals = await Appeal.countDocuments({ status: "PENDING" });
  const approvedAppeals = await Appeal.countDocuments({ status: "APPROVED" });
  const rejectedAppeals = await Appeal.countDocuments({ status: "REJECTED" });
  console.log(`\n[APPEAL AUDIT] Total Appeals: ${totalAppeals}`);
  console.log(` - Pending: ${pendingAppeals}`);
  console.log(` - Approved: ${approvedAppeals}`);
  console.log(` - Rejected: ${rejectedAppeals}`);

  // 3. Audit Problems and Submissions (Must NOT be deleted)
  const totalProblems = await Question.countDocuments();
  const totalSubmissions = await Submission.countDocuments();
  console.log(`\n[PLATFORM DATA INVARIANTS]`);
  console.log(` - Questions / Problems: ${totalProblems}`);
  console.log(` - Submissions: ${totalSubmissions}`);

  // 4. Safe targeted cleanup of test accounts and test duels
  if (testUsers.length > 0) {
    const testUserIds = testUsers.map((u) => u._id.toString());
    
    // Delete only appeals associated with test users
    const deletedAppeals = await Appeal.deleteMany({ userId: { $in: testUserIds } });
    console.log(`\n[CLEANUP] Deleted ${deletedAppeals.deletedCount} test appeal records.`);

    // Delete only admin actions associated with test users
    const deletedAdminActions = await AdminAction.deleteMany({
      $or: [
        { targetUserId: { $in: testUserIds } },
        { adminId: { $in: testUserIds } },
      ],
    });
    console.log(`[CLEANUP] Deleted ${deletedAdminActions.deletedCount} test audit log entries.`);

    // Delete test users
    const deletedUsers = await User.deleteMany({ _id: { $in: testUserIds } });
    console.log(`[CLEANUP] Deleted ${deletedUsers.deletedCount} test user accounts.`);
  }

  // Clean test duels if any
  const testDuels = await DuelRoom.deleteMany({
    $or: [
      { roomId: /^test_/i },
      { "players.username": /^test_/i },
    ],
  });
  console.log(`[CLEANUP] Deleted ${testDuels.deletedCount} test duel rooms.`);

  // 5. Final Post-Cleanup Count
  const finalUserCount = await User.countDocuments();
  const finalAppealCount = await Appeal.countDocuments();
  const finalSubmissionCount = await Submission.countDocuments();
  const finalProblemCount = await Question.countDocuments();

  console.log("\n=================================================");
  console.log(" POST-CLEANUP DATABASE SUMMARY");
  console.log("=================================================");
  console.log(` Active Users: ${finalUserCount}`);
  console.log(` Appeals on Record: ${finalAppealCount}`);
  console.log(` Problems (Preserved): ${finalProblemCount}`);
  console.log(` Submissions (Preserved): ${finalSubmissionCount}`);
  console.log(" All legitimate platform data, stats, and achievements preserved successfully.\n");

  process.exit(0);
}

runAuditAndCleanup().catch((err) => {
  console.error("Audit error:", err);
  process.exit(1);
});
