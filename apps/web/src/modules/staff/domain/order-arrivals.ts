import type { SavedOrder } from "../../ordering/index.ts";

// ADM-008: bootstrap/history and status changes are silent; identity is the reference.
export function detectOrderArrivals(
  previous: readonly string[] | null,
  orders: readonly Pick<SavedOrder, "reference" | "status">[],
) {
  const known = new Set(previous ?? []);
  const arrivals =
    previous === null
      ? []
      : orders
          .filter(
            (order) =>
              !known.has(order.reference) &&
              (order.status === "saved" || order.status === "paid"),
          )
          .map((order) => order.reference);
  for (const order of orders) known.add(order.reference);
  return { known: [...known], arrivals };
}
