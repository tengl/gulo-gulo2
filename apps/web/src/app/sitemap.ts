import type { MetadataRoute } from "next";
import { sitePaths } from "@/modules/site";
import { loadSite } from "@/server/content/load";
import { siteUrl } from "@/server/site/config";

export default function sitemap(): MetadataRoute.Sitemap {
  return sitePaths(loadSite().products)
    .filter((path) => path !== "/bestall")
    .map((path) => ({ url: new URL(path, siteUrl()).href }));
}
