"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { Logo } from "@/components/ui/Logo";
import { useSession, signOut } from "next-auth/react";
import { clearUserDeviceData } from "@/lib/storage/deviceCache";
import { ThemeToggle } from "./ThemeToggle";
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
import {
  USER_PROGRESS_UPDATED_EVENT,
  ProgressUpdateEventDetail,
} from "@/hooks/useSubmissionLifecycle";
import { AnimatedNumber } from "@/components/problem/submission/AnimatedNumber";

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const handleSignOut = async (callbackUrl: string) => {
    if (session?.user?.id) {
      try {
        await clearUserDeviceData(session.user.id);
      } catch {
        // ignore storage errors on logout
      }
    }
    signOut({ callbackUrl });
  };

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const avatarRef = useRef<HTMLDivElement>(null);

  const { data: profileData } = useSWR(
    session?.user ? "/api/user/profile" : null,
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) return null;
      return res.json();
    },
    { revalidateOnFocus: true }
  );

  const currentXp = profileData?.user?.xp ?? session?.user?.xp ?? 0;
  const currentStreak = profileData?.user?.currentStreak ?? session?.user?.currentStreak ?? 0;

  const [liveXp, setLiveXp] = useState<{ from: number; value: number }>({
    from: currentXp,
    value: currentXp,
  });
  const [liveStreak, setLiveStreak] = useState<number>(currentStreak);
  const [streakPulsing, setStreakPulsing] = useState(false);

  useEffect(() => {
    setLiveXp((prev) => {
      if (currentXp !== prev.value) {
        return { from: prev.value, value: currentXp };
      }
      return prev;
    });
  }, [currentXp]);

  useEffect(() => {
    setLiveStreak(currentStreak);
  }, [currentStreak]);

  useEffect(() => {
    const handleProgressUpdate = (e: Event) => {
      const detail = (e as CustomEvent<ProgressUpdateEventDetail>).detail;
      if (!detail) return;

      if (typeof detail.totalXp === "number" && detail.totalXp > 0) {
        setLiveXp((prev) => ({
          from: prev.value,
          value: detail.totalXp,
        }));
      }
      if (typeof detail.currentStreak === "number") {
        setLiveStreak(detail.currentStreak);
      }
      if (detail.streakIncreased) {
        setStreakPulsing(true);
        setTimeout(() => setStreakPulsing(false), 1200);
      }
    };

    window.addEventListener(USER_PROGRESS_UPDATED_EVENT, handleProgressUpdate);
    return () =>
      window.removeEventListener(
        USER_PROGRESS_UPDATED_EVENT,
        handleProgressUpdate
      );
  }, []);

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
        // silent
      }
    };
    fetchNotifCount();
  }, [session?.user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        avatarRef.current &&
        !avatarRef.current.contains(event.target as Node)
      ) {
        setIsAvatarMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (session?.user?.isBanned || pathname === "/suspended") {
    return (
      <header
        className="sticky top-0 z-40 w-full"
        style={{
          borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--bg)",
        }}
      >
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center transition-opacity hover:opacity-80"
            >
              <Logo size="md" />
            </Link>
            <span
              className="mono text-[11px] px-2 py-0.5 rounded font-medium"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--danger) 12%, transparent)",
                color: "var(--danger)",
                border:
                  "1px solid color-mix(in srgb, var(--danger) 28%, transparent)",
              }}
            >
              RESTRICTED
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {session?.user && (
              <button
                onClick={() => handleSignOut("/login")}
                className="btn btn-secondary inline-flex items-center gap-1.5 text-xs px-3 py-1.5"
                style={{
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--bg-subtle)",
                  color: "var(--fg)",
                }}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </header>
    );
  }

  const navLinks = [
    { href: "/problems", label: "Problems" },
    { href: "/duel", label: "Duel" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/stats", label: "Stats" },
  ];

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full"
        style={{
          borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--bg)",
        }}
      >
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6">
          {/* Brand + Nav */}
          <div className="flex items-center gap-4 lg:gap-8 min-w-0">
            <Link
              href="/"
              className="flex items-center transition-opacity hover:opacity-80"
            >
              <Logo size="md" />
            </Link>

            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center gap-0.5">
              {navLinks.map((link) => {
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="relative px-3 py-3 text-[13px] font-medium transition-colors"
                    style={{
                      color: isActive ? "var(--fg)" : "var(--fg-muted)",
                    }}
                  >
                    {link.label}
                    {/* Active underline indicator */}
                    {isActive && (
                      <span
                        className="absolute bottom-0 left-3 right-3 h-px"
                        style={{ backgroundColor: "var(--accent)" }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right action bar */}
          <div className="flex items-center gap-2">
            {/* Search trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search problems and users"
              className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 text-[12px] transition-colors"
              style={{
                border: "1px solid var(--border-strong)",
                borderRadius: "3px",
                backgroundColor: "var(--bg-subtle)",
                color: "var(--fg-muted)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg)")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--fg-muted)")
              }
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search</span>
              <kbd
                className="mono"
                style={{
                  fontSize: "10px",
                  padding: "1px 5px",
                  borderRadius: "2px",
                  backgroundColor: "var(--bg-elevated)",
                  color: "var(--fg-dimmed)",
                  border: "1px solid var(--border-strong)",
                }}
              >
                Ctrl K
              </kbd>
            </button>

            {/* Mobile search icon */}
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search"
              className="sm:hidden flex h-8 w-8 items-center justify-center"
              style={{ color: "var(--fg-muted)" }}
            >
              <Search className="h-4 w-4" />
            </button>

            {session?.user ? (
              <>
                {/* Streak */}
                <div
                  title="Current practice streak"
                  className={`mono hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium whitespace-nowrap transition-transform duration-300 ${
                    streakPulsing ? "scale-110" : "scale-100"
                  }`}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: "3px",
                    color: "var(--warning)",
                  }}
                >
                  <Flame className="h-3.5 w-3.5 shrink-0" />
                  <span>{liveStreak}</span>
                </div>

                {/* XP */}
                <div
                  title="Total earned XP"
                  className="mono hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium whitespace-nowrap"
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: "3px",
                    color: "var(--fg-muted)",
                  }}
                >
                  <Zap className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    <AnimatedNumber
                      from={liveXp.from}
                      value={liveXp.value}
                      duration={0.65}
                    />{" "}
                    XP
                  </span>
                </div>

                {/* Notification bell */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsNotifOpen((prev) => !prev);
                      setIsAvatarMenuOpen(false);
                    }}
                    aria-label="View notifications"
                    className="relative flex h-8 w-8 items-center justify-center transition-colors"
                    style={{ color: "var(--fg-muted)", borderRadius: "3px" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "var(--fg)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "var(--fg-muted)")
                    }
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span
                        className="absolute -top-0.5 -right-0.5 flex h-[14px] w-[14px] items-center justify-center text-[9px] font-bold"
                        style={{
                          borderRadius: "50%",
                          backgroundColor: "var(--accent)",
                          color: "var(--accent-fg)",
                        }}
                      >
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

                {/* Theme toggle */}
                <ThemeToggle />

                {/* Avatar / Profile dropdown */}
                <div className="relative" ref={avatarRef}>
                  <button
                    onClick={() => {
                      setIsAvatarMenuOpen((prev) => !prev);
                      setIsNotifOpen(false);
                    }}
                    aria-label="User menu"
                    className="relative flex h-7 w-7 items-center justify-center text-[11px] font-bold overflow-hidden transition"
                    style={{
                      border: "1.5px solid var(--border-strong)",
                      borderRadius: "3px",
                      backgroundColor: "var(--bg-elevated)",
                      color: "var(--fg-muted)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor = "var(--fg-muted)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor =
                        "var(--border-strong)")
                    }
                  >
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "Avatar"}
                        fill
                        sizes="28px"
                        className="object-cover"
                      />
                    ) : (
                      <span>
                        {session.user.username?.slice(0, 2).toUpperCase() ||
                          "U"}
                      </span>
                    )}
                  </button>

                  {isAvatarMenuOpen && (
                    <div
                      className="absolute right-0 mt-1 w-52 py-1 z-50"
                      style={{
                        border: "1px solid var(--border-strong)",
                        borderRadius: "3px",
                        backgroundColor: "var(--bg-surface)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                      }}
                    >
                      {/* User info header */}
                      <div
                        className="px-3.5 py-2.5"
                        style={{ borderBottom: "1px solid var(--border)" }}
                      >
                        <p
                          className="text-[12px] font-semibold truncate"
                          style={{ color: "var(--fg)" }}
                        >
                          {session.user.displayName || session.user.username}
                        </p>
                        <p
                          className="mono text-[11px] truncate"
                          style={{ color: "var(--fg-dimmed)" }}
                        >
                          @{session.user.username}
                        </p>
                      </div>

                      <div className="py-1">
                        {[
                          {
                            href: `/profile/${session.user.username}`,
                            icon: UserIcon,
                            label: "Profile",
                          },
                          {
                            href: "/settings",
                            icon: SettingsIcon,
                            label: "Settings",
                          },
                          { href: "/credits", icon: BookOpen, label: "Credits" },
                        ].map(({ href, icon: Icon, label }) => (
                          <Link
                            key={href}
                            href={href}
                            onClick={() => setIsAvatarMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2 text-[12px] transition-colors"
                            style={{ color: "var(--fg-muted)" }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "var(--bg-subtle)";
                              e.currentTarget.style.color = "var(--fg)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                              e.currentTarget.style.color = "var(--fg-muted)";
                            }}
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            {label}
                          </Link>
                        ))}

                        {session.user.role === "admin" && (
                          <Link
                            href="/admin"
                            onClick={() => setIsAvatarMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2 text-[12px] font-semibold transition-colors"
                            style={{ color: "var(--success)" }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "var(--bg-subtle)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "transparent")
                            }
                          >
                            <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                            Admin Console
                          </Link>
                        )}
                      </div>

                      <div
                        className="pt-1"
                        style={{ borderTop: "1px solid var(--border)" }}
                      >
                        <button
                          onClick={() => {
                            setIsAvatarMenuOpen(false);
                            signOut({ callbackUrl: "/" });
                          }}
                          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[12px] transition-colors"
                          style={{ color: "var(--danger)" }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "var(--bg-subtle)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "transparent")
                          }
                        >
                          <LogOut className="h-3.5 w-3.5 shrink-0" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Link
                  href="/login"
                  className="btn btn-primary text-[12px] px-3 py-1.5"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      {isSearchOpen && (
        <GlobalSearchModal onClose={() => setIsSearchOpen(false)} />
      )}
    </>
  );
}
