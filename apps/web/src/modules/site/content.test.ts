import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { parseContent, ContentError } from "./domain/content.ts";
import { referencesIn } from "./domain/markdown.ts";
import { sitePaths } from "./domain/site.ts";

// WEBB-006: the same check runs for agents and for people editing on GitHub.
const web = join(import.meta.dirname, "../../..");
const content = join(web, "content");
const read = (path: string) => readFileSync(join(content, path), "utf8");

test("WEBB-006: every content file is valid and its links and images exist", () => {
  const products = readdirSync(join(content, "produkter"))
    .filter((file) => file.endsWith(".md"))
    .map((file) => parseContent("product", `produkter/${file}`, read(`produkter/${file}`)));
  const pages = readdirSync(join(content, "sidor")).map((file) =>
    parseContent("page", `sidor/${file}`, read(`sidor/${file}`)),
  );
  parseContent("settings", "webbplats.md", read("webbplats.md"));
  assert.deepEqual(
    pages.map((page) => page.slug).sort(),
    ["event", "integritet", "om", "start", "swish"],
    "content/sidor ska innehålla exakt start, event, om, swish och integritet",
  );
  const paths = new Set(sitePaths(products));
  const problems: string[] = [];
  const orders = new Set<number>();
  const legacy = new Set<string>();
  for (const product of products) {
    if (!/^[a-z0-9-]+$/.test(product.slug))
      problems.push(`produkter/${product.slug}.md: filnamnet får bara ha a–z, 0–9 och bindestreck`);
    if (orders.has(product.data.ordning))
      problems.push(`produkter/${product.slug}.md: ordning ${product.data.ordning} används redan`);
    orders.add(product.data.ordning);
    if (product.data.gammalAdress && legacy.has(product.data.gammalAdress))
      problems.push(`produkter/${product.slug}.md: gammalAdress används redan`);
    if (product.data.gammalAdress) legacy.add(product.data.gammalAdress);
  }
  for (const document of [...pages, ...products]) {
    const file = `${products.includes(document as never) ? "produkter" : "sidor"}/${document.slug}.md`;
    const { links, images } = referencesIn(document.body);
    const front = document.data as { bild?: string };
    for (const image of [...images, ...(front.bild ? [front.bild] : [])])
      if (!existsSync(join(web, "public", image)))
        problems.push(`${file}: bilden ${image} finns inte i apps/web/public`);
    for (const link of links) {
      if (/^(https:|mailto:|tel:)/.test(link)) continue;
      if (!paths.has(link.split("#")[0]!))
        problems.push(`${file}: länken ${link} leder inte till någon sida`);
    }
  }
  assert.deepEqual(problems, []);
});

test("WEBB-006: content errors name the file and field in Swedish", () => {
  assert.throws(
    () => parseContent("product", "produkter/x.md", "---\nnamn: X\nslogan: Y\nordning: 1\nfakta: []\nfarg: röd\n---\n"),
    (error: unknown) =>
      error instanceof ContentError &&
      error.message.startsWith("produkter/x.md:") &&
      error.message.includes("okänt fält farg") &&
      error.message.includes("fakta får inte vara tomt"),
  );
  assert.throws(
    () => parseContent("page", "sidor/x.md", "---\ntitel: [\n---\n"),
    /sidor\/x\.md: inledningen mellan --- kunde inte läsas/,
  );
  assert.throws(
    () => parseContent("page", "sidor/x.md", "---\ntitel: X\n---\n"),
    /beskrivning saknas/,
  );
});
