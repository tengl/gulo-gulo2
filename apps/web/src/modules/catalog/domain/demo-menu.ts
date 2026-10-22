// UX-004: demonstration data only. Legacy source: 1ef53f5, lib/menu.ts + lib/menytext.ts.
export type Omission =
  "gurka" | "rodlok" | "rostad-lok" | "senap" | "surkal" | "dressing";
export type WrapVariant = "single" | "double";
export type Product = Readonly<{
  id: string;
  name: string;
  category: "wrap" | "drink";
  priceOre: number;
  description: string;
  number?: number;
  badge?: string;
  aliases: readonly string[];
}>;

export const DOUBLE_SURCHARGE_ORE = 4500;
export const MAX_DEMO_QUANTITY = 99;
export const omissionLabels: Record<Omission, string> = {
  gurka: "picklad gurka",
  rodlok: "picklad rödlök",
  "rostad-lok": "rostad lök",
  senap: "senap",
  surkal: "surkål",
  dressing: "dressing",
};

export const demoMenu: readonly Product[] = [
  {
    id: "spack-sabbath",
    number: 1,
    name: "SPÄCK SABBATH",
    category: "wrap",
    priceOre: 11500,
    description: "Grillkorv med tydlig vitpeppar. Surkålsröra.",
    aliases: ["spack sabbath", "spack sabbat"],
  },
  {
    id: "fan-hajlen",
    number: 2,
    name: "FÄN HÄJLEN",
    category: "wrap",
    priceOre: 12000,
    description:
      "Rostad fänkål och lite vitt vin. Stekt surkål och dijondressing.",
    aliases: ["fan hajlen", "van halen"],
  },
  {
    id: "gin-lizzy",
    number: 3,
    name: "GIN LIZZY",
    category: "wrap",
    priceOre: 12000,
    description:
      "Enbär, citronzest och lite gin. Frisk och aromatisk. Surkålsröra.",
    aliases: ["gin lizzy", "gin lizzie"],
  },
  {
    id: "cheezy-top",
    number: 4,
    name: "CHEEZY TOP",
    category: "wrap",
    priceOre: 13000,
    description: "Västerbottensost och kummin. Stekt surkål och dijondressing.",
    aliases: ["cheezy top", "cheesy top"],
  },
  {
    id: "motorwurst",
    number: 5,
    name: "MOTÖRWURST",
    category: "wrap",
    priceOre: 13000,
    description: "Fermenterad korv med persilja och vitlök. Surkålsröra.",
    aliases: ["motorwurst", "motorvurst"],
  },
  {
    id: "twisted-ister",
    number: 6,
    name: "TWISTED ISTER",
    category: "wrap",
    priceOre: 13500,
    description:
      "Kallrökt isterband med ingefära och rödbeta. Surkålsröra med rödbetor.",
    badge: "SM-guld",
    aliases: ["twisted ister", "twisted sister"],
  },
  {
    id: "ghostdog",
    number: 7,
    name: "GHOSTDOG",
    category: "wrap",
    priceOre: 13500,
    description:
      "Fermenterad och kallrökt, med ghost chili och rött vin. Stekt surkål och dijondressing.",
    badge: "Stark",
    aliases: ["ghostdog", "ghost dog"],
  },
  {
    id: "grillost",
    number: 8,
    name: "GRILLOST",
    category: "wrap",
    priceOre: 13500,
    description: "Grillost av komjölk. Stekt surkål och dijondressing.",
    badge: "Vegetarisk",
    aliases: ["grillost", "grill ost"],
  },
  {
    id: "brol",
    number: 9,
    name: "BRÖL",
    category: "wrap",
    priceOre: 14500,
    description:
      "Korv på älg och gris med rött vin. Stekt surkål och dijondressing.",
    aliases: ["brol"],
  },
  {
    id: "burklask",
    name: "Burkläsk",
    category: "drink",
    priceOre: 2500,
    description: "Välj sort på plats.",
    aliases: ["burklask", "lask", "burk"],
  },
  {
    id: "loka",
    name: "Loka",
    category: "drink",
    priceOre: 2500,
    description: "Välj smak på plats.",
    aliases: ["loka"],
  },
  {
    id: "cuba-cola",
    name: "Cuba Cola",
    category: "drink",
    priceOre: 2500,
    description: "Burkläsk.",
    aliases: ["cuba cola"],
  },
  {
    id: "cuba-cola-zero",
    name: "Cuba Cola Zero",
    category: "drink",
    priceOre: 2500,
    description: "Sockerfri burkläsk.",
    aliases: ["cuba cola zero"],
  },
  {
    id: "trocadero",
    name: "Trocadero",
    category: "drink",
    priceOre: 2500,
    description: "Burkläsk.",
    aliases: ["trocadero"],
  },
  {
    id: "trocadero-zero",
    name: "Trocadero Zero",
    category: "drink",
    priceOre: 2500,
    description: "Sockerfri burkläsk.",
    aliases: ["trocadero zero"],
  },
  {
    id: "fjallol",
    name: "Alkoholfri Fjällöl",
    category: "drink",
    priceOre: 3500,
    description: "Alkoholfri öl.",
    aliases: ["alkoholfri fjallol", "fjallol"],
  },
  {
    id: "bjornasen",
    name: "Björnåsen bärdryck",
    category: "drink",
    priceOre: 4500,
    description: "Blåbär, lingon eller rabarber. Välj smak på plats.",
    aliases: ["bjornasen bardryck", "bjornasen", "bardryck"],
  },
];

export function getProduct(id: string): Product {
  const product = demoMenu.find((item) => item.id === id);
  if (!product) throw new Error("Produkten finns inte i demomenyn.");
  return product;
}

export function unitPriceOre(productId: string, variant?: WrapVariant): number {
  const product = getProduct(productId);
  if (
    product.category === "wrap" &&
    variant !== "single" &&
    variant !== "double"
  ) {
    throw new Error("Välj enkel eller dubbel wrap.");
  }
  if (product.category === "drink" && variant !== undefined)
    throw new Error("Dryck har ingen wrapvariant.");
  return product.priceOre + (variant === "double" ? DOUBLE_SURCHARGE_ORE : 0);
}

export function formatPrice(ore: number): string {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(ore / 100);
}
