"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Code2, Trophy, BarChart3, Users, User as UserIcon } from "lucide-react";
import { useSession } from "next-auth/react";

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Hide bottom bar on the dedicated code editing workspace to preserve screen real estate
  const isCodingPage = pathname.startsWith("/problems/") && pathname !== "/problems";
  if (isCodingPage) return null;

  const items = [
    { href: "/problems", label: "Problems", icon: Code2 },
    { href: "/leaderboard", label: "Rank", icon: Trophy },
    { href: "/friends", label: "Friends", icon: Users },
    { href: "/stats", label: "Stats", icon: BarChart3 },
    {
      href: session?.user ? `/profile/${session.user.username}` : "/login",
      label: session?.user ? "Profile" : "Sign In",
      icon: UserIcon,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 block md:hidden border-t border-[#252936] bg-[#090A0F]/95 backdrop-blur-lg">
      <div className="flex h-14 items-center justify-around px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href === "/problems" && pathname.startsWith("/problems"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 w-full py-1 text-[11px] font-medium transition ${
                isActive ? "text-[#00F0FF]" : "text-[#8B93A7] hover:text-[#F5F7FA]"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
