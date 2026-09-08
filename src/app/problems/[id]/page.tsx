"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ProblemWorkspace } from "@/components/problem/ProblemWorkspace";
import { IQuestion } from "@/types";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SingleProblemPage() {
  const params = useParams();
  const id = params?.id as string;

  const [problem, setProblem] = useState<IQuestion | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchProblem = async () => {
      try {
        const res = await fetch(`/api/problems/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProblem(data.problem);
          setIsSolved(data.userState?.isSolved || false);
        } else {
          setError("Problem not found or unpublished.");
        }
      } catch {
        setError("Failed to load problem details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-[#090A0F]">
        <Loader2 className="h-8 w-8 animate-spin text-[#00F0FF]" />
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-[#090A0F] text-center p-4">
        <h2 className="text-xl font-bold text-[#F5F7FA] mb-2">{error || "Problem Not Found"}</h2>
        <p className="text-xs text-[#8B93A7] mb-6">
          The requested programming problem could not be located in the database.
        </p>
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
