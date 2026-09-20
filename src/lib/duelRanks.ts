/**
 * InsidCode Duel Points & Rank Ladder Progression System
 *
 * Normal competitive rank tiers: 24 total tiers across 8 named ranks with 3 divisions each.
 * Top 3 eligible players on the competitive ladder dynamically hold Champion #1, #2, #3 status.
 */

export const WIN_DUEL_POINTS = 25;
export const LOSS_DUEL_POINTS = -10;
export const CHAMPION_MIN_DUELS = 3;

export interface RankTierDefinition {
  name: string;
  tier: string;
  division: string | null;
  minPoints: number;
  maxPoints: number;
}

export interface ResolvedDuelRank {
  tier: number | null;
  rankName: string;
  tierName: string;
  division: string | null;
  minPoints: number;
  maxPoints: number | null;
  pointsToNextRank: number | null;
  nextRankName: string | null;
  isChampion: boolean;
  championPosition: number | null;
}

export const DUEL_RANKS: RankTierDefinition[] = [
  // NOOB (0–299)
  { name: "Noob I", tier: "Noob", division: "I", minPoints: 0, maxPoints: 99 },
  { name: "Noob II", tier: "Noob", division: "II", minPoints: 100, maxPoints: 199 },
  { name: "Noob III", tier: "Noob", division: "III", minPoints: 200, maxPoints: 299 },

  // ROOKIE (300–599)
  { name: "Rookie I", tier: "Rookie", division: "I", minPoints: 300, maxPoints: 399 },
  { name: "Rookie II", tier: "Rookie", division: "II", minPoints: 400, maxPoints: 499 },
  { name: "Rookie III", tier: "Rookie", division: "III", minPoints: 500, maxPoints: 599 },

  // CHALLENGER (600–899)
  { name: "Challenger I", tier: "Challenger", division: "I", minPoints: 600, maxPoints: 699 },
  { name: "Challenger II", tier: "Challenger", division: "II", minPoints: 700, maxPoints: 799 },
  { name: "Challenger III", tier: "Challenger", division: "III", minPoints: 800, maxPoints: 899 },

  // CONTENDER (900–1199)
  { name: "Contender I", tier: "Contender", division: "I", minPoints: 900, maxPoints: 999 },
  { name: "Contender II", tier: "Contender", division: "II", minPoints: 1000, maxPoints: 1099 },
  { name: "Contender III", tier: "Contender", division: "III", minPoints: 1100, maxPoints: 1199 },

  // DUELIST (1200–1499)
  { name: "Duelist I", tier: "Duelist", division: "I", minPoints: 1200, maxPoints: 1299 },
  { name: "Duelist II", tier: "Duelist", division: "II", minPoints: 1300, maxPoints: 1399 },
  { name: "Duelist III", tier: "Duelist", division: "III", minPoints: 1400, maxPoints: 1499 },

  // ELITE DUELIST (1500–1799)
  { name: "Elite Duelist I", tier: "Elite Duelist", division: "I", minPoints: 1500, maxPoints: 1599 },
  { name: "Elite Duelist II", tier: "Elite Duelist", division: "II", minPoints: 1600, maxPoints: 1699 },
  { name: "Elite Duelist III", tier: "Elite Duelist", division: "III", minPoints: 1700, maxPoints: 1799 },

  // APEX (1800–2099)
  { name: "Apex I", tier: "Apex", division: "I", minPoints: 1800, maxPoints: 1899 },
  { name: "Apex II", tier: "Apex", division: "II", minPoints: 1900, maxPoints: 1999 },
  { name: "Apex III", tier: "Apex", division: "III", minPoints: 2000, maxPoints: 2099 },

  // LEGEND / CHAMPION (2100+)
  { name: "Legend I", tier: "Legend", division: "I", minPoints: 2100, maxPoints: 2199 },
  { name: "Legend II", tier: "Legend", division: "II", minPoints: 2200, maxPoints: 2299 },
  { name: "Champion", tier: "Champion", division: null, minPoints: 2300, maxPoints: Infinity },
];

/**
 * Calculates new Duel Points given current points and match delta.
 * Ensures points never drop below 0.
 */
export function applyDuelPointDelta(currentPoints: number = 0, delta: number): number {
  const current = Math.max(0, Math.floor(currentPoints || 0));
  return Math.max(0, current + delta);
}

/**
 * Resolves normal tier rank based strictly on Duel Points.
 */
export function getNormalDuelRank(duelPoints: number = 0): ResolvedDuelRank {
  const pts = Math.max(0, Math.floor(duelPoints || 0));

  const rankIndex = DUEL_RANKS.findIndex(
    (r) => pts >= r.minPoints && pts <= r.maxPoints
  );

  const currentIndex = rankIndex !== -1 ? rankIndex : DUEL_RANKS.length - 1;
  const current = DUEL_RANKS[currentIndex];
  const next = currentIndex < DUEL_RANKS.length - 1 ? DUEL_RANKS[currentIndex + 1] : null;

  return {
    tier: currentIndex + 1,
    rankName: current.name,
    tierName: current.tier,
    division: current.division,
    minPoints: current.minPoints,
    maxPoints: Number.isFinite(current.maxPoints) ? current.maxPoints : null,
    pointsToNextRank: next ? next.minPoints - pts : null,
    nextRankName: next ? next.name : null,
    isChampion: false,
    championPosition: null,
  };
}

/**
 * Resolves full Duel Rank information, incorporating Champion status when eligible.
 */
export function getDuelRank(
  duelPoints: number = 0,
  championPosition?: number | null
): ResolvedDuelRank {
  const pts = Math.max(0, Math.floor(duelPoints || 0));

  if (championPosition && championPosition >= 1 && championPosition <= 3) {
    return {
      tier: null,
      rankName: `Champion #${championPosition}`,
      tierName: "Champion",
      division: `#${championPosition}`,
      minPoints: pts,
      maxPoints: null,
      pointsToNextRank: null,
      nextRankName: null,
      isChampion: true,
      championPosition,
    };
  }

  return getNormalDuelRank(pts);
}

/**
 * Retrieves the user IDs of the current top 3 Champion players.
 * Eligibility requires minimum 3 completed rated duels and active (non-banned) account.
 */
export async function getTop3ChampionUserIds(): Promise<string[]> {
  const { User } = await import("@/models/User");
  const topUsers = await User.find({
    duelsPlayed: { $gte: CHAMPION_MIN_DUELS },
    isBanned: false,
  })
    .sort({ duelPoints: -1, duelsWon: -1, duelRating: -1, _id: 1 })
    .limit(3)
    .select("_id")
    .lean();

  return topUsers.map((u) => u._id.toString());
}

/**
 * Resolves dynamic Champion position (1, 2, 3 or null) for a given user.
 * Can accept either pre-computed top 3 Champion IDs or query automatically.
 */
export async function resolveUserChampionPosition(
  userId: string,
  championIdsOrDuelsPlayed?: string[] | number
): Promise<number | null> {
  if (Array.isArray(championIdsOrDuelsPlayed)) {
    const index = championIdsOrDuelsPlayed.indexOf(userId.toString());
    return index !== -1 ? index + 1 : null;
  }

  if (typeof championIdsOrDuelsPlayed === "number" && championIdsOrDuelsPlayed < CHAMPION_MIN_DUELS) {
    return null;
  }

  const championIds = await getTop3ChampionUserIds();
  const index = championIds.indexOf(userId.toString());
  if (index !== -1) {
    return index + 1; // 1, 2, or 3
  }
  return null;
}
