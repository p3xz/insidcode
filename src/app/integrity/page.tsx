import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ShieldCheck, Code2, Terminal, Bot, ZapOff, Mail, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Academic & User Integrity",
  description:
    "Community integrity guidelines, fair coding standards, and anti-abuse policies for InsidCode.",
  alternates: {
    canonical: "/integrity",
  },
  openGraph: {
    title: "Academic & User Integrity | InsidCode",
    description:
      "Community integrity guidelines, fair coding standards, and anti-abuse policies for InsidCode.",
    url: "https://insidcode.vercel.app/integrity",
  },
};

export default function IntegrityPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-8" style={{ color: "var(--fg)" }}>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
        style={{ color: "var(--fg-muted)" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Home
      </Link>

      <div className="pb-6" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="h-6 w-6" style={{ color: "var(--accent)" }} />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>
            Academic & User Integrity Policy
          </h1>
        </div>
        <p className="text-xs" style={{ color: "var(--fg-dimmed)" }}>
          Last Updated & Effective Date: September 2026
        </p>
      </div>

      <div className="space-y-8 text-xs leading-relaxed font-sans" style={{ color: "var(--fg-muted)" }}>
        {/* Mission Statement */}
        <section
          className="space-y-3 p-5"
          style={{
            border: "1px solid var(--border)",
            borderRadius: "4px",
            backgroundColor: "var(--bg-subtle)",
          }}
        >
          <p className="text-sm font-medium leading-normal" style={{ color: "var(--fg)" }}>
            At <strong>insidcode</strong>, our core mission is to help developers build genuine, foundational problem-solving logic. True mastery comes from wrestling with algorithmic challenges, not copying solutions. This policy outlines our expectations for community integrity, fair competition, and platform usage.
          </p>
        </section>

        {/* 1. Honest Learning */}
        <section
          className="space-y-3 p-5"
          style={{
            border: "1px solid var(--border)",
            borderRadius: "4px",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <div className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--fg)" }}>
            <Code2 className="h-4 w-4" style={{ color: "var(--accent)" }} />
            <h2>1. Honest Learning & Code Originality</h2>
          </div>
          <p>insidcode is built for skill-building, self-assessment, and fair competition:</p>
          <ul className="list-disc pl-5 space-y-2" style={{ color: "var(--fg-muted)" }}>
            <li>
              <strong style={{ color: "var(--fg)" }}>Personal Effort:</strong> You are expected to solve problems using your own reasoning, mathematical logic, and analytical problem-solving skills.
            </li>
            <li>
              <strong style={{ color: "var(--fg)" }}>Plagiarism & Bots:</strong> Automatically scraping solution keys, using automated scripts or AI bots to auto-submit solutions, or submitting generated code purely to inflate your streak, XP, or leaderboard ranking undermines the platform and is strictly prohibited.
            </li>
            <li>
              <strong style={{ color: "var(--fg)" }}>Collaboration vs. Copying:</strong> Discussing problem logic, high-level algorithmic ideas, or pseudo-code with peers is encouraged. Copying and pasting another user&apos;s exact source code is strictly forbidden.
            </li>
          </ul>
        </section>

        {/* 2. Platform Safety */}
        <section
          className="space-y-3 p-5"
          style={{
            border: "1px solid var(--border)",
            borderRadius: "4px",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <div className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--fg)" }}>
            <Terminal className="h-4 w-4" style={{ color: "var(--accent)" }} />
            <h2>2. Platform Safety & Fair Use</h2>
          </div>
          <ul className="list-disc pl-5 space-y-2" style={{ color: "var(--fg-muted)" }}>
            <li>
              <strong style={{ color: "var(--fg)" }}>Sandbox Container Integrity:</strong> You must not attempt to escape isolated runner sandboxes, exploit Linux kernel privileges, scan internal private networks, or manipulate system processes.
            </li>
            <li>
              <strong style={{ color: "var(--fg)" }}>No Malicious Payloads:</strong> Submitting malicious payloads, recursive process spawners (fork bombs), ransomware scripts, or network socket scanners will lead to immediate account suspension and IP blacklisting.
            </li>
          </ul>
        </section>

        {/* 3. Fair Play & No Administrative Tampering */}
        <section
          className="space-y-3 p-5"
          style={{
            border: "1px solid var(--border)",
            borderRadius: "4px",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <div className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--fg)" }}>
            <ShieldAlert className="h-4 w-4" style={{ color: "var(--danger)" }} />
            <h2>3. Fair Play, No Privilege Escalation & Responsible Disclosure</h2>
          </div>
          <p>Global leaderboards and duels exist to celebrate consistency and genuine growth:</p>
          <ul className="list-disc pl-5 space-y-2" style={{ color: "var(--fg-muted)" }}>
            <li>
              <strong style={{ color: "var(--fg)" }}>Zero Tampering:</strong> Attempting unauthorized administrative access, privilege escalation, modifying leaderboard parameters, or forging Duel wins is strictly forbidden and results in immediate automated account suspension.
            </li>
            <li>
              <strong style={{ color: "var(--fg)" }}>Responsible Security Disclosure:</strong> If you discover a security vulnerability, authorization loophole, or test case evaluator bug, please report it responsibly via our <Link href="/feedback" className="underline" style={{ color: "var(--accent)" }}>Feedback Portal</Link> or email (<a href="mailto:contactphoenixfy@gmail.com" className="hover:underline" style={{ color: "var(--accent)" }}>contactphoenixfy@gmail.com</a>) rather than exploiting it.
            </li>
          </ul>
        </section>

        {/* 4. API & Anti-Scraping */}
        <div className="pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-2">
            <ZapOff className="h-6 w-6" style={{ color: "var(--warning)" }} />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>
              API Usage, Anti-Scraping & Automation Rules
            </h1>
          </div>
          <p className="text-xs" style={{ color: "var(--fg-dimmed)" }}>
            To ensure platform stability, fair resource distribution, and fair competition, strict rules apply to all interactions with insidcode APIs, web endpoints, and execution environments.
          </p>
        </div>

        {/* API Rules */}
        <section
          className="space-y-3 p-5"
          style={{
            border: "1px solid var(--border)",
            borderRadius: "4px",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <div className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--fg)" }}>
            <Bot className="h-4 w-4" style={{ color: "var(--accent)" }} />
            <h2>4. Automated Requests & Bots</h2>
          </div>
          <ul className="list-disc pl-5 space-y-2" style={{ color: "var(--fg-muted)" }}>
            <li>
              <strong style={{ color: "var(--fg)" }}>No Scripting:</strong> You are strictly prohibited from using bots, scrapers, crawlers, automated submission tools, or custom scripts to interact with insidcode endpoints.
            </li>
            <li>
              <strong style={{ color: "var(--fg)" }}>Interactive UI Only:</strong> All code runs, submissions, and account actions must originate from authentic manual interactions through the official insidcode user interface.
            </li>
          </ul>
        </section>

        {/* Contact */}
        <section
          className="space-y-3 p-5"
          style={{
            border: "1px solid var(--border)",
            borderRadius: "4px",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <div className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--fg)" }}>
            <Mail className="h-4 w-4" style={{ color: "var(--accent)" }} />
            <h2>Contact Administration</h2>
          </div>
          <p>
            For questions regarding integrity guidelines or responsible disclosure of vulnerabilities, contact us at:{" "}
            <a href="mailto:contactphoenixfy@gmail.com" className="hover:underline font-medium" style={{ color: "var(--accent)" }}>
              contactphoenixfy@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
