"use client";

import React, { useEffect } from "react";
import { AnimatePresence, LazyMotion, domAnimation, m } from "motion/react";
import { Flame, Sparkles, FastForward } from "lucide-react";
import { SubmissionLifecycleResult } from "@/hooks/useSubmissionLifecycle";
import { useReducedMotion } from "@/components/ui/alert-utils/use-reduced-motion";
import { CheckmarkDraw } from "./CheckmarkDraw";
import { ParticleBurst } from "./ParticleBurst";
import { AnimatedNumber } from "./AnimatedNumber";

interface SubmissionStatusOverlayProps {
  open: boolean;
  result: SubmissionLifecycleResult | null;
  onSkip: () => void;
}

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const ACCEPTED_LETTERS = "ACCEPTED".split("");

/**
 * Full-panel (never full-screen) celebration overlay inside the results pane for Accepted verdicts.
 * - Driven strictly by real backend values (`testsPassed`, `totalTests`, `awardedXp`, `currentStreak`).
 * - Can be skipped at any time via Escape, clicking anywhere on the overlay, or the "Skip" button.
 * - Auto-settles after ~3s via `useSubmissionLifecycle`.
 */
export function SubmissionStatusOverlay({
  open,
  result,
  onSkip,
}: SubmissionStatusOverlayProps) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onSkip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onSkip]);

  if (!result || result.status !== "Accepted") {
    return null;
  }

  const hasXpReward = result.awardedXp > 0;
  const showStreakPulse =
    result.streakIncreased && result.currentStreak > 0;

  return (
    <LazyMotion features={domAnimation} strict>
      <AnimatePresence>
        {open && (
          <m.div
            key={`accepted-overlay-${result.submissionId}`}
            role="dialog"
            aria-modal="false"
            aria-label="Solution accepted celebration"
            onClick={onSkip}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduced ? { duration: 0.1 } : { duration: 0.22, ease: EASE_OUT }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden bg-[#090A0F]/95 px-4 py-3 text-center backdrop-blur-md cursor-pointer select-none"
          >
            {/* Radial green burst from center */}
            <m.div
              aria-hidden="true"
              initial={
                reduced
                  ? { opacity: 0.25, scale: 1 }
                  : { opacity: 0, scale: 0.4 }
              }
              animate={{ opacity: hasXpReward ? 0.38 : 0.2, scale: 1.35 }}
              transition={
                reduced ? { duration: 0 } : { duration: 0.65, ease: EASE_OUT }
              }
              className="pointer-events-none absolute h-52 w-52 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(34,197,94,0.35) 0%, rgba(34,211,238,0.12) 45%, rgba(9,10,15,0) 72%)",
              }}
            />

            {/* Short 1.2s particle burst (only when motion allowed) */}
            <ParticleBurst
              active={open && !reduced}
              particleCount={hasXpReward ? 68 : 36}
            />

            {/* Skip button in top-right corner */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSkip();
              }}
              aria-label="Skip celebration animation"
              className="absolute right-3 top-2.5 z-10 inline-flex items-center gap-1 rounded-md border border-[#252936] bg-[#11131A]/90 px-2.5 py-1 text-[11px] font-medium text-[#8B93A7] hover:border-[#22D3EE]/50 hover:text-[#F5F7FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] transition"
            >
              <span>Skip</span>
              <FastForward className="h-3 w-3" />
              <kbd className="ml-0.5 rounded bg-[#181B24] px-1 py-0.2 text-[9px] text-[#8B93A7]">
                Esc
              </kbd>
            </button>

            {/* Self-drawing checkmark ring */}
            <CheckmarkDraw size={48} className="mb-1.5" />

            {/* ACCEPTED title with scale-and-settle + letter stagger */}
            <m.div
              initial={reduced ? { scale: 1, opacity: 1 } : { scale: 1.22, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={
                reduced
                  ? { duration: 0 }
                  : { duration: 0.26, delay: 0.12, ease: EASE_OUT }
              }
              className="flex items-center justify-center tracking-wider font-extrabold text-lg sm:text-xl text-[#4ADE80]"
            >
              {ACCEPTED_LETTERS.map((letter, idx) => (
                <m.span
                  key={idx}
                  initial={
                    reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    reduced
                      ? { duration: 0 }
                      : {
                          duration: 0.18,
                          delay: 0.14 + idx * 0.025,
                          ease: EASE_OUT,
                        }
                  }
                >
                  {letter}
                </m.span>
              ))}
            </m.div>

            {/* Real test count-up */}
            {result.totalTests > 0 && (
              <p className="mt-1 font-mono text-xs text-[#ECEEF3]">
                <AnimatedNumber
                  from={0}
                  value={result.testsPassed}
                  duration={0.55}
                  className="font-bold text-[#4ADE80]"
                />
                <span>/{result.totalTests} tests passed</span>
                {result.runtime > 0 && (
                  <span className="ml-2 text-[#8B93A7]">
                    · {result.runtime}s
                  </span>
                )}
              </p>
            )}

            {/* Real XP & Streak rewards (or quiet message when already solved with 0 XP) */}
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
              {hasXpReward ? (
                <m.div
                  initial={
                    reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 12, scale: 0.9 }
                  }
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { duration: 0.32, delay: 0.28, ease: EASE_OUT }
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#22D3EE]/40 bg-[#22D3EE]/15 px-3 py-1 text-xs font-bold text-[#22D3EE] shadow-sm"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>
                    +<AnimatedNumber from={0} value={result.awardedXp} duration={0.6} /> XP
                  </span>
                </m.div>
              ) : (
                <span className="text-[11px] text-[#8B93A7]">
                  Previously solved · Solution verified
                </span>
              )}

              {showStreakPulse && (
                <m.div
                  initial={
                    reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }
                  }
                  animate={{ opacity: 1, scale: [1, 1.08, 1] }}
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { duration: 0.4, delay: 0.36, ease: EASE_OUT }
                  }
                  className="inline-flex items-center gap-1 rounded-full border border-[#F59E0B]/40 bg-[#F59E0B]/15 px-2.5 py-1 text-xs font-bold text-[#FBBF24]"
                >
                  <Flame className="h-3.5 w-3.5" />
                  <span>{result.currentStreak}-day streak</span>
                </m.div>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
