import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Problems Directory",
  description:
    "Explore 330+ structured programming logic challenges across conditional logic, loops, recursion, arrays, strings, and placement OA interview patterns.",
  alternates: {
    canonical: "/problems",
  },
  openGraph: {
    title: "Problems Directory | InsidCode",
    description:
      "Explore 330+ structured programming logic challenges across conditional logic, loops, recursion, arrays, strings, and placement OA interview patterns.",
    url: "https://insidcode.vercel.app/problems",
  },
};

export default function ProblemsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
