import "server-only";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  ContentError,
  parseContent,
  referenceProblems,
  sitePaths,
} from "@/modules/site";
import { loadSite } from "./load";

// WEBB-015/016: the files admin may edit, and the same check as the build runs
// before anything is sent to GitHub. New files are added by agents or on GitHub.
export type EditableFile = { file: string; title: string; group: string };

const pageNames: Record<string, string> = {
  start: "Startsidan",
  event: "Event",
  om: "Om oss",
  swish: "Swish-butiken",
  integritet: "Integritet",
};

export function editableFiles(): EditableFile[] {
  const site = loadSite();
  return [
    { file: "webbplats.md", title: "Adress, telefon och länkar", group: "Webbplatsen" },
    ...Object.keys(site.pages).map((slug) => ({
      file: `sidor/${slug}.md`,
      title: pageNames[slug] ?? slug,
      group: "Sidor",
    })),
    ...site.products.map((product) => ({
      file: `produkter/${product.slug}.md`,
      title: product.data.namn,
      group: "Produkter",
    })),
  ];
}

export function isEditable(file: unknown): file is string {
  return typeof file === "string" && editableFiles().some((entry) => entry.file === file);
}

export function contentProblems(file: string, raw: string): string[] {
  const kind = file === "webbplats.md" ? "settings" : file.startsWith("sidor/") ? "page" : "product";
  try {
    const document = parseContent(kind, file, raw);
    if (kind === "settings") return [];
    const paths = new Set(sitePaths(loadSite().products));
    const front = document.data as { bild?: string };
    return referenceProblems(file, document.body, front.bild, paths, (image) =>
      existsSync(join(process.cwd(), "public", image)),
    );
  } catch (error) {
    if (error instanceof ContentError) return [error.message];
    throw error;
  }
}
