import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, Scale, Database, UserCheck, AlertTriangle, Mail } from "lucide-react";

export default function PrivacyPage() {
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
          <Shield className="h-6 w-6 text-[#00F0FF]" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F7FA]">
            insidcode Privacy Policy
          </h1>
        </div>
        <p className="text-xs text-[#8B93A7]">
          Last Updated & Effective Date: September 2026
        </p>
      </div>

      <div className="space-y-8 text-xs text-[#8B93A7] leading-relaxed font-sans">
        {/* Intro */}
        <section className="space-y-3">
          <p className="text-sm text-[#F5F7FA] font-medium leading-normal">
            Welcome to <strong>insidcode</strong>. We respect your privacy, value transparency, and are dedicated to protecting your personal data.
          </p>
          <p>
            This Privacy Policy describes how insidcode (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, processes, and protects your information when you access our website, use our isolated code execution services, participate in practice duels, and interact with our platform.
          </p>
        </section>

        {/* 1. Information We Collect */}
        <section className="space-y-3 rounded-xl border border-[#252936] bg-[#11131A] p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
            <Database className="h-4 w-4 text-[#00F0FF]" />
            <h2>1. Personal Information We Collect</h2>
          </div>
          <p>
            We adhere to strict data minimization principles. We only collect information strictly necessary to operate our programming platform:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-[#8B93A7]">
            <li>
              <strong className="text-[#F5F7FA]">Authentication & Social Profile Data:</strong> We operate a password-free platform. When you sign in via Google OAuth or GitHub OAuth, we receive your verified <strong>email address</strong>, <strong>display name</strong>, public <strong>profile image (avatar)</strong>, and provider-specific account identifier.
            </li>
            <li>
              <strong className="text-[#F5F7FA]">User-Provided Account Details:</strong> You may customize your platform username, biography, college branch (e.g., CSE, IT, ECE), and academic semester.
            </li>
            <li>
              <strong className="text-[#F5F7FA]">Code Submissions & Practice Metrics:</strong> We store source code submissions, selected programming languages (Python, JavaScript, C, C++, Java), execution runtimes, problem completion status, practice streaks, and earned Experience Points (XP).
            </li>
            <li>
              <strong className="text-[#F5F7FA]">Device & Log Information:</strong> System IP addresses, browser headers, and request timestamps are processed solely for sliding-window rate limiting, DDoS mitigation, and server security.
            </li>
            <li>
              <strong className="text-[#F5F7FA]">Payment & Transaction Data:</strong> If you purchase insidcode Pro or premium features, our third-party payment gateways (e.g., Razorpay / Stripe) securely handle payment processing. <strong>insidcode never sees, processes, or stores your credit/debit card numbers or UPI PINs.</strong>
            </li>
          </ul>
          <p className="text-[11px] text-[#8B93A7] border-t border-[#252936] pt-2">
            * We do <strong>not</strong> collect physical home addresses, government identification numbers, or phone numbers.
          </p>
        </section>

        {/* 2. How We Use Your Information */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
            <Eye className="h-4 w-4 text-[#00F0FF]" />
            <h2>2. How We Use Your Information</h2>
          </div>
          <p>We process your personal information strictly for legitimate operational purposes:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#8B93A7]">
            <li>To manage your account, authenticate your identity, and preserve your coding sessions.</li>
            <li>To evaluate source code submissions against hidden test cases using isolated sandboxed runners.</li>
            <li>To maintain public, branch-level, and friends-only leaderboards, daily practice streaks, and achievements.</li>
            <li>To prevent fraud, automated bot spam, sandbox attacks, and service abuse.</li>
            <li>To deliver in-app achievement notifications and platform announcements.</li>
          </ul>
        </section>

        {/* 3. Advertising & Tracking */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
            <Lock className="h-4 w-4 text-[#00F0FF]" />
            <h2>3. Zero Third-Party Advertising & Remarketing</h2>
          </div>
          <p>
            insidcode is an ad-free, distraction-free educational environment:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#8B93A7]">
            <li>We do <strong>not</strong> display third-party advertisements or ad banners.</li>
            <li>We do <strong>not</strong> utilize behavioral remarketing services (such as Google Ads Remarketing, Meta Pixel, or Twitter conversion pixels).</li>
            <li>We do <strong>not</strong> sell, rent, monetize, or trade your personal data or source code to third-party data brokers.</li>
          </ul>
        </section>

        {/* 4. Isolated Code Execution Safe Harbor */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
            <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
            <h2>4. Sandboxed Code Execution & Security</h2>
          </div>
          <p>
            When you run or submit code, your instructions are dispatched to an isolated execution sandbox (via Piston Engine). The execution environment enforces strict security boundaries:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#8B93A7]">
            <li>Hard CPU and runtime limits (5,000 ms execution ceiling) and 10,000 ms compilation limit.</li>
            <li>Strict memory quotas, payload restrictions (max 100 KB code, 32 KB stdin), and isolated process execution.</li>
            <li>Any attempt to execute fork bombs, access host metadata, or escape sandbox boundaries is logged, rejected, and subject to permanent account termination.</li>
          </ul>
        </section>

        {/* 5. Account Suspension, AI Usage & Anti-Cheating Rights */}
        <section className="space-y-3 rounded-xl border border-[#FF4D6D]/30 bg-[#FF4D6D]/5 p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#FF4D6D]">
            <AlertTriangle className="h-4 w-4 text-[#FF4D6D]" />
            <h2>5. Account Suspension, Immediate Ban & Fair Play Policy</h2>
          </div>
          <p className="text-[#F5F7FA] font-medium">
            We reserve the absolute right to suspend, terminate, or ban your account at any time, with or without prior notice, for conduct that violates our policies, attempts platform exploitation, or harms other users.
          </p>
          <p>
            <strong>Fair Play & AI Manipulation Warning:</strong> We strongly advise users not to use AI tools, automated scripts, or bots to artificially manipulate problem-solving statistics, bypass test logic, or game leaderboard rankings. If suspicious patterns or automated AI submission spikes are detected, we reserve the right to <strong>reset your XP to 0</strong>, revoke earned achievements, or indefinitely suspend your account until you verify that your submissions are authentic.
          </p>
        </section>

        {/* 6. GDPR Compliance */}
        <section className="space-y-3 rounded-xl border border-[#252936] bg-[#11131A] p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
            <Scale className="h-4 w-4 text-[#00F0FF]" />
            <h2>6. General Data Protection Regulation (GDPR) Compliance</h2>
          </div>
          <p>
            If you reside in the European Economic Area (EEA) or United Kingdom (UK), you possess fundamental legal rights under the GDPR:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-[#8B93A7]">
            <li><strong className="text-[#F5F7FA]">Right to Access:</strong> You can request a copy of the personal information we hold about you.</li>
            <li><strong className="text-[#F5F7FA]">Right to Rectification:</strong> You can modify your username, display name, and preferences directly in your Account Settings.</li>
            <li><strong className="text-[#F5F7FA]">Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> You can permanently wipe your account, profile, all past submissions, streaks, and notifications at any time via your Settings page by confirming account deletion.</li>
            <li><strong className="text-[#F5F7FA]">Right to Restrict & Object:</strong> You can object to the processing of your data or hide your profile from the public leaderboard by toggling off Leaderboard Visibility in Settings.</li>
            <li><strong className="text-[#F5F7FA]">Lawful Basis for Processing:</strong> We process your data based on contractual necessity (providing the coding platform you signed up for) and legitimate interests (platform security and anti-cheat validation).</li>
          </ul>
        </section>

        {/* 7. CCPA / CPRA Compliance */}
        <section className="space-y-3 rounded-xl border border-[#252936] bg-[#11131A] p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
            <UserCheck className="h-4 w-4 text-[#00F0FF]" />
            <h2>7. California Consumer Privacy Act (CCPA) & CPRA Notice</h2>
          </div>
          <p>
            Under the California Consumer Privacy Act (amended by the California Privacy Rights Act - CPRA), California residents are entitled to specific disclosures:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-[#8B93A7]">
            <li><strong className="text-[#F5F7FA]">Right to Know:</strong> You may request the categories and specific pieces of personal information collected over the preceding 12 months.</li>
            <li><strong className="text-[#F5F7FA]">No Sale or Sharing of Personal Information:</strong> We do <strong>NOT</strong> sell your personal information, nor do we share your information for cross-context behavioral advertising. We have not sold any personal information in the preceding 12 months.</li>
            <li><strong className="text-[#F5F7FA]">Right to Non-Discrimination:</strong> We will never deny services, charge different prices, or provide an inferior quality of service because you exercised your CCPA rights.</li>
          </ul>
        </section>

        {/* 8. CalOPPA Notice */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
            <Shield className="h-4 w-4 text-[#00F0FF]" />
            <h2>8. California Online Privacy Protection Act (CalOPPA)</h2>
          </div>
          <p>
            In compliance with CalOPPA:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#8B93A7]">
            <li>Users can visit our public directory and read problem statements without logging in.</li>
            <li>Our Privacy Policy is linked directly in our primary application footer on all pages.</li>
            <li><strong className="text-[#F5F7FA]">Do Not Track (DNT) Signals:</strong> Because there is currently no industry consensus on how to interpret DNT signals, insidcode does not alter its data collection practices upon receiving DNT browser signals. However, we do not track users across third-party websites regardless.</li>
          </ul>
        </section>

        {/* 9. Children's Privacy (COPPA) */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
            <AlertTriangle className="h-4 w-4 text-[#FF4D6D]" />
            <h2>9. Children&apos;s Online Privacy Protection Act (COPPA)</h2>
          </div>
          <p>
            insidcode is strictly directed to university students, working professionals, and individuals aged <strong>13 and older</strong> (or 16 and older in the EEA). We do not knowingly solicit, collect, or retain personal information from children under 13 years of age.
          </p>
          <p>
            If we learn that we have inadvertently collected personal data from a child under 13 without verified parental consent, we will promptly delete that information from our database records. If you believe a child under 13 has created an account, please contact us immediately.
          </p>
        </section>

        {/* 10. Data Retention & Permanent Deletion */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
            <Lock className="h-4 w-4 text-[#00F0FF]" />
            <h2>10. Data Retention & Account Deletion</h2>
          </div>
          <p>
            We retain your personal data for as long as your account remains active. You maintain complete control over your data lifecycle:
          </p>
          <p>
            You can permanently purge your account and all associated submissions, streak records, notification histories, and friendships at any time by navigating to <strong>Account Settings &rarr; Danger Zone &rarr; Delete Account</strong> and typing &quot;DELETE&quot;. Once confirmed, your records are deleted immediately from active databases.
          </p>
        </section>

        {/* 11. Contact Us */}
        <section className="space-y-3 rounded-xl border border-[#252936] bg-[#11131A] p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
            <Mail className="h-4 w-4 text-[#00F0FF]" />
            <h2>11. Contact & Privacy Inquiries</h2>
          </div>
          <p>
            If you have questions, feedback, or legal inquiries regarding this Privacy Policy or wish to exercise your legal data rights, you can reach out to us:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#8B93A7]">
            <li>
              <strong className="text-[#F5F7FA]">By Email:</strong>{" "}
              <a href="mailto:contactphoenixfy@gmail.com" className="text-[#00F0FF] hover:underline">
                contactphoenixfy@gmail.com
              </a>
            </li>
            <li>
              <strong className="text-[#F5F7FA]">Online Feedback Page:</strong>{" "}
              <Link href="/feedback" className="text-[#00F0FF] hover:underline">
                insidcode /feedback
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
