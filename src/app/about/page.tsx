import React from "react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About InsidCode",
  description:
    "InsidCode is a programming logic practice platform built to help learners master foundational coding skills — conditionals, loops, recursion, arrays, and strings — before progressing into data structures and algorithms.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About InsidCode",
    description:
      "InsidCode is a programming logic practice platform built to help learners master foundational coding skills — conditionals, loops, recursion, arrays, and strings — before progressing into data structures and algorithms.",
    url: "https://insidcode.vercel.app/about",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "InsidCode — Programming Logic Practice Before DSA",
      },
    ],
  },
};

const PHASES = [
  {
    id: 1,
    title: "Conditional Thinking",
    description:
      "Learn to control program flow using if-else, boolean logic, and multi-branch decisions.",
  },
  {
    id: 2,
    title: "Looping and Patterns",
    description:
      "Master iterative logic — for loops, while loops, nested loops, and pattern printing.",
  },
  {
    id: 3,
    title: "Recursion",
    description:
      "Understand base cases, recursive state transitions, and call stacks from first principles.",
  },
  {
    id: 4,
    title: "Basic Arrays",
    description:
      "Work through linear scans, subarrays, two-pointer techniques, and array transformations.",
  },
  {
    id: 5,
    title: "Strings",
    description:
      "Practice character manipulation, substring matching, palindromes, and parsing challenges.",
  },
  {
    id: 6,
    title: "Mixed Logical Challenges",
    description:
      "Apply everything — bitwise logic, two-pointer patterns, number theory, and placement OA-style problems.",
  },
];

const LANGUAGES = [
  { name: "Python 3", runtime: "Python 3.14 (sys.stdin)" },
  { name: "JavaScript", runtime: "Deno (TypeScript/JS)" },
  { name: "C", runtime: "GCC 15 (stdio.h)" },
  { name: "C++", runtime: "G++ 15 (iostream)" },
  { name: "Java", runtime: "OpenJDK 25" },
];

