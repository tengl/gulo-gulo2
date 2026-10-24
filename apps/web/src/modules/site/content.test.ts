import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { parseContent, ContentError } from "./domain/content.ts";
import { anchorsIn, referenceProblems, renderMarkdown } from "./domain/markdown.ts";
import { linkTargets, pagePath, sitePaths } from "./domain/site.ts";

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
  const anchors = new Map(
    pages.map((page) => [
      pagePath(page.slug),
      new Set(["innehall", ...anchorsIn(page.body).map((anchor) => anchor.id)]),
    ]),
  );
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
    const front = document.data as { bild?: string };
    problems.push(
      ...referenceProblems(
        file,
        document.body,
        front.bild,
        paths,
        (image) => existsSync(join(web, "public", image)),
        anchors,
      ),
    );
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

test("WEBB-006: a heading with an anchor keeps the paragraphs and images after it", () => {
  const html = renderMarkdown("## Järven {#jarven}\n\n![En järv](/bilder/jarv.jpg)\n\nText.");
  assert.equal(
    html.trim(),
    '<h2 id="jarven">Järven</h2><p><img src="/bilder/jarv.jpg" alt="En järv"></p>\n<p>Text.</p>',
  );
});

test("WEBB-006/016: link problems say what to write instead", () => {
  const paths = new Set(["/", "/om", "/meny"]);
  const anchors = new Map([["/om", new Set(["niklas", "jarven"])]]);
  const check = (link: string) =>
    referenceProblems("sidor/x.md", `[a](${link})`, undefined, paths, () => true, anchors);
  assert.deepEqual(check("/om#niklas"), []);
  assert.deepEqual(check("/meny#menu-wraps"), [], "anchors on pages built in code are not known");
  assert.deepEqual(check("/om#nikals"), [
    "sidor/x.md: länken /om#nikals leder till ett ställe som inte finns på /om; menade du /om#niklas?",
  ]);
  assert.deepEqual(check("/om#kontakt"), [
    "sidor/x.md: länken /om#kontakt leder till ett ställe som inte finns på /om",
  ]);
  assert.deepEqual(check("http://example.com"), [
    "sidor/x.md: länken http://example.com börjar med http://; skriv https:// i stället",
  ]);
  assert.deepEqual(check("om"), [
    "sidor/x.md: länken om ska börja med / för en egen sida (till exempel /om) eller med https://",
  ]);
  assert.deepEqual(check("/omm"), ["sidor/x.md: länken /omm leder inte till någon sida"]);
});

test("WEBB-016: admin offers every page, product and heading anchor as a link target", () => {
  const raw = (path: string) => readFileSync(join(content, path), "utf8");
  const pages = Object.fromEntries(
    ["start", "event", "om", "swish", "integritet"].map((slug) => [
      slug,
      parseContent("page", `sidor/${slug}.md`, raw(`sidor/${slug}.md`)),
    ]),
  );
  const targets = linkTargets({
    settings: parseContent("settings", "webbplats.md", raw("webbplats.md")).data,
    pages: pages as never,
    products: [parseContent("product", "produkter/brewurst.md", raw("produkter/brewurst.md"))],
  });
  const find = (href: string) => targets.find((target) => target.href === href);
  assert.equal(find("/")?.label, "Startsidan");
  assert.equal(find("/om#niklas")?.label, "Om oss › Niklas Bonnevier");
  assert.equal(find("/produkter/brewurst")?.label, "Brewurst");
  assert.ok(find("/meny") && find("/bestall"));
});
