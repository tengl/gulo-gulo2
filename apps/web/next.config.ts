import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import type { NextConfig } from "next";

// WEBB-005: old Squarespace addresses lead permanently to the new pages. Product
// pages declare their old address in content/produkter/*.md (gammalAdress).
function legacyRedirects() {
  const content = join(process.cwd(), "content");
  const products = readdirSync(join(content, "produkter"))
    .filter((file) => file.endsWith(".md"))
    .flatMap((file) => {
      const { gammalAdress } = matter(
        readFileSync(join(content, "produkter", file), "utf8"),
      ).data as { gammalAdress?: string };
      const destination = `/produkter/${file.replace(/\.md$/, "")}`;
      return gammalAdress && gammalAdress !== destination
        ? [{ source: gammalAdress, destination, statusCode: 301 as const }]
        : [];
    });
  const { shop } = matter(readFileSync(join(content, "webbplats.md"), "utf8"))
    .data as { shop: string };
  const site = new URL(process.env.SITE_URL || "https://www.gulogulo.se");
  // Until the Squarespace shop has its own address, /shop is still served there.
  const shopRedirect =
    new URL(shop).host === site.host
      ? []
      : [{ source: "/shop/:path*", destination: `${shop}/:path*`, permanent: false }];
  return [
    ...products,
    { source: "/info", destination: "/om#niklas", statusCode: 301 as const },
    { source: "/niklas", destination: "/om#niklas", statusCode: 301 as const },
    { source: "/jarven", destination: "/om#jarven", statusCode: 301 as const },
    ...shopRedirect,
  ];
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  redirects: async () => legacyRedirects(),
  // WEBB-016: admin's text editor reads the deployed texts and images at run time
  // to list the files and check links and images before saving.
  outputFileTracingIncludes: {
    "/admin/texter": ["./content/**/*"],
    "/api/admin/content": ["./content/**/*", "./public/bilder/**/*"],
    "/api/admin/content/history": ["./content/**/*"],
  },
  ...(process.env.GULO_BROWSER_TEST === "1"
    ? {
        distDir: ".next-e2e",
        typescript: { tsconfigPath: "tsconfig.e2e.json" },
      }
    : {}),
};

export default nextConfig;
