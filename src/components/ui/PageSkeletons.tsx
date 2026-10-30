import React from "react";
import {
  Skeleton,
  SkeletonRegion,
  SkeletonText,
  SkeletonAvatarRow,
  SkeletonEditor,
} from "@/components/ui/Skeleton";

/**
 * Page-level skeletons that mirror the real page containers
 * (same max-width, padding and section heights) so content does not jump.
 */

function Divider() {
  return <div style={{ borderBottom: "1px solid var(--border)" }} />;
}

/** Mirrors /stats: header, 4 metric cells, duel row, heatmap block. */
export function StatsPageSkeleton() {
  return (
    <SkeletonRegion label="Loading statistics" className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="pb-6" style={{ borderBottom: "1px solid var(--border)" }} aria-hidden="true">
        <Skeleton style={{ height: 10, width: 64, marginBottom: 6 }} />
        <Skeleton style={{ height: 26, width: 260 }} />
        <Skeleton style={{ height: 12, width: "60%", marginTop: 8 }} />
      </div>
      <div
        className="grid grid-cols-2 sm:grid-cols-4"
        style={{ borderBottom: "1px solid var(--border)" }}
        aria-hidden="true"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-5 py-6 space-y-1">
            <Skeleton style={{ height: 10, width: "55%" }} />
            <Skeleton style={{ height: 32, width: "50%", marginTop: 8 }} />
          </div>
        ))}
      </div>
      <div className="py-6" aria-hidden="true">
        <Skeleton style={{ height: 12, width: 120, marginBottom: 14 }} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} style={{ height: 44 }} />
          ))}
        </div>
      </div>
      <Divider />
      <div className="py-6" aria-hidden="true">
        <Skeleton style={{ height: 12, width: 160, marginBottom: 14 }} />
        <Skeleton style={{ height: 112, width: "100%" }} />
      </div>
    </SkeletonRegion>
  );
}

/** Mirrors /profile/[username]: avatar header, 4 metrics, activity grid. */
export function ProfilePageSkeleton() {
  return (
    <SkeletonRegion label="Loading profile" className="mx-auto max-w-5xl px-4 py-10 sm:px-6 space-y-8">
      <div className="pb-8" style={{ borderBottom: "1px solid var(--border)" }} aria-hidden="true">
        <div className="flex items-center gap-4">
          <Skeleton style={{ height: 64, width: 64, flexShrink: 0 }} />
          <div className="flex flex-col gap-2" style={{ flex: 1 }}>
            <Skeleton style={{ height: 22, width: 180 }} />
            <Skeleton style={{ height: 12, width: 110 }} />
            <Skeleton style={{ height: 11, width: 140 }} />
          </div>
        </div>
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton style={{ height: 10, width: "50%" }} />
              <Skeleton style={{ height: 24, width: "60%", marginTop: 6 }} />
            </div>
          ))}
        </div>
      </div>
      <div aria-hidden="true">
        <Skeleton style={{ height: 12, width: 160, marginBottom: 14 }} />
        <Skeleton style={{ height: 112, width: "100%" }} />
      </div>
    </SkeletonRegion>
  );
}

/** Mirrors /settings: header plus stacked section cards. */
export function SettingsPageSkeleton() {
  return (
    <SkeletonRegion label="Loading settings" className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-8">
      <div className="pb-6" style={{ borderBottom: "1px solid var(--border)" }} aria-hidden="true">
        <Skeleton style={{ height: 28, width: 260 }} />
        <Skeleton style={{ height: 12, width: "55%", marginTop: 8 }} />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="p-5 space-y-4"
          style={{ border: "1px solid var(--border)", borderRadius: 3 }}
        >
          <Skeleton style={{ height: 14, width: 180 }} />
          <SkeletonText lines={2} />
          <Skeleton style={{ height: 34, width: "100%" }} />
        </div>
      ))}
    </SkeletonRegion>
  );
}

/**
 * Mirrors the problem workspace: mobile tab bar, left description pane
 * (lg:col-span-5) and right editor + output panes (lg:col-span-7).
 */
