import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { connectToDatabase } from "@/lib/mongodb";
import { DuelRoom } from "@/models/DuelRoom";
import { buildAdminRoomIntegrity, type SpectateRoomLike } from "@/lib/duelSpectateAdmin";

type DuelFilter = "LIVE" | "FLAGGED" | "FINISHED" | "ALL";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const FLAGGED_QUERY = {
  $or: [
    { integrityFlagged: true },
    { eloVoided: true },
    { "roundsData.player1RiskScore": { $gt: 0 } },
    { "roundsData.player2RiskScore": { $gt: 0 } },
    { "roundsData.player1TelemetrySummary.lastWarning": { $nin: [null, ""] } },
    { "roundsData.player2TelemetrySummary.lastWarning": { $nin: [null, ""] } },
    { "roundsData.player1TelemetrySummary.pasteBlockedCount": { $gt: 0 } },
    { "roundsData.player2TelemetrySummary.pasteBlockedCount": { $gt: 0 } },
  ],
};

const LIVE_STATUS_QUERY = { status: { $in: ["WAITING", "COUNTDOWN", "ACTIVE"] } };

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdminUser();
    if (!authResult.admin) {
      return NextResponse.json(
        { error: authResult.error || "Forbidden: Admin access required." },
        { status: authResult.status }
      );
    }

    const rl = await checkRateLimit(`admin-duels:${authResult.admin._id}`, {
      limit: 60,
      windowMs: 60 * 1000,
    });
    if (!rl.success) {
      return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const rawFilter = (searchParams.get("filter") || "LIVE").toUpperCase();
    const filter: DuelFilter =
      rawFilter === "FLAGGED" || rawFilter === "FINISHED" || rawFilter === "ALL" ? rawFilter : "LIVE";
    const search = (searchParams.get("search") || "").trim().slice(0, 64);
    const parsedLimit = Number(searchParams.get("limit") || 30);
    const limit = Number.isFinite(parsedLimit) ? Math.min(50, Math.max(1, Math.round(parsedLimit))) : 30;

    const filterClause: Record<string, unknown> =
      filter === "LIVE"
        ? LIVE_STATUS_QUERY
        : filter === "FLAGGED"
        ? FLAGGED_QUERY
        : filter === "FINISHED"
        ? { status: "FINISHED" }
        : {};

    const searchClause: Record<string, unknown> = search
      ? (() => {
          const rx = new RegExp(escapeRegex(search), "i");
          return {
            $or: [
              { roomCode: rx },
              { "player1.username": rx },
              { "player1.displayName": rx },
              { "player2.username": rx },
              { "player2.displayName": rx },
            ],
          };
        })()
      : {};

    const query =
      Object.keys(filterClause).length > 0 && Object.keys(searchClause).length > 0
        ? { $and: [filterClause, searchClause] }
        : Object.keys(filterClause).length > 0
        ? filterClause
        : searchClause;

    const [rooms, liveCount, flaggedCount, finishedCount, totalCount] = await Promise.all([
      DuelRoom.find(query)
        .select(
          "roomCode mode status difficulty currentRound rounds isRated player1 player2 player1Score player2Score winner roundStartedAt finishedAt createdAt integrityFlagged eloVoided integrityReasons roundsData.roundNumber roundsData.problemId roundsData.difficulty roundsData.startedAt roundsData.player1Status roundsData.player2Status roundsData.player1IntegrityFlags roundsData.player2IntegrityFlags roundsData.player1RiskScore roundsData.player2RiskScore roundsData.player1TelemetrySummary roundsData.player2TelemetrySummary"
        )
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      DuelRoom.countDocuments(LIVE_STATUS_QUERY),
      DuelRoom.countDocuments(FLAGGED_QUERY),
      DuelRoom.countDocuments({ status: "FINISHED" }),
      DuelRoom.estimatedDocumentCount(),
    ]);

    const nowMs = Date.now();
    const duels = rooms.map((rawRoom) => {
      const room = rawRoom as SpectateRoomLike & {
        roomCode: string;
        mode?: string;
        difficulty?: string;
        rounds?: number;
        isRated?: boolean;
        player1: { userId: string; username: string; displayName: string };
        player2?: { userId?: string; username?: string; displayName?: string } | null;
        player1Score?: number;
        player2Score?: number;
        winner?: string | null;
        finishedAt?: Date | string | null;
      };

      const integrity = buildAdminRoomIntegrity(room, nowMs);
      const p1HasSignal = Boolean(
        integrity.player1.lastWarning ||
          integrity.player1.integrityFlags.length > 0 ||
          integrity.player1.pasteBlockedCount > 0 ||
          integrity.player1.focusLostCount > 0 ||
          integrity.player1.riskScore > 0
      );
      const p2HasSignal = Boolean(
        integrity.player2 &&
          (integrity.player2.lastWarning ||
            integrity.player2.integrityFlags.length > 0 ||
            integrity.player2.pasteBlockedCount > 0 ||
            integrity.player2.focusLostCount > 0 ||
            integrity.player2.riskScore > 0)
      );

      return {
        roomCode: room.roomCode,
        mode: room.mode || "CASUAL",
        status: room.status,
        difficulty: room.difficulty || "Mixed",
        currentRound: room.currentRound || 1,
        rounds: room.rounds || 3,
        isRated: room.isRated !== false,
        player1: {
          userId: room.player1?.userId || "",
          username: room.player1?.username || "player1",
          displayName: room.player1?.displayName || room.player1?.username || "Player 1",
          score: room.player1Score || 0,
          integrity: integrity.player1,
        },
        player2: room.player2?.userId
          ? {
              userId: room.player2.userId,
              username: room.player2.username || "player2",
              displayName: room.player2.displayName || room.player2.username || "Player 2",
              score: room.player2Score || 0,
              integrity: integrity.player2,
            }
          : null,
        winner: room.winner || null,
        integrityFlagged: integrity.integrityFlagged,
        eloVoided: integrity.eloVoided,
        integrityReasons: integrity.integrityReasons,
        hasAnyWarning:
          Boolean(integrity.player1.lastWarning || integrity.player2?.lastWarning) ||
          integrity.integrityFlagged ||
          p1HasSignal ||
          p2HasSignal,
        hasActiveWarningText: Boolean(integrity.player1.lastWarning || integrity.player2?.lastWarning),
        spectatorUrl: `/duel/${room.roomCode}/spectate`,
        createdAt: room.createdAt || null,
        roundStartedAt: room.roundStartedAt || null,
        finishedAt: room.finishedAt || null,
      };
    });

    return NextResponse.json({
      duels,
      counts: {
        live: liveCount,
        flagged: flaggedCount,
        finished: finishedCount,
        total: totalCount,
      },
      serverTime: new Date(nowMs).toISOString(),
    });
  } catch (error) {
    console.error("Admin duels telemetry fetch failed:", error);
    return NextResponse.json({ error: "Failed to fetch duel telemetry." }, { status: 500 });
  }
}
