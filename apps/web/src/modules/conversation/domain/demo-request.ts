import {
  demoMenu,
  omissionLabels,
  MAX_DEMO_QUANTITY,
} from "../../catalog/index.ts";
import type { Omission, WrapVariant } from "../../catalog/index.ts";

export type SuggestedItem = {
  productId: string;
  quantity: number;
  variant?: WrapVariant;
  omissions: Omission[];
};
export type DemoRequest =
  | { kind: "menu" | "cart" }
  | { kind: "suggestion"; items: SuggestedItem[] }
  | { kind: "clarify"; message: string };

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const quantities: Record<string, number> = {
  en: 1,
  ett: 1,
  tva: 2,
  tre: 3,
  fyra: 4,
  fem: 5,
  sex: 6,
  sju: 7,
  atta: 8,
  nio: 9,
  tio: 10,
};
const productNumbers: Record<string, number> = {
  etta: 1,
  tvaa: 2,
  trea: 3,
  fyra: 4,
  femma: 5,
  sexa: 6,
  sjua: 7,
  atta: 8,
  nia: 9,
};
const cannotInterpret =
  "Jag kunde inte tolka hela texten. Inget har lagts till. Prova till exempel ”två dubbla Ghostdog och en Loka”, eller välj från menyn.";

// UX-008: deliberately narrow command grammar, not a substitute for Claude.
export function parseDemoRequest(raw: string): DemoRequest {
  const text = normalizeText(raw).replace(/[.!?]+$/, "");
  if (["meny", "visa meny", "visa menyn"].includes(text))
    return { kind: "menu" };
  if (["min bestallning", "visa min bestallning", "varukorg"].includes(text))
    return { kind: "cart" };
  if (!text || text.length > 600)
    return {
      kind: "clarify",
      message:
        "Skriv en kort beställning, högst 600 tecken. Inget har lagts till.",
    };
  const chunks = text
    .replace(/^(?:jag vill ha|jag tar|lagg till)\s+/, "")
    .split(/\s+och\s+|,\s*/);
  const items: SuggestedItem[] = [];
  for (const chunk of chunks) {
    const [base = "", omissionText, ...extra] = chunk.split(" utan ");
    if (extra.length) return { kind: "clarify", message: cannotInterpret };
    let name = base;
    let quantity = 1;
    const amount =
      /^(\d+|en|ett|tva|tre|fyra|fem|sex|sju|atta|nio|tio)\s+(?:x\s+)?(.+)$/.exec(
        name,
      );
    if (amount) {
      quantity = quantities[amount[1]!] ?? Number(amount[1]);
      name = amount[2]!;
    }
    if (
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_DEMO_QUANTITY
    ) {
      return {
        kind: "clarify",
        message: `Demon stöder hela antal från 1 till ${MAX_DEMO_QUANTITY} per rad. Inget har lagts till.`,
      };
    }
    let variant: WrapVariant | undefined;
    const size =
      /^(enkel|enkla|dubbel|dubbla|dubbelwrap|dubbelwraps)\s+(.+)$/.exec(name);
    if (size) {
      variant = size[1]!.startsWith("dub") ? "double" : "single";
      name = size[2]!;
    }
    const number =
      productNumbers[name] ?? (/^[1-9]$/.test(name) ? Number(name) : undefined);
    const product = demoMenu.find((item) =>
      number !== undefined
        ? item.number === number
        : item.aliases.includes(name),
    );
    if (
      !product ||
      (product.category === "drink" && (variant || omissionText !== undefined))
    )
      return { kind: "clarify", message: cannotInterpret };
    const omissions: Omission[] = [];
    if (omissionText !== undefined) {
      const omission = (
        Object.entries(omissionLabels) as [Omission, string][]
      ).find(
        ([id, label]) =>
          normalizeText(label) === omissionText || id === omissionText,
      );
      if (!omission) return { kind: "clarify", message: cannotInterpret };
      omissions.push(omission[0]);
    }
    items.push({ productId: product.id, quantity, variant, omissions });
  }
  return { kind: "suggestion", items };
}
