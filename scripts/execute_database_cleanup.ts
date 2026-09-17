import { existsSync } from "node:fs";
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
} else if (existsSync(".env")) {
  process.loadEnvFile(".env");
}
import { connectToDatabase } from "../src/lib/mongodb";
import mongoose from "mongoose";

async function runDatabaseCleanup() {
  await connectToDatabase();
  const db = mongoose.connection.db!;

  console.log("=================================================");
  console.log("       PRODUCTION DATABASE HYGIENE CLEANUP       ");
  console.log("=================================================\n");

  // 1. Identify real users
  const realUsers = await db.collection("users").find({}).project({ _id: 1, username: 1, email: 1 }).toArray();
  const realUserIds = new Set(realUsers.map((u) => u._id.toString()));
  console.log(`Verified ${realUsers.length} Real Users:`);
  realUsers.forEach((u) => console.log(` - ${u.username} (${u.email}) [ID: ${u._id}]`));

  // 2. Count before
  const beforeCounts = {
    users: await db.collection("users").countDocuments(),
    submissions: await db.collection("submissions").countDocuments(),
    languagesolves: await db.collection("languagesolves").countDocuments(),
    notifications: await db.collection("notifications").countDocuments(),
    adminactions: await db.collection("adminactions").countDocuments(),
    appeals: await db.collection("appeals").countDocuments(),
    executions: await db.collection("executions").countDocuments(),
    questions: await db.collection("questions").countDocuments(),
    systemconfigs: await db.collection("systemconfigs").countDocuments(),
    duelrooms: await db.collection("duelrooms").countDocuments(),
    achievements: await db.collection("achievements").countDocuments(),
    friendrequests: await db.collection("friendrequests").countDocuments(),
  };

  console.log("\n--- BEFORE DOCUMENT COUNTS ---");
  console.table(beforeCounts);

  // 3. Remove orphaned test submissions
  // Test submissions belong to userIds not in realUserIds
  const deletedSubmissions = await db.collection("submissions").deleteMany({
    userId: { $nin: Array.from(realUserIds) },
  });
  console.log(`\n[Submissions] Removed ${deletedSubmissions.deletedCount} orphaned test submissions.`);

  // 4. Remove orphaned test language solves
  const deletedLangSolves = await db.collection("languagesolves").deleteMany({
    userId: { $nin: Array.from(realUserIds) },
  });
  console.log(`[LanguageSolves] Removed ${deletedLangSolves.deletedCount} orphaned test language solves.`);

  // 5. Remove orphaned notifications
  const deletedNotifications = await db.collection("notifications").deleteMany({
    userId: { $nin: Array.from(realUserIds) },
  });
  console.log(`[Notifications] Removed ${deletedNotifications.deletedCount} orphaned test notifications.`);

  // 6. Remove test admin actions (created today during suspension/appeal testing with test reasons)
  const deletedAdminActions = await db.collection("adminactions").deleteMany({
    $or: [
      { reason: "test" },
      { reason: "Suspension screen check" },
      { reason: "Admin unban" },
      { action: { $in: ["APPEAL_APPROVED", "APPEAL_REJECTED"] } },
    ],
  });
  console.log(`[AdminActions] Removed ${deletedAdminActions.deletedCount} temporary development suspension/appeal test actions.`);

  // 7. Remove test appeals (created today during appeal testing)
  const deletedAppeals = await db.collection("appeals").deleteMany({
    reason: "Other Reason",
  });
  console.log(`[Appeals] Removed ${deletedAppeals.deletedCount} test appeal records.`);

  // 8. Remove terminal development execution records
  const deletedExecutions = await db.collection("executions").deleteMany({
    status: { $in: ["success", "error", "failed", "timeout", "expired", "cancelled"] },
  });
  console.log(`[Executions] Removed ${deletedExecutions.deletedCount} completed development execution logs.`);

  // 9. Deactivate dummy test announcement in SystemConfig
  const updatedConfig = await db.collection("systemconfigs").updateOne(
    { key: "main" },
    {
      $set: {
        announcement: {
          active: false,
          title: "",
          message: "",
          updatedAt: new Date(),
        },
      },
    }
  );
  console.log(`[SystemConfig] Reset dummy test announcement to inactive.`);

  // 10. Count after
  const afterCounts = {
    users: await db.collection("users").countDocuments(),
    submissions: await db.collection("submissions").countDocuments(),
    languagesolves: await db.collection("languagesolves").countDocuments(),
    notifications: await db.collection("notifications").countDocuments(),
    adminactions: await db.collection("adminactions").countDocuments(),
    appeals: await db.collection("appeals").countDocuments(),
    executions: await db.collection("executions").countDocuments(),
    questions: await db.collection("questions").countDocuments(),
    systemconfigs: await db.collection("systemconfigs").countDocuments(),
    duelrooms: await db.collection("duelrooms").countDocuments(),
    achievements: await db.collection("achievements").countDocuments(),
    friendrequests: await db.collection("friendrequests").countDocuments(),
  };

  console.log("\n--- AFTER DOCUMENT COUNTS ---");
  console.table(afterCounts);

  // 11. Final integrity verification
  console.log("\n--- PRODUCTION INTEGRITY VERIFICATION ---");
  const finalUsers = await db.collection("users").find({}).toArray();
  console.log(`Real users count: ${finalUsers.length} (Expected: 5)`);
  for (const u of finalUsers) {
    console.log(`- ${u.username} (${u.email}): Role=${u.role}, XP=${u.xp}, isSuspended=${u.isSuspended || false}, isBanned=${u.isBanned || false}`);
  }

  const finalQuestions = await db.collection("questions").countDocuments();
  console.log(`Questions count: ${finalQuestions} (Expected: 50)`);

  const finalSubmissions = await db.collection("submissions").find({}).toArray();
  console.log(`Submissions remaining: ${finalSubmissions.length} (all belonging to real users)`);
  for (const s of finalSubmissions) {
    console.log(`- Problem ${s.problemId} | User ${s.username} | Status: ${s.status} | Lang: ${s.language}`);
  }

  await mongoose.disconnect();
}

runDatabaseCleanup().catch((err) => {
  console.error("Cleanup error:", err);
  process.exit(1);
});
