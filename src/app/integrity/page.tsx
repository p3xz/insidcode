import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Scale, Ban, Code2, AlertTriangle, Terminal, Bot, ZapOff, Mail, Lock } from "lucide-react";

export default function IntegrityPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-8 text-[#F5F7FA]">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8B93A7] hover:text-[#00F0FF] transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Home
      </Link>

      <div className="border-b border-[#252936] pb-6">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="h-6 w-6 text-[#00F0FF]" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F7FA]">
            Academic & User Integrity Policy
          </h1>
        </div>
        <p className="text-xs text-[#8B93A7]">
          Last Updated & Effective Date: September 2026
        </p>
      </div>

      <div className="space-y-8 text-xs text-[#8B93A7] leading-relaxed font-sans">
        {/* Mission Statement */}
        <section className="space-y-3 rounded-xl border border-[#00F0FF]/20 bg-[#00F0FF]/5 p-5">
          <p className="text-sm text-[#F5F7FA] font-medium leading-normal">
            At <strong>insidcode</strong>, our core mission is to help developers build genuine, foundational problem-solving logic. True mastery comes from wrestling with algorithmic challenges, not copying solutions. This policy outlines our expectations for community integrity, fair competition, and platform usage.
          </p>
        </section>

        {/* 1. Honest Learning & Code Originality */}
        <section className="space-y-3 rounded-xl border border-[#252936] bg-[#11131A] p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
            <Code2 className="h-4 w-4 text-[#00F0FF]" />
            <h2>1. Honest Learning & Code Originality</h2>
          </div>
          <p>insidcode is built for skill-building, self-assessment, and fair competition:</p>
          <ul className="list-disc pl-5 space-y-2 text-[#8B93A7]">
            <li>
              <strong className="text-[#F5F7FA]">Personal Effort:</strong> You are expected to solve problems using your own reasoning, mathematical logic, and analytical problem-solving skills.
            </li>
            <li>
              <strong className="text-[#F5F7FA]">Plagiarism & Bots:</strong> Automatically scraping solution keys, using automated scripts or AI bots to auto-submit solutions, or submitting generated code purely to inflate your streak, XP, or leaderboard ranking undermines the platform and is strictly prohibited.
            </li>
            <li>
              <strong className="text-[#F5F7FA]">Collaboration vs. Copying:</strong> Discussing problem logic, high-level algorithmic ideas, or pseudo-code with peers is encouraged. Copying and pasting another user&apos;s exact source code is strictly forbidden.
            </li>
          </ul>
        </section>

        {/* 2. Platform Safety & Fair Use */}
        <section className="space-y-3 rounded-xl border border-[#252936] bg-[#11131A] p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
            <Terminal className="h-4 w-4 text-[#00F0FF]" />
            <h2>2. Platform Safety & Fair Use</h2>
          </div>
          <p>
            Our code execution engine runs user code in isolated execution environments. To keep the service fast, secure, and free for everyone, you agree not to exploit or abuse the execution runner:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[#8B93A7]">
            <li>
              <strong className="text-[#F5F7FA]">No Exploits:</strong> You must not attempt to escape the execution sandbox, access host machine resources, read system files, or inspect hidden server environment files.
            </li>
            <li>
              <strong className="text-[#F5F7FA]">No Denial-of-Service (DoS):</strong> Writing intentional fork bombs, infinite resource-exhaustion loops, or sending rapid automated requests to crash the API runner will result in an immediate permanent ban.
            </li>
            <li>
              <strong className="text-[#F5F7FA]">No Test Case Harvesting:</strong> Hidden test cases exist to validate edge-case logic. Attempting to write code that prints, exfiltrates, or reverse-engineers hidden test case inputs/outputs is considered a direct violation of platform integrity.
            </li>
          </ul>
        </section>

        {/* 3. Leaderboard & Streak Fairness */}
        <section className="space-y-3 rounded-xl border border-[#252936] bg-[#11131A] p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
            <Scale className="h-4 w-4 text-[#00F0FF]" />
            <h2>3. Leaderboard & Streak Fairness</h2>
          </div>
          <p>Global and friends-circle leaderboards exist to celebrate consistency and genuine growth:</p>
          <ul className="list-disc pl-5 space-y-2 text-[#8B93A7]">
            <li>
              <strong className="text-[#F5F7FA]">Authentic Progress:</strong> Artificial manipulation of daily heatmaps, account-sharing to maintain streaks, or exploiting bugs to gain unearned XP ruins the experience for the community.
            </li>
            <li>
              <strong className="text-[#F5F7FA]">Responsible Disclosure:</strong> If you discover a security vulnerability or a bug in our test case evaluator, report it responsibly to our administration team (<a href="mailto:contactphoenixfy@gmail.com" className="text-[#00F0FF] hover:underline">contactphoenixfy@gmail.com</a>) rather than exploiting it.
            </li>
          </ul>
        </section>

        {/* 4. Enforcement & Consequences */}
        <section className="space-y-3 rounded-xl border border-[#FF4D6D]/30 bg-[#FF4D6D]/5 p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#FF4D6D]">
            <Ban className="h-4 w-4 text-[#FF4D6D]" />
            <h2>4. Enforcement & Consequences</h2>
          </div>
          <p className="text-[#F5F7FA]">
            We continuously monitor submissions for anomalous patterns, platform abuse, and rate-limit violations. If a user is found violating this Integrity Policy, insidcode reserves the right to take any of the following actions without prior notice:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-[#8B93A7]">
            <li><strong className="text-[#F5F7FA]">Streak & XP Reset:</strong> Immediate removal of unearned points, achievements, or leaderboard positions.</li>
            <li><strong className="text-[#F5F7FA]">Submission Invalidation:</strong> Retroactive disqualification of specific problem solves.</li>
            <li><strong className="text-[#F5F7FA]">Account Suspension or Ban:</strong> Temporary or permanent revocation of platform access and OAuth account binding.</li>
            <li><strong className="text-[#F5F7FA]">IP Blacklisting:</strong> Blocking network access from accounts or bots initiating malicious execution requests.</li>
          </ul>
        </section>

        {/* Divider for API Usage & Anti-Scraping */}
        <div className="border-t border-[#252936] pt-4">
          <div className="flex items-center gap-2 mb-2">
            <ZapOff className="h-6 w-6 text-[#F59E0B]" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F7FA]">
              API Usage, Anti-Scraping & Automation Rules
            </h1>
          </div>
          <p className="text-xs text-[#8B93A7]">
            To ensure platform stability, fair resource distribution, and fair competition, strict rules apply to all interactions with insidcode APIs, web endpoints, and execution environments.
          </p>
        </div>

        {/* API 1. Automated Requests & Bots */}
        <section className="space-y-3 rounded-xl border border-[#252936] bg-[#11131A] p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
            <Bot className="h-4 w-4 text-[#00F0FF]" />
            <h2>1. Automated Requests & Bots</h2>
          </div>
          <ul className="list-disc pl-5 space-y-2 text-[#8B93A7]">
            <li>
              <strong className="text-[#F5F7FA]">No Scripting:</strong> You are strictly prohibited from using bots, scrapers, crawlers, automated submission tools, or custom scripts to interact with insidcode endpoints (<code className="rounded bg-[#181B24] px-1.5 py-0.5 text-[#00F0FF]">/api/*</code>).
            </li>
            <li>
              <strong className="text-[#F5F7FA]">Interactive UI Only:</strong> All code runs, submissions, and account actions must originate from authentic manual interactions through the official insidcode user interface.
            </li>
          </ul>
        </section>

        {/* API 2. API Abuse & Denial of Service */}
        <section className="space-y-3 rounded-xl border border-[#252936] bg-[#11131A] p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
            <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
            <h2>2. API Abuse & Denial of Service</h2>
          </div>
          <ul className="list-disc pl-5 space-y-2 text-[#8B93A7]">
            <li>
              <strong className="text-[#F5F7FA]">Rate Limits:</strong> Bypassing, spoofing headers (such as <code className="rounded bg-[#181B24] px-1.5 py-0.5 text-[#00F0FF]">x-forwarded-for</code>), or attempting to circumvent server-side rate limits and execution locks is forbidden.
            </li>
            <li>
              <strong className="text-[#F5F7FA]">Overburdening Infrastructure:</strong> Sending rapid automated requests, initiating denial-of-service attempts, or executing infinite loop payloads designed to exhaust runner memory, CPU, or network bandwidth will result in immediate termination.
            </li>
          </ul>
        </section>

        {/* API 3. Test Case Harvesting & Data Scraping */}
        <section className="space-y-3 rounded-xl border border-[#252936] bg-[#11131A] p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
            <Lock className="h-4 w-4 text-[#00F0FF]" />
            <h2>3. Test Case Harvesting & Data Scraping</h2>
          </div>
          <ul className="list-disc pl-5 space-y-2 text-[#8B93A7]">
            <li>
              <strong className="text-[#F5F7FA]">Hidden Test Cases:</strong> Hidden evaluation test cases, problem test suites, and internal solution inputs are protected assets. You must not write scripts or code payloads designed to print, extract, exfiltrate, or reverse-engineer hidden test case inputs/outputs.
            </li>
            <li>
              <strong className="text-[#F5F7FA]">Data Scraping:</strong> Mass scraping of user profiles, global leaderboards, submission histories, or problem statements using automated methods is strictly prohibited.
            </li>
          </ul>
        </section>

        {/* API 4. Enforcement */}
        <section className="space-y-3 rounded-xl border border-[#FF4D6D]/30 bg-[#FF4D6D]/5 p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#FF4D6D]">
            <Ban className="h-4 w-4 text-[#FF4D6D]" />
            <h2>4. Enforcement Summary</h2>
          </div>
          <p className="text-[#F5F7FA]">
            Any attempt to abuse, scrape, or automate requests to insidcode infrastructure will result in:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#8B93A7]">
            <li>Immediate, permanent revocation of your account access.</li>
            <li>Nullification of all streaks, XP, and leaderboard achievements.</li>
            <li>Permanent IP address and network-level blocking from platform resources.</li>
          </ul>
        </section>

        {/* Contact */}
        <section className="space-y-3 rounded-xl border border-[#252936] bg-[#11131A] p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
            <Mail className="h-4 w-4 text-[#00F0FF]" />
            <h2>Contact Administration</h2>
          </div>
          <p>
            For questions regarding integrity guidelines or responsible disclosure of vulnerabilities, contact us at:{" "}
            <a href="mailto:contactphoenixfy@gmail.com" className="text-[#00F0FF] hover:underline font-medium">
              contactphoenixfy@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
