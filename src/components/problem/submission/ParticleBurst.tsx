"use client";

import React, { useEffect, useRef } from "react";
import { useReducedMotion } from "@/components/ui/alert-utils/use-reduced-motion";

interface ParticleBurstProps {
  active: boolean;
  particleCount?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  vRot: number;
}

const COLORS = ["#22C55E", "#4ADE80", "#22D3EE", "#FBBF24", "#A7F3D0"];
const BURST_DURATION_MS = 1200;

/**
 * Lightweight canvas particle burst (~64 sparks) lasting ~1.2s, no looping.
 * Automatically disabled when `prefers-reduced-motion` is active or tab is hidden,
 * and cleans up `requestAnimationFrame` and listeners on unmount.
 */
export function ParticleBurst({
  active,
  particleCount = 64,
}: ParticleBurstProps) {
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active || reduced) return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(rect.width, 320);
    const height = Math.max(rect.height, 180);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const originX = width / 2;
    const originY = height * 0.42;
    const cappedCount = Math.min(Math.max(particleCount, 24), 76);

    const particles: Particle[] = Array.from({ length: cappedCount }, (_, i) => {
      const angle =
        (Math.PI * 2 * i) / cappedCount + (Math.random() - 0.5) * 0.35;
      const speed = 2.2 + Math.random() * 4.8;
      return {
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.4,
        size: 2.5 + Math.random() * 3,
        color: COLORS[i % COLORS.length],
        alpha: 1,
        decay: 0.012 + Math.random() * 0.012,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
      };
    });

    let rafId: number | null = null;
    const startTime = performance.now();

    const stopAnimation = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      ctx.clearRect(0, 0, width, height);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopAnimation();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const renderFrame = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed > BURST_DURATION_MS || document.visibilityState === "hidden") {
        stopAnimation();
        return;
      }

      ctx.clearRect(0, 0, width, height);
      let alive = 0;

      for (const p of particles) {
        if (p.alpha <= 0.02) continue;
        alive++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.11; // subtle gravity
        p.vx *= 0.985; // air drag
        p.alpha = Math.max(0, p.alpha - p.decay);
        p.rotation += p.vRot;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
        ctx.restore();
      }

      if (alive > 0) {
        rafId = requestAnimationFrame(renderFrame);
      } else {
        stopAnimation();
      }
    };

    rafId = requestAnimationFrame(renderFrame);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopAnimation();
    };
  }, [active, reduced, particleCount]);

  if (!active || reduced) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
