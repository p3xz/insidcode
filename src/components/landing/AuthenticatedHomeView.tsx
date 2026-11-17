import React from "react";
import Link from "next/link";
import { ArrowRight, Flame, Swords, BarChart3, Trophy, Zap, Code2 } from "lucide-react";
import { CURRICULUM_PHASE_SUMMARIES } from "@/lib/curriculumMeta";

interface WorkspaceUserSummary {
  username?: string;
  displayName?: string;
  name?: string | null;
  xp?: number;
  currentStreak?: number;
}

export default function AuthenticatedHomeView({ user }: { user: WorkspaceUserSummary }) {
  const handle = user.username || user.displayName || user.name || "coder";
  const xp = typeof user.xp === "number" ? user.xp : 0;
  const streak = typeof user.currentStreak === "number" ? user.currentStreak : 0;

  return (
    <div
      className="w-full py-10 sm:py-14"
      style={{ backgroundColor: "var(--bg)", color: "var(--fg)" }}
    >
      <div className="mx-auto max-w-6xl space-y-10 px-4 sm:px-6">
        {/* Workspace Header */}
        <section
          className="flex flex-col justify-between gap-6 pb-8 lg:flex-row lg:items-end"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="space-y-3">
            <p
              className="mono text-[0.75rem] font-semibold uppercase tracking-wider"
              style={{ color: "var(--accent)" }}
            >
              Member Workspace
            </p>
            <h1
              className="font-display font-bold tracking-tight [text-wrap:balance]"
              style={{
                fontSize: "clamp(1.75rem, 1.25rem + 2vw, 2.5rem)",
                lineHeight: 1.2,
                color: "var(--fg-intense)",
              }}
            >
              Welcome back, @{handle}
            </h1>
            <p
              className="max-w-[58ch] text-[0.9375rem] leading-[1.65] [text-wrap:pretty]"
              style={{ color: "var(--fg-muted)" }}
            >
              Jump back into your sequential logic phases, enter a live 1v1 coding duel,
              or review your solve rate and rankings.
            </p>
          </div>

          {/* Quick Session Metrics */}
          <div className="flex flex-wrap items-center gap-3">
            <div
              className="inline-flex min-h-[2.5rem] items-center gap-2 rounded-lg px-3.5 py-2 text-[0.875rem] font-semibold mono"
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-strong)",
                color: "var(--accent)",
              }}
            >
              <Zap className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{xp.toLocaleString()} XP</span>
            </div>

            <div
              className="inline-flex min-h-[2.5rem] items-center gap-2 rounded-lg px-3.5 py-2 text-[0.875rem] font-semibold mono"
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-strong)",
                color: "var(--warning)",
              }}
            >
              <Flame className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{streak}d Streak</span>
            </div>
          </div>
        </section>

        {/* Quick Workspace Navigation */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/problems"
            className="btn btn-primary min-h-[3rem] justify-between px-4 py-3 text-[0.875rem]"
          >
            <span className="inline-flex items-center gap-2">
              <Code2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              Open Problem Directory
            </span>
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Link>

          <Link
            href="/duel"
            className="btn btn-secondary min-h-[3rem] justify-between px-4 py-3 text-[0.875rem]"
          >
            <span className="inline-flex items-center gap-2">
              <Swords className="h-4 w-4 shrink-0" aria-hidden="true" />
              Enter 1v1 Duel Arena
            </span>
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Link>

          <Link
            href="/stats"
            className="btn btn-secondary min-h-[3rem] justify-between px-4 py-3 text-[0.875rem]"
          >
            <span className="inline-flex items-center gap-2">
              <BarChart3 className="h-4 w-4 shrink-0" aria-hidden="true" />
              Performance Stats
            </span>
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Link>

          <Link
            href="/leaderboard"
            className="btn btn-secondary min-h-[3rem] justify-between px-4 py-3 text-[0.875rem]"
          >
            <span className="inline-flex items-center gap-2">
              <Trophy className="h-4 w-4 shrink-0" aria-hidden="true" />
              Leaderboard
            </span>
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Link>
        </section>

        {/* Direct 6-Phase Curriculum Jump Grid */}
        <section className="space-y-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p
                className="mono text-[0.75rem] font-semibold uppercase tracking-wider"
                style={{ color: "var(--fg-dimmed)" }}
              >
                Curriculum Jump Grid
              </p>
              <h2
                className="font-display text-[1.375rem] font-bold tracking-tight [text-wrap:balance]"
                style={{ color: "var(--fg)", lineHeight: 1.25 }}
              >
                Pick up any phase
              </h2>
            </div>

            <span className="mono text-[0.75rem]" style={{ color: "var(--fg-dimmed)" }}>
              330+ Challenges · 6 Phases
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {CURRICULUM_PHASE_SUMMARIES.map((phase) => {
              const phaseCode = String(phase.id).padStart(2, "0");
              return (
                <Link
                  key={phase.id}
                  href={`/problems?phase=${phase.id}`}
                  className="group flex flex-col justify-between gap-4 rounded-xl p-5 transition-colors hover:border-[var(--accent)]"
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    textDecoration: "none",
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="mono text-[0.75rem] font-bold"
                        style={{ color: "var(--accent)" }}
                      >
                        PHASE {phaseCode}
                      </span>
                      <span
                        className="mono text-[0.75rem]"
                        style={{ color: "var(--fg-dimmed)" }}
                      >
                        {phase.problems}
                      </span>
                    </div>

                    <h3
                      className="font-display text-[1.0625rem] font-bold tracking-tight transition-colors group-hover:text-[var(--accent)] [text-wrap:balance]"
                      style={{ color: "var(--fg)", lineHeight: 1.3 }}
                    >
                      {phase.title}
                    </h3>

                    <p
                      className="text-[0.875rem] leading-[1.6] [text-wrap:pretty]"
                      style={{ color: "var(--fg-muted)" }}
                    >
                      {phase.description}
                    </p>
                  </div>

                  <div
                    className="inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold"
                    style={{ color: "var(--accent)" }}
                  >
                    <span>Continue Phase {phaseCode}</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
