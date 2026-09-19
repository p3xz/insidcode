import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { SessionProvider } from "@/components/layout/SessionProvider";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { OnboardingGuard } from "@/components/layout/OnboardingGuard";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://insidcode.vercel.app"),
  title: {
    default: "InsidCode — Programming Logic Practice Before DSA",
    template: "%s | InsidCode",
  },
  description:
    "Practice programming logic with beginner-friendly coding problems, instant code execution, submissions, XP, streaks, and coding Duels. Build strong fundamentals before DSA.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "InsidCode — Programming Logic Practice Before DSA",
    description:
      "Practice programming logic with beginner-friendly coding problems, instant code execution, submissions, XP, streaks, and coding Duels. Build strong fundamentals before DSA.",
    url: "https://insidcode.vercel.app",
    siteName: "InsidCode",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "InsidCode — Programming Logic Practice Before DSA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "InsidCode — Programming Logic Practice Before DSA",
    description:
      "Practice programming logic with beginner-friendly coding problems, instant code execution, submissions, XP, streaks, and coding Duels. Build strong fundamentals before DSA.",
    creator: "@p3xz",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "google-site-verification-placeholder",
    other: {
      "strix-verification": "strix-verify-adb8f5d4b7c98147c0e19528a66bb330",
    },
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('insidcode-theme')||'system';var r=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;document.documentElement.setAttribute('data-theme',r);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://insidcode.vercel.app/#website",
                  name: "InsidCode",
                  url: "https://insidcode.vercel.app",
                  description:
                    "A programming logic practice platform with 330+ structured challenges, isolated code execution, XP, streaks, and 1v1 Duels — designed to build strong fundamentals before DSA.",
                  potentialAction: {
                    "@type": "SearchAction",
                    target: {
                      "@type": "EntryPoint",
                      urlTemplate:
                        "https://insidcode.vercel.app/problems?search={search_term_string}",
                    },
                    "query-input": "required name=search_term_string",
                  },
                },
                {
                  "@type": "SoftwareApplication",
                  "@id": "https://insidcode.vercel.app/#application",
                  name: "InsidCode",
                  url: "https://insidcode.vercel.app",
                  applicationCategory: "EducationalApplication",
                  operatingSystem: "Web",
                  description:
                    "InsidCode is a web-based programming logic practice platform. It offers 330+ structured coding challenges across six progressive phases — covering conditionals, loops, recursion, arrays, strings, and placement OA patterns — with isolated sandboxed code execution, server-verified hidden tests, XP, practice streaks, and real-time 1v1 coding Duels.",
                  offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "USD",
                  },
                  author: {
                    "@type": "Person",
                    name: "Namish Yadav",
                  },
                  inLanguage: "en",
                },
              ],
            }),
          }}
        />
      </head>

      <body
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen antialiased`}
        style={{ backgroundColor: "var(--bg)", color: "var(--fg)" }}
      >
        <ThemeProvider>
          <SessionProvider>
            <OnboardingGuard>
              <div
                className="flex min-h-screen flex-col"
                style={{ backgroundColor: "var(--bg)", color: "var(--fg)" }}
              >
                <Navbar />
                <main className="flex-1 w-full" style={{ backgroundColor: "var(--bg)" }}>
                  {children}
                </main>
                <Footer />
                <BottomNav />
              </div>
            </OnboardingGuard>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
