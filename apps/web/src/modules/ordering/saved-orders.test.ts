import test from "node:test";
import assert from "node:assert/strict";
import {
  addSelections,
  saveDemoOrder,
  cancelDemoOrder,
  parseMemory,
  readCart,
  EMPTY_MEMORY,
  canCustomerCancel,
  describeCart,
  describeSavedOrder,
} from "./index.ts";

const cart = addSelections(
  [],
  [
    {
      productId: "ghostdog",
      variant: "double",
      quantity: 2,
      omissions: ["senap"],
    },
    { productId: "loka", quantity: 1, omissions: [] },
  ],
);
const uuid = "4fa2af97-3517-4912-86a3-00c208de5678";

test("CHATT-005/006: saves a snapshot, clears only the draft, and survives a storage roundtrip", () => {
  const saved = saveDemoOrder(
    { cart, orders: [] },
    uuid,
    "2026-10-22T12:00:00.000Z",
  );
  assert.deepEqual(saved.cart, []);
  assert.equal(saved.orders[0]!.totalOre, 38500);
  assert.match(saved.orders[0]!.reference, /^DEMO-/);
  assert.deepEqual(
    parseMemory(JSON.stringify({ version: 1, ...saved })),
    saved,
  );
  assert.equal(cart.length, 2);
  assert.throws(
    () => saveDemoOrder(saved, uuid, "2026-10-22T12:00:00.000Z"),
    /Välj något/,
  );
});

test("CHATT-005: stored prices remain a historical snapshot, not current catalogue prices", () => {
  const saved = saveDemoOrder(
    { cart, orders: [] },
    uuid,
    "2026-10-22T12:00:00.000Z",
  );
  const older = {
    ...saved.orders[0]!,
    pricesOre: [17000, 2500],
    totalOre: 36500,
  };
  const restored = parseMemory(
    JSON.stringify({ version: 1, cart: [], orders: [older] }),
  );
  assert.equal(restored.orders[0]!.totalOre, 36500);
  assert.equal(restored.orders[0]!.pricesOre[0], 17000);
  assert.match(describeSavedOrder(restored.orders[0]!), /365\s*kr/);
});

test("CHATT-007 / ORD-016: cancellation targets exactly one reference and is idempotently rejected", () => {
  const saved = saveDemoOrder(
    { cart, orders: [] },
    uuid,
    "2026-10-22T12:00:00.000Z",
  );
  const reference = saved.orders[0]!.reference;
  const cancelled = cancelDemoOrder(saved, reference);
  assert.equal(cancelled.orders[0]!.status, "cancelled");
  assert.equal(saved.orders[0]!.status, "saved");
  assert.equal(cancelled.orders[0]!.reference, reference);
  assert.throws(() => cancelDemoOrder(cancelled, reference), /redan avbokad/);
  assert.throws(() => cancelDemoOrder(saved, "someone-else"), /finns inte/);
  assert.equal(canCustomerCancel("unpaid"), true);
  for (const status of ["paid", "collected", "cancelled"] as const)
    assert.equal(canCustomerCancel(status), false);
});

test("CHATT-009: rejects corrupted memory, unknown products, forged prices and missing variants", () => {
  assert.deepEqual(parseMemory(null), EMPTY_MEMORY);
  for (const raw of [
    "{",
    "null",
    '{"version":9,"orders":[]}',
    '{"version":1,"cart":[],"orders":[{}]}',
  ])
    assert.throws(() => parseMemory(raw));
  assert.throws(() =>
    readCart([{ productId: "pizza", quantity: 1, omissions: [] }]),
  );
  assert.throws(() =>
    readCart([{ productId: "ghostdog", quantity: 1, omissions: [] }]),
  );
  assert.throws(() =>
    readCart([{ productId: "loka", quantity: 0.5, omissions: [] }]),
  );
  const saved = saveDemoOrder(
    { cart, orders: [] },
    uuid,
    "2026-10-22T12:00:00.000Z",
  );
  assert.throws(() =>
    parseMemory(
      JSON.stringify({
        version: 1,
        ...saved,
        orders: [{ ...saved.orders[0], totalOre: 1 }],
      }),
    ),
  );
  const forged = readCart([
    { productId: "loka", quantity: 1, omissions: [], key: "fake", priceOre: 1 },
  ]);
  assert.equal(forged[0]!.key, "loka|");
  assert.match(describeCart(forged), /25\s*kr/);
});
