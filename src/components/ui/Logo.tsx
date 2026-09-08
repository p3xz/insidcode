import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ className = "", size = "md", showText = true }: LogoProps) {
  const sizeMap = {
    sm: { icon: 20, text: "text-base", gap: "gap-1.5" },
    md: { icon: 26, text: "text-lg", gap: "gap-2" },
    lg: { icon: 34, text: "text-2xl", gap: "gap-2.5" },
  };

  const { icon: iconSize, text: textClass, gap: gapClass } = sizeMap[size];

  return (
    <div className={`inline-flex items-center ${gapClass} font-mono font-bold tracking-tight select-none ${className}`}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Background rounded frame */}
        <rect width="32" height="32" rx="7" fill="#11131A" stroke="#252936" strokeWidth="1.5" />
        {/* Outer Code Brackets */}
        <path
          d="M10 11L5 16L10 21"
          stroke="#00F0FF"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M22 11L27 16L22 21"
          stroke="#00F0FF"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Inner Core Accent */}
        <path
          d="M18 10L14 22"
          stroke="#39FF14"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      {showText && (
        <span className={`${textClass} font-semibold tracking-tight text-[#F5F7FA]`}>
          insid<span className="text-[#00F0FF]">code</span>
        </span>
      )}
    </div>
  );
}

export function LogoIcon({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" rx="7" fill="#11131A" stroke="#252936" strokeWidth="1.5" />
      <path
        d="M10 11L5 16L10 21"
        stroke="#00F0FF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 11L27 16L22 21"
        stroke="#00F0FF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 10L14 22"
        stroke="#39FF14"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
