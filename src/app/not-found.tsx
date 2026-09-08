import React from "react";
import Link from "next/link";
import { Code2, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem-4rem)] flex-col items-center justify-center bg-[#090A0F] px-4 py-16 text-center text-[#F5F7FA]">
      <div className="w-full max-w-md rounded-2xl border border-[#252936] bg-[#11131A] p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Animated 404 Illustration */}
        <div className="relative mx-auto w-full overflow-hidden rounded-xl border border-[#252936] bg-[#090A0F]">
          <img
            src="https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif"
            alt="404 Page Not Found"
            className="w-full h-48 sm:h-56 object-cover object-center"
          />
        </div>

        {/* 404 Code & Heading */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FF4D6D]/30 bg-[#FF4D6D]/10 px-3 py-1 text-xs font-mono font-bold text-[#FF4D6D]">
            <span>ERROR 404</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#F5F7FA]">
            Page Not Found
          </h1>
          <p className="text-xs text-[#8B93A7] leading-relaxed">
            The requested problem, resource, or developer profile does not exist or has been moved.
          </p>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-[#252936] bg-[#181B24] px-4 py-2.5 text-xs font-semibold text-[#F5F7FA] hover:border-[#363C4E] hover:bg-[#252936] transition"
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </Link>
          <Link
            href="/problems"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-[#00F0FF] px-4 py-2.5 text-xs font-bold text-[#090A0F] hover:bg-[#00F0FF]/90 transition"
          >
            <Code2 className="h-3.5 w-3.5" />
            Browse Problems
          </Link>
        </div>
      </div>
    </div>
  );
}
