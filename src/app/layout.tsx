import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { SessionProvider } from "@/components/layout/SessionProvider";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

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
  title: "Insidcode",
  description:
    "Master your programming logic before DSA with 330+ structured challenges and isolated code execution.",
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
        {/* No-flash theme script — runs before React hydration */}
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
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
