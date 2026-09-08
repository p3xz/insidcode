export function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0]; // YYYY-MM-DD in UTC
}

export function calculateStreak(
  currentStreak: number,
  longestStreak: number,
  lastActiveDate?: string
): { currentStreak: number; longestStreak: number; lastActiveDate: string } {
  const today = getTodayDateString();

  if (!lastActiveDate) {
    return {
      currentStreak: 1,
      longestStreak: Math.max(longestStreak, 1),
      lastActiveDate: today,
    };
  }

  if (lastActiveDate === today) {
    return {
      currentStreak,
      longestStreak,
      lastActiveDate: today,
    };
  }

  const lastDate = new Date(lastActiveDate);
  const currentDate = new Date(today);
  const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    const newCurrent = currentStreak + 1;
    return {
      currentStreak: newCurrent,
      longestStreak: Math.max(longestStreak, newCurrent),
      lastActiveDate: today,
    };
  }

  // Missed one or more days
  return {
    currentStreak: 1,
    longestStreak: Math.max(longestStreak, 1),
    lastActiveDate: today,
  };
}
