import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, Scale, Database, UserCheck, AlertTriangle, Mail } from "lucide-react";

export default function PrivacyPage() {
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
          <Shield className="h-6 w-6" style={{ color: "var(--accent)" }} />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>
            insidcode Privacy Policy
          </h1>
        </div>
        <p className="text-xs" style={{ color: "var(--fg-dimmed)" }}>
          Last Updated & Effective Date: September 2026
        </p>
      </div>

      <div className="space-y-8 text-xs leading-relaxed font-sans" style={{ color: "var(--fg-muted)" }}>
        {/* Intro */}
        <section className="space-y-3">
          <p className="text-sm font-medium leading-normal" style={{ color: "var(--fg)" }}>
            Welcome to <strong>insidcode</strong>. We respect your privacy, value transparency, and are dedicated to protecting your personal data.
          </p>
          <p>
            This Privacy Policy describes how insidcode (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, processes, and protects your information when you access our website, use our isolated code execution services, participate in practice duels, and interact with our platform.
          </p>
        </section>

        {/* 1. Information We Collect */}
        <section
          className="space-y-3 p-5"
          style={{
            border: "1px solid var(--border)",
            borderRadius: "4px",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <div className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--fg)" }}>
            <Database className="h-4 w-4" style={{ color: "var(--accent)" }} />
            <h2>1. Personal Information We Collect</h2>
          </div>
          <p>
            We adhere to strict data minimization principles. We only collect information strictly necessary to operate our programming platform:
          </p>
          <ul className="list-disc pl-5 space-y-1.5" style={{ color: "var(--fg-muted)" }}>
            <li>
              <strong style={{ color: "var(--fg)" }}>Authentication & Social Profile Data:</strong> We operate a password-free platform. When you sign in via Google OAuth or GitHub OAuth, we receive your verified <strong>email address</strong>, <strong>display name</strong>, public <strong>profile image (avatar)</strong>, and provider-specific account identifier.
            </li>
            <li>
              <strong style={{ color: "var(--fg)" }}>User-Provided Account Details:</strong> You may customize your platform username, biography, college branch (e.g., CSE, IT, ECE), and academic semester.
            </li>
            <li>
              <strong style={{ color: "var(--fg)" }}>Code Submissions & Practice Metrics:</strong> We store source code submissions, selected programming languages (Python, JavaScript, C, C++, Java), execution runtimes, problem completion status, practice streaks, and earned Experience Points (XP).
            </li>
            <li>
              <strong style={{ color: "var(--fg)" }}>Device & Log Information:</strong> System IP addresses, browser headers, and request timestamps are processed solely for sliding-window rate limiting, DDoS mitigation, and server security.
            </li>
            <li>
              <strong style={{ color: "var(--fg)" }}>Payment & Transaction Data:</strong> If you purchase insidcode Pro or premium features, our third-party payment gateways (e.g., Razorpay / Stripe) securely handle payment processing. <strong>insidcode never sees, processes, or stores your credit/debit card numbers or UPI PINs.</strong>
            </li>
          </ul>
          <p className="text-[11px] pt-2" style={{ borderTop: "1px solid var(--border)", color: "var(--fg-dimmed)" }}>
            * We do <strong>not</strong> collect physical home addresses, government identification numbers, or phone numbers.
          </p>
        </section>

        {/* 2. How We Use Your Information */}
        <section
          className="space-y-3 p-5"
          style={{
            border: "1px solid var(--border)",
            borderRadius: "4px",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <div className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--fg)" }}>
            <Eye className="h-4 w-4" style={{ color: "var(--accent)" }} />
            <h2>2. How We Use Your Information</h2>
          </div>
          <p>We process your data strictly under valid legal bases:</p>
          <ul className="list-disc pl-5 space-y-1" style={{ color: "var(--fg-muted)" }}>
            <li>To provision your user account and verify code solutions against server-side hidden test suites.</li>
            <li>To compute fair ranking metrics, calculate daily practice streaks, and reward XP achievements.</li>
            <li>To enforce community safety, detect automated malicious scripts, and prevent unauthorized scraping.</li>
            <li>To communicate critical account alerts, system updates, and security announcements.</li>
          </ul>
          <p className="text-[11px] font-semibold" style={{ color: "var(--success)" }}>
            * We never sell, rent, monetize, or trade your personal information with third-party advertisers.
          </p>
        </section>

        {/* 3. Code Execution Privacy */}
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
            <h2>3. Code Execution & Sandboxing Privacy</h2>
          </div>
          <p>
            When you run or submit code, your instructions are dispatched to an isolated execution sandbox. The execution environment enforces strict security boundaries:
          </p>
          <ul className="list-disc pl-5 space-y-1" style={{ color: "var(--fg-muted)" }}>
            <li>Subprocess execution runs with strictly non-root permissions.</li>
            <li>Outbound network sockets are disabled to prevent data exfiltration.</li>
            <li>Strict memory and wall-clock execution limits (3.0 seconds) terminate runaway infinite loops.</li>
            <li>Source files are processed in ephemeral containers and wiped after test evaluation.</li>
          </ul>
        </section>

        {/* 4. Third-Party Services */}
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
            <h2>4. Third-Party Service Providers</h2>
          </div>
          <p>We partner with reputable infrastructure providers:</p>
          <ul className="list-disc pl-5 space-y-1" style={{ color: "var(--fg-muted)" }}>
            <li><strong style={{ color: "var(--fg)" }}>MongoDB Atlas:</strong> Secure cloud database hosting with encrypted storage at rest (AES-256).</li>
            <li><strong style={{ color: "var(--fg)" }}>Google OAuth & GitHub OAuth:</strong> Identity verification protocols.</li>
            <li><strong style={{ color: "var(--fg)" }}>Vercel Inc.:</strong> High-availability application hosting, edge caching, and DNS routing.</li>
          </ul>
        </section>

        {/* 5. GDPR Rights */}
        <section
          className="space-y-3 p-5"
          style={{
            border: "1px solid var(--border)",
            borderRadius: "4px",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <div className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--fg)" }}>
            <UserCheck className="h-4 w-4" style={{ color: "var(--accent)" }} />
            <h2>5. General Data Protection Regulation (GDPR) — European Users</h2>
          </div>
          <p>If you reside in the European Economic Area (EEA), you possess enforceable data rights:</p>
          <ul className="list-disc pl-5 space-y-1" style={{ color: "var(--fg-muted)" }}>
            <li><strong>Right of Access:</strong> Request a complete copy of your stored personal data.</li>
            <li><strong>Right to Rectification:</strong> Update inaccurate account details directly via Account Settings.</li>
            <li><strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Request permanent account deletion.</li>
            <li><strong>Right to Data Portability:</strong> Export your submission history and practice statistics in JSON format.</li>
          </ul>
        </section>

        {/* 6. CCPA */}
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
            <h2>6. California Consumer Privacy Act (CCPA)</h2>
          </div>
          <p>For California residents:</p>
          <ul className="list-disc pl-5 space-y-1" style={{ color: "var(--fg-muted)" }}>
            <li>We do not sell personal information for monetary or other valuable consideration.</li>
            <li>You have the right to request disclosure of categories of personal information collected.</li>
            <li>You will not receive discriminatory treatment or diminished service quality for exercising your privacy rights.</li>
          </ul>
        </section>

        {/* 7. Children's Privacy */}
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
            <h2>7. Children&apos;s Privacy (COPPA)</h2>
          </div>
          <p>
            insidcode is strictly directed to university students, working professionals, and individuals aged <strong>13 and older</strong>. We do not knowingly solicit or collect personal information from children under 13. If you believe a child under 13 has created an account, please contact us immediately.
          </p>
        </section>

        {/* 8. Contact */}
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
            <h2>8. Contact & Privacy Inquiries</h2>
          </div>
          <p>
            If you have questions, feedback, or legal inquiries regarding this Privacy Policy, you can reach out to us:
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
