import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  Swords,
  Layers,
  Code2,
} from "lucide-react";
import { CURRICULUM_PHASES } from "@/lib/constants";

// Precise problem counts per phase aligned with the 330+ problem curriculum
const PHASE_METRICS = [
  { id: 1, problems: "50 Problems", tag: "Branching & Booleans" },
  { id: 2, problems: "30 Problems", tag: "Loops & Patterns" },
  { id: 3, problems: "40 Problems", tag: "Stack & Recursion" },
  { id: 4, problems: "50 Problems", tag: "Arrays & Two Pointers" },
  { id: 5, problems: "40 Problems", tag: "Strings & Parsing" },
  { id: 6, problems: "120+ Problems", tag: "OA Placement Logic" },
];

const WORKFLOW_STEPS = [
  {
    num: "01",
    label: "READ",
    title: "Deconstruct the Problem",
    desc: "Understand input constraints, memory bounds, and edge cases before writing code.",
  },
  {
    num: "02",
    label: "BUILD",
    title: "Write in 5 Languages",
    desc: "Solve in Python, JavaScript, C, C++, or Java inside Monaco with full syntax tools.",
  },
  {
    num: "03",
    label: "RUN",
    title: "Isolated Sandbox Run",
    desc: "Execute custom test inputs in isolated runner containers with strict timeout safeguards.",
  },
  {
    num: "04",
    label: "SUBMIT",
    title: "Hidden Suite Verification",
    desc: "Evaluate solutions against server-authoritative hidden test suites without exposing inputs.",
  },
  {
    num: "05",
    label: "PROGRESS",
    title: "Track XP & Duels",
    desc: "Earn first-solve XP, maintain daily practice streaks, unlock titles, and compete in 1v1 Duels.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative flex flex-col w-full min-h-screen" style={{ backgroundColor: "var(--bg)", color: "var(--fg)" }}>

      {/* ─── Technical Background Grid (Subtle, low-contrast, non-distracting) ─── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-40 dark:opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in srgb, var(--border) 40%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--border) 40%, transparent) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 90% 70% at 50% 20%, black 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 70% at 50% 20%, black 30%, transparent 100%)",
        }}
      />

      <div className="relative z-10 flex flex-col w-full">

        {/* ─── 1. HERO SECTION ────────────────────────────────────────── */}
        <section
          className="pt-12 pb-16 sm:pt-16 sm:pb-20"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
              
              {/* Left Column: Editorial Headline & Primary CTA */}
              <div className="lg:col-span-5 xl:col-span-5 space-y-6">
                
                {/* Technical Meta Tag */}
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 mono text-[10px] font-semibold uppercase tracking-widest"
                    style={{
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--bg-subtle)",
                      color: "var(--fg-dimmed)",
                      borderRadius: "2px",
                    }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
                    INSIDCODE / WORKSPACE // CORE
                  </span>
                </div>

                {/* Main Typographic Headline */}
                <div>
                  <h1
                    className="font-bold tracking-tight uppercase"
                    style={{
                      fontSize: "clamp(2.5rem, 5.5vw, 4.25rem)",
                      lineHeight: "0.95",
                      letterSpacing: "-0.03em",
                    }}
                  >
                    <span style={{ color: "var(--fg)" }}>MASTER</span>
                    <br />
                    <span style={{ color: "var(--fg)" }}>PROGRAMMING</span>
                    <br />
                    <span style={{ color: "var(--fg-muted)", fontWeight: "500" }}>LOGIC.</span>
                  </h1>
                </div>

                {/* Value Proposition */}
                <p className="text-[13px] sm:text-[14px] leading-relaxed" style={{ color: "var(--fg-muted)", maxWidth: "38ch" }}>
                  A structured logic engineering platform. Solve 330+ sequential challenges across
                  six foundational phases with isolated execution, server-side hidden test verification,
                  and competitive 1v1 duels.
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link href="/problems" className="btn btn-primary text-xs px-5 py-2.5">
                    <span>Browse Problems</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link href="/duel" className="btn btn-secondary text-xs px-4 py-2.5">
                    <Swords className="h-3.5 w-3.5" />
                    <span>Live 1v1 Duel</span>
                  </Link>
                  <Link href="/leaderboard" className="btn btn-ghost text-xs px-3 py-2.5">
                    <span>Rankings</span>
                  </Link>
                </div>

                {/* Hero Platform Metrics */}
                <div
                  className="grid grid-cols-3 gap-4 pt-4"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <div>
                    <div className="text-[20px] sm:text-[22px] font-bold tracking-tight mono" style={{ color: "var(--fg)" }}>
                      330+
                    </div>
                    <div className="section-label text-[10px] mt-0.5">PROBLEMS</div>
                  </div>
                  <div>
                    <div className="text-[20px] sm:text-[22px] font-bold tracking-tight mono" style={{ color: "var(--fg)" }}>
                      06
                    </div>
                    <div className="section-label text-[10px] mt-0.5">PHASES</div>
                  </div>
                  <div>
                    <div className="text-[20px] sm:text-[22px] font-bold tracking-tight mono" style={{ color: "var(--fg)" }}>
                      05
                    </div>
                    <div className="section-label text-[10px] mt-0.5">LANGUAGES</div>
                  </div>
                </div>

              </div>

              {/* Right Column: High-Fidelity Code & Execution Specimen */}
              <div className="lg:col-span-7 xl:col-span-7">
                <div
                  className="overflow-hidden mono text-[12px] shadow-sm"
                  style={{
                    border: "1px solid var(--border-strong)",
                    borderRadius: "4px",
                    backgroundColor: "var(--bg-subtle)",
                  }}
                >
                  {/* Specimen Header Bar */}
                  <div
                    className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2"
                    style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-elevated)" }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--danger)", opacity: 0.8 }} />
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--warning)", opacity: 0.8 }} />
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--success)", opacity: 0.8 }} />
                      </div>
                      <span className="text-[11px] font-semibold pl-1.5" style={{ color: "var(--fg)" }}>
                        PROBLEM 001
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded" style={{ backgroundColor: "var(--bg)", color: "var(--fg-dimmed)" }}>
                        PHASE 01
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-[10px] mono" style={{ color: "var(--fg-dimmed)" }}>positive_or_zero.py</span>
                      <span
                        className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          borderRadius: "2px",
                          backgroundColor: "color-mix(in srgb, var(--success) 12%, transparent)",
                          color: "var(--success)",
                        }}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        ACCEPTED
                      </span>
                    </div>
                  </div>

                  {/* Split Specimen Content */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
                    
                    {/* Problem Meta Pane */}
                    <div
                      className="md:col-span-5 p-4 space-y-3 font-sans text-[12px]"
                      style={{ borderRight: "1px solid var(--border)", backgroundColor: "var(--bg-subtle)" }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="px-1.5 py-0.5 text-[10px] font-bold uppercase"
                          style={{
                            color: "var(--easy)",
                            backgroundColor: "color-mix(in srgb, var(--easy) 12%, transparent)",
                            borderRadius: "2px",
                          }}
                        >
                          Easy
                        </span>
                        <span className="mono text-[10px]" style={{ color: "var(--fg-dimmed)" }}>
                          #001 // CONDITIONAL
                        </span>
                      </div>

                      <div>
                        <h3 className="font-semibold text-[13px] leading-snug" style={{ color: "var(--fg)" }}>
                          Positive, Negative, or Zero
                        </h3>
                        <p className="text-[11px] leading-relaxed mt-1" style={{ color: "var(--fg-muted)" }}>
                          Given an integer from stdin, output whether it is Positive, Negative, or Zero.
                        </p>
                      </div>

                      {/* Test Case Specimen */}
                      <div
                        className="mono p-2.5 text-[11px] space-y-1"
                        style={{
                          backgroundColor: "var(--bg)",
                          border: "1px solid var(--border)",
                          borderRadius: "3px",
                        }}
                      >
                        <div className="flex justify-between text-[10px] pb-1" style={{ borderBottom: "1px solid var(--border)", color: "var(--fg-dimmed)" }}>
                          <span>TEST SPECIMEN</span>
                          <span>STDIN / STDOUT</span>
                        </div>
                        <div>
                          <span style={{ color: "var(--fg-dimmed)" }}>Input: </span>
                          <span style={{ color: "var(--fg)" }}>5</span>
                        </div>
                        <div>
                          <span style={{ color: "var(--fg-dimmed)" }}>Output: </span>
                          <span style={{ color: "var(--success)" }}>Positive</span>
                        </div>
                      </div>

                      <div className="pt-1 flex items-center justify-between text-[10px] mono" style={{ color: "var(--fg-dimmed)" }}>
                        <span>LIMIT: 3.0s</span>
                        <span>MEM: 128 MB</span>
                      </div>
                    </div>

                    {/* Code Pane with Line Numbers */}
                    <div className="md:col-span-7 p-3.5 mono text-[11px] leading-snug flex flex-col justify-between" style={{ backgroundColor: "var(--bg)" }}>
                      <div className="space-y-0.5">
                        <div className="flex items-center text-[10px] pb-1.5 mb-1" style={{ borderBottom: "1px solid var(--border)", color: "var(--fg-dimmed)" }}>
                          <span>PYTHON 3.14 RUNTIME</span>
                          <span className="ml-auto">UTF-8</span>
                        </div>

                        {[
                          { num: 1, content: <> <span style={{ color: "var(--fg-dimmed)" }}># Positive, Negative, or Zero</span></> },
                          { num: 2, content: <> <span style={{ color: "var(--accent)" }}>import</span> <span style={{ color: "var(--fg)" }}>sys</span></> },
                          { num: 3, content: <> <span style={{ color: "var(--accent)" }}>def</span> <span style={{ color: "var(--warning)" }}>solve</span><span style={{ color: "var(--fg)" }}>():</span></> },
                          { num: 4, content: <> &nbsp;&nbsp;<span style={{ color: "var(--fg)" }}>n = </span><span style={{ color: "var(--accent)" }}>int</span><span style={{ color: "var(--fg)" }}>(sys.stdin.read().strip())</span></> },
                          { num: 5, content: <> &nbsp;&nbsp;<span style={{ color: "var(--accent)" }}>if</span> <span style={{ color: "var(--fg)" }}>n &gt; 0:</span></> },
                          { num: 6, content: <> &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: "var(--accent)" }}>print</span><span style={{ color: "var(--success)" }}>(&#34;Positive&#34;)</span></> },
                          { num: 7, content: <> &nbsp;&nbsp;<span style={{ color: "var(--accent)" }}>elif</span> <span style={{ color: "var(--fg)" }}>n &lt; 0:</span></> },
                          { num: 8, content: <> &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: "var(--accent)" }}>print</span><span style={{ color: "var(--success)" }}>(&#34;Negative&#34;)</span></> },
                          { num: 9, content: <> &nbsp;&nbsp;<span style={{ color: "var(--accent)" }}>else</span><span style={{ color: "var(--fg)" }}>:</span> <span style={{ color: "var(--accent)" }}>print</span><span style={{ color: "var(--success)" }}>(&#34;Zero&#34;)</span></> },
                          { num: 10, content: <> <span style={{ color: "var(--fg)" }}>solve()</span><span className="inline-block w-1.5 h-3 ml-0.5 align-middle animate-pulse" style={{ backgroundColor: "var(--accent)" }} /></> },
                        ].map((line) => (
                          <div key={line.num} className="flex items-baseline">
                            <span className="w-5 shrink-0 select-none text-[10px] text-right pr-2" style={{ color: "var(--fg-dimmed)" }}>
                              {line.num}
                            </span>
                            <div className="truncate">{line.content}</div>
                          </div>
                        ))}
                      </div>

                      {/* Execution Result Banner */}
                      <div
                        className="mt-3 flex items-center justify-between px-2.5 py-1.5 text-[10px]"
                        style={{
                          border: "1px solid color-mix(in srgb, var(--success) 35%, transparent)",
                          backgroundColor: "color-mix(in srgb, var(--success) 8%, transparent)",
                          borderRadius: "2px",
                        }}
                      >
                        <div className="flex items-center gap-1.5 font-bold" style={{ color: "var(--success)" }}>
                          <CheckCircle2 className="h-3 w-3" />
                          <span>4/4 TESTS PASSED</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span style={{ color: "var(--fg-muted)" }}>0.042s</span>
                          <span className="font-bold" style={{ color: "var(--accent)" }}>+10 XP</span>
                        </div>
                      </div>

                    </div>

                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ─── 2. TECHNICAL PLATFORM PILLARS ──────────────────────────── */}
        <section
          className="py-10 sm:py-12"
          style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-subtle)" }}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "var(--fg)" }}>
                  <Cpu className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
                  <span>EXECUTION // ISOLATED</span>
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                  Sandboxed runners with strict 3.0s wall-clock timeouts and non-root process boundaries.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "var(--fg)" }}>
                  <ShieldCheck className="h-3.5 w-3.5" style={{ color: "var(--success)" }} />
                  <span>TESTING // SERVER VERIFIED</span>
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                  Zero client-side test exposure. Output is verified against authoritative hidden suites.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "var(--fg)" }}>
                  <Layers className="h-3.5 w-3.5" style={{ color: "var(--warning)" }} />
                  <span>CURRICULUM // 06 PHASES</span>
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                  A pure logic progression from conditionals and recursion before advanced OA patterns.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "var(--fg)" }}>
                  <Swords className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
                  <span>DUEL // REAL-TIME 1V1</span>
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                  Synchronized best-of-three algorithmic head-to-head battles with live round states.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ─── 3. CURRICULUM PHASE MAP (EDITORIAL INDEX) ──────────────── */}
        <section
          className="py-14 sm:py-18"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
            
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-2">
              <div>
                <p className="section-label mb-1">CURRICULUM INDEX</p>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>
                  Six-Phase Logic Progression
                </h2>
              </div>
              <div className="mono text-[11px]" style={{ color: "var(--fg-dimmed)" }}>
                330+ SEQUENTIAL CHALLENGES
              </div>
            </div>

            {/* Editorial Table */}
            <div
              className="overflow-hidden"
              style={{
                border: "1px solid var(--border)",
                borderRadius: "3px",
                backgroundColor: "var(--bg)",
              }}
            >
              {/* Header row */}
              <div
                className="hidden sm:grid grid-cols-12 px-4 py-2 text-[10px] font-bold uppercase mono"
                style={{
                  borderBottom: "1px solid var(--border)",
                  backgroundColor: "var(--bg-subtle)",
                  color: "var(--fg-dimmed)",
                  letterSpacing: "0.08em",
                }}
              >
                <span className="col-span-1">PHASE</span>
                <span className="col-span-4">TOPIC & DOMAIN</span>
                <span className="col-span-5">CORE LEARNING INVARIANTS</span>
                <span className="col-span-2 text-right">VOLUME</span>
              </div>

              {/* Rows */}
              {CURRICULUM_PHASES.map((phase, idx) => {
                const metric = PHASE_METRICS.find((m) => m.id === phase.id);
                return (
                  <Link
                    key={phase.id}
                    href={`/problems?phase=${phase.id}`}
                    className="grid grid-cols-12 items-center px-4 py-3.5 transition-colors group hover:bg-[var(--bg-subtle)]"
                    style={{
                      borderBottom: idx < CURRICULUM_PHASES.length - 1 ? "1px solid var(--border)" : "none",
                      textDecoration: "none",
                    }}
                  >
                    <span className="col-span-2 sm:col-span-1 mono text-[12px] font-bold" style={{ color: "var(--accent)" }}>
                      {String(phase.id).padStart(2, "0")}
                    </span>

                    <div className="col-span-10 sm:col-span-4 flex flex-col">
                      <span className="text-[13px] font-semibold group-hover:text-[var(--accent)] transition-colors" style={{ color: "var(--fg)" }}>
                        {phase.title}
                      </span>
                      <span className="sm:hidden text-[11px] mono mt-0.5" style={{ color: "var(--fg-dimmed)" }}>
                        {metric?.problems || "40+ Problems"}
                      </span>
                    </div>

                    <p className="hidden sm:block col-span-5 text-[12px] pr-4 leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                      {phase.description}
                    </p>

                    <div className="hidden sm:flex col-span-2 items-center justify-end gap-2 text-right">
                      <span className="mono text-[11px] font-medium" style={{ color: "var(--fg-dimmed)" }}>
                        {metric?.problems}
                      </span>
                      <span className="text-[11px] font-bold group-hover:translate-x-0.5 transition-transform" style={{ color: "var(--accent)" }}>
                        →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs" style={{ color: "var(--fg-dimmed)" }}>
                All phases support Python, JavaScript, C, C++, and Java.
              </span>
              <Link href="/problems" className="text-xs font-semibold hover:underline inline-flex items-center gap-1" style={{ color: "var(--accent)" }}>
                <span>Open Full Directory</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

          </div>
        </section>

        {/* ─── 4. HOW IT WORKS (EDITORIAL PROCESS) ────────────────────── */}
        <section
          className="py-14 sm:py-18"
          style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-subtle)" }}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
            
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <p className="section-label mb-1">PIPELINE // EXECUTION</p>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>
                  How InsidCode Works
                </h2>
              </div>
              <p className="text-xs mono" style={{ color: "var(--fg-dimmed)" }}>
                05 STEP CYCLE
              </p>
            </div>

            {/* Editorial numbered steps with thin dividers */}
            <div style={{ borderTop: "1px solid var(--border)" }}>
              {WORKFLOW_STEPS.map((step, i) => (
                <div
                  key={step.num}
                  className="grid grid-cols-1 md:grid-cols-12 items-baseline py-4 sm:py-5 gap-2 md:gap-4"
                  style={{
                    borderBottom: i < WORKFLOW_STEPS.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <div className="md:col-span-2 flex items-center gap-2">
                    <span className="mono text-[13px] font-bold" style={{ color: "var(--accent)" }}>
                      {step.num}
                    </span>
                    <span
                      className="mono px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-widest"
                      style={{
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--bg)",
                        color: "var(--fg-dimmed)",
                        borderRadius: "2px",
                      }}
                    >
                      {step.label}
                    </span>
                  </div>

                  <div className="md:col-span-4">
                    <h3 className="text-[14px] font-semibold" style={{ color: "var(--fg)" }}>
                      {step.title}
                    </h3>
                  </div>

                  <div className="md:col-span-6">
                    <p className="text-[13px] leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ─── 5. ASYMMETRIC PLATFORM SPECIFICATION BREAKDOWN ─────────── */}
        <section
          className="py-14 sm:py-18"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              
              {/* Left Column: Technical Principles */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <p className="section-label mb-1">SPECIFICATION // PRINCIPLES</p>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>
                    Built for Logic Building, Not Guesswork
                  </h2>
                </div>

                <div className="space-y-4 text-xs leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                  <p>
                    Most coding platforms throw complex data structures at beginners before they have mastered
                    basic iterative invariants, multi-branch conditionals, or recursive call frames.
                  </p>
                  <p>
                    InsidCode is structured to isolate foundational logic patterns first. You learn to solve
                    problems by writing clean, deterministic algorithms without reliance on pre-built libraries.
                  </p>
                </div>

                <div
                  className="p-4 space-y-2 mono text-[11px]"
                  style={{
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--bg-subtle)",
                    borderRadius: "3px",
                  }}
                >
                  <div className="flex items-center gap-1.5 font-bold pb-1" style={{ borderBottom: "1px solid var(--border)", color: "var(--fg)" }}>
                    <Code2 className="h-3.5 w-3.5 text-[var(--accent)]" />
                    <span>MULTI-COMPILER ENVIRONMENT</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]" style={{ color: "var(--fg-dimmed)" }}>
                    <div>• Python 3.14 (sys.stdin)</div>
                    <div>• C (GCC 15 / stdio.h)</div>
                    <div>• JavaScript (Deno TS/JS)</div>
                    <div>• C++ (G++ 15 / iostream)</div>
                    <div>• Java (OpenJDK 25)</div>
                    <div>• Strict Timeout (3.0s)</div>
                  </div>
                </div>
              </div>

              {/* Right Column: 1v1 Duel Arena Feature Highlight */}
              <div className="lg:col-span-7">
                <div
                  className="p-5 sm:p-6 space-y-5"
                  style={{
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--bg-subtle)",
                    borderRadius: "4px",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Swords className="h-4 w-4" style={{ color: "var(--accent)" }} />
                      <span className="mono text-xs font-bold" style={{ color: "var(--fg)" }}>
                        1V1 DUEL MODE // ARENA
                      </span>
                    </div>
                    <span
                      className="mono px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)",
                        color: "var(--accent)",
                        borderRadius: "2px",
                      }}
                    >
                      LIVE MULTIPLAYER
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                    Challenge friends or practice peers in synchronized, best-of-three algorithmic showdowns.
                    First to submit an accepted solution claims the round.
                  </p>

                  <div className="grid grid-cols-3 gap-3 mono text-[11px]">
                    <div className="p-3 text-center space-y-1" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg)", borderRadius: "3px" }}>
                      <div className="text-[10px]" style={{ color: "var(--fg-dimmed)" }}>ROUNDS</div>
                      <div className="font-bold text-[14px]" style={{ color: "var(--fg)" }}>Best of 3</div>
                    </div>
                    <div className="p-3 text-center space-y-1" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg)", borderRadius: "3px" }}>
                      <div className="text-[10px]" style={{ color: "var(--fg-dimmed)" }}>ROUND TIMER</div>
                      <div className="font-bold text-[14px]" style={{ color: "var(--warning)" }}>5:00 / Round</div>
                    </div>
                    <div className="p-3 text-center space-y-1" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg)", borderRadius: "3px" }}>
                      <div className="text-[10px]" style={{ color: "var(--fg-dimmed)" }}>VERIFICATION</div>
                      <div className="font-bold text-[14px]" style={{ color: "var(--success)" }}>Instant Pass</div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <Link href="/duel" className="btn btn-primary text-xs px-4 py-2">
                      <Swords className="h-3.5 w-3.5" />
                      <span>Enter Duel Arena</span>
                    </Link>
                    <Link href="/leaderboard" className="btn btn-secondary text-xs px-4 py-2">
                      <span>Duel Leaderboard</span>
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ─── 6. FINAL BOTTOM CALLOUT ─────────────────────────────────── */}
        <section className="py-14 sm:py-16 text-center">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 space-y-5">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight uppercase" style={{ color: "var(--fg)" }}>
              Start Building Logical Mastery
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "var(--fg-muted)", maxWidth: "48ch", margin: "0 auto" }}>
              Explore over 330 structured challenges across conditionals, loops, recursion, and arrays.
              Zero boilerplate, isolated execution, and server-side test suites.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Link href="/problems" className="btn btn-primary text-xs px-6 py-2.5">
                <span>Browse Problem Catalog</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link href="/stats" className="btn btn-secondary text-xs px-5 py-2.5">
                <span>View Platform Stats</span>
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
