import React from "react";
import Link from "next/link";
import { Code2, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-16 text-center"
      style={{ backgroundColor: "var(--bg)", color: "var(--fg)" }}
    >
      <div
        className="w-full max-w-md p-6 sm:p-8 space-y-6"
        style={{
          border: "1px solid var(--border)",
          borderRadius: "4px",
          backgroundColor: "var(--bg-surface)",
        }}
      >
        {/* 404 Visual */}
        <div
          className="relative mx-auto w-full overflow-hidden"
          style={{
            border: "1px solid var(--border)",
            borderRadius: "3px",
            backgroundColor: "var(--bg-subtle)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif"
            alt="404 Page Not Found"
            className="w-full h-48 sm:h-56 object-cover object-center"
          />
        </div>

        {/* 404 Code & Heading */}
        <div className="space-y-2">
          <div
            className="inline-flex items-center px-2.5 py-1 text-[11px] mono font-bold"
            style={{
              border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)",
              backgroundColor: "color-mix(in srgb, var(--danger) 10%, transparent)",
              color: "var(--danger)",
              borderRadius: "2px",
            }}
          >
            <span>ERROR 404</span>
          </div>
          <h1 className="text-[18px] font-bold tracking-tight" style={{ color: "var(--fg)" }}>
            Page Not Found
          </h1>
          <p className="text-[12px] leading-relaxed" style={{ color: "var(--fg-muted)" }}>
            The requested problem, resource, or developer profile does not exist or has been moved.
          </p>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/" className="btn btn-secondary w-full sm:w-auto text-[12px]">
            <Home className="h-3.5 w-3.5" />
            Home
          </Link>
          <Link href="/problems" className="btn btn-primary w-full sm:w-auto text-[12px]">
            <Code2 className="h-3.5 w-3.5" />
            Browse Problems
          </Link>
        </div>
      </div>
    </div>
  );
}
