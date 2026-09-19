import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicProblem } from "@/lib/problems";
import { ProblemPageClient } from "@/components/problem/ProblemPageClient";

interface Props {
  params: Promise<{ id: string }>;
}

const BASE_URL = "https://insidcode.vercel.app";

const PHASE_LABELS: Record<number, string> = {
  1: "Conditional Thinking",
  2: "Looping and Patterns",
  3: "Recursion",
  4: "Basic Arrays",
  5: "Strings",
  6: "Mixed Logical Challenges",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const problem = await getPublicProblem(id);

  if (!problem) {
    return {
      title: "Problem Not Found",
      description: "The requested programming problem could not be found on InsidCode.",
      robots: { index: false, follow: false },
    };
  }

  const phaseLabel = PHASE_LABELS[problem.phase] ?? `Phase ${problem.phase}`;
  const canonicalUrl = `${BASE_URL}/problems/${problem.slug}`;

  const title = `${problem.title} — ${problem.difficulty} Programming Problem`;
  const description = `Practice "${problem.title}" on InsidCode. A ${problem.difficulty.toLowerCase()} ${phaseLabel.toLowerCase()} challenge — solve it in Python, JavaScript, C, C++, or Java with instant code execution and server-verified tests.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/problems/${problem.slug}`,
    },
    openGraph: {
      title: `${problem.title} | InsidCode`,
      description,
      url: canonicalUrl,
      type: "website",
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: `InsidCode — ${problem.title}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${problem.title} | InsidCode`,
      description,
      images: ["/og-image.jpg"],
    },
  };
}

// Server-rendered SEO content for a problem.
// The actual interactive workspace (Monaco, Run, Submit) is in ProblemPageClient.
export default async function SingleProblemPage({ params }: Props) {
  const { id } = await params;
  const problem = await getPublicProblem(id);

  if (!problem) {
    notFound();
  }

  const phaseLabel = PHASE_LABELS[problem.phase] ?? `Phase ${problem.phase}`;
  const canonicalUrl = `${BASE_URL}/problems/${problem.slug}`;

  // BreadcrumbList JSON-LD — per-problem
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: BASE_URL + "/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Problems",
        item: BASE_URL + "/problems",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: problem.title,
        item: canonicalUrl,
      },
    ],
  };

  // Determine which languages have starter templates (truthful claim only)
  const availableLanguages = [
    problem.starterTemplates?.python ? "Python" : null,
    problem.starterTemplates?.javascript ? "JavaScript" : null,
    problem.starterTemplates?.c ? "C" : null,
    problem.starterTemplates?.cpp ? "C++" : null,
    problem.starterTemplates?.java ? "Java" : null,
  ].filter(Boolean) as string[];

  const languageDisplay =
    availableLanguages.length > 0
      ? availableLanguages.join(", ")
      : "Python, JavaScript, C, C++, Java";

  return (
    <>
      {/* BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/*
        Server-rendered problem header — visible in initial HTML for crawlers.
        Styled to be invisible to users (position: absolute, out of flow) so
        ProblemWorkspace renders the full interactive UI below without layout conflict.
        This content is read by search engines from the HTML source.
      */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {/* Breadcrumb navigation for crawlers */}
        <nav aria-label="Breadcrumb">
          <ol>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/problems">Problems</Link></li>
            <li>{problem.title}</li>
          </ol>
        </nav>

        {/* Problem metadata for crawlers */}
        <article>
          <header>
            <h1>{problem.title}</h1>
            <p>Difficulty: {problem.difficulty}</p>
            <p>Phase: {problem.phase} — {phaseLabel}</p>
            <p>XP Reward: {problem.xp} XP</p>
            {problem.tags.length > 0 && (
              <p>Topics: {problem.tags.join(", ")}</p>
            )}
            <p>Supported Languages: {languageDisplay}</p>
          </header>

          <section>
            <h2>Problem Description</h2>
            <p>{problem.description}</p>
          </section>

          {problem.constraints.length > 0 && (
            <section>
              <h2>Constraints</h2>
              <ul>
                {problem.constraints.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </section>
          )}

          {problem.examples.length > 0 && (
            <section>
              <h2>Examples</h2>
              {problem.examples.map((ex, i) => (
                <div key={i}>
                  <h3>Example {i + 1}</h3>
                  <p>Input: {ex.input}</p>
                  <p>Output: {ex.output}</p>
                  {ex.explanation && <p>Explanation: {ex.explanation}</p>}
                </div>
              ))}
            </section>
          )}
        </article>
      </div>

      {/* Full interactive problem workspace — client component, unchanged */}
      <ProblemPageClient problemId={problem.problemId} problemSlug={problem.slug} />
    </>
  );
}
