import {
  getProduct,
  unitPriceOre,
  omissionLabels,
  MAX_DEMO_QUANTITY,
} from "../../catalog/index.ts";
import type { Omission, WrapVariant } from "../../catalog/index.ts";

export type Selection = Readonly<{
  productId: string;
  quantity: number;
  variant?: WrapVariant;
  omissions: readonly Omission[];
}>;
export type CartLine = Selection & Readonly<{ key: string }>;
export type Cart = readonly CartLine[];

function normalize(selection: Selection): Selection {
  const product = getProduct(selection.productId);
  unitPriceOre(product.id, selection.variant);
  if (
    !Number.isSafeInteger(selection.quantity) ||
    selection.quantity < 1 ||
    selection.quantity > MAX_DEMO_QUANTITY
  ) {
    throw new Error(`Välj ett helt antal mellan 1 och ${MAX_DEMO_QUANTITY}.`);
  }
  if (
    selection.omissions.some((value) => !Object.hasOwn(omissionLabels, value))
  )
    throw new Error("Okänt bortval.");
  if (product.category === "drink" && selection.omissions.length)
    throw new Error("Dryck har inga bortval.");
  return { ...selection, omissions: [...new Set(selection.omissions)].sort() };
}

export function addSelections(
  cart: Cart,
  selections: readonly Selection[],
): Cart {
  // UX-007/008: all-or-nothing; invalid input never partially updates the draft.
  const result = [...cart];
  for (const input of selections) {
    const selection = normalize(input);
    const key = [
      selection.productId,
      selection.variant ?? "",
      ...selection.omissions,
    ].join("|");
    const existing = result.findIndex((line) => line.key === key);
    const previous = result[existing];
    if (previous) {
      const updated = normalize({
        ...previous,
        quantity: previous.quantity + selection.quantity,
      });
      result[existing] = { ...updated, key };
    } else result.push({ ...selection, key });
    if (result.length > 50)
      throw new Error("Varukorgen kan ha högst 50 olika rader i demon.");
  }
  return result;
}

export function setQuantity(cart: Cart, key: string, quantity: number): Cart {
  return cart.map((line) =>
    line.key === key ? { ...line, ...normalize({ ...line, quantity }) } : line,
  );
}

export function removeLine(cart: Cart, key: string): Cart {
  return cart.filter((line) => line.key !== key);
}
export function cartTotalOre(cart: Cart): number {
  return cart.reduce(
    (sum, line) =>
      sum + unitPriceOre(line.productId, line.variant) * line.quantity,
    0,
  );
}
export function cartCount(cart: Cart): number {
  return cart.reduce((sum, line) => sum + line.quantity, 0);
}
