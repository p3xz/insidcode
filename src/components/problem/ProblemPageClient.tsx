"use client";

import React, { useState, useEffect } from "react";
import { ProblemWorkspace } from "@/components/problem/ProblemWorkspace";
import { ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";
import { ProblemPageSkeleton } from "@/components/ui/PageSkeletons";
import { useDelayedFlag } from "@/hooks/useDelayedFlag";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { IQuestion } from "@/types";

interface ProblemPageClientProps {
  /** The problemId (e.g. "001") — used to fetch full problem data */
  problemId: string;
  /** The slug — used as fallback display identifier */
  problemSlug: string;
  /** Server-rendered public problem data for instant zero-spinner paint */
  initialProblem?: IQuestion;
}

interface PublicProblemApiResponse {
  problem: IQuestion;
}

interface UserStateApiResponse {
  userState: {
    isSolved: boolean;
    isAttempted: boolean;
    lastSubmission: {
      language: string;
      code: string;
      status: string;
      runtime: number;
      createdAt: string;
    } | null;
    nextProblem: {
      problemId: string;
      title: string;
      phase: number;
    } | null;
    isAllSolved: boolean;
  };
}

export function ProblemPageClient({
  problemId,
  initialProblem,
}: ProblemPageClientProps) {
  const { data: session } = useSession();
  const [cachedProblem, setCachedProblem] = useState<IQuestion | null>(
    initialProblem || null
  );

  // 1. Public Problem Content (safe to cache publicly, identical for all users)
  const {
    data: publicData,
    error: publicError,
    isLoading: isPublicLoading,
    mutate: revalidateProblem,
  } = useSWR<PublicProblemApiResponse>(
    problemId ? `/api/problems/${problemId}` : null,
    async (url: string) => {
      const res = await fetch(url);
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
      return res.json();
    },
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  // 2. Private User State (per-user, private no-store, only fetched when logged in)
  const { data: userStateData } = useSWR<UserStateApiResponse>(
    session?.user?.id && problemId
      ? `/api/problems/${problemId}/user-state`
      : null,
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error("Failed to load user state");
      }
      return res.json();
    },
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  useEffect(() => {
    if (publicData?.problem) {
      setCachedProblem(publicData.problem);
    }
  }, [publicData?.problem]);

  const activeProblem = publicData?.problem || cachedProblem || initialProblem || null;
  const loading = isPublicLoading && !activeProblem;
  const error = publicError?.message || null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canRetry = Boolean(publicError && (publicError as any).status !== 404);
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

  if (error && !activeProblem) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-[#090A0F] text-center p-4">
        <h2 className="text-xl font-bold text-[#F5F7FA] mb-2">{error}</h2>
        <p className="text-xs text-[#8B93A7] mb-6">
          {canRetry
            ? "A temporary issue prevented loading the problem statement."
            : "The requested programming problem could not be located in the database."}
        </p>
        {canRetry && (
          <button
            type="button"
            onClick={() => revalidateProblem()}
            className="mb-3 flex items-center gap-2 rounded-lg border border-[#252936] px-4 py-2 text-xs font-bold text-[#F5F7FA] hover:border-[#00F0FF]/50 transition cursor-pointer"
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

  const isSolved = Boolean(userStateData?.userState?.isSolved);
  const nextProblem = userStateData?.userState?.nextProblem || null;
  const isAllSolved = Boolean(userStateData?.userState?.isAllSolved);

  return (
    <ProblemWorkspace
      problem={activeProblem!}
      initialSolved={isSolved}
      initialNextProblem={nextProblem}
      initialIsAllSolved={isAllSolved}
    />
  );
}
