import React from "react";
import Link from "next/link";
import {
  Code2,
  Terminal,
  Play,
  Send,
  Zap,
  CheckCircle2,
  ArrowRight,
  Layers,
} from "lucide-react";
import { CURRICULUM_PHASES } from "@/lib/constants";

export default function LandingPage() {
  const steps = [
    {
      num: "01",
      title: "Structured Phases",
      desc: "Progress through six sequential logic-building phases from conditionals to recursion and arrays.",
      icon: Layers,
    },
    {
      num: "02",
      title: "Monaco Workspace",
      desc: "Write clean solutions with full syntax highlighting in Python, JavaScript, C, C++, or Java.",
      icon: Code2,
    },
    {
      num: "03",
      title: "Isolated Execution",
      desc: "Run code against custom inputs using the Piston sandbox with strict execution timeouts.",
      icon: Play,
    },
    {
      num: "04",
      title: "Server Hidden Tests",
      desc: "Submissions are evaluated against server-side test suites without exposing test vectors.",
      icon: Send,
    },
    {
      num: "05",
      title: "XP & Streaks",
      desc: "Earn first-solve XP, maintain daily practice streaks, and track your activity history.",
      icon: Zap,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#090A0F] text-[#F5F7FA]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-20 border-b border-[#252936]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center space-y-5">
            <div className="inline-flex items-center gap-2 rounded-md border border-[#252936] bg-[#11131A] px-3 py-1 text-xs font-mono text-[#00F0FF]">
              <Terminal className="h-3.5 w-3.5" />
              <span>Logic Building & Code Practice</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F5F7FA] leading-tight">
              Master Programming Logic{" "}
              <span className="text-[#00F0FF]">Before DSA</span>
            </h1>

            <p className="text-xs sm:text-sm text-[#8B93A7] leading-relaxed max-w-2xl mx-auto">
              A private, focused coding practice platform. Solve structured challenges across six foundational phases with isolated execution, automated hidden test evaluation, and social rankings.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/problems"
                className="flex items-center gap-2 rounded-lg bg-[#00F0FF] px-5 py-2.5 text-xs font-bold text-[#090A0F] hover:bg-[#00F0FF]/90 transition shadow-md"
              >
                Browse Problems
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/leaderboard"
                className="rounded-lg border border-[#252936] bg-[#11131A] px-5 py-2.5 text-xs font-semibold text-[#F5F7FA] hover:border-[#363C4E] hover:bg-[#181B24] transition"
              >
                View Leaderboard
              </Link>
            </div>
          </div>

          {/* Interactive Workspace Preview */}
          <div className="mt-12 mx-auto max-w-4xl rounded-xl border border-[#252936] bg-[#11131A] shadow-2xl overflow-hidden font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#252936] bg-[#181B24] px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-[#FF4D6D]/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#39FF14]/80" />
                <span className="ml-2 text-[11px] text-[#8B93A7]">problem_001.py</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#39FF14]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Accepted (4/4 Hidden Tests)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 p-4 gap-4 bg-[#090A0F]">
              <div className="md:col-span-5 border-b md:border-b-0 md:border-r border-[#252936] pb-4 md:pb-0 md:pr-4 space-y-2.5 font-sans">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[#181B24] px-2 py-0.5 text-[10px] font-bold text-[#8B93A7]">#001</span>
                  <span className="rounded bg-[#39FF14]/10 text-[#39FF14] px-2 py-0.5 text-[10px] font-semibold border border-[#39FF14]/20">Easy</span>
                  <span className="text-[10px] text-[#8B93A7]">Phase 1</span>
                </div>
                <h3 className="font-bold text-[#F5F7FA] text-xs">Positive, Negative, or Zero</h3>
                <p className="text-xs text-[#8B93A7] leading-relaxed">
                  Given an integer input from standard in, print whether the number is Positive, Negative, or Zero.
                </p>
                <div className="rounded bg-[#11131A] p-2 border border-[#252936] font-mono text-[11px]">
                  <span className="text-[#8B93A7]">Input: </span>
                  <span className="text-[#F5F7FA]">5</span>
                  <br />
                  <span className="text-[#8B93A7]">Output: </span>
                  <span className="text-[#39FF14]">Positive</span>
                </div>
              </div>

              <div className="md:col-span-7 space-y-1.5">
                <div className="text-[#5E667B]"># Python 3 Solution</div>
                <div className="text-[#F5F7FA]">
                  <span className="text-[#00F0FF]">import</span> sys
                </div>
                <div className="text-[#F5F7FA]">
                  <span className="text-[#00F0FF]">def</span> <span className="text-[#F59E0B]">solve</span>():
                </div>
                <div className="text-[#F5F7FA] pl-4">
                  n = <span className="text-[#00F0FF]">int</span>(sys.stdin.read().strip())
                </div>
                <div className="text-[#F5F7FA] pl-4">
                  <span className="text-[#00F0FF]">if</span> n &gt; 0: <span className="text-[#00F0FF]">print</span>(<span className="text-[#39FF14]">&quot;Positive&quot;</span>)
                </div>
                <div className="text-[#F5F7FA] pl-4">
                  <span className="text-[#00F0FF]">elif</span> n &lt; 0: <span className="text-[#00F0FF]">print</span>(<span className="text-[#39FF14]">&quot;Negative&quot;</span>)
                </div>
                <div className="text-[#F5F7FA] pl-4">
                  <span className="text-[#00F0FF]">else</span>: <span className="text-[#00F0FF]">print</span>(<span className="text-[#39FF14]">&quot;Zero&quot;</span>)
                </div>
                <div className="text-[#F5F7FA]">
                  solve()
                </div>

                <div className="mt-3 rounded-lg border border-[#39FF14]/30 bg-[#39FF14]/10 p-2 flex items-center justify-between text-[#39FF14] font-sans text-xs">
                  <span>Execution Runtime: 0.042s</span>
                  <span className="font-bold text-[#00F0FF]">+10 XP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Core Architecture Workflow */}
      <section className="py-16 border-b border-[#252936] bg-[#090A0F]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F7FA]">
              Platform Workflow
            </h2>
            <p className="mt-1 text-xs text-[#8B93A7]">
              Engineered for developer clarity and accurate logic verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="rounded-xl border border-[#252936] bg-[#11131A] p-4 space-y-2.5 hover:border-[#363C4E] transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#00F0FF]">{step.num}</span>
                    <Icon className="h-4 w-4 text-[#8B93A7]" />
                  </div>
                  <h3 className="text-xs font-bold text-[#F5F7FA]">{step.title}</h3>
                  <p className="text-xs text-[#8B93A7] leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Curriculum Phases Overview */}
      <section className="py-16 bg-[#090A0F]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F7FA]">
              Six-Phase Curriculum
            </h2>
            <p className="mt-1 text-xs text-[#8B93A7]">
              Step-by-step logic progression before advanced data structures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CURRICULUM_PHASES.map((p) => (
              <Link
                key={p.id}
                href={`/problems?phase=${p.id}`}
                className="rounded-xl border border-[#252936] bg-[#11131A] p-4 space-y-2 hover:border-[#00F0FF]/50 transition block"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-[#00F0FF]">
                    Phase {p.id}
                  </span>
                  <span className="text-[10px] text-[#5E667B]">View Problems &rarr;</span>
                </div>
                <h3 className="text-xs font-bold text-[#F5F7FA]">{p.title}</h3>
                <p className="text-xs text-[#8B93A7] leading-relaxed">{p.description}</p>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/problems"
              className="inline-flex items-center gap-2 rounded-lg bg-[#00F0FF] px-5 py-2.5 text-xs font-bold text-[#090A0F] hover:bg-[#00F0FF]/90 transition"
            >
              Open Problems Directory
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