export function ProblemPageSkeleton() {
  return (
    <SkeletonRegion
      label="Loading problem"
      className="flex flex-col w-full bg-[#090A0F]"
      style={{ height: "calc(100vh - 3.5rem)" }}
    >
      <div
        className="flex lg:hidden items-center gap-2 px-3 py-2"
        style={{ borderBottom: "1px solid #252936", backgroundColor: "#11131A" }}
        aria-hidden="true"
      >
        <Skeleton style={{ height: 28, width: 96 }} />
        <Skeleton style={{ height: 28, width: 96 }} />
        <Skeleton style={{ height: 28, width: 72 }} />
      </div>
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left: description */}
        <div
          className="h-full flex flex-col gap-4 overflow-hidden p-4 sm:p-6 lg:col-span-5"
          style={{ borderRight: "1px solid #252936" }}
          aria-hidden="true"
        >
          <div className="flex gap-2">
            <Skeleton style={{ height: 20, width: 56 }} />
            <Skeleton style={{ height: 20, width: 72 }} />
            <Skeleton style={{ height: 20, width: 64 }} />
          </div>
          <Skeleton style={{ height: 28, width: "70%" }} />
          <Skeleton style={{ height: 12, width: 160 }} />
          <SkeletonText lines={5} className="mt-2" lineHeight={12} gap={9} />
          <SkeletonText lines={3} lineHeight={12} gap={9} />
          <div
            className="p-3 flex flex-col gap-2 mt-2"
            style={{ border: "1px solid #252936", borderRadius: 3 }}
          >
            <Skeleton style={{ height: 10, width: 70 }} />
            <Skeleton style={{ height: 44, width: "100%" }} />
            <Skeleton style={{ height: 10, width: 70 }} />
            <Skeleton style={{ height: 44, width: "100%" }} />
          </div>
        </div>
        {/* Right: toolbar, editor, output */}
        <div className="hidden lg:flex lg:col-span-7 h-full flex-col overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-2"
            style={{ borderBottom: "1px solid #252936", backgroundColor: "#11131A" }}
            aria-hidden="true"
          >
            <div className="flex gap-2 items-center">
              <Skeleton style={{ height: 28, width: 110 }} />
              <Skeleton style={{ height: 28, width: 90 }} />
            </div>
            <div className="flex gap-2">
              <Skeleton style={{ height: 28, width: 64 }} />
              <Skeleton style={{ height: 28, width: 72 }} />
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <SkeletonEditor />
          </div>
          <div
            className="p-3 flex flex-col gap-2"
            style={{ height: 160, borderTop: "1px solid #252936", backgroundColor: "#0C0E16" }}
            aria-hidden="true"
          >
            <Skeleton style={{ height: 10, width: 80 }} />
            <SkeletonText lines={3} lineHeight={11} gap={8} />
          </div>
        </div>
      </div>
    </SkeletonRegion>
  );
}

/** Generic admin table skeleton: header bar plus avatar rows. */
export function AdminTableSkeleton({ rows = 8, label = "Loading" }: { rows?: number; label?: string }) {
  return (
    <SkeletonRegion label={label} style={{ minHeight: rows * 56 }}>
      <div aria-hidden="true">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4"
            style={{ height: 56, borderBottom: i < rows - 1 ? "1px solid var(--border)" : "none" }}
          >
            <SkeletonAvatarRow className="flex-1" />
            <Skeleton style={{ height: 12, width: 64 }} />
            <Skeleton style={{ height: 12, width: 48 }} />
          </div>
        ))}
      </div>
    </SkeletonRegion>
  );
}

/** Notification dropdown rows (matches compact list items). */
export function NotificationListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <SkeletonRegion label="Loading notifications" style={{ minHeight: rows * 60 }}>
      <div aria-hidden="true">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-3 px-4 py-3" style={{ height: 60 }}>
            <Skeleton style={{ height: 8, width: 8, borderRadius: 999, marginTop: 5, flexShrink: 0 }} />
            <div className="flex flex-col gap-1.5 flex-1">
              <Skeleton style={{ height: 11, width: "70%" }} />
              <Skeleton style={{ height: 10, width: "90%" }} />
            </div>
          </div>
        ))}
      </div>
    </SkeletonRegion>
  );
}
