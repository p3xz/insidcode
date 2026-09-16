import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://insidcode.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/problems", "/privacy", "/terms", "/credits", "/integrity"],
      disallow: [
        "/api/",
        "/admin/",
        "/settings",
        "/onboarding",
        "/login",
        "/profile/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
