/**
 * Server-side XP & Language Points Consistency Checker
 *
 * Ensures that User.xp is the single source of truth for total earned XP,
 * and that the Language Points breakdown plus any explicit non-language XP
 * (e.g. admin adjustments or duel bonuses) mathematically equals User.xp.
 */

export interface LanguagePointsMap {
  python?: number;
  javascript?: number;
  c?: number;
  cpp?: number;
  java?: number;
}

export type LanguagePointsInput =
  | LanguagePointsMap
  | Record<string, number | undefined>
  | null
  | undefined;

export interface UserXpSummary {
  userId: string;
  username: string;
  totalXp: number;
  languageSum: number;
  otherXp: number;
  drift: number; // totalXp - (languageSum + otherXp)
  isConsistent: boolean;
  languagePoints: {
    python: number;
    javascript: number;
    c: number;
    cpp: number;
    java: number;
  };
}

/**
 * Calculates total points summed across all supported programming languages.
 */
export function calculateLanguagePointsSum(lp?: LanguagePointsInput): number {
  if (!lp) return 0;
  const p = lp.python || 0;
  const j = lp.javascript || 0;
  const c = lp.c || 0;
  const cpp = lp.cpp || 0;
  const java = lp.java || 0;
  return p + j + c + cpp + java;
}

/**
 * Derives the single source of truth XP breakdown for a user.
 * If user.xp exceeds language points (e.g., admin adjustment or duel prize),
 * the excess is explicitly categorized as otherXp so lines always add up to totalXp.
 */
export function deriveXpBreakdown(
  userXp: number = 0,
  languagePoints?: LanguagePointsInput
): {
  totalXp: number;
  languageSum: number;
  otherXp: number;
  languages: {
    python: number;
    javascript: number;
    c: number;
    cpp: number;
    java: number;
  };
} {
  const safeLp = {
    python: Math.max(0, languagePoints?.python || 0),
    javascript: Math.max(0, languagePoints?.javascript || 0),
    c: Math.max(0, languagePoints?.c || 0),
    cpp: Math.max(0, languagePoints?.cpp || 0),
    java: Math.max(0, languagePoints?.java || 0),
  };

  const languageSum =
    safeLp.python + safeLp.javascript + safeLp.c + safeLp.cpp + safeLp.java;

  const totalXp = Math.max(0, userXp);
  const otherXp = Math.max(0, totalXp - languageSum);

  return {
    totalXp,
    languageSum,
    otherXp,
    languages: safeLp,
  };
}

/**
 * Checks whether user.xp matches the sum of language points.
 */
export function checkUserXpConsistency(
  userId: string,
  username: string,
  userXp: number = 0,
  languagePoints?: LanguagePointsInput,
  knownOtherXp: number = 0
): UserXpSummary {
  const breakdown = deriveXpBreakdown(userXp, languagePoints);
  const drift = userXp - (breakdown.languageSum + knownOtherXp);

  return {
    userId,
    username,
    totalXp: userXp,
    languageSum: breakdown.languageSum,
    otherXp: knownOtherXp,
    drift,
    isConsistent: drift === 0,
    languagePoints: breakdown.languages,
  };
}
