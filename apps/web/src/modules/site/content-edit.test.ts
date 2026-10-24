import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { applyContentEdits, editableContent, ContentEditError } from "./domain/content-edit.ts";
import { parseContent } from "./domain/content.ts";

const content = join(import.meta.dirname, "../../../content");
const read = (path: string) => readFileSync(join(content, path), "utf8");
const files = [
  "webbplats.md",
  ...readdirSync(join(content, "sidor")).map((file) => `sidor/${file}`),
  ...readdirSync(join(content, "produkter")).map((file) => `produkter/${file}`),
];
const changedLines = (a: string, b: string) => {
  const left = a.split("\n");
  const right = b.split("\n");
  return right.filter((line, index) => line !== left[index]);
};

test("WEBB-015: saving every field unchanged leaves each content file byte for byte", () => {
  for (const file of files) {
    const raw = read(file);
    const { fields, body } = editableContent(raw);
    const values = Object.fromEntries(fields.map((field) => [field.id, field.value]));
    assert.equal(applyContentEdits(raw, values, body), raw, file);
  }
});

test("WEBB-015: an edited field rewrites only its own line and keeps the file valid", () => {
  const raw = read("sidor/om.md");
  const edited = applyContentEdits(raw, { rubrik: "Om Gulo Gulo: oss" });
  assert.deepEqual(changedLines(raw, edited), ['rubrik: "Om Gulo Gulo: oss"']);
  assert.equal(parseContent("page", "sidor/om.md", edited).data.rubrik, "Om Gulo Gulo: oss");
  const plain = applyContentEdits(raw, { rubrik: "Om charkuteriet" });
  assert.deepEqual(changedLines(raw, plain), ["rubrik: Om charkuteriet"]);
});

test("WEBB-015: facts in short lists are quoted when needed and labelled by heading", () => {
  const raw = read("produkter/brewurst.md");
  const { fields } = editableContent(raw);
  const pack = fields.find((field) => field.value === "Glasburk 90 g")!;
  assert.equal(pack.label, "Fakta · Förpackning · Värde 1");
  assert.ok(!fields.some((field) => field.id === "bild" || field.id === "gammalAdress"));
  assert.ok(!fields.some((field) => field.id === "ordning"), "numbers are not text fields");
  const edited = applyContentEdits(raw, { [pack.id]: "Glasburk, 90 g" });
  assert.deepEqual(changedLines(raw, edited), ['    varden: ["Glasburk, 90 g"]']);
  const product = parseContent("product", "produkter/brewurst.md", edited);
  assert.deepEqual(product.data.fakta[1]!.varden, ["Glasburk, 90 g"]);
});

test("WEBB-015: the body is replaced as text and the front matter is kept", () => {
  const raw = read("sidor/event.md");
  const edited = applyContentEdits(raw, {}, "Ny text.\n\n## Rubrik\n");
  assert.ok(edited.startsWith(raw.slice(0, raw.indexOf("\n---\n") + 5)));
  assert.equal(parseContent("page", "sidor/event.md", edited).body, "Ny text.\n\n## Rubrik");
  assert.ok(edited.endsWith("## Rubrik\n"));
});

test("WEBB-016: an empty value is written so that the content check can refuse it", () => {
  const raw = read("sidor/om.md");
  const edited = applyContentEdits(raw, { rubrik: "" });
  assert.throws(() => parseContent("page", "sidor/om.md", edited), /rubrik får inte vara tomt/);
});

test("files without front matter are refused with a Swedish message", () => {
  assert.throws(() => editableContent("Bara text"), ContentEditError);
  assert.throws(() => editableContent("---\ntitel: [\n---\n"), /kunde inte läsas/);
});
