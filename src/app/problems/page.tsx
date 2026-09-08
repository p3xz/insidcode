"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  Circle,
  Flame,
  Zap,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { CURRICULUM_PHASES } from "@/lib/constants";

interface ProblemRow {
  _id: string;
  problemId: string;
  title: string;
  slug: string;
  phase: number;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  xp: number;
  isSolved: boolean;
  isAttempted: boolean;
}

interface PhaseStat {
  phaseId: number;
  title: string;
  description: string;
  total: number;
  solved: number;
  percentage: number;
}

export default function ProblemsDirectoryPage() {
  const { data: session } = useSession();
  const [problems, setProblems] = useState<ProblemRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters and pagination
  const [search, setSearch] = useState("");
  const [selectedPhase, setSelectedPhase] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Stats
  const [phaseStats, setPhaseStats] = useState<PhaseStat[]>([]);
  const [totalSolved, setTotalSolved] = useState(0);
  const [totalPublished, setTotalPublished] = useState(0);
  const [overallPercentage, setOverallPercentage] = useState(0);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (selectedPhase) params.set("phase", selectedPhase);
      if (selectedDifficulty) params.set("difficulty", selectedDifficulty);
      if (selectedStatus !== "all") params.set("status", selectedStatus);
      params.set("page", page.toString());
      params.set("limit", "25");

      const res = await fetch(`/api/problems?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProblems(data.questions || []);
        setTotalPages(data.pagination?.totalPages || 1);

        if (data.stats) {
          setPhaseStats(data.stats.phases || []);
          setTotalSolved(data.stats.totalSolved || 0);
          setTotalPublished(data.stats.totalPublished || 0);
          setOverallPercentage(data.stats.overallPercentage || 0);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, [search, selectedPhase, selectedDifficulty, selectedStatus, page]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Top Progress Dashboard */}
      <div className="rounded-xl border border-[#252936] bg-[#11131A] p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#252936] pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#F5F7FA]">Problems Directory</h1>
            <p className="text-xs text-[#8B93A7]">
              Master logic building through 250+ structured challenges across six essential phases.
            </p>
          </div>

          {/* User Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg border border-[#252936] bg-[#181B24] px-3.5 py-1.5 text-xs font-mono font-medium text-[#F59E0B]">
              <Flame className="h-4 w-4" />
              <span>{session?.user?.currentStreak || 0} Day Streak</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-[#252936] bg-[#181B24] px-3.5 py-1.5 text-xs font-mono font-medium text-[#00F0FF]">
              <Zap className="h-4 w-4" />
              <span>{session?.user?.xp || 0} XP</span>
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#F5F7FA]">Curriculum Completion</span>
            <span className="font-mono text-[#8B93A7]">
              {totalSolved} / {totalPublished} Solved ({overallPercentage}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#181B24]">
            <div
              className="h-full bg-gradient-to-r from-[#00F0FF] to-[#39FF14] transition-all duration-500"
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
        </div>

        {/* Six Phase Progress Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {CURRICULUM_PHASES.map((phase) => {
            const stat = phaseStats.find((s) => s.phaseId === phase.id) || {
              solved: 0,
              total: 0,
              percentage: 0,
            };
            const isSelected = selectedPhase === phase.id.toString();

            return (
              <button
                key={phase.id}
                onClick={() => {
                  setSelectedPhase(isSelected ? "" : phase.id.toString());
                  setPage(1);
                }}
                className={`rounded-lg border p-3 text-left transition ${
                  isSelected
                    ? "border-[#00F0FF] bg-[#181B24]"
                    : "border-[#252936] bg-[#090A0F] hover:border-[#363C4E]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-[#00F0FF]">Phase {phase.id}</span>
                  <span className="font-mono text-[10px] text-[#8B93A7]">{stat.percentage}%</span>
                </div>
                <h4 className="text-xs font-semibold text-[#F5F7FA] truncate">{phase.title}</h4>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#181B24]">
                  <div
                    className="h-full bg-[#39FF14] transition-all"
                    style={{ width: `${stat.percentage}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-5 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8B93A7]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search problems by name, ID, or tag..."
            className="w-full rounded-lg border border-[#252936] bg-[#11131A] py-2 pl-9 pr-4 text-xs text-[#F5F7FA] placeholder-[#5E667B] focus:border-[#00F0FF] focus:outline-none"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedPhase}
            onChange={(e) => {
              setSelectedPhase(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-[#252936] bg-[#11131A] py-2 px-3 text-xs text-[#F5F7FA] focus:border-[#00F0FF] focus:outline-none cursor-pointer"
          >
            <option value="">All Phases</option>
            {CURRICULUM_PHASES.map((p) => (
              <option key={p.id} value={p.id}>
                Phase {p.id}: {p.title}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <select
            value={selectedDifficulty}
            onChange={(e) => {
              setSelectedDifficulty(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-[#252936] bg-[#11131A] py-2 px-3 text-xs text-[#F5F7FA] focus:border-[#00F0FF] focus:outline-none cursor-pointer"
          >
            <option value="">All Difficulties</option>
            <option value="Easy">Easy (10 XP)</option>
            <option value="Medium">Medium (20 XP)</option>
            <option value="Hard">Hard (30 XP)</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-[#252936] bg-[#11131A] py-2 px-3 text-xs text-[#F5F7FA] focus:border-[#00F0FF] focus:outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="solved">Solved</option>
            <option value="unsolved">Unsolved</option>
          </select>
        </div>
      </div>

      {/* Problems Clean Directory Table */}
      <div className="rounded-xl border border-[#252936] bg-[#11131A] overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-[#00F0FF]" />
          </div>
        ) : problems.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#8B93A7]">
            No problems found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#252936] bg-[#181B24]/70 font-mono text-[#8B93A7]">
                <tr>
                  <th className="px-4 py-3 w-12 text-center">Status</th>
                  <th className="px-4 py-3 w-16">ID</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Phase</th>
                  <th className="px-4 py-3">Difficulty</th>
                  <th className="px-4 py-3 text-right">Reward</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252936]/60 text-[#F5F7FA]">
                {problems.map((prob) => (
                  <tr key={prob.problemId} className="hover:bg-[#181B24]/40 transition group">
                    <td className="px-4 py-3.5 text-center">
                      {prob.isSolved ? (
                        <CheckCircle2 className="h-4 w-4 text-[#39FF14] mx-auto" />
                      ) : prob.isAttempted ? (
                        <Circle className="h-4 w-4 text-[#F59E0B] mx-auto stroke-2" />
                      ) : (
                        <Circle className="h-4 w-4 text-[#5E667B] mx-auto opacity-40" />
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[#00F0FF]">{prob.problemId}</td>
                    <td className="px-4 py-3.5 font-medium">
                      <Link
                        href={`/problems/${prob.problemId}`}
                        className="hover:text-[#00F0FF] transition flex items-center gap-2"
                      >
                        <span>{prob.title}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-[#181B24] px-2 py-0.5 text-[11px] text-[#8B93A7]">
                        Phase {prob.phase}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                          prob.difficulty === "Easy"
                            ? "text-[#39FF14] bg-[#39FF14]/10"
                            : prob.difficulty === "Medium"
                            ? "text-[#F59E0B] bg-[#F59E0B]/10"
                            : "text-[#FF4D6D] bg-[#FF4D6D]/10"
                        }`}
                      >
                        {prob.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-[#00F0FF]">
                      +{prob.xp} XP
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-[#252936] bg-[#181B24]/50 px-4 py-3 text-xs text-[#8B93A7]">
          <span>
            Page <strong className="text-[#F5F7FA]">{page}</strong> of{" "}
            <strong className="text-[#F5F7FA]">{totalPages}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded border border-[#252936] bg-[#11131A] px-2.5 py-1 disabled:opacity-40 hover:text-[#F5F7FA]"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 rounded border border-[#252936] bg-[#11131A] px-2.5 py-1 disabled:opacity-40 hover:text-[#F5F7FA]"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
