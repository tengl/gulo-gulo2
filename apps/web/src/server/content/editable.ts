import "server-only";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  ContentError,
  anchorsIn,
  linkTargets,
  pageAnchors,
  pageNames,
  pagePath,
  parseContent,
  referenceProblems,
  sitePaths,
} from "@/modules/site";
import { loadSite } from "./load";

// WEBB-015/016: the files admin may edit, and the same check as the build runs
// before anything is sent to GitHub. New files are added by agents or on GitHub.
export type EditableFile = { file: string; title: string; group: string };

export function editableFiles(): EditableFile[] {
  const site = loadSite();
  return [
    { file: "webbplats.md", title: "Adress, telefon och länkar", group: "Webbplatsen" },
    ...(Object.keys(site.pages) as (keyof typeof pageNames)[]).map((slug) => ({
      file: `sidor/${slug}.md`,
      title: pageNames[slug],
      group: "Sidor",
    })),
    ...site.products.map((product) => ({
      file: `produkter/${product.slug}.md`,
      title: product.data.namn,
      group: "Produkter",
    })),
  ];
}

export const editorLinks = () => linkTargets(loadSite());

export function isEditable(file: unknown): file is string {
  return typeof file === "string" && editableFiles().some((entry) => entry.file === file);
}

const imageExists = (image: string) => existsSync(join(process.cwd(), "public", image));

export function contentProblems(file: string, raw: string): string[] {
  const kind = file === "webbplats.md" ? "settings" : file.startsWith("sidor/") ? "page" : "product";
  try {
    const document = parseContent(kind, file, raw);
    if (kind === "settings") return [];
    const site = loadSite();
    const paths = new Set(sitePaths(site.products));
    // The edited page's anchors come from the new text, not the deployed one.
    const anchors = pageAnchors(site);
    const own = kind === "page" ? pagePath(document.slug) : undefined;
    if (own)
      anchors.set(own, new Set(["innehall", ...anchorsIn(document.body).map((anchor) => anchor.id)]));
    const front = document.data as { bild?: string };
    const problems = referenceProblems(file, document.body, front.bild, paths, imageExists, anchors);
    // A removed or renamed heading anchor must not break links on other pages.
    // The deployed texts are valid, so any problem there comes from this edit.
    if (own) {
      const others = [
        ...Object.entries(site.pages).map(([slug, page]) => ({ file: `sidor/${slug}.md`, body: page.body })),
        ...site.products.map((product) => ({ file: `produkter/${product.slug}.md`, body: product.body })),
      ].filter((other) => other.file !== file);
      for (const other of others)
        for (const problem of referenceProblems(other.file, other.body, undefined, paths, () => true, anchors))
          problems.push(`${problem} (efter din ändring i ${file})`);
    }
    return problems;
  } catch (error) {
    if (error instanceof ContentError) return [error.message];
    throw error;
  }
}
