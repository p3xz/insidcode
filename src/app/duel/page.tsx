"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Swords, ArrowRight, Loader2, Zap, Shield, Flame, Eye } from "lucide-react";
import { useSession } from "next-auth/react";

export default function DuelHubPage() {
  const router = useRouter();
  const { data: session } = useSession();

  // Create Duel Setup State
  const [selectedDifficulty, setSelectedDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Join Duel State
  const [roomCode, setRoomCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleCreateDuel = async () => {
    setCreateError(null);
    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent("/duel")}`);
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch("/api/duel/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty: selectedDifficulty }),
      });

      const data = await res.json();
      if (res.ok && data.roomCode) {
        router.push(`/duel/${data.roomCode}`);
      } else {
        setCreateError(data.error || "Failed to create Duel room.");
      }
    } catch {
      setCreateError("Network error creating Duel room. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinDuel = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);

    const cleanCode = roomCode.trim().toUpperCase();
    if (!cleanCode) {
      setJoinError("Please enter a valid Duel room code.");
      return;
    }

    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/duel/${cleanCode}`)}`);
      return;
    }

    setIsJoining(true);
    try {
      const res = await fetch("/api/duel/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode: cleanCode }),
      });

      const data = await res.json();
      if (res.ok && data.roomCode) {
        router.push(`/duel/${data.roomCode}`);
      } else {
        setJoinError(data.error || "Failed to join Duel room.");
      }
    } catch {
      setJoinError("Network error joining Duel. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const difficulties = [
    {
      id: "Easy",
      name: "Easy",
      icon: Zap,
      desc: "Fundamental loops, conditionals, and arrays. 5m per round.",
      color: "var(--easy)",
    },
    {
      id: "Medium",
      name: "Medium",
      icon: Shield,
      desc: "String manipulation, recursion, and patterns. 5m per round.",
      color: "var(--medium)",
    },
    {
      id: "Hard",
      name: "Hard",
      icon: Flame,
      desc: "Complex logic, nested state, and transformations. 5m per round.",
      color: "var(--hard)",
    },
  ] as const;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold mono mb-3"
          style={{
            border: "1px solid var(--border-strong)",
            borderRadius: "3px",
            backgroundColor: "var(--bg-elevated)",
            color: "var(--warning)",
          }}
        >
          <Swords className="h-3.5 w-3.5" />
          <span>1v1 CODE DUEL</span>
        </div>
        <h1 className="text-[26px] font-bold tracking-tight mb-2" style={{ color: "var(--fg)" }}>
          Private 1v1 Arena
        </h1>
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--fg-muted)" }}>
          Challenge an opponent in a live 3-round speed-coding battle. First to solve each round scores a point. Best of 3 wins.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Main Card: Create Duel (col-span-7) */}
        <div
          className="p-6 flex flex-col justify-between lg:col-span-7"
          style={{
            border: "1px solid var(--border-strong)",
            borderRadius: "4px",
            backgroundColor: "var(--bg)",
          }}
        >
          <div>
            <h2 className="text-[15px] font-bold mb-1" style={{ color: "var(--fg)" }}>
              Create New Duel
            </h2>
            <p className="text-[12px] mb-5" style={{ color: "var(--fg-dimmed)" }}>
              Configure your match parameters and generate an invite code for your opponent.
            </p>

            {/* Step 1: Rounds Indicator (Fixed to 3) */}
            <div className="mb-5">
              <label className="section-label block mb-1.5">MATCH FORMAT</label>
              <div
                className="flex items-center justify-between p-3"
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "3px",
                  backgroundColor: "var(--bg-subtle)",
                }}
              >
                <div>
                  <span className="mono text-[13px] font-bold" style={{ color: "var(--fg)" }}>
                    BEST OF 3 ROUNDS
                  </span>
                  <p className="text-[11px]" style={{ color: "var(--fg-dimmed)" }}>
                    3 independent problems · First to 2 points wins
                  </p>
                </div>
                <span
                  className="mono text-[11px] font-bold px-2 py-0.5 rounded"
                  style={{ backgroundColor: "var(--bg-elevated)", color: "var(--accent)" }}
                >
                  3 ROUNDS
                </span>
              </div>
            </div>

            {/* Step 2: Difficulty Selection */}
            <div className="mb-6">
              <label className="section-label block mb-1.5">SELECT DIFFICULTY</label>
              <div className="grid grid-cols-3 gap-2">
                {difficulties.map((diff) => {
                  const isSelected = selectedDifficulty === diff.id;
                  const Icon = diff.icon;
                  return (
                    <button
                      key={diff.id}
                      type="button"
                      onClick={() => setSelectedDifficulty(diff.id)}
                      className="p-3 text-left transition-all relative flex flex-col justify-between min-h-[84px]"
                      style={{
                        border: `1.5px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                        borderRadius: "3px",
                        backgroundColor: isSelected ? "var(--bg-elevated)" : "var(--bg-subtle)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="mono text-[11px] font-bold uppercase tracking-wider"
                          style={{ color: diff.color }}
                        >
                          {diff.name}
                        </span>
                        <Icon className="h-3.5 w-3.5" style={{ color: diff.color }} />
                      </div>
                      <p className="text-[10px] leading-tight" style={{ color: "var(--fg-dimmed)" }}>
                        {diff.id === "Easy" ? "Foundations" : diff.id === "Medium" ? "Algorithms" : "Complex Logic"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {createError && (
              <p className="text-[11px] font-medium mb-4" style={{ color: "var(--danger)" }}>
                {createError}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleCreateDuel}
            disabled={isCreating}
            className="w-full btn btn-primary flex items-center justify-center gap-2 text-[12px] py-2.5 disabled:opacity-50"
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Swords className="h-3.5 w-3.5" />
                <span>Create Best-of-3 Duel</span>
              </>
            )}
          </button>
        </div>

        {/* Right Card: Join Duel (col-span-5) */}
        <div
          className="p-6 flex flex-col justify-between lg:col-span-5"
          style={{
            border: "1px solid var(--border)",
            borderRadius: "4px",
            backgroundColor: "var(--bg-subtle)",
          }}
        >
          <div>
            <h2 className="text-[15px] font-bold mb-1" style={{ color: "var(--fg)" }}>
              Join With Code
            </h2>
            <p className="text-[12px] mb-5" style={{ color: "var(--fg-dimmed)" }}>
              Received a room invite code from a friend? Enter it to enter the match.
            </p>

            <form onSubmit={handleJoinDuel} className="space-y-4">
              <div>
                <label className="section-label block mb-1.5">ROOM CODE</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value.toUpperCase());
                    setJoinError(null);
                  }}
                  placeholder="e.g. DUEL-847"
                  maxLength={12}
                  className="w-full py-2 px-3 text-[14px] mono font-bold bg-transparent focus:outline-none tracking-wider uppercase"
                  style={{
                    border: "1px solid var(--border-strong)",
                    borderRadius: "3px",
                    color: "var(--fg)",
                    backgroundColor: "var(--bg)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
                />
              </div>

              {joinError && (
                <p className="text-[11px] font-medium" style={{ color: "var(--danger)" }}>
                  {joinError}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  disabled={isJoining || !roomCode.trim()}
                  className="flex-1 btn btn-secondary flex items-center justify-center gap-2 text-[12px] py-2.5 disabled:opacity-50"
                >
                  {isJoining ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Enter Duel Room</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={!roomCode.trim()}
                  onClick={() => {
                    const clean = roomCode.trim().toUpperCase();
                    if (clean) router.push(`/duel/${clean}/spectate`);
                  }}
                  className="px-3 py-2.5 rounded bg-[#181B24] border border-[#252936] text-[12px] font-mono text-[#00F0FF] hover:bg-[#00F0FF]/10 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  title="Watch match live as spectator"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Spectate Live</span>
                </button>
              </div>
            </form>
          </div>

          <div
            className="p-3.5 mt-6 text-[11px] space-y-1.5 rounded"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg)",
              color: "var(--fg-muted)",
            }}
          >
            <p className="font-bold text-[11px]" style={{ color: "var(--fg)" }}>
              Duel Rules:
            </p>
            <ul className="list-disc pl-3.5 space-y-1 text-[11px]" style={{ color: "var(--fg-dimmed)" }}>
              <li>Both players receive the exact same problem each round.</li>
              <li>First Accepted submission scores 1 point.</li>
              <li>First player to 2 points wins the match.</li>
              <li>5 minutes allotted per round.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
