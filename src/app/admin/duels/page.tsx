"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Swords,
  Search,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Eye,
  ClipboardX,
  EyeOff,
  Pause,
  Play,
  WifiOff,
} from "lucide-react";
import { AdminTableSkeleton } from "@/components/ui/PageSkeletons";
import { LoadError } from "@/components/ui/LoadError";
import { useDelayedFlag } from "@/hooks/useDelayedFlag";
import { formatIST } from "@/lib/dateUtils";
import type { AdminPlayerIntegritySnapshot } from "@/lib/duelSpectateAdmin";

type DuelFilter = "LIVE" | "FLAGGED" | "FINISHED" | "ALL";

interface AdminDuelPlayerSummary {
  userId: string;
  username: string;
  displayName: string;
  score: number;
  integrity: AdminPlayerIntegritySnapshot;
}

interface AdminDuelItem {
  roomCode: string;
  mode: string;
  status: string;
  difficulty: string;
  currentRound: number;
  rounds: number;
  isRated: boolean;
  player1: AdminDuelPlayerSummary;
  player2: AdminDuelPlayerSummary | null;
  winner: string | null;
  integrityFlagged: boolean;
  eloVoided: boolean;
  integrityReasons: string[];
  hasAnyWarning: boolean;
  hasActiveWarningText: boolean;
  spectatorUrl: string;
  createdAt: string | null;
  roundStartedAt: string | null;
  finishedAt: string | null;
}

interface DuelCounts {
  live: number;
  flagged: number;
  finished: number;
  total: number;
}

