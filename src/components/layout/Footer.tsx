"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { ArrowUpRight } from "lucide-react";

const platformLinks = [
  { href: "/problems", label: "Problems" },
  { href: "/duel", label: "Duel" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/stats", label: "Stats" },
];

const aboutLinks = [
  { href: "/about", label: "About" },
  { href: "/changelog", label: "Changelog" },
  { href: "/feedback", label: "Feedback" },
  { href: "/credits", label: "Credits" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/integrity", label: "Integrity" },
];

const creatorLinks = [
  { href: "https://namishhh.vercel.app/", label: "Portfolio", external: true },
  { href: "https://github.com/p3xz", label: "GitHub", external: true },
  { href: "https://www.linkedin.com/in/namish-yadav-639769408/", label: "LinkedIn", external: true },
  { href: "https://instagram.com/nam7sh", label: "Instagram", external: true },
];

export function Footer() {
  const pathname = usePathname();

  const isCodingPage =
    pathname.startsWith("/problems/") && pathname !== "/problems";
  if (isCodingPage) return null;

  return (
    <footer
      className="w-full pb-16 md:pb-0"
      style={{
        borderTop: "1px solid var(--border)",
        backgroundColor: "var(--bg)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Main footer grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 py-10">
          {/* Brand column (2 cols on md) */}
          <div className="space-y-3 sm:col-span-2">
            <Link href="/" className="inline-block transition-opacity hover:opacity-85">
              <Logo size="md" />
            </Link>
            <p className="text-[12px] leading-relaxed max-w-xs" style={{ color: "var(--fg-muted)" }}>
              A focused programming platform for mastering algorithmic logic,
              recursion, arrays, and problem solving before DSA.
            </p>
          </div>

          {/* Platform column */}
          <div>
            <p className="section-label mb-3">Platform</p>
            <div className="flex flex-col gap-2">
              {platformLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[12px] transition-colors w-fit"
                  style={{ color: "var(--fg-muted)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-muted)")}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* About column */}
          <div>
            <p className="section-label mb-3">About</p>
            <div className="flex flex-col gap-2">
              {aboutLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[12px] transition-colors w-fit"
                  style={{ color: "var(--fg-muted)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-muted)")}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Creator column */}
          <div>
            <p className="section-label mb-3">Creator</p>
            <div className="flex flex-col gap-2">
              {creatorLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-[12px] transition-colors w-fit"
                  style={{ color: "var(--fg-muted)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-muted)")}
                >
                  <span>{link.label}</span>
                  <ArrowUpRight className="h-3 w-3" style={{ color: "var(--fg-dimmed)" }} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 py-5 text-[11px]"
          style={{ borderTop: "1px solid var(--border)", color: "var(--fg-dimmed)" }}
        >
          <span>© 2026 insidcode. Developed by Namish Yadav (@p3xz).</span>
          <span className="mono">Built for disciplined logic growth.</span>
        </div>
      </div>
    </footer>
  );
}
