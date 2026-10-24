import type { MetadataRoute } from "next";
import { siteIndexable, siteUrl } from "@/server/site/config";

// WEBB-011/014: AI assistants and search engines may read the production site.
export default function robots(): MetadataRoute.Robots {
  if (!siteIndexable())
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/bestall", "/admin", "/api/"] },
    ],
    sitemap: new URL("/sitemap.xml", siteUrl()).href,
  };
}
