/**
 * Pure server-side calculations for Duel W/L, Win Rate, and KD statistics.
 */

/**
 * Calculates Duel K/D ratio safely.
 *
 * Rules:
 * - If wins = 0 and losses = 0: "—"
 * - If losses = 0 and wins > 0: "∞"
 * - Otherwise: (wins / losses).toFixed(2) (e.g. "2.00", "1.00", "0.50")
 */
export function calculateDuelKd(wins: number = 0, losses: number = 0): string {
  const w = Math.max(0, wins || 0);
  const l = Math.max(0, losses || 0);

  if (w === 0 && l === 0) {
    return "—";
  }
  if (l === 0) {
    return "∞";
  }
  return (w / l).toFixed(2);
}

/**
 * Calculates Duel win rate percentage rounded to 1 decimal place.
 *
 * Rules:
 * - Win Rate = (Wins / Duels Played) * 100
 * - If duelsPlayed <= 0: 0
 * - Rounded to 1 decimal place (e.g. 66.7)
 */
export function calculateDuelWinRate(wins: number = 0, played: number = 0): number {
  const w = Math.max(0, wins || 0);
  const p = Math.max(0, played || 0);

  if (p <= 0) {
    return 0;
  }
  return Number(((w / p) * 100).toFixed(1));
}
