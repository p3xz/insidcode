import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://insidcode.vercel.app";

  return {
    rules: [
      {
        // Default rule for all crawlers — allows public content, blocks private areas
        userAgent: "*",
        allow: [
          "/",
          "/problems",
          "/problems/",
          "/about",
          "/privacy",
          "/terms",
          "/credits",
          "/integrity",
          "/leaderboard",
          "/changelog",
          "/feedback",
        ],
        disallow: [
          "/api/",
          "/admin/",
          "/settings",
          "/onboarding",
          "/login",
          "/profile/",
          "/suspended",
          "/account-restored",
          "/stats",
          "/duel/",
          "/notifications/",
        ],
      },
      {
        // Explicitly allow OAI-SearchBot (ChatGPT Search) to access public content.
        // Per OpenAI documentation, OAI-SearchBot respects robots.txt.
        // Public content is intentionally accessible to AI search crawlers.
        userAgent: "OAI-SearchBot",
        allow: [
          "/",
          "/problems",
          "/problems/",
          "/about",
          "/privacy",
          "/terms",
          "/credits",
          "/integrity",
          "/leaderboard",
          "/changelog",
          "/feedback",
        ],
        disallow: [
          "/api/",
          "/admin/",
          "/settings",
          "/onboarding",
          "/login",
          "/profile/",
          "/suspended",
          "/account-restored",
          "/stats",
          "/duel/",
          "/notifications/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
