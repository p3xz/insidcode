import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, FileText, AlertTriangle, ShieldCheck, Scale, Lock, Ban, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Terms and conditions for utilizing the InsidCode algorithmic practice platform and sandboxed code execution environment.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Terms of Use | InsidCode",
    description:
      "Terms and conditions for utilizing the InsidCode algorithmic practice platform and sandboxed code execution environment.",
    url: "https://insidcode.vercel.app/terms",
  },
};

export default function TermsPage() {
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
          <FileText className="h-6 w-6" style={{ color: "var(--accent)" }} />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>
            insidcode Terms and Conditions
          </h1>
        </div>
        <p className="text-xs" style={{ color: "var(--fg-dimmed)" }}>
          Last Updated & Effective Date: September 2026
        </p>
      </div>

      <div className="space-y-8 text-xs leading-relaxed font-sans" style={{ color: "var(--fg-muted)" }}>
        {/* Welcome */}
        <section className="space-y-3">
          <p className="text-sm font-medium leading-normal" style={{ color: "var(--fg)" }}>
            Welcome to <strong>insidcode</strong>!
          </p>
          <p>
            These terms and conditions outline the rules and regulations for the use of insidcode (&quot;the Platform&quot;, &quot;Company&quot;, &quot;We&quot;, &quot;Our&quot;, or &quot;Us&quot;). By accessing or using this website, we assume you accept these terms and conditions in full. <strong>Do not continue to use insidcode if you do not agree to take all of the terms and conditions stated on this page.</strong>
          </p>
        </section>

        {/* 1. Description of Service */}
        <section
          className="space-y-3 p-5"
          style={{
            border: "1px solid var(--border)",
            borderRadius: "4px",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <div className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--fg)" }}>
            <ShieldCheck className="h-4 w-4" style={{ color: "var(--accent)" }} />
            <h2>1. Description of Service</h2>
          </div>
          <p>
            insidcode provides an interactive, web-based coding environment for learning, developing, and mastering algorithmic logic, problem-solving, recursion, and patterns. We provide sandboxed code execution environments, automated problem evaluation against hidden test suites, practice streaks, 1v1 Duels, and user progress tracking.
          </p>
        </section>

        {/* 2. Acceptable Use & Code Runner Rules */}
        <section
          className="space-y-3 p-5"
          style={{
            border: "1px solid var(--border)",
            borderRadius: "4px",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <div className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--fg)" }}>
            <Lock className="h-4 w-4" style={{ color: "var(--accent)" }} />
            <h2>2. Acceptable Use & Prohibited Conduct</h2>
          </div>
          <p>
            You agree to use the Platform strictly for educational and self-assessment purposes. You are strictly prohibited from:
          </p>
          <ul className="list-disc pl-5 space-y-1.5" style={{ color: "var(--fg-muted)" }}>
            <li>Attempting unauthorized administrative access, privilege escalation, or modifying protected system settings.</li>
            <li>Directly calling or bypassing API authorization boundaries to execute privileged administrator operations.</li>
            <li>Artificially manipulating XP, language points, achievements, streaks, leaderboard ranks, or 1v1 Duel statistics.</li>
            <li>Attempting to break, escape, or exploit the sandbox code execution containers.</li>
            <li>Executing malicious code, fork bombs, cryptominers, or denial-of-service attack scripts.</li>
            <li>Using automated bots, scrapers, or third-party automation tools to mass-submit solutions or tamper with platform telemetry.</li>
            <li>Attempting unauthorized access to backend APIs, servers, or other user accounts.</li>
          </ul>
        </section>

        {/* 3. Intellectual Property */}
        <section
          className="space-y-3 p-5"
          style={{
            border: "1px solid var(--border)",
            borderRadius: "4px",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <div className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--fg)" }}>
            <Scale className="h-4 w-4" style={{ color: "var(--accent)" }} />
            <h2>3. Intellectual Property & User Code Rights</h2>
          </div>
          <p>
            You retain 100% intellectual ownership of any original source code you write and submit on the Platform. Unless otherwise stated, insidcode and/or its licensors own the intellectual property rights for all educational material, question prompts, test cases, and editorial content published on insidcode.
          </p>
        </section>

        {/* 4. Account Suspension and Termination */}
        <section
          className="space-y-3 p-5"
          style={{
            border: "1px solid var(--border)",
            borderRadius: "4px",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <div className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--fg)" }}>
            <Ban className="h-4 w-4" style={{ color: "var(--danger)" }} />
            <h2>4. Account Suspension, Revocation & Termination</h2>
          </div>
          <p>
            We reserve the right to suspend, restrict, or terminate account access for violations of these Terms:
          </p>
          <ul className="list-disc pl-5 space-y-1" style={{ color: "var(--fg-muted)" }}>
            <li>
              <strong>Automatic Suspension:</strong> Confirmed unauthorized attempts to perform administrative mutations, tamper with platform settings, or exploit security vulnerabilities will result in immediate automated suspension.
            </li>
            <li>
              <strong>Progress Revocation:</strong> Illegitimately gained XP, fake streak days, manipulated language points, and invalid leaderboard rankings will be removed.
            </li>
            <li>
              <strong>Appeals:</strong> Suspended users may submit an inquiry or appeal via the official Feedback and support channel.
            </li>
          </ul>
        </section>

        {/* 5. Disclaimer & Limitation of Liability */}
        <section
          className="space-y-3 p-5"
          style={{
            border: "1px solid var(--border)",
            borderRadius: "4px",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <div className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--fg)" }}>
            <AlertTriangle className="h-4 w-4" style={{ color: "var(--warning)" }} />
            <h2>5. Disclaimer & Limitation of Liability</h2>
          </div>
          <p>
            The Platform is provided on an <strong>&quot;AS IS&quot;</strong> and <strong>&quot;AS AVAILABLE&quot;</strong> basis without warranties of any kind. As long as the website and the services on the website are provided free of charge, we will not be liable for any loss or damage of any nature.
          </p>
        </section>

        {/* 6. Contact */}
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
            <h2>6. Contact Us</h2>
          </div>
          <p>
            If you have questions regarding these Terms and Conditions, please contact us:
          </p>
          <p>
            <strong style={{ color: "var(--fg)" }}>Email:</strong>{" "}
            <a href="mailto:contactphoenixfy@gmail.com" className="hover:underline" style={{ color: "var(--accent)" }}>
              contactphoenixfy@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
