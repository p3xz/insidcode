import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feedback & Bug Report",
  description:
    "Report issues, submit feature requests, or share feedback on the InsidCode algorithmic practice platform.",
  alternates: {
    canonical: "/feedback",
  },
  openGraph: {
    title: "Feedback & Bug Report | InsidCode",
    description:
      "Report issues, submit feature requests, or share feedback on the InsidCode algorithmic practice platform.",
    url: "https://insidcode.vercel.app/feedback",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "InsidCode Feedback",
      },
    ],
  },
};

export default function FeedbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
