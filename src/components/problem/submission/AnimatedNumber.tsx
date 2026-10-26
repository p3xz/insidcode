"use client";

import React, { useEffect, useRef } from "react";
import { animate, useMotionValue } from "motion/react";
import { useReducedMotion } from "@/components/ui/alert-utils/use-reduced-motion";

interface AnimatedNumberProps {
  value: number;
  from?: number;
  duration?: number;
  className?: string;
  format?: (val: number) => string;
}

/**
 * Animates a number using a MotionValue written directly to a DOM node's textContent
 * (zero per-frame React state updates). Immediately displays `value` when reduced motion is enabled.
 */
export function AnimatedNumber({
  value,
  from,
  duration = 0.65,
  className,
  format,
}: AnimatedNumberProps) {
  const reduced = useReducedMotion();
  const initialVal = from !== undefined ? from : value;
  const motionVal = useMotionValue(initialVal);
  const spanRef = useRef<HTMLSpanElement>(null);
  const prevValueRef = useRef<number>(initialVal);

  const formatter = useRef(format);

  useEffect(() => {
    formatter.current = format;
  }, [format]);

  useEffect(() => {
    const node = spanRef.current;
    if (!node) return;

    const formatNumber = (n: number) => {
      const rounded = Math.round(n);
      return formatter.current
        ? formatter.current(rounded)
        : String(rounded);
    };

    const startValue = from !== undefined ? from : prevValueRef.current;
    prevValueRef.current = value;

    if (reduced || startValue === value) {
      motionVal.set(value);
      node.textContent = formatNumber(value);
      return;
    }

    motionVal.set(startValue);
    node.textContent = formatNumber(startValue);

    const unsubscribe = motionVal.on("change", (latest) => {
      if (spanRef.current) {
        spanRef.current.textContent = formatNumber(latest);
      }
    });

    const controls = animate(motionVal, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });

    return () => {
      unsubscribe();
      controls.stop();
    };
  }, [value, from, duration, reduced, motionVal]);

  const initialDisplay = format
    ? format(Math.round(reduced ? value : initialVal))
    : String(Math.round(reduced ? value : initialVal));

  return (
    <span ref={spanRef} className={className}>
      {initialDisplay}
    </span>
  );
}
