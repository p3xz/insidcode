import { connectToDatabase } from "../src/lib/mongodb";
import { Question } from "../src/models/Question";
import { SystemConfig } from "../src/models/SystemConfig";
import { CURRICULUM_QUESTIONS } from "../src/lib/curriculumData";
import { EXPANDED_CURRICULUM_QUESTIONS } from "../src/lib/curriculumDataExpanded";

async function runSeed() {
  console.log("Connecting to MongoDB Atlas via connectToDatabase()...");
  const mongooseInstance = await connectToDatabase();

  // Initialize SystemConfig
  await SystemConfig.findOneAndUpdate(
    { key: "main" },
    {
      $setOnInsert: {
        key: "main",
        leaderboardFrozen: false,
        announcement: {
          active: false,
          title: "Welcome to insidcode",
          message: "Practice logic building across all six curriculum phases.",
          updatedAt: new Date(),
        },
      },
    },
    { upsert: true, new: true }
  );

  const allQuestions = [...CURRICULUM_QUESTIONS, ...EXPANDED_CURRICULUM_QUESTIONS];
  console.log(`Seeding all ${allQuestions.length} curriculum questions into MongoDB Atlas...`);

  let upsertedCount = 0;
  for (const q of allQuestions) {
    await Question.findOneAndUpdate(
      { problemId: q.problemId },
      { $set: q },
      { upsert: true, new: true }
    );
    upsertedCount++;
  }

  console.log(`Successfully seeded ${upsertedCount} curriculum questions into MongoDB.`);
  await mongooseInstance.disconnect();
  console.log("Database connection closed cleanly.");
}

runSeed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