function PlayerWarningPreview({
  player,
}: {
  player: AdminDuelPlayerSummary;
}) {
  const { integrity } = player;
  if (!integrity.lastWarning && integrity.staleHeartbeatSec === null && integrity.integrityFlags.length === 0) {
    return null;
  }

  return (
    <div
      className="rounded px-2 py-1 text-[11px] space-y-0.5"
      style={{
        backgroundColor:
          integrity.lastWarningSeverity === "danger"
            ? "color-mix(in srgb, #EF4444 12%, transparent)"
            : integrity.lastWarningSeverity === "info"
            ? "color-mix(in srgb, #00F0FF 10%, transparent)"
            : "color-mix(in srgb, #F59E0B 12%, transparent)",
        border:
          integrity.lastWarningSeverity === "danger"
            ? "1px solid color-mix(in srgb, #EF4444 32%, transparent)"
            : integrity.lastWarningSeverity === "info"
            ? "1px solid color-mix(in srgb, #00F0FF 30%, transparent)"
            : "1px solid color-mix(in srgb, #F59E0B 32%, transparent)",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="mono font-semibold" style={{ color: "var(--fg)" }}>
          @{player.username}
        </span>
        {integrity.staleHeartbeatSec !== null && (
          <span className="inline-flex items-center gap-1 mono text-[10px] text-[#F59E0B]">
            <WifiOff className="h-3 w-3" aria-hidden="true" />
            Away {integrity.staleHeartbeatSec}s
          </span>
        )}
      </div>
      {integrity.lastWarning && (
        <p className="line-clamp-2 leading-snug" style={{ color: "var(--fg-muted)" }}>
          {integrity.lastWarning}
        </p>
      )}
      {integrity.integrityFlags.length > 0 && (
        <p className="mono text-[10px] text-[#EF4444]">
          Flags: {integrity.integrityFlags.join(", ")}
        </p>
      )}
    </div>
  );
}

export default function AdminDuelsPage() {
  const [duels, setDuels] = useState<AdminDuelItem[]>([]);
  const [counts, setCounts] = useState<DuelCounts>({ live: 0, flagged: 0, finished: 0, total: 0 });
  const [filter, setFilter] = useState<DuelFilter>("LIVE");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [autoPoll, setAutoPoll] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");
  const showSkeleton = useDelayedFlag(loading);

  const fetchDuels = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        const params = new URLSearchParams({ filter, limit: "40" });
        if (search.trim()) params.set("search", search.trim());

        const res = await fetch(`/api/admin/duels?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        setDuels(Array.isArray(json.duels) ? json.duels : []);
        if (json.counts) setCounts(json.counts);
        setLoadError(false);
        setLastRefreshed(new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }));
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
        if (isManual) setRefreshing(false);
      }
    },
    [filter, search]
  );

  useEffect(() => {
    setLoading(true);
    fetchDuels(false);
  }, [fetchDuels]);

  useEffect(() => {
    if (!autoPoll) return;
    const timer = setInterval(() => {
      fetchDuels(false);
    }, 4000);
    return () => clearInterval(timer);
  }, [autoPoll, fetchDuels]);

  const filterTabs: Array<{ key: DuelFilter; label: string; count: number }> = [
    { key: "LIVE", label: "Live Matches", count: counts.live },
    { key: "FLAGGED", label: "Warnings / Flagged", count: counts.flagged },
    { key: "FINISHED", label: "Finished", count: counts.finished },
    { key: "ALL", label: "All Rooms", count: counts.total },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div>
          <div className="flex items-center gap-2">
            <Swords className="h-5 w-5" style={{ color: "var(--accent)" }} aria-hidden="true" />
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>
              Live Duels &amp; Integrity Monitor
            </h1>
          </div>
          <p className="text-[12px] mt-1" style={{ color: "var(--fg-muted)" }}>
            Spectate ongoing 1v1 duels in real time and inspect player anti-cheat warnings, paste blocks, and tab switches.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {lastRefreshed && (
            <span className="mono text-[11px]" style={{ color: "var(--fg-dimmed)" }}>
              Updated {lastRefreshed} IST
            </span>
          )}
          <button
            type="button"
            onClick={() => setAutoPoll((prev) => !prev)}
            aria-pressed={autoPoll}
            className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[12px] font-medium transition"
            style={{
              backgroundColor: autoPoll
                ? "color-mix(in srgb, var(--accent) 12%, transparent)"
                : "var(--bg-subtle)",
              color: autoPoll ? "var(--accent)" : "var(--fg-muted)",
              border: "1px solid var(--border)",
            }}
          >
            {autoPoll ? (
              <Pause className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{autoPoll ? "Auto-Poll On (4s)" : "Auto-Poll Paused"}</span>
          </button>

          <button
            type="button"
            onClick={() => fetchDuels(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[12px] font-medium transition"
            style={{
              backgroundColor: "var(--bg-subtle)",
              color: "var(--fg)",
              border: "1px solid var(--border)",
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter duels">
          {filterTabs.map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(tab.key)}
                className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[12px] font-medium transition"
                style={{
                  backgroundColor: active
                    ? "color-mix(in srgb, var(--accent) 14%, transparent)"
                    : "var(--bg-subtle)",
                  color: active ? "var(--accent)" : "var(--fg-muted)",
                  border: active
                    ? "1px solid color-mix(in srgb, var(--accent) 35%, transparent)"
                    : "1px solid var(--border)",
                }}
              >
                <span>{tab.label}</span>
                <span
                  className="mono text-[10px] px-1.5 py-0.2 rounded"
                  style={{
                    backgroundColor: "var(--bg)",
                    color: active ? "var(--accent)" : "var(--fg-dimmed)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[240px]">
          <label htmlFor="admin-duels-search" className="sr-only">
            Search rooms by code or player username
          </label>
          <Search
            className="absolute left-3 top-2.5 h-3.5 w-3.5"
            style={{ color: "var(--fg-dimmed)" }}
            aria-hidden="true"
          />
          <input
            id="admin-duels-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search room code or @username..."
            className="w-full rounded py-1.5 pl-8 pr-3 text-[12px] focus:outline-none"
            style={{
              backgroundColor: "var(--bg-subtle)",
              color: "var(--fg)",
              border: "1px solid var(--border)",
            }}
          />
        </div>
      </div>

      {/* Duels Table Container */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          border: "1px solid var(--border)",
          backgroundColor: "var(--bg)",
        }}
      >
        {loading ? (
          showSkeleton ? (
            <AdminTableSkeleton label="Loading live duels" />
          ) : (
            <div aria-busy="true" style={{ minHeight: 8 * 56 }} />
          )
        ) : loadError ? (
          <LoadError
            message="We couldn't load duel telemetry. Check your connection and try again."
            onRetry={() => fetchDuels(true)}
          />
        ) : duels.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-2">
            <p className="text-[13px] font-medium" style={{ color: "var(--fg)" }}>
              No duels match the selected view.
            </p>
            <p className="text-[12px]" style={{ color: "var(--fg-muted)" }}>
              {filter === "LIVE"
                ? "Switch to Warnings / Flagged or All Rooms to review historical matches and telemetry."
                : "Try clearing the search filter or checking back once new matches start."}
            </p>
          </div>
        ) : (
          <div
            tabIndex={0}
            role="region"
            aria-labelledby="admin-duels-table-caption"
            className="overflow-x-auto focus:outline-none focus-visible:ring-2"
          >
            <table className="w-full text-left text-[12px]">
              <caption id="admin-duels-table-caption" className="sr-only">
                Duel rooms and live player anti-cheat warnings
              </caption>
              <thead
                className="font-mono text-[11px] uppercase tracking-wider"
                style={{
                  backgroundColor: "var(--bg-subtle)",
                  color: "var(--fg-dimmed)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <tr>
                  <th scope="col" className="px-4 py-3">Room</th>
                  <th scope="col" className="px-4 py-3">Players &amp; Score</th>
                  <th scope="col" className="px-4 py-3">Live Warnings</th>
                  <th scope="col" className="px-4 py-3">Telemetry Signals</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3 text-right">Spectate</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {duels.map((duel) => {
                  const p1 = duel.player1.integrity;
                  const p2 = duel.player2?.integrity || null;
                  const totalBlockedPastes = p1.pasteBlockedCount + (p2?.pasteBlockedCount || 0);
                  const totalTabSwitches = p1.focusLostCount + (p2?.focusLostCount || 0);
                  const maxUnfocusedPct = Math.max(p1.unfocusedPercent, p2?.unfocusedPercent || 0);
                  const maxRisk = Math.max(p1.riskScore, p2?.riskScore || 0);

                  return (
                    <tr key={duel.roomCode} className="align-top">
                      <th scope="row" className="px-4 py-3 font-normal whitespace-nowrap">
                        <div className="space-y-1">
                          <span className="mono font-bold text-[13px]" style={{ color: "var(--fg)" }}>
                            {duel.roomCode}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className="mono text-[10px] px-1.5 py-0.5 rounded uppercase"
                              style={{
                                backgroundColor: "var(--bg-subtle)",
                                color: "var(--fg-muted)",
                                border: "1px solid var(--border)",
                              }}
                            >
                              {duel.mode} · {duel.difficulty}
                            </span>
                            <span className="mono text-[10px]" style={{ color: "var(--fg-dimmed)" }}>
                              R{duel.currentRound}/{duel.rounds}
                            </span>
                          </div>
                          {duel.createdAt && (
                            <p className="text-[10px]" style={{ color: "var(--fg-dimmed)" }}>
                              {formatIST(duel.createdAt)}
                            </p>
                          )}
                        </div>
                      </th>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium" style={{ color: "var(--fg)" }}>
                              @{duel.player1.username}
                            </span>
                            <span className="mono font-bold" style={{ color: "var(--accent)" }}>
                              {duel.player1.score}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            {duel.player2 ? (
                              <>
                                <span className="font-medium" style={{ color: "var(--fg)" }}>
                                  @{duel.player2.username}
                                </span>
                                <span className="mono font-bold text-[#F59E0B]">
                                  {duel.player2.score}
                                </span>
                              </>
                            ) : (
                              <span className="text-[11px]" style={{ color: "var(--fg-dimmed)" }}>
                                Waiting for opponent...
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 min-w-[230px] max-w-[340px]">
                        <div className="space-y-1.5">
                          <PlayerWarningPreview player={duel.player1} />
                          {duel.player2 && <PlayerWarningPreview player={duel.player2} />}
                          {!duel.hasActiveWarningText &&
                            duel.player1.integrity.staleHeartbeatSec === null &&
                            (!duel.player2 || duel.player2.integrity.staleHeartbeatSec === null) &&
                            duel.player1.integrity.integrityFlags.length === 0 &&
                            (!duel.player2 || duel.player2.integrity.integrityFlags.length === 0) && (
                              <span
                                className="inline-flex items-center gap-1 text-[11px]"
                                style={{ color: "var(--fg-dimmed)" }}
                              >
                                <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" aria-hidden="true" />
                                Clean — no warnings shown
                              </span>
                            )}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="space-y-1 font-mono text-[11px]">
                          <div className="flex items-center gap-3" style={{ color: "var(--fg-muted)" }}>
                            <span className="inline-flex items-center gap-1">
                              <ClipboardX className="h-3 w-3 text-[#F59E0B]" aria-hidden="true" />
                              {totalBlockedPastes} pastes
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <EyeOff className="h-3 w-3 text-[#F59E0B]" aria-hidden="true" />
                              {totalTabSwitches} tabs ({maxUnfocusedPct}%)
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {duel.eloVoided && (
                              <span className="px-1.5 py-0.5 rounded bg-[#EF4444]/15 border border-[#EF4444]/30 text-[10px] font-bold text-[#EF4444]">
                                ELO VOIDED
                              </span>
                            )}
                            {duel.integrityFlagged && !duel.eloVoided && (
                              <span className="px-1.5 py-0.5 rounded bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[10px] font-bold text-[#F59E0B]">
                                FLAGGED
                              </span>
                            )}
                            {maxRisk > 0 && (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]"
                                style={{
                                  backgroundColor: "var(--bg-subtle)",
                                  color: maxRisk >= 70 ? "#EF4444" : "#F59E0B",
                                  border: "1px solid var(--border)",
                                }}
                              >
                                <AlertTriangle className="h-2.5 w-2.5" aria-hidden="true" />
                                Peak Risk {maxRisk}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="space-y-1">
                          <span
                            className="inline-flex items-center gap-1 mono text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                            style={{
                              backgroundColor:
                                duel.status === "ACTIVE" || duel.status === "COUNTDOWN"
                                  ? "color-mix(in srgb, #10B981 14%, transparent)"
                                  : duel.status === "WAITING"
                                  ? "color-mix(in srgb, #F59E0B 14%, transparent)"
                                  : "var(--bg-subtle)",
                              color:
                                duel.status === "ACTIVE" || duel.status === "COUNTDOWN"
                                  ? "#10B981"
                                  : duel.status === "WAITING"
                                  ? "#F59E0B"
                                  : "var(--fg-muted)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            {duel.hasAnyWarning && (
                              <ShieldAlert className="h-3 w-3 text-[#F59E0B]" aria-hidden="true" />
                            )}
                            {duel.status}
                          </span>
                          {!duel.isRated && (
                            <p className="mono text-[10px]" style={{ color: "var(--fg-dimmed)" }}>
                              Unrated
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Link
                          href={duel.spectatorUrl}
                          className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[11px] font-semibold transition"
                          style={{
                            backgroundColor: "color-mix(in srgb, var(--accent) 14%, transparent)",
                            color: "var(--accent)",
                            border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)",
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Spectate Live</span>
                          <span className="sr-only">room {duel.roomCode}</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
