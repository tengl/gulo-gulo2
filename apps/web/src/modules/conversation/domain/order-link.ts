import { demoMenu, MAX_DEMO_QUANTITY } from "../../catalog/index.ts";
import type { WrapVariant } from "../../catalog/index.ts";
import type { Selection } from "../../ordering/index.ts";
import type { ChatAction } from "./chat.ts";

// WEBB-012: /bestall?varor=ghostdog-dubbel:2,loka:1 becomes a proposal that the
// customer approves in the chat. Nothing is added from the link itself.
const variants: Record<string, WrapVariant> = {
  enkel: "single",
  dubbel: "double",
};
const MAX_LINK_ITEMS = 20;

export type OrderLink = { items: Selection[]; rejected: string[] };

export function parseOrderLink(raw: string): OrderLink {
  const items: Selection[] = [];
  const rejected: string[] = [];
  for (const entry of raw.split(",").map((part) => part.trim()).filter(Boolean)) {
    if (items.length + rejected.length >= MAX_LINK_ITEMS) {
      rejected.push(`${entry} (för många rader i länken)`);
      continue;
    }
    const [code = "", amount] = entry.split(":");
    const quantity = amount === undefined ? 1 : Number(amount);
    const match = /^(.+?)(?:-(enkel|dubbel))?$/.exec(code.toLowerCase());
    const product = demoMenu.find((item) => item.id === match?.[1]);
    const variant = match?.[2] ? variants[match[2]] : undefined;
    if (!product) {
      rejected.push(`${code} (okänd vara)`);
    } else if (
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_DEMO_QUANTITY
    ) {
      rejected.push(`${code} (antalet måste vara 1–${MAX_DEMO_QUANTITY})`);
    } else if (product.category === "drink" && variant) {
      rejected.push(`${code} (dryck har ingen variant)`);
    } else {
      items.push({ productId: product.id, quantity, variant, omissions: [] });
    }
  }
  return { items, rejected };
}

export function orderLinkReply(link: OrderLink): {
  text: string;
  action?: ChatAction;
} {
  const skipped = link.rejected.length
    ? ` Det här kunde inte tas med: ${link.rejected.join(", ")}.`
    : "";
  if (!link.items.length)
    return {
      text: `Länken du kom hit med innehöll inga varor jag kunde känna igen.${skipped} Du kan välja från menyn eller skriva vad du vill ha.`,
    };
  return {
    text: `Du kom hit med en länk med de här valen. Inget är tillagt ännu – kontrollera dem, välj variant där det behövs och godkänn.${skipped}`,
    action: { kind: "add", items: link.items },
  };
}
