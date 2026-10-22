import { getProduct } from "../../catalog/index.ts";
import { stockholmDate } from "../../business-hours/index.ts";
import type { SavedOrder } from "../../ordering/index.ts";

export type OrderFilters = {
  query: string;
  date: string;
  status: "all" | SavedOrder["status"];
  preparation?: "all" | SavedOrder["preparation"];
};
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("sv-SE")
    .trim();

// ADM-004: the date is creation date, never an invented pickup date.
export function filterAdminOrders(
  orders: readonly SavedOrder[],
  filters: OrderFilters,
): SavedOrder[] {
  const query = normalize(filters.query);
  return orders
    .filter((order) => {
      if (filters.status !== "all" && order.status !== filters.status)
        return false;
      if (
        filters.preparation &&
        filters.preparation !== "all" &&
        order.preparation !== filters.preparation
      )
        return false;
      if (
        filters.date &&
        stockholmDate(new Date(order.createdAt)) !== filters.date
      )
        return false;
      return (
        !query ||
        normalize(
          [
            order.reference,
            ...order.cart.map((line) => getProduct(line.productId).name),
          ].join(" "),
        ).includes(query)
      );
    })
    .sort(
      (a, b) =>
        Date.parse(b.createdAt) - Date.parse(a.createdAt) ||
        a.reference.localeCompare(b.reference),
    );
}

// ADM-007: totals follow the filters, use snapshots, exclude cancelled orders.
export function summarizeAdminOrders(orders: readonly SavedOrder[]) {
  const active = orders.filter((order) => order.status !== "cancelled");
  return {
    orderCount: active.length,
    wrapCount: active.reduce(
      (sum, order) =>
        sum +
        order.cart.reduce(
          (count, line) =>
            count +
            (getProduct(line.productId).category === "wrap"
              ? line.quantity
              : 0),
          0,
        ),
      0,
    ),
    totalOre: active.reduce((sum, order) => sum + order.totalOre, 0),
  };
}
