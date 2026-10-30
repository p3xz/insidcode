"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ProblemWorkspace } from "@/components/problem/ProblemWorkspace";
import { IQuestion } from "@/types";
import { ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";
import { ProblemPageSkeleton } from "@/components/ui/PageSkeletons";
import { useDelayedFlag } from "@/hooks/useDelayedFlag";

interface ProblemPageClientProps {
  /** The problemId (e.g. "001") — used to fetch full problem data including user state */
  problemId: string;
  /** The slug — used as fallback display identifier */
  problemSlug: string;
}

/**
 * Client component that handles:
 * - Fetching the full problem data (including user auth state) from the API
 * - Rendering the interactive ProblemWorkspace (Monaco, Run, Submit)
 *
 * SEO-visible content (title, description, examples) is server-rendered in the
 * parent server component (page.tsx) so crawlers see it in the initial HTML.
 */
export function ProblemPageClient({ problemId }: ProblemPageClientProps) {
  const [problem, setProblem] = useState<IQuestion | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(false);
  const showSkeleton = useDelayedFlag(loading);

  const fetchProblem = useCallback(async () => {
    if (!problemId) return;
    setLoading(true);
    setError(null);
    setCanRetry(false);
    try {
      const res = await fetch(`/api/problems/${problemId}`);
      if (res.ok) {
        const data = await res.json();
        setProblem(data.problem);
        setIsSolved(data.userState?.isSolved || false);
      } else if (res.status === 404) {
        setError("Problem not found or unpublished.");
      } else {
        setError("We couldn't load this problem. Please try again.");
        setCanRetry(true);
      }
    } catch {
      setError("Failed to load problem details.");
      setCanRetry(true);
    } finally {
      setLoading(false);
    }
  }, [problemId]);

  useEffect(() => {
    fetchProblem();
  }, [fetchProblem]);

  if (loading) {
    return showSkeleton ? (
      <ProblemPageSkeleton />
    ) : (
      <div
        aria-busy="true"
        className="h-[calc(100vh-3.5rem)] bg-[#090A0F]"
      />
    );
  }

  if (error || !problem) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-[#090A0F] text-center p-4">
        <h2 className="text-xl font-bold text-[#F5F7FA] mb-2">{error || "Problem Not Found"}</h2>
        <p className="text-xs text-[#8B93A7] mb-6">
          The requested programming problem could not be located in the database.
        </p>
        {canRetry && (
          <button
            type="button"
            onClick={fetchProblem}
            className="mb-3 flex items-center gap-2 rounded-lg border border-[#252936] px-4 py-2 text-xs font-bold text-[#F5F7FA] cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Retry
          </button>
        )}
        <Link
          href="/problems"
          className="flex items-center gap-2 rounded-lg bg-[#00F0FF] px-4 py-2 text-xs font-bold text-[#090A0F]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Problems Directory
        </Link>
      </div>
    );
  }

  return <ProblemWorkspace problem={problem} initialSolved={isSolved} />;
}
