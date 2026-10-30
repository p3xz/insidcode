import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as fs from "fs";
import * as path from "path";
import {
  Skeleton,
  SkeletonRegion,
  SkeletonTableRows,
  SkeletonEditor,
  SkeletonAvatarRow,
  SkeletonCard,
  SkeletonText,
} from "../src/components/ui/Skeleton";
import {
  StatsPageSkeleton,
  ProfilePageSkeleton,
  SettingsPageSkeleton,
  ProblemPageSkeleton,
  AdminTableSkeleton,
  NotificationListSkeleton,
} from "../src/components/ui/PageSkeletons";

let passed = 0;
let failed = 0;
function check(cond: boolean, name: string) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}`);
  }
}
const h = React.createElement;
const html = (el: React.ReactElement) => renderToStaticMarkup(el);

console.log("\nSkeleton primitives");
{
  const out = html(h(Skeleton, { style: { height: 10, width: 20 } }));
  check(out.includes('aria-hidden="true"'), "Skeleton block is aria-hidden");
  check(out.includes('class="skeleton'), "Skeleton uses the shared .skeleton class");
}
{
  const out = html(h(SkeletonRegion, { label: "Loading problems", children: h("div") }));
  check(out.includes('aria-busy="true"'), "Region sets aria-busy=true");
  check(out.includes('role="status"'), "Region has role=status");
  check(out.includes("sr-only") && out.includes("Loading problems"), "Region has visually hidden status text");
}

console.log("\nLayout stability (fixed heights)");
{
  const a = html(h(SkeletonTableRows, { rows: 10, rowHeight: 49 }));
  const rows = a.match(/height:49px/g) || [];
  check(rows.length === 10, "Table skeleton renders 10 rows each fixed at 49px");
  const b = html(h(SkeletonTableRows, { rows: 12, rowHeight: 49 }));
  check((b.match(/height:49px/g) || []).length === 12, "Table skeleton row count is configurable (12)");
}
{
  const out = html(h(AdminTableSkeleton, { rows: 8, label: "Loading users" }));
  check(out.includes("min-height:448px"), "Admin skeleton reserves rows x 56px (448px) minimum height");
  check((out.match(/height:56px/g) || []).length === 8, "Admin skeleton rows are fixed at 56px");
}
{
  const out = html(h(NotificationListSkeleton, { rows: 4 }));
  check(out.includes("min-height:240px"), "Notification skeleton reserves 4 x 60px");
}
{
  const out = html(h(SkeletonAvatarRow, { size: 28 }));
  check(out.includes("height:28px") && out.includes("width:28px"), "Avatar row keeps the real 28px avatar size");
}
{
  const out = html(h(SkeletonCard, { height: 73 }));
  check(out.includes("height:73px"), "Card honors a fixed height");
  const t = html(h(SkeletonText, { lines: 5 }));
  check((t.match(/class="skeleton/g) || []).length === 5, "SkeletonText renders the requested line count");
  const e = html(h(SkeletonEditor, { lines: 14 }));
  check((e.match(/class="skeleton/g) || []).length >= 14, "Editor skeleton renders gutter and code bars");
}

console.log("\nPage skeletons: accessibility and no spinners");
const pages: [string, React.ReactElement][] = [
  ["Stats", h(StatsPageSkeleton)],
  ["Profile", h(ProfilePageSkeleton)],
  ["Settings", h(SettingsPageSkeleton)],
  ["Problem", h(ProblemPageSkeleton)],
];
for (const [name, el] of pages) {
  const out = html(el);
  check(out.includes('aria-busy="true"'), `${name} skeleton is aria-busy`);
  check(out.includes("sr-only"), `${name} skeleton has a hidden status label`);
  check(!out.includes("animate-spin"), `${name} skeleton contains no spinner`);
}
{
  const out = html(h(ProblemPageSkeleton));
  check(out.includes("calc(100vh - 3.5rem)"), "Problem skeleton uses the same viewport height as the workspace");
  check(out.includes("lg:col-span-5") && out.includes("lg:col-span-7"), "Problem skeleton mirrors the 5/7 two-pane grid");
}

console.log("\nCSS: shimmer and reduced motion");
{
  const css = fs.readFileSync(path.join(__dirname, "../src/app/globals.css"), "utf8");
  const sweep = css.match(/@keyframes skeleton-sweep \{[\s\S]*?\n\}/);
  check(!!sweep, "skeleton-sweep keyframes exist");
  check(!!sweep && /background-position/.test(sweep[0]) && !/(width|height|margin|padding|top|left)\s*:/.test(sweep[0]), "Shimmer animates background-position only (no layout properties)");
  const rm = css.match(/@media \(prefers-reduced-motion: reduce\) \{\s*\.skeleton \{[\s\S]*?\}\s*\}/);
  check(!!rm && /animation:\s*none/.test(rm[0]), "Reduced motion disables the skeleton animation (static dim block)");
}

console.log("\nRemaining spinners (source scan)");
{
  const root = path.join(__dirname, "../src");
  const hits: string[] = [];
  const walk = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.tsx$/.test(e.name)) {
        const lines = fs.readFileSync(p, "utf8").split(/\r?\n/);
        lines.forEach((l, i) => {
          if (/animate-spin/.test(l)) hits.push(`${path.relative(root, p)}:${i + 1}`);
        });
      }
    }
  };
  walk(root);
  console.log("  spinner sites:\n   " + hits.join("\n   "));
  const pageLevel = hits.filter((x) => /(problems[\\/]page|leaderboard|stats[\\/]page|profile|ProblemPageClient|AdminProblemManagement|admin[\\/]|NotificationDropdown)/.test(x));
  check(pageLevel.length === 0, "No spinners remain on the data-loading pages/panels");
}

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
