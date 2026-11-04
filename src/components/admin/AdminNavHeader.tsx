"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  MessageSquare,
  Activity,
  FileText,
  Code2,
  ArrowUpRight,
  Shield,
} from "lucide-react";

interface AdminNavHeaderProps {
  adminUsername: string;
}

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/appeals", label: "Appeals", icon: ShieldAlert },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/admin/activity", label: "Activity", icon: Activity },
  { href: "/admin/audit", label: "Audit Logs", icon: FileText },
  { href: "/admin/problems", label: "Questions", icon: Code2 },
];

export function AdminNavHeader({ adminUsername }: AdminNavHeaderProps) {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-40 w-full"
      style={{
        borderBottom: "1px solid var(--border)",
        backgroundColor: "color-mix(in srgb, var(--bg) 92%, transparent)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Top brand line */}
        <div className="flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2 font-bold tracking-tight text-[15px]">
              <div
                className="flex h-7 w-7 items-center justify-center rounded"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
                  color: "var(--accent)",
                  border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
                }}
              >
                <Shield className="h-4 w-4" />
              </div>
              <span style={{ color: "var(--fg)" }}>InsidCode</span>
              <span
                className="mono text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  color: "var(--accent)",
                  border: "1px solid var(--border)",
                }}
              >
                Admin
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] mono font-medium"
              style={{
                backgroundColor: "var(--bg-subtle)",
                color: "var(--fg-muted)",
                border: "1px solid var(--border)",
              }}
            >
              <span>Logged in as:</span>
              <span className="font-semibold" style={{ color: "var(--fg)" }}>
                @{adminUsername}
              </span>
            </div>

            <Link
              href="/"
              className="flex items-center gap-1 text-[12px] font-medium transition-colors px-2.5 py-1 rounded"
              style={{
                color: "var(--fg-muted)",
                border: "1px solid var(--border)",
                backgroundColor: "var(--bg-subtle)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--fg)";
                e.currentTarget.style.borderColor = "var(--border-strong)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--fg-muted)";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              <span>Exit to App</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Tab navigation strip */}
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1.5 -mb-px">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium shrink-0 transition-all"
                style={{
                  backgroundColor: isActive
                    ? "color-mix(in srgb, var(--accent) 12%, transparent)"
                    : "transparent",
                  color: isActive ? "var(--accent)" : "var(--fg-muted)",
                  border: isActive
                    ? "1px solid color-mix(in srgb, var(--accent) 30%, transparent)"
                    : "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "var(--bg-subtle)";
                    e.currentTarget.style.color = "var(--fg)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "var(--fg-muted)";
                  }
                }}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
