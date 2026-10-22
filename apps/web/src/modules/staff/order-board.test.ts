import assert from "node:assert/strict";
import test from "node:test";
import {
  filterAdminOrders,
  summarizeAdminOrders,
  detectOrderArrivals,
} from "./index.ts";
import {
  addSelections,
  saveDemoOrder,
  type SavedOrder,
} from "../ordering/index.ts";

const cart = addSelections(
  [],
  [
    { productId: "brol", quantity: 2, variant: "double", omissions: ["senap"] },
    { productId: "loka", quantity: 1, omissions: [] },
  ],
);
const base = saveDemoOrder(
  { cart, orders: [] },
  "00000000-0000-4000-8000-000000000001",
  "2026-10-21T22:30:00.000Z",
).orders[0]!;

test("ADM-004: filter by Stockholm creation date, product/reference and status without hiding completed orders", () => {
  const old = {
    ...base,
    reference: "DEMO-00000000-0000-4000-8000-000000000002",
    createdAt: "2026-10-21T10:00:00.000Z",
    status: "collected" as const,
  };
  const orders = [old, base];
  assert.deepEqual(
    filterAdminOrders(orders, {
      query: "brol",
      date: "2026-10-22",
      status: "all",
    }),
    [base],
  );
  assert.deepEqual(
    filterAdminOrders(orders, {
      query: "000002",
      date: "",
      status: "collected",
    }),
    [old],
  );
  assert.deepEqual(
    filterAdminOrders(orders, { query: "pizza", date: "", status: "all" }),
    [],
  );
  assert.deepEqual(
    filterAdminOrders(orders, { query: "", date: "", status: "all" }),
    [base, old],
  );
  assert.deepEqual(orders, [old, base]);
  const preparing = { ...base, preparation: "preparing" as const };
  assert.deepEqual(
    filterAdminOrders([base, preparing], {
      query: "",
      date: "",
      status: "all",
      preparation: "preparing",
    }),
    [preparing],
  );
});

test("ADM-008: new references trigger arrivals once; history, status changes and reappearance stay silent", () => {
  const initial = detectOrderArrivals(null, [base]);
  assert.deepEqual(initial.arrivals, []);
  const changed = { ...base, status: "paid" as const };
  assert.deepEqual(detectOrderArrivals(initial.known, [changed]).arrivals, []);
  const next = { ...base, reference: "DEMO-NEW" };
  const arrived = detectOrderArrivals(initial.known, [next, changed]);
  assert.deepEqual(arrived.arrivals, [next.reference]);
  const empty = detectOrderArrivals(arrived.known, []);
  assert.deepEqual(
    detectOrderArrivals(empty.known, [next, changed]).arrivals,
    [],
  );
  assert.deepEqual(
    detectOrderArrivals(initial.known, [{ ...next, status: "cancelled" }])
      .arrivals,
    [],
  );
});

test("ADM-007: filtered totals exclude cancellation, preserve historical prices, and count double wraps once", () => {
  const historical: SavedOrder = {
    ...base,
    pricesOre: [17000, 2500],
    totalOre: 36500,
    status: "paid",
  };
  const cancelled = { ...base, status: "cancelled" as const };
  assert.deepEqual(summarizeAdminOrders([historical, cancelled]), {
    orderCount: 1,
    wrapCount: 2,
    totalOre: 36500,
  });
  assert.deepEqual(summarizeAdminOrders([cancelled]), {
    orderCount: 0,
    wrapCount: 0,
    totalOre: 0,
  });
  assert.deepEqual(summarizeAdminOrders([]), {
    orderCount: 0,
    wrapCount: 0,
    totalOre: 0,
  });
});
