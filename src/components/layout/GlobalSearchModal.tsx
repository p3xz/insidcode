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

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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

  const hasResults =
    results.problems.length > 0 || results.users.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[15vh]"
      style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg overflow-hidden"
        style={{
          border: "1px solid var(--border-strong)",
          borderRadius: "4px",
          backgroundColor: "var(--bg-surface)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Input row */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <Search className="h-4 w-4 shrink-0" style={{ color: "var(--fg-dimmed)" }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search problems, topics, or developers..."
            className="w-full bg-transparent text-[13px] focus:outline-none"
            style={{ color: "var(--fg)" }}
          />
          {loading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" style={{ color: "var(--fg-dimmed)" }} />
          ) : (
            <button
              onClick={onClose}
              aria-label="Close search"
              className="flex h-6 w-6 items-center justify-center transition-colors"
              style={{ color: "var(--fg-dimmed)", borderRadius: "2px" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-dimmed)")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim().length >= 2 && !hasResults && !loading && (
            <div className="py-10 text-center text-[12px]" style={{ color: "var(--fg-muted)" }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {query.trim().length < 2 && (
            <div className="py-8 text-center text-[12px]" style={{ color: "var(--fg-dimmed)" }}>
              Type at least 2 characters to search
            </div>
          )}

          {/* Problems */}
          {results.problems.length > 0 && (
            <div>
              <div
                className="section-label px-4 py-2"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                Problems
              </div>
              {results.problems.map((p) => (
                <Link
                  key={p.problemId}
                  href={`/problems/${p.problemId}`}
                  onClick={onClose}
                  className="flex items-center justify-between px-4 py-2.5 text-[12px] transition-colors"
                  style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-subtle)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Code2 className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--fg-dimmed)" }} />
                    <span className="mono shrink-0" style={{ color: "var(--fg-dimmed)" }}>
                      {p.problemId}
                    </span>
                    <span className="font-medium truncate" style={{ color: "var(--fg)" }}>
                      {p.title}
                    </span>
                  </div>
                  <span
                    className="shrink-0 ml-3"
                    style={{
                      color:
                        p.difficulty === "Easy"
                          ? "var(--easy)"
                          : p.difficulty === "Medium"
                          ? "var(--medium)"
                          : "var(--hard)",
                      fontSize: "10px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {p.difficulty}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* Users */}
          {results.users.length > 0 && (
            <div>
              <div
                className="section-label px-4 py-2"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                Developers
              </div>
              {results.users.map((u) => (
                <Link
                  key={u.username}
                  href={`/profile/${u.username}`}
                  onClick={onClose}
                  className="flex items-center justify-between px-4 py-2.5 text-[12px] transition-colors"
                  style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-subtle)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserIcon className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--fg-dimmed)" }} />
                    <span className="font-medium truncate" style={{ color: "var(--fg)" }}>
                      {u.displayName}
                    </span>
                    <span className="mono shrink-0" style={{ color: "var(--fg-dimmed)" }}>
                      @{u.username}
                    </span>
                  </div>
                  <span className="mono shrink-0 text-[11px]" style={{ color: "var(--fg-muted)" }}>
                    {u.xp} XP
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
