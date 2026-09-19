import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Global Leaderboard",
  description:
    "View top problem solvers, global XP rankings, solve streaks, and duel champions on InsidCode.",
  alternates: {
    canonical: "/leaderboard",
  },
  openGraph: {
    title: "Global Leaderboard | InsidCode",
    description:
      "View top problem solvers, global XP rankings, solve streaks, and duel champions on InsidCode.",
    url: "https://insidcode.vercel.app/leaderboard",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "InsidCode Global Leaderboard",
      },
    ],
  },
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
