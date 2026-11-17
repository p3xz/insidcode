"use client";

import React from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers,
  Lock,
  Swords,
  ShieldCheck,
} from "lucide-react";
import { CURRICULUM_PHASE_SUMMARIES } from "@/lib/curriculumMeta";

const CORE_PILLARS = [
  {
    icon: Layers,
    eyebrow: "Curriculum",
    title: "Six Sequential Phases",
    desc: "Build real problem-solving intuition across 330+ curated problems before tackling competitive data structures — moving cleanly from branching and loops into recursion, arrays, strings, and OA logic.",
    accent: "var(--accent)",
  },
  {
    icon: Cpu,
    eyebrow: "Execution",
    title: "Isolated 5-Language Sandbox",
    desc: "Write in Python, JavaScript, C, C++, or Java inside Monaco and test against server-verified hidden suites under strict deterministic timeout boundaries.",
    accent: "var(--success)",
  },
  {
    icon: Swords,
    eyebrow: "Arena",
    title: "Real-Time 1v1 Code Duels",
    desc: "Challenge peers in synchronized best-of-three coding matches protected by active anti-cheat telemetry, keystroke dynamics, and Elo rankings.",
    accent: "var(--warning)",
  },
];

const PREVIEW_CODE_LINES = [
  { num: 1, text: "# Determine sign cleanly from stdin", dim: true },
  { num: 2, text: "import sys", kw: true },
  { num: 3, text: "def classify_integer() -> None:", fn: true },
  { num: 4, text: "    raw = sys.stdin.read().strip()" },
  { num: 5, text: "    value = int(raw)" },
  { num: 6, text: "    if value > 0:" },
  { num: 7, text: '        print("Positive")' },
  { num: 8, text: "    elif value < 0:" },
  { num: 9, text: '        print("Negative")' },
  { num: 10, text: '    else: print("Zero")' },
];

