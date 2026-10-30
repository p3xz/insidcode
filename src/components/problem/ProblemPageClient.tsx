"use client";

import React, { useMemo } from "react";
import { ProblemWorkspace } from "@/components/problem/ProblemWorkspace";
import { ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";
import { ProblemPageSkeleton } from "@/components/ui/PageSkeletons";
import { useDelayedFlag } from "@/hooks/useDelayedFlag";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { PublicProblemData } from "@/lib/problems";
import {
  getCachedPublicProblem,
  setCachedPublicProblem,
  getCachedUserState,
  setCachedUserState,
} from "@/lib/problemClientCache";

interface ProblemPageClientProps {
  /** The problemId (e.g. "001") — used to fetch full problem data including user state */
  problemId: string;
  /** The slug — used as fallback display identifier */
  problemSlug: string;
  /** Server-hydrated initial public problem data */
  initialProblem?: PublicProblemData | null;
}

/**
 * Client component that handles:
 * - Instant rendering from server props, in-memory cache, or sessionStorage
 * - Background SWR revalidation throttled to 5 minutes
 * - Rendering the interactive ProblemWorkspace (Monaco, Run, Submit)
 */
export function ProblemPageClient({
  problemId,
  initialProblem,
}: ProblemPageClientProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // Immediately store initial server-hydrated problem into client cache if provided
  if (initialProblem && typeof window !== "undefined") {
    setCachedPublicProblem(problemId, initialProblem);
  }

  // Synchronous cache lookup (0 ms) — check memory and sessionStorage
  const cachedProblem = useMemo(() => {
    return initialProblem || getCachedPublicProblem(problemId);
  }, [problemId, initialProblem]);

  const cachedUserState = useMemo(() => {
    return getCachedUserState(userId, problemId);
  }, [userId, problemId]);

  const swrKey = [userId || "anon", `/api/problems/${problemId}`];

  const { data, error: swrError, isLoading, mutate: revalidateProblem } = useSWR(
    problemId ? swrKey : null,
    async () => {
      const res = await fetch(`/api/problems/${problemId}`);
      if (!res.ok) {
        const err = new Error(
          res.status === 404
            ? "Problem not found or unpublished."
            : "We couldn't load this problem. Please try again."
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err as any).status = res.status;
        throw err;
      }
      const json = await res.json();
      if (json?.problem) {
        setCachedPublicProblem(problemId, json.problem);
      }
      if (json?.userState && userId) {
        setCachedUserState(userId, problemId, json.userState);
      }
      return json;
    },
    {
      fallbackData: cachedProblem
        ? {
            problem: cachedProblem,
            userState: cachedUserState || { isSolved: false, isAttempted: false },
          }
        : undefined,
      revalidateOnFocus: true,
      // Revalidate in background at most once every 5 minutes (300,000 ms)
      dedupingInterval: 300000,
    }
  );

  const problem = data?.problem || cachedProblem;
  const isSolved = Boolean(data?.userState?.isSolved ?? cachedUserState?.isSolved);

  // If we already have problem content (from props, SWR, or cache), never show skeleton or spinner
  const hasProblemContent = Boolean(problem);
  const loading = isLoading && !hasProblemContent;
  const error = !hasProblemContent && swrError?.message ? swrError.message : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canRetry = Boolean(swrError && (swrError as any).status !== 404);
  const showSkeleton = useDelayedFlag(loading);

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
            onClick={() => revalidateProblem()}
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
