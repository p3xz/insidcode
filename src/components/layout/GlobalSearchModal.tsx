"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, X, Code2, User as UserIcon, Loader2 } from "lucide-react";

interface SearchResult {
  problems: Array<{
    problemId: string;
    title: string;
    slug: string;
    difficulty: "Easy" | "Medium" | "Hard";
    phase: number;
  }>;
  users: Array<{
    username: string;
    displayName: string;
    image?: string;
    xp: number;
  }>;
}

export function GlobalSearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult>({ problems: [], users: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ problems: [], users: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-20 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-[#252936] bg-[#11131A] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-[#252936] px-4 py-3">
          <Search className="h-4 w-4 text-[#8B93A7]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search problems, topics, or developers..."
            className="w-full bg-transparent text-sm text-[#F5F7FA] placeholder-[#5E667B] focus:outline-none"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-[#00F0FF]" />}
          <button
            onClick={onClose}
            aria-label="Close search"
            className="rounded p-1 text-[#8B93A7] hover:bg-[#181B24] hover:text-[#F5F7FA]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-2">
          {query.trim().length >= 2 && results.problems.length === 0 && results.users.length === 0 && !loading && (
            <div className="py-8 text-center text-xs text-[#8B93A7]">
              No problems or developers found matching &quot;{query}&quot;.
            </div>
          )}

          {/* Problems Section */}
          {results.problems.length > 0 && (
            <div className="mb-3">
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#5E667B]">
                Problems
              </div>
              {results.problems.map((p) => (
                <Link
                  key={p.problemId}
                  href={`/problems/${p.problemId}`}
                  onClick={onClose}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-xs hover:bg-[#181B24] transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <Code2 className="h-3.5 w-3.5 text-[#00F0FF]" />
                    <span className="font-mono text-[#8B93A7] group-hover:text-[#F5F7FA]">{p.problemId}</span>
                    <span className="font-medium text-[#F5F7FA]">{p.title}</span>
                  </div>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      p.difficulty === "Easy"
                        ? "text-[#39FF14] bg-[#39FF14]/10"
                        : p.difficulty === "Medium"
                        ? "text-[#F59E0B] bg-[#F59E0B]/10"
                        : "text-[#FF4D6D] bg-[#FF4D6D]/10"
                    }`}
                  >
                    {p.difficulty}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* Users Section */}
          {results.users.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#5E667B]">
                Developers
              </div>
              {results.users.map((u) => (
                <Link
                  key={u.username}
                  href={`/profile/${u.username}`}
                  onClick={onClose}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-xs hover:bg-[#181B24] transition"
                >
                  <div className="flex items-center gap-2.5">
                    <UserIcon className="h-3.5 w-3.5 text-[#8B93A7]" />
                    <span className="font-medium text-[#F5F7FA]">{u.displayName}</span>
                    <span className="font-mono text-[#5E667B]">@{u.username}</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#00F0FF]">{u.xp} XP</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
