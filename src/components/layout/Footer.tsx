"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  const pathname = usePathname();

  // Hide footer on full-screen problem code workspace
  const isCodingPage = pathname.startsWith("/problems/") && pathname !== "/problems";
  if (isCodingPage) return null;

  return (
    <footer className="w-full border-t border-[#252936] bg-[#090A0F] py-10 pb-20 md:pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Logo & Slogan */}
          <div className="flex flex-col gap-2">
            <Link href="/" className="inline-block">
              <Logo size="md" />
            </Link>
            <p className="text-xs text-[#8B93A7] max-w-sm">
              A private, focused programming practice platform for mastering algorithmic logic, recursion, arrays, and problem solving.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-[#8B93A7]">
            <Link href="/problems" className="hover:text-[#F5F7FA] transition">
              Problems
            </Link>
            <Link href="/leaderboard" className="hover:text-[#F5F7FA] transition">
              Leaderboard
            </Link>
            <Link href="/stats" className="hover:text-[#F5F7FA] transition">
              Stats
            </Link>
            <Link href="/credits" className="hover:text-[#F5F7FA] transition">
              Credits
            </Link>
            <Link href="/privacy" className="hover:text-[#F5F7FA] transition">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#F5F7FA] transition">
              Terms
            </Link>
            <Link href="/integrity" className="hover:text-[#F5F7FA] transition">
              Integrity
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#252936] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#5E667B]">
          <p>© 2026 insidcode. All rights reserved.</p>
          <p className="font-mono text-[11px]">Designed for serious developer logic growth.</p>
        </div>
      </div>
    </footer>
  );
}
