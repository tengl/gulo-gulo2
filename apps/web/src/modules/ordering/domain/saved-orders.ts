import {
  getProduct,
  formatPrice,
  unitPriceOre,
  omissionLabels,
} from "../../catalog/index.ts";
import { addSelections, cartTotalOre } from "./cart.ts";
import type { Cart, Selection } from "./cart.ts";

export type SavedOrder = Readonly<{
  reference: string;
  createdAt: string;
  status: "saved" | "paid" | "collected" | "cancelled";
  preparation: "new" | "confirmed" | "preparing" | "prepared";
  cart: Cart;
  pricesOre: readonly number[];
  totalOre: number;
}>;
export type OrderMemory = Readonly<{
  cart: Cart;
  orders: readonly SavedOrder[];
}>;
export const EMPTY_MEMORY: OrderMemory = { cart: [], orders: [] };
export const MAX_SAVED_ORDERS = 30;
export const demoOrderStatusLabels = {
  saved: "Sparad demo",
  paid: "Betald · demo",
  collected: "Hämtad · demo",
  cancelled: "Avbokad",
} as const;
export const demoOrderPreparationLabels = {
  new: "Inväntar mottagningsbekräftelse",
  confirmed: "Mottagning bekräftad",
  preparing: "Tillagas",
  prepared: "Tillagad",
} as const;

export function isDemoOrderPreparation(
  value: unknown,
): value is SavedOrder["preparation"] {
  return (
    typeof value === "string" &&
    Object.hasOwn(demoOrderPreparationLabels, value)
  );
}

export function canChangeDemoOrderPreparation(
  order: Pick<SavedOrder, "status" | "preparation">,
  to: SavedOrder["preparation"],
): boolean {
  return (
    order.status !== "cancelled" &&
    order.status !== "collected" &&
    ((order.preparation === "new" && to === "confirmed") ||
      (order.preparation === "confirmed" && to === "preparing") ||
      (order.preparation === "preparing" && to === "prepared"))
  );
}

// ADM-009: preparation and payment are independent; both use the same version check.
export function changeDemoOrderPreparation(
  memory: OrderMemory,
  reference: string,
  expected: string,
  preparation: SavedOrder["preparation"],
): OrderMemory {
  const order = memory.orders.find((item) => item.reference === reference);
  if (!order)
    throw new Error("Beställningen finns inte längre i det lokala minnet.");
  if (demoOrderFingerprint(order) !== expected)
    throw new Error(
      "Beställningen har ändrats. Stäng och granska den aktuella versionen.",
    );
  if (!canChangeDemoOrderPreparation(order, preparation))
    throw new Error(
      "Den ändringen av mottagning eller tillagning är inte tillåten.",
    );
  return {
    ...memory,
    orders: memory.orders.map((item) =>
      item.reference === reference ? { ...item, preparation } : item,
    ),
  };
}

export function isDemoOrderStatus(
  value: unknown,
): value is SavedOrder["status"] {
  return (
    typeof value === "string" && Object.hasOwn(demoOrderStatusLabels, value)
  );
}

export function canCancelDemoOrder(order: Pick<SavedOrder, "status">): boolean {
  return canCustomerCancel(order.status === "saved" ? "unpaid" : order.status);
}

// CHATT-011: follow unpaid and paid customer orders until collection/cancellation.
export function hasActiveCustomerOrders(
  orders: readonly Pick<SavedOrder, "status">[],
): boolean {
  return orders.some(
    (order) => order.status === "saved" || order.status === "paid",
  );
}

export function demoOrderFingerprint(order: SavedOrder): string {
  return JSON.stringify(order);
}

// ADM-005/006: local simulation only; real transitions require an authorized server transaction.
export function canChangeDemoOrderStatus(
  from: SavedOrder["status"],
  to: SavedOrder["status"],
): boolean {
  return (
    (from === "saved" && (to === "paid" || to === "cancelled")) ||
    (from === "paid" && to === "collected")
  );
}

