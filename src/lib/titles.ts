import { IUser, ITitleDefinition } from "@/types";
import { Question } from "@/models/Question";
import { LanguageSolve } from "@/models/LanguageSolve";

export const AVAILABLE_TITLES: ITitleDefinition[] = [
  { id: "first_steps", title: "First Steps", description: "Solved your first programming challenge.", category: "solves" },
  { id: "problem_solver", title: "Problem Solver", description: "Successfully solved 10 programming problems.", category: "solves" },
  { id: "logic_builder", title: "Logic Builder", description: "Successfully solved 25 programming problems.", category: "solves" },
  { id: "code_apprentice", title: "Code Apprentice", description: "Successfully solved 50 programming challenges.", category: "solves" },
  { id: "code_runner", title: "Code Runner", description: "Centurion milestone: 100 problems solved.", category: "solves" },
  { id: "streak_starter", title: "Streak Starter", description: "Maintained a 7-day practice streak.", category: "streak" },
  { id: "unstoppable", title: "Unstoppable", description: "Maintained a relentless 30-day practice streak.", category: "streak" },
  { id: "polyglot", title: "Polyglot", description: "Solved challenges across 5 distinct programming languages.", category: "language" },
  { id: "hard_mode", title: "Hard Mode", description: "Successfully conquered a Hard difficulty problem.", category: "difficulty" },
  { id: "duelist", title: "Duelist", description: "Won your first 1v1 Duel match.", category: "duel" },
  { id: "champion", title: "Champion", description: "Achieved 10 overall 1v1 Duel match victories.", category: "duel" },
  { id: "duel_master", title: "Duel Master", description: "Grandmaster status: 25 overall 1v1 Duel match victories.", category: "duel" },
];

export async function getUnlockedTitles(user: IUser): Promise<string[]> {
  const unlocked: string[] = [];
  const solveCount = user.solvedProblems?.length || 0;
  const bestStreak = Math.max(user.currentStreak || 0, user.longestStreak || 0);
  const duelsWon = user.duelsWon || 0;

  // Solves
  if (solveCount >= 1) unlocked.push("First Steps");
  if (solveCount >= 10) unlocked.push("Problem Solver");
  if (solveCount >= 25) unlocked.push("Logic Builder");
  if (solveCount >= 50) unlocked.push("Code Apprentice");
  if (solveCount >= 100) unlocked.push("Code Runner");

  // Streaks
  if (bestStreak >= 7) unlocked.push("Streak Starter");
  if (bestStreak >= 30) unlocked.push("Unstoppable");

  // Duels
  if (duelsWon >= 1) unlocked.push("Duelist");
  if (duelsWon >= 10) unlocked.push("Champion");
  if (duelsWon >= 25) unlocked.push("Duel Master");

  // Polyglot
  let langCount = 0;
  if (user.languagePoints) {
    langCount = Object.values(user.languagePoints).filter((pts) => typeof pts === "number" && pts > 0).length;
  }
  if (langCount < 5) {
    try {
      const distinctLangs = await LanguageSolve.distinct("language", {
        userId: user._id.toString(),
      });
      langCount = Math.max(langCount, distinctLangs.length);
    } catch {
      // silent
    }
  }
  if (langCount >= 5) {
    unlocked.push("Polyglot");
  }

  // Hard Mode
  if (solveCount > 0) {
    try {
      const hardSolvedCount = await Question.countDocuments({
        problemId: { $in: user.solvedProblems },
        difficulty: "Hard",
        isPublished: true,
      });
      if (hardSolvedCount > 0) {
        unlocked.push("Hard Mode");
      }
    } catch {
      // silent
    }
  }

  return unlocked;
}

export async function isTitleUnlocked(user: IUser, title: string): Promise<boolean> {
  const unlocked = await getUnlockedTitles(user);
  return unlocked.includes(title);
}

