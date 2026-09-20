export const DEFAULT_DUEL_RATING = 1000;
export const ELO_K_FACTOR = 32;

export type DuelWinnerOutcome = "player1" | "player2" | "draw" | null;

export interface EloCalculationResult {
  player1NewRating: number;
  player2NewRating: number;
  player1Delta: number;
  player2Delta: number;
}

/**
 * Calculates the expected score for player A against player B using standard Elo:
 * EA = 1 / (1 + 10^((RB - RA) / 400))
 */
export function calculateExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculates new ratings and rating deltas for two players following a Duel outcome.
 *
 * Rules:
 * - K-factor = 32
 * - Missing/undefined ratings default to 1000
 * - Final ratings are rounded to nearest integers
 * - Ratings are clamped to a minimum of 0 (non-negative)
 * - If the match ended in a draw / no winner, no rating change is applied (delta = 0)
 */
export function calculateDuelElo(
  rating1: number = DEFAULT_DUEL_RATING,
  rating2: number = DEFAULT_DUEL_RATING,
  winner: DuelWinnerOutcome
): EloCalculationResult {
  const r1 = Math.max(0, Math.round(rating1 ?? DEFAULT_DUEL_RATING));
  const r2 = Math.max(0, Math.round(rating2 ?? DEFAULT_DUEL_RATING));

  if (!winner || winner === "draw") {
    return {
      player1NewRating: r1,
      player2NewRating: r2,
      player1Delta: 0,
      player2Delta: 0,
    };
  }

  const expected1 = calculateExpectedScore(r1, r2);
  const expected2 = calculateExpectedScore(r2, r1);

  const score1 = winner === "player1" ? 1 : 0;
  const score2 = winner === "player2" ? 1 : 0;

  const newR1 = Math.max(0, Math.round(r1 + ELO_K_FACTOR * (score1 - expected1)));
  const newR2 = Math.max(0, Math.round(r2 + ELO_K_FACTOR * (score2 - expected2)));

  return {
    player1NewRating: newR1,
    player2NewRating: newR2,
    player1Delta: newR1 - r1,
    player2Delta: newR2 - r2,
  };
}
