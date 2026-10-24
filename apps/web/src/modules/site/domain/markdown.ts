import { Marked } from "marked";

// Content may set a heading anchor with "## Rubrik {#ankare}" (used by /om#niklas).
const anchoredHeading = /^(#{1,6}) (.+?)\s*\{#([a-z0-9-]+)\}\s*$/gm;

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