export function changeDemoOrderStatus(
  memory: OrderMemory,
  reference: string,
  expected: string,
  status: SavedOrder["status"],
): OrderMemory {
  const order = memory.orders.find((item) => item.reference === reference);
  if (!order)
    throw new Error("Beställningen finns inte längre i det lokala minnet.");
  if (demoOrderFingerprint(order) !== expected)
    throw new Error(
      "Beställningen har ändrats. Stäng och granska den aktuella versionen.",
    );
  if (!canChangeDemoOrderStatus(order.status, status))
    throw new Error("Den statusändringen är inte tillåten.");
  return {
    ...memory,
    orders: memory.orders.map((item) =>
      item.reference === reference ? { ...item, status } : item,
    ),
  };
}

// CHATT-009: reconstruct selections; never trust keys or prices from JSON/model input.
export function readSelections(
  input: unknown,
  requireVariant = true,
): Selection[] {
  if (!Array.isArray(input) || input.length > 50)
    throw new Error("Ogiltiga produktrader.");
  return input.map((value: unknown) => {
    if (!value || typeof value !== "object")
      throw new Error("Ogiltig produktrad.");
    const line = value as Record<string, unknown>;
    if (
      typeof line.productId !== "string" ||
      typeof line.quantity !== "number" ||
      !Number.isSafeInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > 99 ||
      !Array.isArray(line.omissions) ||
      line.omissions.length > 6 ||
      line.omissions.some(
        (id) => typeof id !== "string" || !Object.hasOwn(omissionLabels, id),
      ) ||
      (line.variant !== undefined &&
        line.variant !== "single" &&
        line.variant !== "double")
    ) {
      throw new Error("Ogiltigt antal, variant eller bortval.");
    }
    const product = getProduct(line.productId);
    if (product.category === "drink" && (line.variant || line.omissions.length))
      throw new Error("Dryck har inga wrapval.");
    const selection: Selection = {
      productId: product.id,
      quantity: line.quantity,
      ...(line.variant ? { variant: line.variant } : {}),
      omissions: [...new Set(line.omissions)] as Selection["omissions"],
    };
    if (requireVariant || product.category === "drink")
      unitPriceOre(product.id, selection.variant);
    return selection;
  });
}

export function readCart(input: unknown): Cart {
  return addSelections([], readSelections(input));
}

export function cartFingerprint(cart: Cart): string {
  return JSON.stringify(cart);
}

export function describeSavedOrder(order: SavedOrder): string {
  return `${demoOrderStatusLabels[order.status]} · ${demoOrderPreparationLabels[order.preparation]} (lokal demo)\n${describeLines(order.cart, order.pricesOre, order.totalOre)}`;
}

export function describeCart(cart: Cart): string {
  return describeLines(
    cart,
    cart.map((line) => unitPriceOre(line.productId, line.variant)),
    cartTotalOre(cart),
  );
}

function describeLines(
  cart: Cart,
  pricesOre: readonly number[],
  totalOre: number,
): string {
  if (!cart.length)
    return "Din varukorg är tom just nu. Du kan välja från menyn eller berätta vad du är sugen på.";
  return (
    cart
      .map((line, index) => {
        const product = getProduct(line.productId);
        const variant =
          product.category === "wrap"
            ? line.variant === "double"
              ? "dubbel wrap"
              : "enkel wrap"
            : "dryck";
        return `${line.quantity} × ${product.number ? product.number + ". " : ""}${product.name} · ${variant}${line.omissions.length ? " · utan " + line.omissions.map((id) => omissionLabels[id]).join(", ") : ""} · ${formatPrice(pricesOre[index]! * line.quantity)}`;
      })
      .join("\n") + `\n\nTotalt: ${formatPrice(totalOre)}`
  );
}

