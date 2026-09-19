import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "Explore the latest platform updates, compiler releases, features, and engineering improvements to InsidCode.",
  alternates: {
    canonical: "/changelog",
  },
  openGraph: {
    title: "Changelog | InsidCode",
    description:
      "Explore the latest platform updates, compiler releases, features, and engineering improvements to InsidCode.",
    url: "https://insidcode.vercel.app/changelog",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "InsidCode Changelog",
      },
    ],
  },
};

export default function ChangelogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
