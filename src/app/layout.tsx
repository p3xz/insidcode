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
    default: "InsidCode | Master Programming Logic Before DSA",
    template: "%s | InsidCode",
  },
  description:
    "Master foundational programming logic, recursion, arrays, and algorithms with 330+ structured challenges and isolated code execution before diving into DSA.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "InsidCode | Master Programming Logic Before DSA",
    description:
      "Master foundational programming logic, recursion, arrays, and algorithms with 330+ structured challenges and isolated code execution before diving into DSA.",
    url: "https://insidcode.vercel.app",
    siteName: "InsidCode",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "InsidCode | Master Programming Logic Before DSA",
    description:
      "Master foundational programming logic, recursion, arrays, and algorithms with 330+ structured challenges and isolated code execution before diving into DSA.",
    creator: "@p3xz",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "google-site-verification-placeholder",
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
