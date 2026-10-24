import "server-only";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseContent } from "@/modules/site";
import type { SiteContent } from "@/modules/site";

// WEBB-006: the site's texts live in apps/web/content. Pages are rendered at
// build time, so a content error stops the build with the file and field.
const root = join(process.cwd(), "content");
let cached: SiteContent | undefined;

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

export function loadSite(): SiteContent {
  if (cached) return cached;
  const page = (slug: keyof SiteContent["pages"]) =>
    parseContent("page", `sidor/${slug}.md`, read(`sidor/${slug}.md`));
  cached = {
    settings: parseContent("settings", "webbplats.md", read("webbplats.md"))
      .data,
    pages: {
      start: page("start"),
      event: page("event"),
      om: page("om"),
      swish: page("swish"),
      integritet: page("integritet"),
    },
    products: readdirSync(join(root, "produkter"))
      .filter((file) => file.endsWith(".md"))
      .map((file) =>
        parseContent("product", `produkter/${file}`, read(`produkter/${file}`)),
      )
      .sort((a, b) => a.data.ordning - b.data.ordning),
  };
  return cached;
}
