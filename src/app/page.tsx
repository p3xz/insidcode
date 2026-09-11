import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { CURRICULUM_PHASES } from "@/lib/constants";

const HOW_IT_WORKS = [
  {
    num: "01",
    title: "Structured Phases",
    desc: "Six sequential logic phases — from conditionals to recursion and arrays — before any DSA.",
  },
  {
    num: "02",
    title: "Monaco Workspace",
    desc: "Full syntax highlighting in Python, JavaScript, C, C++, or Java.",
  },
  {
    num: "03",
    title: "Isolated Execution",
    desc: "Run code against custom inputs in a sandboxed environment with strict timeouts.",
  },
  {
    num: "04",
    title: "Hidden Test Suite",
    desc: "Submissions evaluated server-side against test cases without exposing them.",
  },
  {
    num: "05",
    title: "XP & Streaks",
    desc: "First-solve XP, daily practice streaks, and complete activity history.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col w-full" style={{ backgroundColor: "var(--bg)", color: "var(--fg)" }}>

      {/* ─── Hero ─────────────────────────────────────────────────── */}
      <section
        className="pt-14 pb-16 sm:pt-20 sm:pb-20"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">

            {/* Left — editorial headline */}
            <div className="lg:col-span-5 xl:col-span-5 space-y-7">
              <div>
                <p className="section-label mb-4">Logic Building · Code Practice</p>
                <h1
                  className="font-bold leading-none tracking-tight"
                  style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
                >
                  Master
                  <br />
                  Programming
                  <br />
                  <span style={{ color: "var(--fg-muted)" }}>Logic.</span>
                </h1>
              </div>

              <p className="text-[14px] leading-relaxed" style={{ color: "var(--fg-muted)", maxWidth: "34ch" }}>
                A private, structured coding platform. Solve 330+ challenges across
                six foundational phases with isolated execution, hidden test evaluation,
                and social rankings.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link href="/problems" className="btn btn-primary">
                  Browse Problems
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link href="/leaderboard" className="btn btn-secondary">
                  View Leaderboard
                </Link>
              </div>

              {/* Quick stats */}
              <div
                className="flex items-center gap-6 pt-2"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                {[
                  { value: "330+", label: "Problems" },
                  { value: "6", label: "Phases" },
                  { value: "5", label: "Languages" },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <div className="text-[22px] font-bold tracking-tight mono" style={{ color: "var(--fg)" }}>
                      {value}
                    </div>
                    <div className="section-label mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — code workspace preview */}
            <div className="lg:col-span-7 xl:col-span-7">
              <div
                className="overflow-hidden mono text-[12px]"
                style={{
                  border: "1px solid var(--border-strong)",
                  borderRadius: "4px",
                  backgroundColor: "var(--bg-subtle)",
                }}
              >
                {/* Terminal titlebar */}
                <div
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-elevated)" }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--danger)", opacity: 0.7 }} />
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--warning)", opacity: 0.7 }} />
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--success)", opacity: 0.7 }} />
                    <span className="ml-3 text-[11px]" style={{ color: "var(--fg-dimmed)" }}>
                      problem_001.py
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--success)" }}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Accepted (4/4 Tests)</span>
                  </div>
                </div>

                {/* Split pane */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
                  {/* Problem statement */}
                  <div
                    className="md:col-span-5 p-4 space-y-2.5 font-sans text-[12px]"
                    style={{ borderRight: "1px solid var(--border)" }}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="mono px-1.5 py-0.5 text-[10px]"
                        style={{ backgroundColor: "var(--bg-elevated)", color: "var(--fg-dimmed)", borderRadius: "2px" }}
                      >
                        #001
                      </span>
                      <span
                        className="px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{
                          color: "var(--easy)",
                          backgroundColor: "color-mix(in srgb, var(--easy) 12%, transparent)",
                          borderRadius: "2px",
                        }}
                      >
                        Easy
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--fg-dimmed)" }}>
                        Phase 1
                      </span>
                    </div>
                    <h3 className="font-semibold text-[13px]" style={{ color: "var(--fg)" }}>
                      Positive, Negative, or Zero
                    </h3>
                    <p className="text-[12px] leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                      Given an integer from stdin, print whether it is Positive,
                      Negative, or Zero.
                    </p>
                    <div
                      className="mono p-2.5 text-[11px]"
                      style={{
                        backgroundColor: "var(--bg)",
                        border: "1px solid var(--border)",
                        borderRadius: "3px",
                      }}
                    >
                      <span style={{ color: "var(--fg-muted)" }}>Input: </span>
                      <span style={{ color: "var(--fg)" }}>5</span>
                      <br />
                      <span style={{ color: "var(--fg-muted)" }}>Output: </span>
                      <span style={{ color: "var(--success)" }}>Positive</span>
                    </div>
                  </div>

                  {/* Code editor */}
                  <div className="md:col-span-7 p-4 mono space-y-0.5 text-[12px]">
                    <div style={{ color: "var(--fg-dimmed)" }}># Python 3 Solution</div>
                    <div>
                      <span style={{ color: "var(--accent)" }}>import</span>
                      <span style={{ color: "var(--fg)" }}> sys</span>
                    </div>
                    <div>
                      <span style={{ color: "var(--accent)" }}>def</span>
                      <span style={{ color: "var(--warning)" }}> solve</span>
                      <span style={{ color: "var(--fg)" }}>():</span>
                    </div>
                    <div className="pl-4">
                      <span style={{ color: "var(--fg)" }}>n = </span>
                      <span style={{ color: "var(--accent)" }}>int</span>
                      <span style={{ color: "var(--fg)" }}>(sys.stdin.read().strip())</span>
                    </div>
                    <div className="pl-4">
                      <span style={{ color: "var(--accent)" }}>if</span>
                      <span style={{ color: "var(--fg)" }}> n &gt; 0: </span>
                      <span style={{ color: "var(--accent)" }}>print</span>
                      <span style={{ color: "var(--success)" }}>(&#34;Positive&#34;)</span>
                    </div>
                    <div className="pl-4">
                      <span style={{ color: "var(--accent)" }}>elif</span>
                      <span style={{ color: "var(--fg)" }}> n &lt; 0: </span>
                      <span style={{ color: "var(--accent)" }}>print</span>
                      <span style={{ color: "var(--success)" }}>(&#34;Negative&#34;)</span>
                    </div>
                    <div className="pl-4">
                      <span style={{ color: "var(--accent)" }}>else</span>
                      <span style={{ color: "var(--fg)" }}>: </span>
                      <span style={{ color: "var(--accent)" }}>print</span>
                      <span style={{ color: "var(--success)" }}>(&#34;Zero&#34;)</span>
                    </div>
                    <div style={{ color: "var(--fg)" }}>solve()</div>

                    <div
                      className="mt-4 flex items-center justify-between px-3 py-2 text-[11px]"
                      style={{
                        border: "1px solid color-mix(in srgb, var(--success) 30%, transparent)",
                        backgroundColor: "color-mix(in srgb, var(--success) 8%, transparent)",
                        borderRadius: "2px",
                        color: "var(--success)",
                      }}
                    >
                      <span>Runtime: 0.042s</span>
                      <span className="font-semibold" style={{ color: "var(--fg-muted)" }}>+10 XP</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ──────────────────────────────────────────── */}
      <section
        className="py-14"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8">
            <p className="section-label mb-1">How It Works</p>
            <h2 className="text-[20px] font-bold tracking-tight">
              Platform workflow
            </h2>
          </div>

          {/* Numbered feature rows — dense, not card grid */}
          <div style={{ borderTop: "1px solid var(--border)" }}>
            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={step.num}
                className="grid grid-cols-12 items-baseline gap-4 py-4"
                style={{ borderBottom: i < HOW_IT_WORKS.length - 1 ? "1px solid var(--border)" : "none" }}
              >
                <span className="col-span-1 mono text-[11px] font-bold" style={{ color: "var(--fg-dimmed)" }}>
                  {step.num}
                </span>
                <span className="col-span-3 sm:col-span-2 text-[13px] font-semibold" style={{ color: "var(--fg)" }}>
                  {step.title}
                </span>
                <p className="col-span-8 sm:col-span-9 text-[13px] leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Curriculum Phases ─────────────────────────────────────── */}
      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8">
            <p className="section-label mb-1">Curriculum</p>
            <h2 className="text-[20px] font-bold tracking-tight">
              Six-phase progression
            </h2>
          </div>

          {/* Phase table-list — not card grid */}
          <div style={{ border: "1px solid var(--border)", borderRadius: "3px", overflow: "hidden" }}>
            {/* Column headers */}
            <div
              className="hidden sm:grid grid-cols-12 px-4 py-2.5 text-[11px] font-semibold"
              style={{
                borderBottom: "1px solid var(--border)",
                backgroundColor: "var(--bg-subtle)",
                color: "var(--fg-dimmed)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              <span className="col-span-1">#</span>
              <span className="col-span-3">Phase</span>
              <span className="col-span-6">Description</span>
              <span className="col-span-2 text-right">View</span>
            </div>

            {CURRICULUM_PHASES.map((p, i) => (
              <Link
                key={p.id}
                href={`/problems?phase=${p.id}`}
                className="grid grid-cols-12 items-center px-4 py-4 transition-colors group hover:bg-[var(--bg-subtle)]"
                style={{
                  borderBottom: i < CURRICULUM_PHASES.length - 1 ? "1px solid var(--border)" : "none",
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                <span className="col-span-1 mono text-[11px]" style={{ color: "var(--fg-dimmed)" }}>
                  {String(p.id).padStart(2, "0")}
                </span>
                <span className="col-span-4 sm:col-span-3 text-[13px] font-semibold" style={{ color: "var(--fg)" }}>
                  {p.title}
                </span>
                <p className="hidden sm:block col-span-6 text-[12px]" style={{ color: "var(--fg-muted)" }}>
                  {p.description}
                </p>
                <span
                  className="col-span-7 sm:col-span-2 text-right text-[12px] font-medium transition-colors"
                  style={{ color: "var(--fg-dimmed)" }}
                >
                  Problems →
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-8">
            <Link href="/problems" className="btn btn-primary">
              Open Problems Directory
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