export default function GuestWelcomePage() {
  return (
    <div
      className="relative flex w-full flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--fg)" }}
    >
      {/* Subtle architectural radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 75% 60% at 50% 0%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 72%)",
        }}
      />

      {/* ─── 1. Hero Section ──────────────────────────────────────────── */}
      <section
        className="relative z-10 py-14 sm:py-20"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-14">
            {/* Editorial Headline & Sign-In Card */}
            <div className="space-y-6 lg:col-span-6">
              <div>
                <span
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.75rem] font-medium"
                  style={{
                    backgroundColor: "var(--bg-subtle)",
                    border: "1px solid var(--border-strong)",
                    color: "var(--fg-muted)",
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: "var(--accent)" }}
                  />
                  Private Logic Engineering Platform
                </span>
              </div>

              <h1
                className="font-display font-extrabold tracking-tight [text-wrap:balance]"
                style={{
                  fontSize: "clamp(2.25rem, 1.5rem + 3vw, 3.75rem)",
                  lineHeight: 1.08,
                  color: "var(--fg-intense)",
                }}
              >
                Master programming logic before jumping into DSA.
              </h1>

              <p
                className="max-w-[60ch] text-[1.0625rem] leading-[1.65] [text-wrap:pretty]"
                style={{ color: "var(--fg-muted)" }}
              >
                InsidCode is a member-gated coding workspace built around clarity
                and fundamentals. Sign in to unlock 330+ progressive logic challenges,
                isolated 5-language execution, and live 1v1 duels.
              </p>

              {/* Direct Sign-In Card */}
              <div
                className="max-w-md space-y-4 rounded-xl p-5 sm:p-6"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-strong)",
                }}
              >
                <div className="space-y-1">
                  <h2
                    className="font-display text-[1.0625rem] font-bold tracking-tight"
                    style={{ color: "var(--fg)", lineHeight: 1.3 }}
                  >
                    Sign in to enter your workspace
                  </h2>
                  <p
                    className="text-[0.875rem] leading-[1.55]"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    Access to the problem directory, duels, rankings, and personal telemetry
                    requires a verified account.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => signIn("google", { callbackUrl: "/problems" })}
                    className="inline-flex min-h-[2.75rem] w-full items-center justify-center gap-2.5 rounded-lg px-4 py-2.5 text-[0.875rem] font-semibold transition-colors"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      color: "var(--fg)",
                      border: "1px solid var(--border-strong)",
                    }}
                  >
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#EA4335"
                        d="M12 5c1.54 0 2.94.55 4.04 1.46l3.03-3.03C17.24 1.72 14.81 1 12 1 7.37 1 3.44 3.72 1.63 7.64l3.66 2.84C6.18 7.36 8.86 5 12 5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.5 12.28c0-.85-.08-1.68-.22-2.28H12v4.51h6.47c-.28 1.48-1.12 2.73-2.39 3.58l3.69 2.86c2.16-1.99 3.41-4.92 3.41-8.67z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.29 14.48c-.23-.68-.36-1.41-.36-2.18s.13-1.5.36-2.18L1.63 7.28C.59 9.38 0 11.63 0 14s.59 4.62 1.63 6.72l3.66-2.84z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c3.24 0 5.96-1.07 7.95-2.91l-3.69-2.86c-1.08.73-2.47 1.16-4.26 1.16-3.14 0-5.82-2.36-6.71-5.48L1.63 16.72C3.44 20.64 7.37 23 12 23z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => signIn("github", { callbackUrl: "/problems" })}
                    className="inline-flex min-h-[2.75rem] w-full items-center justify-center gap-2.5 rounded-lg px-4 py-2.5 text-[0.875rem] font-semibold transition-colors"
                    style={{
                      backgroundColor: "var(--accent)",
                      color: "var(--accent-fg)",
                    }}
                  >
                    <svg
                      className="h-4 w-4 shrink-0"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      />
                    </svg>
                    <span>Continue with GitHub</span>
                  </button>
                </div>

                <div
                  className="flex items-center justify-between gap-2 pt-2 text-[0.75rem]"
                  style={{ borderTop: "1px solid var(--border)", color: "var(--fg-dimmed)" }}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" style={{ color: "var(--success)" }} aria-hidden="true" />
                    Verified OAuth only
                  </span>
                  <Link
                    href="/login"
                    className="font-medium hover:underline"
                    style={{ color: "var(--accent)" }}
                  >
                    Open full sign-in page
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column: Clean Execution Preview Card */}
            <div className="lg:col-span-6">
              <div
                className="overflow-hidden rounded-xl shadow-sm"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-strong)",
                }}
              >
                <div
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                  style={{
                    backgroundColor: "var(--bg-subtle)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--danger)", opacity: 0.75 }} />
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--warning)", opacity: 0.75 }} />
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--success)", opacity: 0.75 }} />
                    <span
                      className="mono ml-2 text-[0.75rem] font-medium"
                      style={{ color: "var(--fg)" }}
                    >
                      positive_or_zero.py
                    </span>
                  </div>

                  <span
                    className="mono inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[0.75rem] font-semibold"
                    style={{
                      backgroundColor: "var(--success-subtle)",
                      color: "var(--success-emphasis)",
                    }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    4/4 test cases verified
                  </span>
                </div>

                <div className="overflow-x-auto p-5">
                  <pre className="mono text-[0.8125rem] leading-[1.65]" style={{ color: "var(--fg)" }}>
                    {PREVIEW_CODE_LINES.map((line) => (
                      <div key={line.num} className="flex gap-4">
                        <span
                          className="w-5 shrink-0 select-none text-right"
                          style={{ color: "var(--fg-dimmed)" }}
                        >
                          {line.num}
                        </span>
                        <span
                          style={{
                            color: line.dim
                              ? "var(--fg-dimmed)"
                              : line.kw
                              ? "var(--accent)"
                              : line.fn
                              ? "var(--warning-emphasis)"
                              : "var(--fg)",
                          }}
                        >
                          {line.text}
                        </span>
                      </div>
                    ))}
                  </pre>
                </div>

                <div
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-[0.75rem]"
                  style={{
                    backgroundColor: "var(--bg-subtle)",
                    borderTop: "1px solid var(--border)",
                    color: "var(--fg-muted)",
                  }}
                >
                  <span className="mono">Python · JS · C · C++ · Java</span>
                  <span className="mono" style={{ color: "var(--fg-dimmed)" }}>
                    Runtime: 0.042s · Server Hidden Suite
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. Core Pillars Section ──────────────────────────────────── */}
      <section
        id="features"
        className="py-16 sm:py-20"
        style={{
          backgroundColor: "var(--bg-subtle)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-10">
          <div className="max-w-[54ch] space-y-2">
            <p
              className="mono text-[0.75rem] font-semibold uppercase tracking-wider"
              style={{ color: "var(--accent)" }}
            >
              Why InsidCode
            </p>
            <h2
              className="font-display font-bold tracking-tight [text-wrap:balance]"
              style={{
                fontSize: "clamp(1.5rem, 1.15rem + 1.4vw, 2.25rem)",
                lineHeight: 1.2,
                color: "var(--fg-intense)",
              }}
            >
              Built for disciplined logic fundamentals.
            </h2>
            <p
              className="text-[0.9375rem] leading-[1.65] [text-wrap:pretty]"
              style={{ color: "var(--fg-muted)" }}
            >
              A focused alternative to cluttered interview prep sites: clear problem
              progression, deterministic judging, and fair real-time competition.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {CORE_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <article
                  key={pillar.title}
                  className="flex flex-col justify-between space-y-4 rounded-xl p-6"
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="space-y-3">
                    <div
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <Icon className="h-5 w-5" style={{ color: pillar.accent }} aria-hidden="true" />
                    </div>
                    <p
                      className="mono text-[0.75rem] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--fg-dimmed)" }}
                    >
                      {pillar.eyebrow}
                    </p>
                    <h3
                      className="font-display text-[1.125rem] font-bold tracking-tight [text-wrap:balance]"
                      style={{ color: "var(--fg)", lineHeight: 1.3 }}
                    >
                      {pillar.title}
                    </h3>
                    <p
                      className="text-[0.9375rem] leading-[1.65] [text-wrap:pretty]"
                      style={{ color: "var(--fg-muted)" }}
                    >
                      {pillar.desc}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 3. Six-Phase Curriculum Preview ──────────────────────────── */}
      <section
        id="curriculum"
        className="py-16 sm:py-20"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-[54ch] space-y-2">
              <p
                className="mono text-[0.75rem] font-semibold uppercase tracking-wider"
                style={{ color: "var(--accent)" }}
              >
                Curriculum Roadmap
              </p>
              <h2
                className="font-display font-bold tracking-tight [text-wrap:balance]"
                style={{
                  fontSize: "clamp(1.5rem, 1.15rem + 1.4vw, 2.25rem)",
                  lineHeight: 1.2,
                  color: "var(--fg-intense)",
                }}
              >
                Six phases from first branch to placement readiness.
              </h2>
            </div>

            <Link
              href="/login"
              className="inline-flex min-h-[2.5rem] items-center gap-1.5 text-[0.875rem] font-semibold hover:underline"
              style={{ color: "var(--accent)" }}
            >
              <span>Sign in to start Phase 01</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {CURRICULUM_PHASE_SUMMARIES.map((phase) => (
              <div
                key={phase.id}
                className="flex flex-col justify-between gap-5 rounded-xl p-5"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="mono text-[0.75rem] font-bold"
                      style={{ color: "var(--accent)" }}
                    >
                      PHASE {String(phase.id).padStart(2, "0")}
                    </span>
                    <span
                      className="mono rounded px-2 py-0.5 text-[0.75rem]"
                      style={{
                        backgroundColor: "var(--bg-subtle)",
                        color: "var(--fg-dimmed)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {phase.problems}
                    </span>
                  </div>

                  <h3
                    className="font-display text-[1.0625rem] font-bold tracking-tight [text-wrap:balance]"
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

                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(`/problems?phase=${phase.id}`)}`}
                  className="inline-flex min-h-[2.25rem] items-center justify-between rounded-lg px-3 py-2 text-[0.8125rem] font-medium transition-colors"
                  style={{
                    backgroundColor: "var(--bg-subtle)",
                    color: "var(--fg-muted)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                    Sign in to unlock
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. Clean Bottom Callout ──────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 space-y-5">
          <h2
            className="font-display font-extrabold tracking-tight [text-wrap:balance]"
            style={{
              fontSize: "clamp(1.625rem, 1.25rem + 1.5vw, 2.5rem)",
              lineHeight: 1.15,
              color: "var(--fg-intense)",
            }}
          >
            Ready to write cleaner, faster logic?
          </h2>
          <p
            className="mx-auto max-w-[54ch] text-[0.9375rem] leading-[1.65] [text-wrap:pretty]"
            style={{ color: "var(--fg-muted)" }}
          >
            Sign in with Google or GitHub to access your private coding workspace, track
            solved streaks, and enter rated 1v1 duels.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="btn btn-primary min-h-[2.75rem] px-6 py-3 text-[0.875rem]"
            >
              <span>Sign In to Enter Workspace</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