export function saveDemoOrder(
  memory: OrderMemory,
  uuid: string,
  createdAt: string,
): OrderMemory {
  // CHATT-005: synthetic references only; this does not create a server order.
  if (!memory.cart.length)
    throw new Error("Välj något innan du sparar beställningen.");
  if (memory.orders.length >= MAX_SAVED_ORDERS)
    throw new Error(
      "Du har 30 sparade demobeställningar. Rensa det lokala minnet för att prova fler.",
    );
  if (!/^[0-9a-f-]{36}$/i.test(uuid) || !Number.isFinite(Date.parse(createdAt)))
    throw new Error("Ogiltig demoreferens.");
  const reference = `DEMO-${uuid.toUpperCase()}`;
  if (memory.orders.some((order) => order.reference === reference))
    throw new Error("Referensen används redan.");
  const cart = readCart(memory.cart);
  return {
    cart: [],
    orders: [
      {
        reference,
        createdAt,
        status: "saved",
        preparation: "new",
        cart,
        pricesOre: cart.map((line) =>
          unitPriceOre(line.productId, line.variant),
        ),
        totalOre: cartTotalOre(cart),
      },
      ...memory.orders,
    ],
  };
}

// ORD-016: use server status for real orders; local records are demonstrations only.
export function canCustomerCancel(
  status: "unpaid" | "paid" | "collected" | "cancelled",
): boolean {
  return status === "unpaid";
}

export function cancelDemoOrder(
  memory: OrderMemory,
  reference: string,
): OrderMemory {
  const order = memory.orders.find((item) => item.reference === reference);
  if (!order) throw new Error("Beställningen finns inte i det lokala minnet.");
  if (!canCancelDemoOrder(order))
    throw new Error(
      order.status === "cancelled"
        ? "Demobeställningen är redan avbokad."
        : "Efter betalning kontaktar du personalen. Beställningen kan inte avbokas här.",
    );
  return {
    ...memory,
    orders: memory.orders.map((item) =>
      item.reference === reference ? { ...item, status: "cancelled" } : item,
    ),
  };
}

export function parseMemory(raw: string | null): OrderMemory {
  if (!raw) return EMPTY_MEMORY;
  if (raw.length > 300_000) throw new Error("Det lokala minnet är för stort.");
  const input = JSON.parse(raw);
  if (
    input?.version !== 1 ||
    !Array.isArray(input.orders) ||
    input.orders.length > MAX_SAVED_ORDERS
  )
    throw new Error("Det lokala minnet har ett okänt format.");
  const seen = new Set<string>();
  const orders: SavedOrder[] = input.orders.map((value: unknown) => {
    if (!value || typeof value !== "object")
      throw new Error("Ogiltig sparad demobeställning.");
    const order = value as Record<string, unknown>;
    if (
      typeof order.reference !== "string" ||
      !/^DEMO-[0-9A-F-]{36}$/.test(order.reference) ||
      seen.has(order.reference) ||
      typeof order.createdAt !== "string" ||
      order.createdAt.length > 30 ||
      !Number.isFinite(Date.parse(order.createdAt)) ||
      !isDemoOrderStatus(order.status) ||
      (order.preparation !== undefined &&
        !isDemoOrderPreparation(order.preparation))
    )
      throw new Error("Ogiltig sparad demobeställning.");
    seen.add(order.reference);
    const cart = readCart(order.cart);
    if (
      !cart.length ||
      !Array.isArray(order.pricesOre) ||
      order.pricesOre.length !== cart.length ||
      order.pricesOre.some(
        (price) =>
          !Number.isSafeInteger(price) || price < 0 || price > 1_000_000,
      )
    )
      throw new Error("Ogiltiga sparade demopriser.");
    const pricesOre = order.pricesOre as number[];
    const totalOre = cart.reduce(
      (sum, line, index) => sum + line.quantity * pricesOre[index]!,
      0,
    );
    if (order.totalOre !== totalOre)
      throw new Error("Den sparade demobeställningens belopp stämmer inte.");
    return {
      reference: order.reference,
      createdAt: order.createdAt,
      status: order.status,
      preparation:
        order.preparation === undefined
          ? "new"
          : (order.preparation as SavedOrder["preparation"]),
      cart,
      pricesOre,
      totalOre,
    };
  });
  return { cart: readCart(input.cart), orders };
}
