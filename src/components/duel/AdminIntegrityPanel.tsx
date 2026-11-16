"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ClipboardX,
  EyeOff,
  Keyboard,
  Zap,
  ChevronDown,
  ChevronUp,
  WifiOff,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import type {
  AdminPlayerIntegritySnapshot,
  AdminRoomIntegritySnapshot,
} from "@/lib/duelSpectateAdmin";

interface SpectatorSideUser {
  userId: string;
  username: string;
  displayName: string;
}

interface AdminIntegrityPanelProps {
  player1: SpectatorSideUser;
  player2: SpectatorSideUser | null;
  integrity: AdminRoomIntegritySnapshot;
  roomStatus: string;
}

function formatSecondsShort(ms: number): string {
  const sec = Math.max(0, Math.round(ms / 1000));
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

function getRiskTone(riskScore: number, hasWarning: boolean): {
  label: string;
  borderClass: string;
  badgeClass: string;
} {
  if (riskScore >= 70) {
    return {
      label: `HIGH RISK (${riskScore})`,
      borderClass: "border-[#EF4444]/40",
      badgeClass: "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30",
    };
  }
  if (riskScore > 0 || hasWarning) {
    return {
      label: riskScore > 0 ? `WATCH (${riskScore})` : "WARNED",
      borderClass: "border-[#F59E0B]/40",
      badgeClass: "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30",
    };
  }
  return {
    label: "CLEAN (0)",
    borderClass: "border-[#252936]",
    badgeClass: "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/25",
  };
}

function PlayerIntegrityCard({
  label,
  player,
  snapshot,
  accentClass,
  roomStatus,
}: {
  label: string;
  player: SpectatorSideUser | null;
  snapshot: AdminPlayerIntegritySnapshot | null;
  accentClass: string;
  roomStatus: string;
}) {
  if (!player || !snapshot) {
    return (
      <div className="p-4 rounded-xl bg-[#0D0F15] border border-[#252936] flex items-center justify-center min-h-[150px]">
        <p className="font-mono text-xs text-[#5E667B]">Waiting for second player telemetry...</p>
      </div>
    );
  }

  const hasWarningSignal = Boolean(
    snapshot.lastWarning ||
      snapshot.integrityFlags.length > 0 ||
      snapshot.pasteBlockedCount > 0 ||
      snapshot.unexplainedBurstCount > 0 ||
      snapshot.unfocusedPercent >= 50
  );
  const tone = getRiskTone(snapshot.riskScore, hasWarningSignal);

  return (
    <div className={`p-4 rounded-xl bg-[#0D0F15] border ${tone.borderClass} space-y-3`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`font-mono text-[10px] font-bold uppercase ${accentClass}`}>{label}</span>
          <span className="font-bold text-sm text-[#F5F7FA] truncate">@{player.username}</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {snapshot.staleHeartbeatSec !== null && roomStatus === "ACTIVE" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[#F59E0B]/35 bg-[#F59E0B]/10 font-mono text-[10px] text-[#F59E0B]">
              <WifiOff className="h-3 w-3" aria-hidden="true" />
              Tab away {snapshot.staleHeartbeatSec}s
            </span>
          )}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border font-mono text-[10px] font-bold ${tone.badgeClass}`}>
            {tone.label}
          </span>
        </div>
      </div>

      {/* Live Warning Status */}
      {snapshot.lastWarning ? (
        <div
          className={`p-3 rounded-lg border text-xs space-y-1.5 ${
            snapshot.lastWarningSeverity === "danger"
              ? "bg-[#EF4444]/10 border-[#EF4444]/35 text-[#FCA5A5]"
              : snapshot.lastWarningSeverity === "info"
              ? "bg-[#00F0FF]/10 border-[#00F0FF]/35 text-[#67E8F9]"
              : "bg-[#F59E0B]/10 border-[#F59E0B]/35 text-[#FDE68A]"
          }`}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {snapshot.lastWarningSeverity === "danger"
                ? "CRITICAL WARNING SHOWN"
                : snapshot.lastWarningSeverity === "info"
                ? "INTEGRITY NOTICE SHOWN"
                : "LIVE WARNING SHOWN"}
            </span>
            <span className="font-mono text-[10px] opacity-85 px-1.5 py-0.5 rounded bg-black/25">
              {snapshot.warningDismissed ? "Dismissed by player" : "Active on player screen"}
            </span>
          </div>
          <p className="leading-relaxed text-[12px] text-[#F5F7FA]">{snapshot.lastWarning}</p>
        </div>
      ) : (
        <div className="px-3 py-2 rounded-lg bg-[#11131A] border border-[#252936] flex items-center gap-2 text-[11px] text-[#8B93A7]">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981] shrink-0" aria-hidden="true" />
          <span>No anti-cheat warnings triggered this round.</span>
        </div>
      )}

      {/* Telemetry Breakdown Grid */}
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 rounded-lg bg-[#11131A] border border-[#252936]">
          <dt className="flex items-center gap-1 text-[10px] font-mono text-[#8B93A7] uppercase">
            <ClipboardX className="h-3 w-3 text-[#F59E0B]" aria-hidden="true" />
            Blocked Pastes
          </dt>
          <dd className="font-mono text-sm font-bold text-[#F5F7FA] mt-0.5">
            {snapshot.pasteBlockedCount}
            {snapshot.pasteBlockedChars > 0 && (
              <span className="text-[10px] font-normal text-[#8B93A7] ml-1">
                ({snapshot.pasteBlockedChars} ch)
              </span>
            )}
          </dd>
        </div>

        <div className="p-2.5 rounded-lg bg-[#11131A] border border-[#252936]">
          <dt className="flex items-center gap-1 text-[10px] font-mono text-[#8B93A7] uppercase">
            <EyeOff className="h-3 w-3 text-[#F59E0B]" aria-hidden="true" />
            Tab / Away
          </dt>
          <dd className="font-mono text-sm font-bold mt-0.5">
            <span
              className={
                snapshot.unfocusedPercent >= 70
                  ? "text-[#EF4444]"
                  : snapshot.unfocusedPercent >= 40
                  ? "text-[#F59E0B]"
                  : "text-[#F5F7FA]"
              }
            >
              {snapshot.unfocusedPercent}%
            </span>
            <span className="text-[10px] font-normal text-[#8B93A7] ml-1">
              ({snapshot.focusLostCount}x · {formatSecondsShort(snapshot.effectiveBlurredMs)})
            </span>
          </dd>
        </div>

        <div className="p-2.5 rounded-lg bg-[#11131A] border border-[#252936]">
          <dt className="flex items-center gap-1 text-[10px] font-mono text-[#8B93A7] uppercase">
            <Zap className="h-3 w-3 text-[#EF4444]" aria-hidden="true" />
            Code Bursts
          </dt>
          <dd className="font-mono text-sm font-bold text-[#F5F7FA] mt-0.5">
            {snapshot.unexplainedBurstCount}
            {snapshot.maxBurstChars > 0 && (
              <span className="text-[10px] font-normal text-[#8B93A7] ml-1">
                (max {snapshot.maxBurstChars})
              </span>
            )}
          </dd>
        </div>

        <div className="p-2.5 rounded-lg bg-[#11131A] border border-[#252936]">
          <dt className="flex items-center gap-1 text-[10px] font-mono text-[#8B93A7] uppercase">
            <Keyboard className="h-3 w-3 text-[#00F0FF]" aria-hidden="true" />
            Keystrokes
          </dt>
          <dd className="font-mono text-sm font-bold text-[#F5F7FA] mt-0.5">
            {snapshot.keystrokes}
            <span className="text-[10px] font-normal text-[#8B93A7] ml-1">
              (-{snapshot.backspaces})
            </span>
          </dd>
        </div>
      </dl>

      {/* Post-Submit Server Flags */}
      {snapshot.integrityFlags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="font-mono text-[10px] text-[#8B93A7] uppercase mr-1">Server Flags:</span>
          {snapshot.integrityFlags.map((flag) => (
            <span
              key={flag}
              className="px-2 py-0.5 rounded bg-[#EF4444]/15 border border-[#EF4444]/30 font-mono text-[10px] text-[#FCA5A5]"
            >
              {flag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminIntegrityPanel({
  player1,
  player2,
  integrity,
  roomStatus,
}: AdminIntegrityPanelProps) {
  const [showRoundHistory, setShowRoundHistory] = useState(false);

  return (
    <section
      aria-labelledby="admin-integrity-heading"
      className="p-5 bg-[#11131A] border border-[#252936] rounded-xl space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#252936] pb-3">
        <div className="flex items-center gap-2.5">
          {integrity.eloVoided || integrity.integrityFlagged ? (
            <ShieldAlert className="h-5 w-5 text-[#EF4444]" aria-hidden="true" />
          ) : (
            <ShieldCheck className="h-5 w-5 text-[#10B981]" aria-hidden="true" />
          )}
          <div>
            <h2 id="admin-integrity-heading" className="text-sm font-bold text-[#F5F7FA] tracking-tight">
              Admin Live Anti-Cheat &amp; Warnings Monitor
            </h2>
            <p className="text-[11px] text-[#8B93A7]">
              Private staff view — live player warnings, tab focus loss, blocked pastes, and risk signals (Round {integrity.activeRound}).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/duels"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#181B24] border border-[#252936] hover:border-[#383E52] font-mono text-[11px] text-[#8B93A7] hover:text-[#F5F7FA] transition"
          >
            <ArrowLeft className="h-3 w-3" aria-hidden="true" />
            <span>All Live Duels</span>
          </Link>
          {integrity.eloVoided && (
            <span className="px-2.5 py-1 rounded bg-[#EF4444]/15 border border-[#EF4444]/35 font-mono text-[11px] font-bold text-[#EF4444]">
              ELO VOIDED
            </span>
          )}
          {integrity.integrityFlagged && !integrity.eloVoided && (
            <span className="px-2.5 py-1 rounded bg-[#F59E0B]/15 border border-[#F59E0B]/35 font-mono text-[11px] font-bold text-[#F59E0B]">
              INTEGRITY FLAGGED
            </span>
          )}
          {!integrity.integrityFlagged && !integrity.eloVoided && (
            <span className="px-2.5 py-1 rounded bg-[#10B981]/10 border border-[#10B981]/25 font-mono text-[11px] text-[#10B981]">
              RATING ELIGIBLE
            </span>
          )}
        </div>
      </div>

      {integrity.integrityReasons.length > 0 && (
        <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 space-y-1">
          <p className="font-mono text-[10px] font-bold uppercase text-[#FCA5A5]">
            Audit Trigger Reasons
          </p>
          <ul className="list-disc list-inside text-xs text-[#F5F7FA] space-y-0.5">
            {integrity.integrityReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PlayerIntegrityCard
          label="PLAYER 1"
          player={player1}
          snapshot={integrity.player1}
          accentClass="text-[#00F0FF]"
          roomStatus={roomStatus}
        />
        <PlayerIntegrityCard
          label="PLAYER 2"
          player={player2}
          snapshot={integrity.player2}
          accentClass="text-[#F59E0B]"
          roomStatus={roomStatus}
        />
      </div>

      {integrity.rounds.length > 1 && (
        <div className="pt-1 border-t border-[#252936]">
          <button
            type="button"
            onClick={() => setShowRoundHistory((prev) => !prev)}
            aria-expanded={showRoundHistory}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#8B93A7] hover:text-[#F5F7FA] transition py-1"
          >
            {showRoundHistory ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>Round-by-Round Warning History ({integrity.rounds.length} rounds)</span>
          </button>

          {showRoundHistory && (
            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {integrity.rounds.map((rd) => (
                <div
                  key={rd.roundNumber}
                  className="p-3 rounded-lg bg-[#0D0F15] border border-[#252936] space-y-1.5 text-[11px]"
                >
                  <div className="flex items-center justify-between font-mono text-[#8B93A7]">
                    <span className="font-bold text-[#F5F7FA]">Round {rd.roundNumber}</span>
                    <span>{rd.problemId}</span>
                  </div>
                  <div className="space-y-1 text-[#8B93A7]">
                    <p>
                      <span className="text-[#00F0FF] font-mono">@{player1.username}:</span>{" "}
                      {rd.player1.lastWarning ? (
                        <span className="text-[#FDE68A]">{rd.player1.lastWarning}</span>
                      ) : (
                        <span>
                          {rd.player1.pasteBlockedCount} pastes · {rd.player1.focusLostCount} tabs · Risk {rd.player1.riskScore}
                        </span>
                      )}
                    </p>
                    {player2 && rd.player2 && (
                      <p>
                        <span className="text-[#F59E0B] font-mono">@{player2.username}:</span>{" "}
                        {rd.player2.lastWarning ? (
                          <span className="text-[#FDE68A]">{rd.player2.lastWarning}</span>
                        ) : (
                          <span>
                            {rd.player2.pasteBlockedCount} pastes · {rd.player2.focusLostCount} tabs · Risk {rd.player2.riskScore}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
