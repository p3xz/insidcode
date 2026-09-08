import { IUser } from "@/types";
import { Notification } from "@/models/Notification";
import { Question } from "@/models/Question";

export const SYSTEM_ACHIEVEMENTS = [
  {
    key: "first_solve",
    title: "First Solve",
    description: "Successfully solved your first programming problem.",
    iconName: "Code",
    type: "solve_count",
    value: 1,
  },
  {
    key: "ten_solves",
    title: "10 Problems Solved",
    description: "Solved 10 programming problems across any phase.",
    iconName: "CheckCircle",
    type: "solve_count",
    value: 10,
  },
  {
    key: "fifty_solves",
    title: "50 Problems Solved",
    description: "Solved 50 programming challenges.",
    iconName: "Flame",
    type: "solve_count",
    value: 50,
  },
  {
    key: "hundred_solves",
    title: "100 Problems Solved",
    description: "Centurion milestone: 100 solved problems.",
    iconName: "Award",
    type: "solve_count",
    value: 100,
  },
  {
    key: "streak_7",
    title: "7 Day Streak",
    description: "Maintained a continuous 7 day practice streak.",
    iconName: "Calendar",
    type: "streak",
    value: 7,
  },
  {
    key: "streak_30",
    title: "30 Day Streak",
    description: "Maintained a relentless 30 day daily streak.",
    iconName: "Zap",
    type: "streak",
    value: 30,
  },
  {
    key: "first_hard",
    title: "First Hard Problem",
    description: "Successfully passed all hidden tests on a Hard difficulty challenge.",
    iconName: "ShieldAlert",
    type: "hard_solve",
    value: 1,
  },
  {
    key: "phase_1_complete",
    title: "Conditional Thinking Master",
    description: "Completed all published Phase 1 problems.",
    iconName: "Compass",
    type: "phase",
    value: 1,
  },
  {
    key: "phase_2_complete",
    title: "Patterns and Loops Expert",
    description: "Completed all published Phase 2 problems.",
    iconName: "Repeat",
    type: "phase",
    value: 2,
  },
  {
    key: "phase_3_complete",
    title: "Recursion Architect",
    description: "Completed all published Phase 3 problems.",
    iconName: "GitBranch",
    type: "phase",
    value: 3,
  },
  {
    key: "phase_4_complete",
    title: "Array Strategist",
    description: "Completed all published Phase 4 problems.",
    iconName: "Layers",
    type: "phase",
    value: 4,
  },
  {
    key: "phase_5_complete",
    title: "String Virtuoso",
    description: "Completed all published Phase 5 problems.",
    iconName: "Type",
    type: "phase",
    value: 5,
  },
  {
    key: "phase_6_complete",
    title: "Logical Grandmaster",
    description: "Completed all published Phase 6 mixed challenges.",
    iconName: "Sparkles",
    type: "phase",
    value: 6,
  },
] as const;

export async function checkAndAwardAchievements(
  user: IUser,
  latestProblemDifficulty: string,
  latestProblemPhase: number
): Promise<string[]> {
  const newAchievements: string[] = [];

  const solveCount = user.solvedProblems.length;
  const currentStreak = user.currentStreak;

  // 1. Solve counts
  if (solveCount >= 1) newAchievements.push("first_solve");
  if (solveCount >= 10) newAchievements.push("ten_solves");
  if (solveCount >= 50) newAchievements.push("fifty_solves");
  if (solveCount >= 100) newAchievements.push("hundred_solves");

  // 2. Streaks
  if (currentStreak >= 7) newAchievements.push("streak_7");
  if (currentStreak >= 30) newAchievements.push("streak_30");

  // 3. First Hard problem
  if (latestProblemDifficulty === "Hard") {
    newAchievements.push("first_hard");
  }

  // 4. Phase completion checks
  if (latestProblemPhase >= 1 && latestProblemPhase <= 6) {
    const totalPhaseQuestions = await Question.countDocuments({
      phase: latestProblemPhase,
      isPublished: true,
    });

    if (totalPhaseQuestions > 0) {
      const solvedInPhaseCount = await Question.countDocuments({
        phase: latestProblemPhase,
        problemId: { $in: user.solvedProblems },
        isPublished: true,
      });

      if (solvedInPhaseCount >= totalPhaseQuestions) {
        newAchievements.push(`phase_${latestProblemPhase}_complete`);
      }
    }
  }

  // Create notifications for newly triggered achievements
  for (const achKey of newAchievements) {
    const ach = SYSTEM_ACHIEVEMENTS.find((a) => a.key === achKey);
    if (ach) {
      // Check if notification already exists
      const existingNotif = await Notification.findOne({
        userId: user._id.toString(),
        type: "achievement",
        title: `Achievement Unlocked: ${ach.title}`,
      });

      if (!existingNotif) {
        await Notification.create({
          userId: user._id.toString(),
          title: `Achievement Unlocked: ${ach.title}`,
          message: ach.description,
          type: "achievement",
          read: false,
          link: `/profile/${user.username}`,
        });
      }
    }
  }

  return newAchievements;
}
