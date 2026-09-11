"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Calendar,
  Layers,
  Loader2,
  Edit3,
} from "lucide-react";
import Link from "next/link";

interface ProfileData {
  id: string;
  username: string;
  displayName: string;
  image?: string;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalQuestions: number;
  phaseBreakdown: Array<{
    phaseId: number;
    title: string;
    solved: number;
    total: number;
    percentage: number;
  }>;
  heatmap: Record<string, number>;
  recentSolves: Array<{
    problemId: string;
    problemTitle: string;
    language: string;
    runtime: number;
    createdAt: string;
  }>;
  memberSince: string;
  role: string;
  isOwnProfile: boolean;
}

export default function UserProfilePage() {
  const params = useParams();
  const username = params?.username as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/profile/${username}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--fg-dimmed)" }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl py-20 text-center text-[12px]" style={{ color: "var(--fg-muted)" }}>
        Developer profile not found.
      </div>
    );
  }

  // 52-week activity grid
  const days: { dateStr: string; count: number }[] = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    days.push({ dateStr, count: profile.heatmap[dateStr] || 0 });
  }

  const totalHeatmapSolves = Object.values(profile.heatmap).reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 space-y-8">
      {/* Profile Header */}
      <div
        className="pb-8"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center shrink-0 overflow-hidden text-xl font-bold"
              style={{
                border: "1.5px solid var(--border-strong)",
                borderRadius: "4px",
                backgroundColor: "var(--bg-elevated)",
                color: "var(--fg-muted)",
              }}
            >
              {profile.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.image} alt={profile.displayName} className="h-full w-full object-cover" />
              ) : (
                <span>{profile.username.slice(0, 2).toUpperCase()}</span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[20px] font-bold tracking-tight" style={{ color: "var(--fg)" }}>
                  {profile.displayName}
                </h1>
                {profile.role === "admin" && (
                  <span
                    className="px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--success) 12%, transparent)",
                      color: "var(--success)",
                      borderRadius: "2px",
                    }}
                  >
                    ADMIN
                  </span>
                )}
              </div>
              <p className="mono text-[12px]" style={{ color: "var(--fg-dimmed)" }}>@{profile.username}</p>
              <p className="text-[11px] mt-1" style={{ color: "var(--fg-muted)" }}>
                Member since {new Date(profile.memberSince).toLocaleDateString()}
              </p>
            </div>
          </div>

          {profile.isOwnProfile && (
            <Link
              href="/settings"
              className="btn btn-secondary self-start sm:self-auto text-[12px]"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit Profile
            </Link>
          )}
        </div>

        {/* Primary Metrics Row */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div>
            <p className="section-label">Total XP</p>
            <p className="text-[22px] font-bold mono mt-1" style={{ color: "var(--fg)" }}>
              {profile.xp.toLocaleString()} <span className="text-[12px] font-normal" style={{ color: "var(--fg-dimmed)" }}>XP</span>
            </p>
          </div>
          <div>
            <p className="section-label">Problems Solved</p>
            <p className="text-[22px] font-bold mono mt-1" style={{ color: "var(--fg)" }}>
              {profile.totalSolved}{" "}
              <span className="text-[12px] font-normal" style={{ color: "var(--fg-dimmed)" }}>
                / {profile.totalQuestions}
              </span>
            </p>
          </div>
          <div>
            <p className="section-label">Current Streak</p>
            <p className="text-[22px] font-bold mono mt-1" style={{ color: "var(--warning)" }}>
              {profile.currentStreak}{" "}
              <span className="text-[12px] font-normal" style={{ color: "var(--fg-dimmed)" }}>Days</span>
            </p>
          </div>
          <div>
            <p className="section-label">Longest Streak</p>
            <p className="text-[22px] font-bold mono mt-1" style={{ color: "var(--fg)" }}>
              {profile.longestStreak}{" "}
              <span className="text-[12px] font-normal" style={{ color: "var(--fg-dimmed)" }}>Days</span>
            </p>
          </div>
        </div>
      </div>

      {/* Solve Heatmap */}
      <div
        className="pb-8"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" style={{ color: "var(--fg-muted)" }} />
            <h3 className="text-[13px] font-bold" style={{ color: "var(--fg)" }}>Solve Activity</h3>
          </div>
          <span className="mono text-[11px]" style={{ color: "var(--fg-dimmed)" }}>
            {totalHeatmapSolves} total solves
          </span>
        </div>

        <div className="overflow-x-auto pb-2">
          <div
            className="grid grid-rows-7 grid-flow-col gap-[3px] w-max"
            style={{ gridTemplateRows: "repeat(7, 1fr)" }}
          >
            {days.map((d) => {
              const count = d.count;
              const bg =
                count === 0
                  ? "var(--bg-elevated)"
                  : count === 1
                  ? "color-mix(in srgb, var(--success) 25%, transparent)"
                  : count <= 3
                  ? "color-mix(in srgb, var(--success) 55%, transparent)"
                  : "var(--success)";

              return (
                <div
                  key={d.dateStr}
                  title={`${d.dateStr}: ${count} solve${count !== 1 ? "s" : ""}`}
                  style={{
                    width: "11px",
                    height: "11px",
                    borderRadius: "2px",
                    backgroundColor: bg,
                  }}
                />
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-3 text-[10px]" style={{ color: "var(--fg-dimmed)" }}>
          <span>Less</span>
          {["var(--bg-elevated)", "color-mix(in srgb, var(--success) 25%, transparent)", "color-mix(in srgb, var(--success) 55%, transparent)", "var(--success)"].map((bg, i) => (
            <span
              key={i}
              style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: bg, display: "inline-block" }}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Phase Breakdown */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Layers className="h-4 w-4" style={{ color: "var(--fg-muted)" }} />
          <h3 className="text-[13px] font-bold" style={{ color: "var(--fg)" }}>Phase Mastery</h3>
        </div>

        <div
          style={{ border: "1px solid var(--border)", borderRadius: "3px", overflow: "hidden" }}
        >
          {profile.phaseBreakdown.map((p, i) => (
            <div
              key={p.phaseId}
              className="grid grid-cols-12 items-center gap-3 px-4 py-3"
              style={{
                borderBottom: i < profile.phaseBreakdown.length - 1 ? "1px solid var(--border)" : "none",
                backgroundColor: "var(--bg)",
              }}
            >
              <span className="col-span-1 mono text-[11px]" style={{ color: "var(--fg-dimmed)" }}>
                P{p.phaseId}
              </span>
              <span className="col-span-4 sm:col-span-3 text-[12px] font-medium truncate" style={{ color: "var(--fg)" }}>
                {p.title}
              </span>
              <div className="col-span-4 sm:col-span-5">
                <div
                  className="h-1.5 w-full overflow-hidden"
                  style={{ backgroundColor: "var(--bg-elevated)", borderRadius: "2px" }}
                >
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${p.percentage}%`, backgroundColor: "var(--accent)" }}
                  />
                </div>
              </div>
              <span className="col-span-3 mono text-[11px] text-right" style={{ color: "var(--fg-muted)" }}>
                {p.solved} / {p.total} ({p.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
