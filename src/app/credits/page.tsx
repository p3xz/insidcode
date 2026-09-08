import React from "react";
import Link from "next/link";
import { ArrowLeft, Code, Database, Server, Cpu, Shield, Sparkles } from "lucide-react";

export default function CreditsPage() {
  const techStack = [
    {
      name: "Next.js",
      role: "Full-stack React framework powering App Router, SSR, and API endpoints.",
      license: "MIT License",
      url: "https://nextjs.org",
      icon: Server,
    },
    {
      name: "Monaco Editor",
      role: "Browser-based code editor engine powering the interactive coding workspace.",
      license: "MIT License",
      url: "https://microsoft.github.io/monaco-editor",
      icon: Code,
    },
    {
      name: "MongoDB & Mongoose",
      role: "Document database storage for users, questions, test suites, and streaks.",
      license: "SSPL / Apache 2.0",
      url: "https://mongoosejs.com",
      icon: Database,
    },
    {
      name: "Auth.js / NextAuth",
      role: "Secure passwordless authentication with Google and GitHub OAuth providers.",
      license: "ISC License",
      url: "https://authjs.dev",
      icon: Shield,
    },
    {
      name: "Piston API",
      role: "High-performance isolated code execution engine for C, C++, Java, Python, and JavaScript.",
      license: "MIT License",
      url: "https://github.com/engineer-man/piston",
      icon: Cpu,
    },
    {
      name: "Tailwind CSS & Lucide",
      role: "Utility-first design styling and clean geometric vector iconography.",
      license: "MIT License",
      url: "https://tailwindcss.com",
      icon: Sparkles,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8B93A7] hover:text-[#00F0FF] transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Home
      </Link>

      <div className="border-b border-[#252936] pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#F5F7FA]">Credits & Open Source Acknowledgements</h1>
        <p className="text-xs text-[#8B93A7] mt-1">
          insidcode is built on robust open-source technologies and developer tooling.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {techStack.map((tech) => {
          const Icon = tech.icon;
          return (
            <div
              key={tech.name}
              className="rounded-xl border border-[#252936] bg-[#11131A] p-5 space-y-2 hover:border-[#363C4E] transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-[#00F0FF]" />
                  <h3 className="text-sm font-bold text-[#F5F7FA]">{tech.name}</h3>
                </div>
                <span className="font-mono text-[10px] text-[#5E667B]">{tech.license}</span>
              </div>
              <p className="text-xs text-[#8B93A7] leading-relaxed">{tech.role}</p>
              <a
                href={tech.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-[11px] font-mono text-[#00F0FF] hover:underline pt-1"
              >
                {tech.url} &rarr;
              </a>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-[#252936] bg-[#11131A] p-6 space-y-2">
        <h3 className="text-sm font-bold text-[#F5F7FA]">Curriculum & Author</h3>
        <p className="text-xs text-[#8B93A7] leading-relaxed">
          The &quot;Master Your Logic Building (Before Starting DSA)&quot; curriculum is organized into six progressive phases to build problem-solving intuition. Platform created for private developer growth.
        </p>
      </div>
    </div>
  );
}
