"use client";

import React from "react";
import { LazyMotion, domAnimation, m } from "motion/react";
import { useReducedMotion } from "@/components/ui/alert-utils/use-reduced-motion";

interface CheckmarkDrawProps {
  size?: number;
  className?: string;
}

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/**
 * Self-drawing green ring + checkmark SVG path for the Accepted celebration.
 */
export function CheckmarkDraw({ size = 56, className }: CheckmarkDrawProps) {
  const reduced = useReducedMotion();

  return (
    <LazyMotion features={domAnimation} strict>
      <div
        className={`relative inline-flex items-center justify-center ${className || ""}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 56 56"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Soft inner fill */}
          <m.circle
            cx="28"
            cy="28"
            r="24"
            fill="rgba(34, 197, 94, 0.14)"
            initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={
              reduced ? { duration: 0 } : { duration: 0.26, ease: EASE_OUT }
            }
          />
          {/* Self-drawing outer ring */}
          <m.circle
            cx="28"
            cy="28"
            r="24"
            stroke="#22C55E"
            strokeWidth="2.75"
            strokeLinecap="round"
            initial={
              reduced ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0.5 }
            }
            animate={{ pathLength: 1, opacity: 1 }}
            transition={
              reduced
                ? { duration: 0 }
                : { duration: 0.42, ease: EASE_OUT }
            }
          />
          {/* Self-drawing checkmark */}
          <m.path
            d="M18.5 28.5L25 35L38 21.5"
            stroke="#4ADE80"
            strokeWidth="3.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={
              reduced ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }
            }
            animate={{ pathLength: 1, opacity: 1 }}
            transition={
              reduced
                ? { duration: 0 }
                : { duration: 0.32, delay: 0.22, ease: EASE_OUT }
            }
          />
        </svg>
      </div>
    </LazyMotion>
  );
}
