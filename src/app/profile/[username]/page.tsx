"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Calendar,
  Layers,
  UserPlus,
  Loader2,
  Check,
  Edit3,
} from "lucide-react";
import { useSession } from "next-auth/react";
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
  const { data: session } = useSession();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendReqSent, setFriendReqSent] = useState(false);
  const [friendActionLoading, setFriendActionLoading] = useState(false);

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

  const handleAddFriend = async () => {
    if (!profile) return;
    setFriendActionLoading(true);
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          targetUserId: profile.id,
        }),
      });

      if (res.ok) {
        setFriendReqSent(true);
      } else {
        const d = await res.json();
        alert(d.error || "Failed to send friend request");
      }
    } catch {
      alert("Error sending friend request");
    } finally {
      setFriendActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#00F0FF]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl py-20 text-center text-xs text-[#8B93A7]">
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Profile Header Card */}
      <div className="rounded-xl border border-[#252936] bg-[#11131A] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#00F0FF] bg-[#181B24] text-xl font-bold text-[#00F0FF] overflow-hidden">
              {profile.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.image} alt={profile.displayName} className="h-full w-full object-cover" />
              ) : (
                <span>{profile.username.slice(0, 2).toUpperCase()}</span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#F5F7FA]">{profile.displayName}</h1>
                {profile.role === "admin" && (
                  <span className="rounded bg-[#39FF14]/10 px-2 py-0.5 text-[10px] font-bold text-[#39FF14]">
                    ADMIN
                  </span>
                )}
              </div>
              <p className="font-mono text-xs text-[#8B93A7]">@{profile.username}</p>
              <p className="text-[11px] text-[#5E667B] mt-1">
                Member since {new Date(profile.memberSince).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Action button */}
          {!profile.isOwnProfile && session?.user && (
            <button
              onClick={handleAddFriend}
              disabled={friendReqSent || friendActionLoading}
              className="flex items-center gap-1.5 rounded-lg bg-[#00F0FF] px-4 py-2 text-xs font-bold text-[#090A0F] hover:bg-[#00F0FF]/90 disabled:opacity-50 transition self-start sm:self-auto"
            >
              {friendReqSent ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Request Sent
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5" /> Add Friend
                </>
              )}
            </button>
          )}

          {profile.isOwnProfile && (
            <Link
              href="/settings"
              className="flex items-center gap-1.5 rounded-lg border border-[#252936] bg-[#181B24] px-4 py-2 text-xs font-semibold text-[#F5F7FA] hover:border-[#00F0FF] hover:text-[#00F0FF] transition self-start sm:self-auto"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit Username & Profile
            </Link>
          )}
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#252936]">
          <div>
            <span className="text-[11px] text-[#8B93A7]">Total XP</span>
            <p className="text-xl font-bold text-[#00F0FF] font-mono">{profile.xp} XP</p>
          </div>
          <div>
            <span className="text-[11px] text-[#8B93A7]">Problems Solved</span>
            <p className="text-xl font-bold text-[#F5F7FA] font-mono">
              {profile.totalSolved}{" "}
              <span className="text-xs font-normal text-[#5E667B]">/ {profile.totalQuestions}</span>
            </p>
          </div>
          <div>
            <span className="text-[11px] text-[#8B93A7]">Current Streak</span>
            <p className="text-xl font-bold text-[#F59E0B] font-mono">{profile.currentStreak} Days</p>
          </div>
          <div>
            <span className="text-[11px] text-[#8B93A7]">Longest Streak</span>
            <p className="text-xl font-bold text-[#F5F7FA] font-mono">{profile.longestStreak} Days</p>
          </div>
        </div>
      </div>

      {/* Solve Heatmap */}
      <div className="rounded-xl border border-[#252936] bg-[#11131A] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#00F0FF]" />
            <h3 className="text-sm font-bold text-[#F5F7FA]">Solve Activity</h3>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="grid grid-rows-7 grid-flow-col gap-1 w-max">
            {days.map((d) => {
              const count = d.count;
              const bgClass =
                count === 0
                  ? "bg-[#181B24]"
                  : count === 1
                  ? "bg-[#00F0FF]/30"
                  : count <= 3
                  ? "bg-[#00F0FF]/60"
                  : "bg-[#00F0FF]";

              return (
                <div
                  key={d.dateStr}
                  title={`${d.dateStr}: ${count} solves`}
                  className={`h-3 w-3 rounded-xs ${bgClass} transition hover:ring-1 hover:ring-[#F5F7FA]`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Phase Breakdown */}
      <div className="rounded-xl border border-[#252936] bg-[#11131A] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-[#39FF14]" />
          <h3 className="text-sm font-bold text-[#F5F7FA]">Phase Mastery</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.phaseBreakdown.map((p) => (
            <div key={p.phaseId} className="rounded-lg border border-[#252936] bg-[#090A0F] p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#F5F7FA]">
                  Phase {p.phaseId}: {p.title}
                </span>
                <span className="font-mono text-[#8B93A7]">
                  {p.solved} / {p.total} ({p.percentage}%)
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#181B24]">
                <div
                  className="h-full bg-[#00F0FF]"
                  style={{ width: `${p.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
