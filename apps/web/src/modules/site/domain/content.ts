import matter from "gray-matter";
import { z } from "zod";

// WEBB-006: people edit these files by hand, so every problem is reported in
// Swedish with the file and the field.
const text = z.string().trim().min(1);
const sitePath = z.string().regex(/^\/[a-z0-9/_.-]*$/);
const image = z.string().regex(/^\/bilder\/[a-z0-9-]+\.(jpg|jpeg|png|webp)$/);

const settingsSchema = z.strictObject({
  namn: text,
  beskrivning: text,
  adress: z.strictObject({
    gata: text,
    postnummer: z.string().regex(/^\d{3} \d{2}$/),
    ort: text,
    hitta: text,
  }),
  karta: z.url(),
  telefon: z.string().regex(/^\+46\d{6,12}$/),
  telefonText: text,
  instagram: z.url(),
  facebook: z.url(),
  shop: z.url(),
});

const pageSchema = z.strictObject({
  titel: text,
  beskrivning: text.max(200),
  rubrik: text,
  ingress: text,
  bild: image.optional(),
  bildtext: text.optional(),
});

const productSchema = z.strictObject({
  namn: text,
  slogan: text,
  ordning: z.number().int().positive(),
  gammalAdress: sitePath.optional(),
  bild: image.optional(),
  bildtext: text.optional(),
  utmarkelse: text.optional(),
  fakta: z
    .array(z.strictObject({ rubrik: text, varden: z.array(text).min(1) }))
    .min(1),
});

export type SiteSettings = z.infer<typeof settingsSchema>;
export type PageFront = z.infer<typeof pageSchema>;
export type ProductFront = z.infer<typeof productSchema>;
export type ContentDocument<T> = { slug: string; data: T; body: string };
export type Page = ContentDocument<PageFront>;
export type ContentProduct = ContentDocument<ProductFront>;

const schemas = {
  settings: settingsSchema,
  page: pageSchema,
  product: productSchema,
};

function describeIssue(issue: z.core.$ZodIssue): string {
  const field = issue.path.join(".") || "(filen)";
  if (issue.code === "unrecognized_keys")
    return `okänt fält ${issue.keys.join(", ")}`;
  if (issue.code === "invalid_type" && issue.input === undefined)
    return `${field} saknas`;
  if (issue.code === "too_small") return `${field} får inte vara tomt`;
  if (issue.code === "too_big") return `${field} är för långt`;
  return `${field} har fel format`;
}

export class ContentError extends Error {}

export function parseContent<K extends keyof typeof schemas>(
  kind: K,
  file: string,
  raw: string,
): ContentDocument<z.infer<(typeof schemas)[K]>> {
  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(raw);
  } catch {
    throw new ContentError(
      `${file}: inledningen mellan --- kunde inte läsas. Kontrollera kolon och indrag.`,
    );
  }
  const result = schemas[kind].safeParse(parsed.data);
  if (!result.success)
    throw new ContentError(
      `${file}: ${result.error.issues.map(describeIssue).join("; ")}`,
    );
  const slug = file.split("/").pop()!.replace(/\.md$/, "");
  return {
    slug,
    data: result.data as z.infer<(typeof schemas)[K]>,
    body: parsed.content.trim(),
  };
}
