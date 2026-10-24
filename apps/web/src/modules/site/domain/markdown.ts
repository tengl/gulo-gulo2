import { Marked } from "marked";

// Content may set a heading anchor with "## Rubrik {#ankare}" (used by /om#niklas).
const anchoredHeading = /^(#{1,6}) (.+?)[ \t]*\{#([a-z0-9-]+)\}[ \t]*$/gm;

const marked = new Marked({
  gfm: true,
  renderer: {
    link({ href, tokens }) {
      const inner = this.parser.parseInline(tokens);
      const external = /^https?:/.test(href);
      return `<a href="${href}"${external ? ' rel="noopener"' : ""}>${inner}</a>`;
    },
  },
});

function withAnchors(source: string): string {
  return source.replace(anchoredHeading, (_, hashes: string, title: string, id: string) => {
    const depth = hashes.length;
    return `<h${depth} id="${id}">${marked.parseInline(title, { async: false })}</h${depth}>`;
  });
}

// Content files are written in this repository, so their HTML is trusted.
export function renderMarkdown(source: string): string {
  return marked.parse(withAnchors(source), { async: false });
}

// Markdown for /llms-full.txt, without the anchor syntax.
export function plainMarkdown(source: string): string {
  return source.replace(anchoredHeading, "$1 $2");
}

// Links and images in a document, for the content check.
export function referencesIn(source: string): {
  links: string[];
  images: string[];
} {
  const links: string[] = [];
  const images: string[] = [];
  marked.walkTokens(marked.lexer(source), (token) => {
    if (token.type === "link") links.push(token.href);
    if (token.type === "image") images.push(token.href);
  });
  return { links, images };
}

// Anchors set with "## Rubrik {#ankare}", in order.
export function anchorsIn(source: string): { id: string; title: string }[] {
  return [...source.matchAll(anchoredHeading)].map((match) => ({
    id: match[3]!,
    title: match[2]!.trim(),
  }));
}

function distance(a: string, b: string): number {
  let row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++)
      next[j] = Math.min(row[j]! + 1, next[j - 1]! + 1, row[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    row = next;
  }
  return row[b.length]!;
}

// WEBB-006/016: internal links must lead to a page (and to an anchor on it,
// where the page's anchors are known) and images must exist. Used by the
// content check and before admin saves an edited file.
export function referenceProblems(
  file: string,
  body: string,
  image: string | undefined,
  paths: ReadonlySet<string>,
  imageExists: (path: string) => boolean,
  anchors: ReadonlyMap<string, ReadonlySet<string>> = new Map(),
): string[] {
  const problems: string[] = [];
  const { links, images } = referencesIn(body);
  for (const path of [...images, ...(image ? [image] : [])])
    if (!imageExists(path))
      problems.push(`${file}: bilden ${path} finns inte i apps/web/public`);
  for (const link of links) {
    if (/^(https:|mailto:|tel:)/.test(link)) continue;
    if (/^http:/.test(link)) {
      problems.push(`${file}: länken ${link} börjar med http://; skriv https:// i stället`);
      continue;
    }
    const [path, anchor] = link.split("#") as [string, string | undefined];
    if (!link.startsWith("/") && !link.startsWith("#")) {
      problems.push(
        `${file}: länken ${link} ska börja med / för en egen sida (till exempel /om) eller med https://`,
      );
      continue;
    }
    if (!paths.has(path)) {
      problems.push(`${file}: länken ${link} leder inte till någon sida`);
      continue;
    }
    const known = anchors.get(path);
    if (anchor === undefined || !known || known.has(anchor)) continue;
    const near = [...known]
      .map((id) => ({ id, far: distance(anchor, id) }))
      .filter((entry) => entry.far <= 2)
      .sort((a, b) => a.far - b.far)[0];
    problems.push(
      `${file}: länken ${link} leder till ett ställe som inte finns på ${path}${near ? `; menade du ${path}#${near.id}?` : ""}`,
    );
  }
  return problems;
}
