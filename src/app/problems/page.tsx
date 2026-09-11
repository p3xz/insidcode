"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  Circle,
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

  const [search, setSearch] = useState("");
  const [selectedPhase, setSelectedPhase] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [phaseStats, setPhaseStats] = useState<PhaseStat[]>([]);
  const [totalSolved, setTotalSolved] = useState(0);
  const [totalPublished, setTotalPublished] = useState(0);
  const [overallPercentage, setOverallPercentage] = useState(0);

  const fetchProblems = useCallback(async () => {
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
  }, [search, selectedPhase, selectedDifficulty, selectedStatus, page]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const diffColor = (d: string) =>
    d === "Easy" ? "var(--easy)" : d === "Medium" ? "var(--medium)" : "var(--hard)";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">

      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="mb-8" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1.5rem" }}>
        <h1 className="text-[22px] font-bold tracking-tight" style={{ color: "var(--fg)" }}>
          Problems Directory
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-[13px]">
          <span style={{ color: "var(--fg-muted)" }}>
            <span className="font-semibold" style={{ color: "var(--fg)" }}>{totalSolved}</span>
            {" / "}{totalPublished} solved
          </span>
          {session?.user && (
            <>
              <span style={{ color: "var(--fg-dimmed)" }}>·</span>
              <span style={{ color: "var(--fg-muted)" }}>
                <span className="font-semibold" style={{ color: "var(--fg)" }}>
                  {session.user.currentStreak || 0}
                </span>{" "}day streak
              </span>
              <span style={{ color: "var(--fg-dimmed)" }}>·</span>
              <span className="mono" style={{ color: "var(--fg-muted)" }}>
                <span className="font-semibold" style={{ color: "var(--fg)" }}>
                  {session.user.xp || 0}
                </span>{" "}XP
              </span>
            </>
          )}
          <span style={{ color: "var(--fg-dimmed)" }}>·</span>
          <span style={{ color: "var(--fg-muted)" }}>
            <span className="font-semibold" style={{ color: "var(--fg)" }}>{overallPercentage}%</span>{" "}complete
          </span>
        </div>
      </div>

      {/* ── Overall Progress Bar ─────────────────────────────────── */}
      <div className="mb-6 space-y-1.5">
        <p className="section-label">Overall curriculum completion</p>
        <div
          className="h-1.5 w-full overflow-hidden"
          style={{ backgroundColor: "var(--bg-elevated)", borderRadius: "2px" }}
        >
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${overallPercentage}%`, backgroundColor: "var(--success)" }}
          />
        </div>
      </div>

      {/* ── Phase Progress Grid ──────────────────────────────────── */}
      <div
        className="mb-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px"
        style={{ backgroundColor: "var(--border)", border: "1px solid var(--border)", borderRadius: "3px", overflow: "hidden" }}
      >
        {CURRICULUM_PHASES.map((phase) => {
          const stat = phaseStats.find((s) => s.phaseId === phase.id) || {
            solved: 0, total: 0, percentage: 0,
          };
          const isSelected = selectedPhase === phase.id.toString();

          return (
            <button
              key={phase.id}
              onClick={() => {
                setSelectedPhase(isSelected ? "" : phase.id.toString());
                setPage(1);
              }}
              className="text-left p-3 transition-colors"
              style={{
                backgroundColor: isSelected ? "var(--bg-elevated)" : "var(--bg)",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = "var(--bg-subtle)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isSelected ? "var(--bg-elevated)" : "var(--bg)";
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="mono text-[10px] font-bold"
                  style={{ color: isSelected ? "var(--accent)" : "var(--fg-dimmed)" }}
                >
                  P{phase.id}
                </span>
                <span className="mono text-[10px]" style={{ color: "var(--fg-dimmed)" }}>
                  {stat.percentage}%
                </span>
              </div>
              <p className="text-[11px] font-medium truncate" style={{ color: "var(--fg)" }}>
                {phase.title}
              </p>
              <div className="mt-2 h-0.5 w-full" style={{ backgroundColor: "var(--bg-elevated)" }}>
                <div
                  className="h-full transition-all"
                  style={{ width: `${stat.percentage}%`, backgroundColor: "var(--success)" }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Filter Row ───────────────────────────────────────────── */}
      <div
        className="flex flex-wrap items-center gap-2 mb-4 pb-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
            style={{ color: "var(--fg-dimmed)" }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search problems..."
            className="w-full py-1.5 pl-8 pr-3 text-[12px] bg-transparent focus:outline-none"
            style={{
              border: "1px solid var(--border-strong)",
              borderRadius: "3px",
              color: "var(--fg)",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
          />
        </div>

        {[
          {
            value: selectedPhase,
            onChange: (v: string) => { setSelectedPhase(v); setPage(1); },
            options: [
              { value: "", label: "All Phases" },
              ...CURRICULUM_PHASES.map((p) => ({ value: String(p.id), label: `Phase ${p.id}: ${p.title}` })),
            ],
          },
          {
            value: selectedDifficulty,
            onChange: (v: string) => { setSelectedDifficulty(v); setPage(1); },
            options: [
              { value: "", label: "All Difficulties" },
              { value: "Easy", label: "Easy" },
              { value: "Medium", label: "Medium" },
              { value: "Hard", label: "Hard" },
            ],
          },
          {
            value: selectedStatus,
            onChange: (v: string) => { setSelectedStatus(v); setPage(1); },
            options: [
              { value: "all", label: "All Status" },
              { value: "solved", label: "Solved" },
              { value: "unsolved", label: "Unsolved" },
            ],
          },
        ].map((sel, i) => (
          <select
            key={i}
            value={sel.value}
            onChange={(e) => sel.onChange(e.target.value)}
            className="py-1.5 px-2.5 text-[12px] cursor-pointer focus:outline-none"
            style={{
              border: "1px solid var(--border-strong)",
              borderRadius: "3px",
              backgroundColor: "var(--bg)",
              color: "var(--fg)",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
          >
            {sel.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ))}
      </div>

      {/* ── Problems Table ───────────────────────────────────────── */}
      <div
        style={{ border: "1px solid var(--border)", borderRadius: "3px", overflow: "hidden" }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--fg-dimmed)" }} />
          </div>
        ) : problems.length === 0 ? (
          <div className="py-16 text-center text-[12px]" style={{ color: "var(--fg-muted)" }}>
            No problems found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-subtle)" }}>
                  {["", "ID", "Title", "Phase", "Difficulty", "XP"].map((col, i) => (
                    <th
                      key={i}
                      className={`px-4 py-3 section-label ${i === 5 ? "text-right" : i === 0 ? "w-10 text-center" : ""}`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {problems.map((prob, i) => (
                  <tr
                    key={prob.problemId}
                    style={{ borderBottom: i < problems.length - 1 ? "1px solid var(--border)" : "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-subtle)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {/* Status icon */}
                    <td className="px-4 py-3 text-center w-10">
                      {prob.isSolved ? (
                        <CheckCircle2 className="h-4 w-4 mx-auto" style={{ color: "var(--success)" }} />
                      ) : prob.isAttempted ? (
                        <Circle className="h-4 w-4 mx-auto stroke-2" style={{ color: "var(--warning)" }} />
                      ) : (
                        <Circle className="h-4 w-4 mx-auto opacity-25" style={{ color: "var(--fg-dimmed)" }} />
                      )}
                    </td>

                    {/* ID */}
                    <td className="px-4 py-3 mono" style={{ color: "var(--fg-dimmed)" }}>
                      {prob.problemId}
                    </td>

                    {/* Title */}
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/problems/${prob.problemId}`}
                        className="transition-colors"
                        style={{ color: "var(--fg)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg)")}
                      >
                        {prob.title}
                      </Link>
                    </td>

                    {/* Phase */}
                    <td className="px-4 py-3 mono" style={{ color: "var(--fg-dimmed)" }}>
                      Ph.{prob.phase}
                    </td>

                    {/* Difficulty */}
                    <td className="px-4 py-3">
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: diffColor(prob.difficulty),
                        }}
                      >
                        {prob.difficulty}
                      </span>
                    </td>

                    {/* XP */}
                    <td className="px-4 py-3 text-right mono" style={{ color: "var(--fg-muted)" }}>
                      +{prob.xp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div
          className="flex items-center justify-between px-4 py-3 text-[12px]"
          style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--bg-subtle)", color: "var(--fg-muted)" }}
        >
          <span>
            Page{" "}
            <span className="font-semibold" style={{ color: "var(--fg)" }}>{page}</span>
            {" "}of{" "}
            <span className="font-semibold" style={{ color: "var(--fg)" }}>{totalPages}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-2.5 py-1 transition-colors disabled:opacity-30"
              style={{ border: "1px solid var(--border-strong)", borderRadius: "3px", color: "var(--fg-muted)" }}
              onMouseEnter={(e) => { if (page > 1) e.currentTarget.style.color = "var(--fg)"; }}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-muted)")}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-2.5 py-1 transition-colors disabled:opacity-30"
              style={{ border: "1px solid var(--border-strong)", borderRadius: "3px", color: "var(--fg-muted)" }}
              onMouseEnter={(e) => { if (page < totalPages) e.currentTarget.style.color = "var(--fg)"; }}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-muted)")}
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
