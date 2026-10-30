import React from "react";

/**
 * Skeleton primitives. Blocks are decorative (aria-hidden); the surrounding
 * <SkeletonRegion> announces the loading state to assistive tech.
 * Shimmer is CSS-only (see `.skeleton` in globals.css) and is disabled
 * under prefers-reduced-motion.
 */

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = "", style }: SkeletonProps) {
  return <span aria-hidden="true" className={`skeleton ${className}`} style={style} />;
}

interface SkeletonRegionProps {
  /** Visually hidden text announced as the loading status, e.g. "Loading problems". */
  label: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export function SkeletonRegion({ label, className, style, children }: SkeletonRegionProps) {
  return (
    <div aria-busy="true" role="status" className={className} style={style}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Lines of text with varied widths. Line height matches 12-13px body copy. */
export function SkeletonText({
  lines = 3,
  className = "",
  lineHeight = 12,
  gap = 8,
}: {
  lines?: number;
  className?: string;
  lineHeight?: number;
  gap?: number;
}) {
  const widths = ["100%", "92%", "78%", "96%", "60%"];
  return (
    <div aria-hidden="true" className={className} style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} style={{ height: lineHeight, width: widths[i % widths.length] }} />
      ))}
    </div>
  );
}

/** Bordered card with a title bar and body lines. */
export function SkeletonCard({
  height,
  lines = 2,
  className = "",
}: {
  height?: number;
  lines?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`p-3 ${className}`}
      style={{
        height,
        border: "1px solid var(--border)",
        borderRadius: 3,
        backgroundColor: "var(--bg)",
      }}
    >
      <Skeleton style={{ height: 10, width: 28, marginBottom: 8 }} />
      <Skeleton style={{ height: 12, width: "70%", marginBottom: 8 }} />
      {lines > 1 && <Skeleton style={{ height: 2, width: "100%" }} />}
    </div>
  );
}

/** Avatar square (matches the 28px rounded-square avatars used in the app) plus two text lines. */
export function SkeletonAvatarRow({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={`flex items-center gap-2.5 ${className}`}>
      <Skeleton style={{ height: size, width: size, flexShrink: 0 }} />
      <div className="flex flex-col gap-1.5" style={{ minWidth: 0, flex: 1 }}>
        <Skeleton style={{ height: 12, width: "55%" }} />
        <Skeleton style={{ height: 9, width: "35%" }} />
      </div>
    </div>
  );
}

/**
 * Table body rows with fixed row height so nothing shifts when data arrives.
 * `columns` are width percentages; the first column renders a small status dot.
 */
export function SkeletonTableRows({
  rows = 10,
  columns = [4, 8, 38, 8, 12, 8, 14],
  rowHeight = 45,
}: {
  rows?: number;
  columns?: number[];
  rowHeight?: number;
}) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 px-4"
          style={{
            height: rowHeight,
            borderBottom: r < rows - 1 ? "1px solid var(--border)" : "none",
          }}
        >
          {columns.map((w, c) => (
            <Skeleton
              key={c}
              style={{
                height: c === 0 ? 16 : 11,
                width: c === 0 ? 16 : `${w}%`,
                borderRadius: c === 0 ? 999 : 3,
                flexShrink: c === 0 ? 0 : undefined,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Code editor placeholder: line-number gutter plus code bars of varied widths. */
export function SkeletonEditor({
  lines = 14,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  const widths = [40, 0, 62, 55, 70, 48, 0, 34, 66, 58, 28, 0, 52, 44];
  return (
    <div
      aria-hidden="true"
      className={`flex h-full w-full overflow-hidden ${className}`}
      style={{ backgroundColor: "#090A0F" }}
    >
      <div
        className="flex flex-col items-end gap-[9px] py-3 pr-3 pl-4"
        style={{ borderRight: "1px solid var(--border)" }}
      >
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} style={{ height: 9, width: 14 }} />
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-[9px] py-3 px-4">
        {Array.from({ length: lines }).map((_, i) => {
          const w = widths[i % widths.length];
          return w === 0 ? (
            <span key={i} style={{ height: 9 }} />
          ) : (
            <Skeleton key={i} style={{ height: 9, width: `${w}%` }} />
          );
        })}
      </div>
    </div>
  );
}
