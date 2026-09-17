import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Server, Code, Database, Shield, Sparkles, Feather, ArrowUpRight } from "lucide-react";
import { CreatorSocialCard } from "@/components/ui/CreatorSocialCard";

export const metadata: Metadata = {
  title: "Credits & Tech Stack",
  description:
    "Open-source technologies, runtime dependencies, and creators behind the InsidCode algorithmic practice platform.",
  alternates: {
    canonical: "/credits",
  },
  openGraph: {
    title: "Credits & Tech Stack | InsidCode",
    description:
      "Open-source technologies, runtime dependencies, and creators behind the InsidCode algorithmic practice platform.",
    url: "https://insidcode.vercel.app/credits",
  },
};

const TECH_STACK = [
  {
    name: "Next.js",
    role: "App Router, SSR, Server Components & Edge API routes",
    license: "MIT License",
    url: "https://nextjs.org",
    icon: Server,
  },
  {
    name: "Monaco Editor",
    role: "Browser-based code editor powering the practice workspace",
    license: "MIT License",
    url: "https://microsoft.github.io/monaco-editor",
    icon: Code,
  },
  {
    name: "MongoDB & Mongoose",
    role: "Database storage for curriculum challenges, users, and telemetry",
    license: "SSPL / Apache 2.0",
    url: "https://mongoosejs.com",
    icon: Database,
  },
  {
    name: "Auth.js",
    role: "Passwordless authentication via GitHub and Google OAuth",
    license: "ISC License",
    url: "https://authjs.dev",
    icon: Shield,
  },
  {
    name: "Tailwind CSS",
    role: "Utility-first design token system and fluid typography",
    license: "MIT License",
    url: "https://tailwindcss.com",
    icon: Sparkles,
  },
  {
    name: "Lucide",
    role: "Minimal vector iconography and system indicators",
    license: "ISC License",
    url: "https://lucide.dev",
    icon: Feather,
  },
  {
    name: "LDNOOBW Word Dataset",
    role: "Multilingual abusive content screening and username moderation dataset",
    license: "CC BY 4.0",
    url: "https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words",
    icon: Shield,
  },
];

export default function CreditsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-12" style={{ color: "var(--fg)" }}>
      {/* Top back navigation */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
        style={{ color: "var(--fg-muted)" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Home
      </Link>

      {/* ── Primary Section: Creator Attribution ───────────────────── */}
      <section className="space-y-8">
        <div className="space-y-2">
          <p className="section-label">Credits & Authorship</p>
          <h1
            className="font-bold tracking-tight leading-none"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            INSIDCODE
          </h1>
          <p className="text-[13px]" style={{ color: "var(--fg-muted)" }}>
            Created and developed by
          </p>
        </div>

        {/* Creator Identity Hero */}
        <div
          className="p-6 sm:p-8 space-y-4"
          style={{
            border: "1.5px solid var(--border-strong)",
            borderRadius: "4px",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <span className="section-label block mb-1">Lead Architect & Developer</span>
              <h2 className="text-[26px] font-bold tracking-tight" style={{ color: "var(--fg)" }}>
                NAMISH YADAV
              </h2>
              <p className="mono text-[13px] mt-0.5" style={{ color: "var(--accent)" }}>
                @p3xz
              </p>
            </div>
            <p className="text-[12px] max-w-xs leading-relaxed" style={{ color: "var(--fg-muted)" }}>
              Designed, built, and maintained as a focused logic-building platform
              to master programming foundations before DSA.
            </p>
          </div>

          {/* Quick links list */}
          <div
            className="pt-4 flex flex-wrap items-center gap-4 text-[12px] font-medium"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            {[
              { label: "Portfolio →", href: "https://namishhh.vercel.app/" },
              { label: "LinkedIn →", href: "https://www.linkedin.com/in/namish-yadav-639769408/" },
              { label: "GitHub →", href: "https://github.com/p3xz" },
              { label: "Instagram →", href: "https://instagram.com/nam7sh" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:underline"
                style={{ color: "var(--fg)" }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Interactive Creator Social Card */}
        <div className="pt-2">
          <CreatorSocialCard />
        </div>
      </section>

      {/* ── Secondary Section: Technology Attribution ──────────────── */}
      <section className="pt-8" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="mb-6 space-y-1">
          <p className="section-label">Underlying Infrastructure</p>
          <h2 className="text-[18px] font-bold tracking-tight" style={{ color: "var(--fg)" }}>
            Built with
          </h2>
          <p className="text-[12px]" style={{ color: "var(--fg-muted)" }}>
            InsidCode stands on the shoulders of robust, open-source developer tooling.
          </p>
        </div>

        {/* Structured table rows (no giant cards) */}
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "3px",
            overflow: "hidden",
          }}
        >
          {TECH_STACK.map((tech, i) => {
            const Icon = tech.icon;
            return (
              <div
                key={tech.name}
                className="grid grid-cols-12 items-center px-4 py-3.5 transition-colors group"
                style={{
                  borderBottom: i < TECH_STACK.length - 1 ? "1px solid var(--border)" : "none",
                  backgroundColor: "var(--bg)",
                }}
              >
                {/* Tech name + icon */}
                <div className="col-span-12 sm:col-span-4 flex items-center gap-2.5 mb-1 sm:mb-0">
                  <Icon className="h-4 w-4 shrink-0" style={{ color: "var(--fg-dimmed)" }} />
                  <span className="text-[13px] font-semibold" style={{ color: "var(--fg)" }}>
                    {tech.name}
                  </span>
                  <span className="mono text-[10px] sm:hidden" style={{ color: "var(--fg-dimmed)" }}>
                    · {tech.license}
                  </span>
                </div>

                {/* Role */}
                <div className="col-span-12 sm:col-span-5 text-[12px]" style={{ color: "var(--fg-muted)" }}>
                  {tech.role}
                </div>

                {/* License & External link */}
                <div className="col-span-12 sm:col-span-3 flex items-center justify-between sm:justify-end gap-3 mt-1 sm:mt-0">
                  <span className="mono text-[10px] hidden sm:inline" style={{ color: "var(--fg-dimmed)" }}>
                    {tech.license}
                  </span>
                  <a
                    href={tech.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-[11px] font-medium transition-colors hover:underline"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    <span>docs</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Curriculum & Mission Note ──────────────────────────────── */}
      <section
        className="p-5"
        style={{
          border: "1px solid var(--border)",
          borderRadius: "3px",
          backgroundColor: "var(--bg-subtle)",
        }}
      >
        <p className="section-label mb-1">Curriculum Architecture</p>
        <p className="text-[12px] leading-relaxed" style={{ color: "var(--fg-muted)" }}>
          The &quot;Master Your Logic Building (Before Starting DSA)&quot; curriculum comprises
          330+ structured problems arranged into six sequential phases.
          Created and maintained for disciplined, self-directed developer intuition.
        </p>
      </section>
    </div>
  );
}
