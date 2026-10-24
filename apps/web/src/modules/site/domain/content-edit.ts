import {
  isMap,
  isScalar,
  isSeq,
  parse,
  parseDocument,
  type Document,
  type Scalar,
} from "yaml";

// WEBB-015–017: admin edits the same Markdown files as people on GitHub and
// agents. Only the edited values are rewritten in place, so a save never
// reformats the rest of a file that someone else has written by hand.

export type ContentField = {
  id: string;
  label: string;
  value: string;
  long: boolean;
};

export type EditableContent = { fields: ContentField[]; body: string };

export class ContentEditError extends Error {}

const frontmatter = /^---\r?\n([\s\S]*?\r?\n)?---[ \t]*(?:\r?\n|$)/;

// Images and old addresses are technical: they need a file or a redirect.
const hidden = new Set(["bild", "gammalAdress"]);
const long = new Set(["beskrivning", "ingress", "hitta", "bildtext"]);
const labels: Record<string, string> = {
  namn: "Namn",
  titel: "Titel i webbläsarfliken",
  beskrivning: "Beskrivning för sökmotorer och delningar",
  rubrik: "Rubrik",
  ingress: "Ingress",
  bildtext: "Bildtext",
  slogan: "Slogan",
  utmarkelse: "Utmärkelse",
  gata: "Gatuadress",
  postnummer: "Postnummer",
  ort: "Ort",
  hitta: "Hitta hit",
  karta: "Kartlänk",
  telefon: "Telefonnummer (+46…)",
  telefonText: "Telefonnummer som det visas",
  instagram: "Instagram",
  facebook: "Facebook",
  shop: "Webbshoppens adress",
  fakta: "Fakta",
  varden: "Värde",
};

type Path = (string | number)[];

function split(raw: string) {
  const match = frontmatter.exec(raw);
  if (!match)
    throw new ContentEditError(
      "Filen saknar inledningen mellan --- och kan inte redigeras här.",
    );
  const front = match[1] ?? "";
  const start = match[0].indexOf("\n") + 1;
  return { front, start, end: start + front.length, tail: raw.slice(match[0].length) };
}

function read(front: string): Document {
  const document = parseDocument(front);
  if (document.errors.length > 0)
    throw new ContentEditError(
      "Inledningen mellan --- kunde inte läsas. Rätta filen på GitHub först.",
    );
  return document;
}

type Visit = (scalar: Scalar, path: Path, label: string, key: string) => void;

function walk(node: unknown, path: Path, label: string, key: string, visit: Visit) {
  if (isScalar(node)) {
    if (typeof node.value === "string") visit(node, path, label, key);
  } else if (isMap(node)) {
    for (const pair of node.items) {
      if (!isScalar(pair.key) || typeof pair.key.value !== "string") continue;
      const name = pair.key.value;
      if (hidden.has(name)) continue;
      const own = labels[name] ?? name;
      walk(pair.value, [...path, name], label ? `${label} · ${own}` : own, name, visit);
    }
  } else if (isSeq(node)) {
    node.items.forEach((item, index) => {
      // A fact is named by its heading, for example "Fakta · Kryddning · Värde 2".
      const heading = isMap(item) ? item.get("rubrik") : undefined;
      const own = isMap(item)
        ? `${label} · ${typeof heading === "string" ? heading : index + 1}`
        : `${label} ${index + 1}`;
      walk(item, [...path, index], own, key, visit);
    });
  }
}

function trimBody(tail: string): string {
  return tail.replace(/^(\r?\n)+/, "").trimEnd();
}

export function editableContent(raw: string): EditableContent {
  const { front, tail } = split(raw);
  const fields: ContentField[] = [];
  walk(read(front).contents, [], "", "", (scalar, path, label, key) => {
    const value = String(scalar.value);
    fields.push({
      id: path.join("."),
      label,
      value,
      long: long.has(key) || value.length > 90,
    });
  });
  return { fields, body: trimBody(tail) };
}

// The shortest YAML text for a value: plain when it reads back unchanged,
// otherwise a double-quoted string (valid YAML because it is valid JSON).
function scalarText(value: string, original: Scalar, flow: boolean): string {
  const plain = original.type === "PLAIN" && !/[\n\r]/.test(value);
  if (plain && value.trim() === value && value !== "") {
    try {
      const back = flow ? parse(`[${value}]`) : parse(`x: ${value}`);
      const read = flow ? (back as unknown[])[0] : (back as { x: unknown }).x;
      if (read === value && (!flow || (back as unknown[]).length === 1)) return value;
    } catch {
      /* Not valid as plain text; quoted below. */
    }
  }
  return JSON.stringify(value);
}

export function applyContentEdits(
  raw: string,
  values: Readonly<Record<string, string>>,
  body?: string,
): string {
  const { front, start, end, tail } = split(raw);
  const document = read(front);
  const replacements: { from: number; to: number; text: string }[] = [];
  walk(document.contents, [], "", "", (scalar, path) => {
    const id = path.join(".");
    const value = values[id];
    if (value === undefined || value === scalar.value) return;
    const [from, to] = scalar.range!;
    const parent = document.getIn(path.slice(0, -1), true);
    const flow = (isSeq(parent) || isMap(parent)) && Boolean(parent.flow);
    let text = scalarText(value, scalar, flow);
    // A block scalar's range includes its final line break; keep it.
    if (front.slice(from, to).endsWith("\n")) text += "\n";
    replacements.push({ from, to, text });
  });
  let edited = front;
  for (const { from, to, text } of replacements.sort((a, b) => b.from - a.from))
    edited = edited.slice(0, from) + text + edited.slice(to);
  // Self-check: every edited value must read back exactly as typed.
  const check = read(edited);
  for (const [id, value] of Object.entries(values)) {
    const path = id.split(".").map((part) => (/^\d+$/.test(part) ? Number(part) : part));
    const current = check.getIn(path);
    if (typeof current === "string" && current !== value)
      throw new ContentEditError(`Fältet ${id} kunde inte sparas som det skrevs.`);
  }
  const unchangedBody = body === undefined || body === trimBody(tail);
  const nextTail = unchangedBody ? tail : `\n${body.trimEnd()}\n`;
  return raw.slice(0, start) + edited + raw.slice(end, raw.length - tail.length) + nextTail;
}
