"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Code2, Trophy, BarChart3, User as UserIcon } from "lucide-react";
import { useSession } from "next-auth/react";

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isCodingPage =
    pathname.startsWith("/problems/") && pathname !== "/problems";
  if (isCodingPage) return null;

  const items = [
    { href: "/problems", label: "Problems", icon: Code2 },
    { href: "/leaderboard", label: "Rank", icon: Trophy },
    { href: "/stats", label: "Stats", icon: BarChart3 },
    {
      href: session?.user ? `/profile/${session.user.username}` : "/login",
      label: session?.user ? "Profile" : "Sign In",
      icon: UserIcon,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 block md:hidden"
      style={{
        borderTop: "1px solid var(--border)",
        backgroundColor: "var(--bg)",
      }}
    >
      <div className="flex h-14 items-center justify-around px-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href === "/problems" &&
              pathname.startsWith("/problems"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 w-full py-2 text-[10px] font-medium transition-colors"
              style={{ color: isActive ? "var(--accent)" : "var(--fg-muted)" }}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
              {/* Active indicator */}
              {isActive && (
                <span
                  className="absolute top-0 h-px"
                  style={{
                    width: "24px",
                    backgroundColor: "var(--accent)",
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
