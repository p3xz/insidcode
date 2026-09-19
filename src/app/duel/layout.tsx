import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "1v1 Duel Arena",
  description:
    "Challenge peers in real-time best-of-three algorithmic head-to-head coding duels.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DuelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
