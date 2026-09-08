import React from "react";
import Link from "next/link";
import { ArrowLeft, FileText, AlertTriangle, ShieldCheck, Scale, Lock, Ban, Mail } from "lucide-react";

export default function TermsPage() {
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
          <FileText className="h-6 w-6 text-[#00F0FF]" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F7FA]">
            insidcode Terms and Conditions
          </h1>
        </div>
        <p className="text-xs text-[#8B93A7]">
          Last Updated & Effective Date: September 2026
        </p>
      </div>

      <div className="space-y-8 text-xs text-[#8B93A7] leading-relaxed font-sans">
        {/* Welcome */}
        <section className="space-y-3">
          <p className="text-sm text-[#F5F7FA] font-medium leading-normal">
            Welcome to <strong>insidcode</strong>!
          </p>
          <p>
            These terms and conditions outline the rules and regulations for the use of insidcode (&quot;the Platform&quot;, &quot;Company&quot;, &quot;We&quot;, &quot;Our&quot;, or &quot;Us&quot;). By accessing or using this website, we assume you accept these terms and conditions in full. <strong>Do not continue to use insidcode if you do not agree to take all of the terms and conditions stated on this page.</strong>
          </p>
          <p>
            The following terminology applies to these Terms and Conditions, Privacy Statement, and Disclaimer Notice and all Agreements: &quot;Client&quot;, &quot;You&quot;, and &quot;Your&quot; refers to you, the person logged on to this website and compliant with the Company&apos;s terms and conditions. Any use of the above terminology or other words in the singular, plural, capitalization, and/or he/she or they, are taken as interchangeable and therefore as referring to the same.
          </p>
        </section>

        {/* 1. Description of Service */}
        <section className="space-y-3 rounded-xl border border-[#252936] bg-[#11131A] p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
            <ShieldCheck className="h-4 w-4 text-[#00F0FF]" />
            <h2>1. Description of Service</h2>
          </div>
          <p>
            insidcode provides an interactive, web-based coding environment for learning, developing, and mastering algorithmic logic, problem-solving, recursion, and patterns. We provide sandboxed code execution environments, automated problem evaluation against hidden test suites, practice streaks, and user progress tracking.
          </p>
        </section>

        {/* 2. Acceptable Use & Code Runner Rules */}
        <section className="space-y-3 rounded-xl border border-[#252936] bg-[#11131A] p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
            <Lock className="h-4 w-4 text-[#00F0FF]" />
            <h2>2. Acceptable Use & Code Runner Rules</h2>
          </div>
          <p>
            You agree to use the Platform strictly for educational and self-assessment purposes. You are strictly prohibited from:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#8B93A7]">
            <li>Submitting malicious code designed to breach, exploit, crash, or escape the execution sandbox.</li>
            <li>Initiating Denial of Service (DoS) attacks, brute-force requests, or excessive API calls.</li>
            <li>Attempting to scrape or extract hidden test cases, solution keys, or user data.</li>
            <li>Using automated bots, scripts, or scrapers to auto-submit solutions or manipulate leaderboards.</li>
            <li>Attempting to access unauthorized administrative routes or internal backend infrastructure.</li>
          </ul>
          <p className="text-[11px] text-[#FF4D6D] font-semibold border-t border-[#252936] pt-2">
            * Violation of any of these rules will result in an immediate and permanent account ban, IP block, and potential legal inquiry.
          </p>
        </section>

        {/* 3. Account Suspension & Anti-AI Manipulation Warning */}
        <section className="space-y-3 rounded-xl border border-[#FF4D6D]/30 bg-[#FF4D6D]/5 p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#FF4D6D]">
            <Ban className="h-4 w-4 text-[#FF4D6D]" />
            <h2>3. Account Termination, Immediate Bans & Anti-AI Manipulation Policy</h2>
          </div>
          <p className="text-[#F5F7FA] font-medium">
            <strong>Right to Ban at Any Time:</strong> We reserve the absolute right to suspend or terminate your access to the Platform at any time, with or without prior notice, for conduct that violates these Terms or harms other users or the platform&apos;s integrity.
          </p>
          <p>
            <strong>Warning on AI Usage & Stats Manipulation:</strong> We strongly advise you <strong>not to use AI tools, automated solvers, or scripts to manipulate your statistics, solve problems artificially, or game leaderboard rankings</strong>. If AI manipulation or fraudulent activity is suspected or detected:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#FF4D6D]/90">
            <li>We may immediately reset your XP to 0.</li>
            <li>We may wipe your practice streak and leaderboard rankings.</li>
            <li>We may indefinitely suspend or permanently ban your account until you prove you are genuine.</li>
          </ul>
        </section>

        {/* 4. Intellectual Property */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
            <Scale className="h-4 w-4 text-[#00F0FF]" />
            <h2>4. Intellectual Property & License</h2>
          </div>
          <p>
            <strong>Your Code:</strong> You retain full ownership of the original code solutions you write and submit to the Platform. By submitting code, you grant insidcode a non-exclusive license to run, test, and evaluate your code for test cases.
          </p>
          <p>
            <strong>Platform Assets:</strong> Unless otherwise stated, insidcode and/or its licensors own the intellectual property rights for all material on insidcode. All problem statements, custom curriculum structures, site branding, UI design elements, and source code are the exclusive property of insidcode. All intellectual property rights are reserved.
          </p>
          <p>You must not:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#8B93A7]">
            <li>Republish material from insidcode without explicit written permission.</li>
            <li>Sell, rent, or sub-license material or problems from insidcode.</li>
            <li>Reproduce, duplicate, or copy proprietary curriculum material from insidcode.</li>
            <li>Redistribute content from insidcode for commercial purposes.</li>
          </ul>
        </section>

        {/* 5. User Comments & Feedback */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
            <FileText className="h-4 w-4 text-[#00F0FF]" />
            <h2>5. User Comments, Feedback & Submissions</h2>
          </div>
          <p>
            Parts of this website offer an opportunity for users to post feedback, problem suggestions, and exchange information. insidcode does not filter, edit, publish, or review comments prior to their presence on the website. Comments do not reflect the views and opinions of insidcode, its agents, or affiliates, but rather the person posting them.
          </p>
          <p>
            insidcode reserves the right to monitor all feedback, submissions, and comments and to remove any material considered inappropriate, offensive, or in breach of these Terms.
          </p>
          <p>You warrant and represent that:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#8B93A7]">
            <li>You are entitled to post comments and have all necessary licenses and consents to do so.</li>
            <li>Your content does not invade any intellectual property rights of any third party.</li>
            <li>Your content contains no defamatory, libelous, offensive, or unlawful material.</li>
            <li>Your content will not be used to solicit or promote commercial activity or unlawful acts.</li>
          </ul>
          <p>
            You hereby grant insidcode a non-exclusive license to use, reproduce, edit, and authorize others to use and reproduce your feedback or suggested questions in any and all forms.
          </p>
        </section>

        {/* 6. Cookies */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
            <ShieldCheck className="h-4 w-4 text-[#00F0FF]" />
            <h2>6. Cookies & Session Tokens</h2>
          </div>
          <p>
            We employ the use of secure, HTTP-only authentication session cookies. By accessing insidcode, you agreed to use cookies in agreement with our Privacy Policy. Cookies are used by our website to maintain your logged-in session, remember editor language preferences, and ensure responsive platform navigation.
          </p>
        </section>

        {/* 7. Hyperlinking to our Content */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
            <Scale className="h-4 w-4 text-[#00F0FF]" />
            <h2>7. Hyperlinking to Our Content</h2>
          </div>
          <p>
            Government agencies, search engines, educational institutions, coding clubs, and news organizations may link to our home page or problem directory without prior written approval, provided the link is not deceptive, does not falsely imply sponsorship or endorsement, and fits within the context of the linking party&apos;s site.
          </p>
          <p>
            No use of insidcode&apos;s logo or artwork will be allowed for linking absent a trademark license agreement.
          </p>
        </section>

        {/* 8. iFrames */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
            <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
            <h2>8. iFrames</h2>
          </div>
          <p>
            Without prior approval and written permission, you may not create frames around our webpages that alter in any way the visual presentation or appearance of our Website.
          </p>
        </section>

        {/* 9. Content Liability & Reservation of Rights */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
            <Scale className="h-4 w-4 text-[#00F0FF]" />
            <h2>9. Content Liability & Reservation of Rights</h2>
          </div>
          <p>
            We shall not be held responsible for any content that appears on external websites linking to us. You agree to protect and defend us against all claims arising from your external links.
          </p>
          <p>
            We reserve the right to request that you remove all links or any particular link to our Website at any time. We also reserve the right to amend these terms and conditions and its linking policy at any time.
          </p>
        </section>

        {/* 10. Service Availability & Disclaimers */}
        <section className="space-y-3 rounded-xl border border-[#252936] bg-[#11131A] p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
            <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
            <h2>10. Disclaimer & Limitation of Liability</h2>
          </div>
          <p>
            The Platform is provided on an <strong>&quot;AS IS&quot;</strong> and <strong>&quot;AS AVAILABLE&quot;</strong> basis without warranties of any kind. We do not guarantee uninterrupted uptime, immediate execution speeds, or permanent storage of unsubmitted code drafts.
          </p>
          <p>
            To the maximum extent permitted by applicable law, we exclude all representations, warranties, and conditions relating to our website and the use of this website. Nothing in this disclaimer will:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#8B93A7]">
            <li>Limit or exclude our or your liability for death or personal injury;</li>
            <li>Limit or exclude our or your liability for fraud or fraudulent misrepresentation;</li>
            <li>Limit any of our or your liabilities in any way that is not permitted under applicable law; or</li>
            <li>Exclude any of our or your liabilities that may not be excluded under applicable law.</li>
          </ul>
          <p className="text-[#F5F7FA] font-medium border-t border-[#252936] pt-3">
            <strong>Free of Charge Provision:</strong> As long as the website and the information and services on the website are provided free of charge, we will not be liable for any loss or damage of any nature.
          </p>
        </section>

        {/* 11. Contact Us */}
        <section className="space-y-3 rounded-xl border border-[#252936] bg-[#11131A] p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
            <Mail className="h-4 w-4 text-[#00F0FF]" />
            <h2>11. Contact Us</h2>
          </div>
          <p>
            If you have any questions or concerns regarding these Terms and Conditions, please contact us:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#8B93A7]">
            <li>
              <strong className="text-[#F5F7FA]">By Email:</strong>{" "}
              <a href="mailto:contactphoenixfy@gmail.com" className="text-[#00F0FF] hover:underline">
                contactphoenixfy@gmail.com
              </a>
            </li>
            <li>
              <strong className="text-[#F5F7FA]">Online Feedback:</strong>{" "}
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
