"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { useSession, signOut } from "next-auth/react";
import {
  Flame,
  Zap,
  Bell,
  Search,
  User as UserIcon,
  Settings as SettingsIcon,
  ShieldAlert,
  LogOut,
  BookOpen,
} from "lucide-react";
import { GlobalSearchModal } from "./GlobalSearchModal";
import { NotificationDropdown } from "./NotificationDropdown";

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Global Ctrl + K search listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch unread notification count
  useEffect(() => {
    if (!session?.user) return;
    const fetchNotifCount = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch {
        // silent catch
      }
    };
    fetchNotifCount();
  }, [session?.user]);

  // Click outside avatar menu listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
        setIsAvatarMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { href: "/problems", label: "Problems" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/stats", label: "Stats" },
    { href: "/friends", label: "Friends" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#252936] bg-[#090A0F]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center transition hover:opacity-90">
              <Logo size="md" />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                      isActive
                        ? "bg-[#181B24] text-[#00F0FF]"
                        : "text-[#8B93A7] hover:bg-[#11131A] hover:text-[#F5F7FA]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Global Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search problems and users"
              className="flex items-center gap-2 rounded-md border border-[#252936] bg-[#11131A] px-2.5 py-1.5 text-xs text-[#8B93A7] hover:border-[#363C4E] hover:text-[#F5F7FA] transition"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden sm:inline-block rounded bg-[#181B24] px-1.5 py-0.5 text-[10px] font-mono text-[#5E667B]">
                Ctrl K
              </kbd>
            </button>

            {session?.user ? (
              <>
                {/* Streak Counter */}
                <div
                  title="Current practice streak"
                  className="flex items-center gap-1.5 rounded-md border border-[#252936] bg-[#11131A] px-2.5 py-1 text-xs font-mono font-medium text-[#F59E0B]"
                >
                  <Flame className="h-3.5 w-3.5" />
                  <span>{session.user.currentStreak || 0}</span>
                </div>

                {/* XP Counter */}
                <div
                  title="Total earned XP"
                  className="hidden sm:flex items-center gap-1.5 rounded-md border border-[#252936] bg-[#11131A] px-2.5 py-1 text-xs font-mono font-medium text-[#00F0FF]"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>{session.user.xp || 0} XP</span>
                </div>

                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setIsNotifOpen((prev) => !prev)}
                    aria-label="View notifications"
                    className="relative flex h-8 w-8 items-center justify-center rounded-md border border-[#252936] bg-[#11131A] text-[#8B93A7] hover:text-[#F5F7FA] transition"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#00F0FF] text-[9px] font-bold text-[#090A0F]">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>
                  {isNotifOpen && (
                    <NotificationDropdown
                      onClose={() => setIsNotifOpen(false)}
                      onReadUpdate={() => setUnreadCount(0)}
                    />
                  )}
                </div>

                {/* Avatar / Profile Dropdown */}
                <div className="relative" ref={avatarRef}>
                  <button
                    onClick={() => setIsAvatarMenuOpen((prev) => !prev)}
                    aria-label="User menu"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#252936] bg-[#181B24] text-xs font-bold text-[#00F0FF] hover:border-[#00F0FF] transition overflow-hidden"
                  >
                    {session.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={session.user.image}
                        alt={session.user.name || "User Avatar"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{session.user.username?.slice(0, 2).toUpperCase() || "U"}</span>
                    )}
                  </button>

                  {isAvatarMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 rounded-lg border border-[#252936] bg-[#11131A] py-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3.5 py-2 border-b border-[#252936]">
                        <p className="text-xs font-semibold text-[#F5F7FA] truncate">
                          {session.user.name || session.user.username}
                        </p>
                        <p className="text-[11px] font-mono text-[#8B93A7] truncate">
                          @{session.user.username}
                        </p>
                      </div>

                      <div className="py-1">
                        <Link
                          href={`/profile/${session.user.username}`}
                          onClick={() => setIsAvatarMenuOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-2 text-xs text-[#8B93A7] hover:bg-[#181B24] hover:text-[#F5F7FA] transition"
                        >
                          <UserIcon className="h-3.5 w-3.5" />
                          Profile
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setIsAvatarMenuOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-2 text-xs text-[#8B93A7] hover:bg-[#181B24] hover:text-[#F5F7FA] transition"
                        >
                          <SettingsIcon className="h-3.5 w-3.5" />
                          Settings
                        </Link>
                        <Link
                          href="/credits"
                          onClick={() => setIsAvatarMenuOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-2 text-xs text-[#8B93A7] hover:bg-[#181B24] hover:text-[#F5F7FA] transition"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          Credits
                        </Link>

                        {/* Admin Link (server confirmed role check) */}
                        {session.user.role === "admin" && (
                          <Link
                            href="/admin"
                            onClick={() => setIsAvatarMenuOpen(false)}
                            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#39FF14] hover:bg-[#181B24] transition"
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                            Admin Console
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-[#252936] pt-1">
                        <button
                          onClick={() => {
                            setIsAvatarMenuOpen(false);
                            signOut({ callbackUrl: "/" });
                          }}
                          className="flex w-full items-center gap-2 px-3.5 py-2 text-xs text-[#FF4D6D] hover:bg-[#181B24] transition"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-md bg-[#00F0FF] px-3.5 py-1.5 text-xs font-semibold text-[#090A0F] hover:bg-[#00F0FF]/90 transition"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      {isSearchOpen && <GlobalSearchModal onClose={() => setIsSearchOpen(false)} />}
    </>
  );
}
