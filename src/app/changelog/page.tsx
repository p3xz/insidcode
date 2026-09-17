"use client";

import React from "react";
import Link from "next/link";
import { CHANGELOG_RELEASES, ChangelogRelease } from "@/lib/changelogData";
import {
  PlusCircle,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  MinusCircle,
  Database,
  ArrowLeft,
} from "lucide-react";

export default function ChangelogPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-12">
      {/* Header */}
      <div className="pb-8 space-y-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-[12px] hover:underline inline-flex items-center gap-1.5 transition-colors"
            style={{ color: "var(--fg-muted)" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Home</span>
          </Link>
          <span style={{ color: "var(--border-strong)" }}>/</span>
          <span className="section-label">Release History</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>
            Patch Notes & Changelog
          </h1>
          <span className="mono text-[12px]" style={{ color: "var(--fg-dimmed)" }}>
            Current: <span className="font-semibold" style={{ color: "var(--accent)" }}>{CHANGELOG_RELEASES[0]?.version}</span>
          </span>
        </div>

        <p className="text-[13px] leading-relaxed max-w-2xl" style={{ color: "var(--fg-muted)" }}>
          Official release history and technical changelog for the InsidCode platform. Documenting new features, performance updates, bug fixes, and security hardenings.
        </p>
      </div>

      {/* Releases Timeline */}
      <div className="space-y-12">
        {CHANGELOG_RELEASES.map((release, index) => (
          <ReleaseSection
            key={release.version}
            release={release}
            isLatest={index === 0}
          />
        ))}
      </div>
    </div>
  );
}

function ReleaseSection({
  release,
  isLatest,
}: {
  release: ChangelogRelease;
  isLatest: boolean;
}) {
  return (
    <article
      className="p-6 sm:p-8 space-y-6 relative transition-all"
      style={{
        border: "1px solid var(--border)",
        backgroundColor: isLatest ? "var(--bg-subtle)" : "var(--bg)",
        borderRadius: "6px",
      }}
    >
      {/* Version Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <span
            className="mono text-xl sm:text-2xl font-bold tracking-tight"
            style={{ color: "var(--fg)" }}
          >
            {release.version}
          </span>

          {release.tag && (
            <span
              className="mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-semibold"
              style={{
                backgroundColor:
                  release.tag === "Latest"
                    ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                    : release.tag === "Major"
                    ? "color-mix(in srgb, var(--danger) 15%, transparent)"
                    : "var(--bg-subtle)",
                color:
                  release.tag === "Latest"
                    ? "var(--accent)"
                    : release.tag === "Major"
                    ? "var(--danger)"
                    : "var(--fg-muted)",
                border: `1px solid ${
                  release.tag === "Latest"
                    ? "color-mix(in srgb, var(--accent) 30%, transparent)"
                    : "var(--border)"
                }`,
              }}
            >
              {release.tag}
            </span>
          )}
        </div>

        <span className="mono text-[12px]" style={{ color: "var(--fg-dimmed)" }}>
          {release.releaseDate}
        </span>
      </div>

      {/* Title & Summary */}
      <div className="space-y-1.5">
        <h2 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: "var(--fg)" }}>
          {release.title}
        </h2>
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--fg-muted)" }}>
          {release.summary}
        </p
      ></div>

      {/* Categorized Lists */}
      <div className="space-y-5 pt-2">
        {/* ADDED */}
        {release.added && release.added.length > 0 && (
          <CategoryBlock
            label="Added"
            icon={PlusCircle}
            items={release.added}
            color="var(--success)"
            prefix="+"
          />
        )}

        {/* CHANGED */}
        {release.changed && release.changed.length > 0 && (
          <CategoryBlock
            label="Changed"
            icon={RefreshCw}
            items={release.changed}
            color="var(--accent)"
            prefix="~"
          />
        )}

        {/* FIXED */}
        {release.fixed && release.fixed.length > 0 && (
          <CategoryBlock
            label="Fixed"
            icon={CheckCircle2}
            items={release.fixed}
            color="#f59e0b"
            prefix="•"
          />
        )}

        {/* SECURITY */}
        {release.security && release.security.length > 0 && (
          <CategoryBlock
            label="Security & Reliability"
            icon={ShieldCheck}
            items={release.security}
            color="var(--danger)"
            prefix="🔒"
          />
        )}

        {/* DATABASE */}
        {release.database && release.database.length > 0 && (
          <CategoryBlock
            label="Database & Schema"
            icon={Database}
            items={release.database}
            color="#8b5cf6"
            prefix="⛁"
          />
        )}

        {/* REMOVED */}
        {release.removed && release.removed.length > 0 && (
          <CategoryBlock
            label="Removed"
            icon={MinusCircle}
            items={release.removed}
            color="var(--fg-dimmed)"
            prefix="-"
          />
        )}
      </div>
    </article>
  );
}

function CategoryBlock({
  label,
  icon: Icon,
  items,
  color,
  prefix,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  items: string[];
  color: string;
  prefix: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" style={{ color }} />
        <span
          className="mono text-[11px] uppercase tracking-wider font-bold"
          style={{ color }}
        >
          {label}
        </span>
      </div>

      <ul className="space-y-1.5 pl-1">
        {items.map((item, idx) => (
          <li
            key={idx}
            className="text-[12px] leading-relaxed flex items-start gap-2"
            style={{ color: "var(--fg)" }}
          >
            <span className="mono text-[11px] font-bold select-none shrink-0" style={{ color }}>
              {prefix}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}