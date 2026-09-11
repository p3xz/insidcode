"use client";

import React from "react";
import { Globe, Linkedin, Github, Instagram, ArrowUpRight } from "lucide-react";

interface SocialLinkItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  handle: string;
  delay?: string;
}

const CREATOR_LINKS: SocialLinkItem[] = [
  {
    name: "Portfolio",
    href: "https://namishhh.vercel.app/",
    icon: <Globe className="h-4 w-4" />,
    handle: "namishhh.vercel.app",
    delay: "0ms",
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/namish-yadav-639769408/",
    icon: <Linkedin className="h-4 w-4" />,
    handle: "namish-yadav",
    delay: "50ms",
  },
  {
    name: "GitHub",
    href: "https://github.com/p3xz",
    icon: <Github className="h-4 w-4" />,
    handle: "p3xz",
    delay: "100ms",
  },
  {
    name: "Instagram",
    href: "https://instagram.com/nam7sh",
    icon: <Instagram className="h-4 w-4" />,
    handle: "@nam7sh",
    delay: "150ms",
  },
];

interface SocialBoxProps {
  item: SocialLinkItem;
}

function SocialBox({ item }: SocialBoxProps) {
  return (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${item.name}: ${item.handle}`}
      className="group relative flex items-center justify-between p-3.5 transition-all text-left"
      style={{
        border: "1.5px solid var(--border-strong)",
        borderRadius: "3px",
        backgroundColor: "var(--bg-surface)",
        boxShadow: "2px 2px 0 0 var(--border)",
        transitionDelay: item.delay,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translate(-1px, -1px)";
        e.currentTarget.style.boxShadow = "3px 3px 0 0 var(--border-strong)";
        e.currentTarget.style.borderColor = "var(--fg-muted)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translate(0, 0)";
        e.currentTarget.style.boxShadow = "2px 2px 0 0 var(--border)";
        e.currentTarget.style.borderColor = "var(--border-strong)";
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className="flex h-8 w-8 items-center justify-center shrink-0 transition-colors"
          style={{
            borderRadius: "3px",
            backgroundColor: "var(--bg-subtle)",
            border: "1px solid var(--border)",
            color: "var(--fg)",
          }}
        >
          {item.icon}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold tracking-tight" style={{ color: "var(--fg)" }}>
              {item.name}
            </span>
          </div>
          <span className="mono text-[11px] truncate block" style={{ color: "var(--fg-dimmed)" }}>
            {item.handle}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 pl-2 shrink-0">
        <span
          className="text-[12px] font-medium transition-colors hidden sm:inline"
          style={{ color: "var(--fg-muted)" }}
        >
          Visit
        </span>
        <ArrowUpRight
          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          style={{ color: "var(--fg-dimmed)" }}
        />
      </div>
    </a>
  );
}

export function CreatorSocialCard() {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-baseline justify-between">
        <p className="section-label">Connect & Verification</p>
        <span className="mono text-[11px]" style={{ color: "var(--fg-dimmed)" }}>
          @p3xz
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CREATOR_LINKS.map((link) => (
          <SocialBox key={link.name} item={link} />
        ))}
      </div>
    </div>
  );
}