export default function AboutPage() {
  return (
    <div
      className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-16"
      style={{ color: "var(--fg)" }}
    >
      {/* ─── Breadcrumb ─── */}
      <nav aria-label="Breadcrumb" className="text-xs" style={{ color: "var(--fg-muted)" }}>
        <ol className="flex items-center gap-2">
          <li><Link href="/" style={{ color: "var(--fg-muted)" }} className="hover:underline">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li style={{ color: "var(--fg)" }}>About</li>
        </ol>
      </nav>

      {/* ─── Hero ─── */}
      <section>
        <p
          className="mono text-[10px] font-bold uppercase tracking-widest mb-3"
          style={{ color: "var(--accent)" }}
        >
          INSIDCODE / ABOUT
        </p>
        <h1
          className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
          style={{ lineHeight: "1.1" }}
        >
          Programming Logic Practice Before DSA
        </h1>
        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--fg-muted)", maxWidth: "62ch" }}
        >
          InsidCode is a web-based coding practice platform designed for learners who want to build
          solid programming fundamentals before jumping into data structures and algorithms. It
          provides 330+ structured challenges, isolated code execution, server-verified tests, XP
          tracking, practice streaks, and real-time 1v1 coding Duels.
        </p>
      </section>

      {/* ─── What is InsidCode ─── */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">What is InsidCode?</h2>
        <div
          className="text-sm leading-relaxed space-y-3"
          style={{ color: "var(--fg-muted)" }}
        >
          <p>
            Most beginners encounter complex data structures before they have fully internalized the
            logic patterns that make those structures work. InsidCode addresses this by providing a
            purely logic-focused curriculum — starting from simple conditionals and building
            progressively through loops, recursion, arrays, and strings before reaching more advanced
            OA-style challenges.
          </p>
          <p>
            Each problem on InsidCode has a clear problem statement, input/output format, worked
            examples, and constraints. When you submit a solution, it is evaluated against a set of
            hidden test cases on the server — you only see whether each test passed or failed, not
            the test inputs themselves. This prevents gaming the system and simulates real assessment
            conditions.
          </p>
        </div>
      </section>

      {/* ─── Who is it for ─── */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Who is InsidCode for?</h2>
        <ul
          className="text-sm leading-relaxed space-y-2 list-disc pl-5"
          style={{ color: "var(--fg-muted)" }}
        >
          <li>Beginners who are learning to code and want structured practice.</li>
          <li>
            Students preparing for campus placement OA tests (TCS NQT, Infosys, Accenture, etc.)
            who need to sharpen basic logic.
          </li>
          <li>
            Self-taught developers who skipped fundamentals and want to fill the gaps before DSA.
          </li>
          <li>Anyone who wants to practice coding in Python, JavaScript, C, C++, or Java.</li>
        </ul>
      </section>

      {/* ─── Six-Phase Curriculum ─── */}
      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight mb-1">The Six-Phase Curriculum</h2>
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
            330+ problems organized as a deliberate learning progression.
          </p>
        </div>
        <div
          className="overflow-hidden"
          style={{ border: "1px solid var(--border)", borderRadius: "3px" }}
        >
          {PHASES.map((phase, idx) => (
            <div
              key={phase.id}
              className="flex gap-4 px-5 py-4 text-sm"
              style={{
                borderBottom: idx < PHASES.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <span
                className="mono text-[12px] font-bold shrink-0 w-6"
                style={{ color: "var(--accent)" }}
              >
                {String(phase.id).padStart(2, "0")}
              </span>
              <div>
                <div className="font-semibold mb-0.5">{phase.title}</div>
                <div className="text-[13px]" style={{ color: "var(--fg-muted)" }}>
                  {phase.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">How InsidCode Works</h2>
        <div
          className="text-sm leading-relaxed space-y-3"
          style={{ color: "var(--fg-muted)" }}
        >
          <p>
            <strong style={{ color: "var(--fg)" }}>Run</strong> — Execute your code against a
            custom test input in an isolated sandbox. The runner uses strict 3-second wall-clock
            timeouts and non-root process boundaries. You see stdout/stderr immediately.
          </p>
          <p>
            <strong style={{ color: "var(--fg)" }}>Submit</strong> — Evaluate your solution against
            the hidden test suite on the server. Results show which tests passed and which failed,
            but hidden test inputs are never exposed to the client.
          </p>
          <p>
            <strong style={{ color: "var(--fg)" }}>XP and Streaks</strong> — Earn XP for your first
            accepted submission on each problem. Maintain a daily practice streak to track
            consistency. XP and streaks are tracked per account.
          </p>
          <p>
            <strong style={{ color: "var(--fg)" }}>1v1 Duels</strong> — Challenge another user to a
            real-time best-of-three coding Duel. Both players receive the same problem. The first to
            submit an accepted solution wins the round. Duel sessions are ephemeral — they expire
            and are not permanently public.
          </p>
        </div>
      </section>

      {/* ─── Supported Languages ─── */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Supported Languages</h2>
        <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
          All problems can be solved in any of the five supported languages. Each language runs in
          its own isolated environment.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {LANGUAGES.map((lang) => (
            <div
              key={lang.name}
              className="flex items-center gap-3 px-4 py-3 text-sm"
              style={{ border: "1px solid var(--border)", borderRadius: "3px" }}
            >
              <span className="font-semibold" style={{ minWidth: "80px" }}>
                {lang.name}
              </span>
              <span className="mono text-[11px]" style={{ color: "var(--fg-dimmed)" }}>
                {lang.runtime}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Creator ─── */}
      <section
        className="pt-8"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
          InsidCode is built and maintained by{" "}
          <strong style={{ color: "var(--fg)" }}>Namish Yadav</strong>.
        </p>
        <div className="flex flex-wrap gap-3 mt-4">
          <Link
            href="/problems"
            className="btn btn-primary text-xs px-5 py-2.5"
          >
            Browse Problems
          </Link>
          <Link
            href="/feedback"
            className="btn btn-secondary text-xs px-4 py-2.5"
          >
            Send Feedback
          </Link>
        </div>
      </section>

      {/* Organization JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": "https://insidcode.vercel.app/#organization",
            name: "InsidCode",
            url: "https://insidcode.vercel.app",
            description:
              "A programming logic practice platform with 330+ structured challenges, isolated code execution, XP tracking, and 1v1 Duels.",
            founder: {
              "@type": "Person",
              name: "Namish Yadav",
            },
          }),
        }}
      />
    </div>
  );
}
