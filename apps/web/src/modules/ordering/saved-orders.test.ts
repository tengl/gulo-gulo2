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
  changeDemoOrderStatus,
  demoOrderFingerprint,
  canChangeDemoOrderStatus,
  canCancelDemoOrder,
  canChangeDemoOrderPreparation,
  changeDemoOrderPreparation,
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

test("ADM-009: receipt and preparation advance independently of payment, preserve snapshots, and migrate older memory", () => {
  const memory = saveDemoOrder(
    { cart, orders: [] },
    uuid,
    "2026-10-22T12:00:00.000Z",
  );
  let current = memory;
  const reference = memory.orders[0]!.reference;
  for (const to of ["confirmed", "preparing", "prepared"] as const) {
    const before = current.orders[0]!;
    current = changeDemoOrderPreparation(
      current,
      reference,
      demoOrderFingerprint(before),
      to,
    );
    assert.equal(current.orders[0]!.preparation, to);
    assert.equal(current.orders[0]!.status, "saved");
    assert.equal(current.orders[0]!.cart, before.cart);
    assert.equal(current.orders[0]!.pricesOre, before.pricesOre);
    assert.equal(current.orders[0]!.totalOre, before.totalOre);
    assert.throws(
      () =>
        changeDemoOrderPreparation(
          current,
          reference,
          demoOrderFingerprint(before),
          to,
        ),
      /har ändrats/,
    );
  }
  for (const status of ["saved", "paid", "collected", "cancelled"] as const) {
    for (const preparation of [
      "new",
      "confirmed",
      "preparing",
      "prepared",
    ] as const) {
      const order = { ...memory.orders[0]!, status, preparation };
      for (const to of ["new", "confirmed", "preparing", "prepared"] as const) {
        const allowed =
          (status === "saved" || status === "paid") &&
          ((preparation === "new" && to === "confirmed") ||
            (preparation === "confirmed" && to === "preparing") ||
            (preparation === "preparing" && to === "prepared"));
        assert.equal(canChangeDemoOrderPreparation(order, to), allowed);
        if (!allowed)
          assert.throws(
            () =>
              changeDemoOrderPreparation(
                { ...memory, orders: [order] },
                reference,
                demoOrderFingerprint(order),
                to,
              ),
            /inte tillåten/,
          );
      }
    }
  }
  const legacy: Record<string, unknown> = { ...memory.orders[0]! };
  delete legacy.preparation;
  assert.equal(
    parseMemory(JSON.stringify({ version: 1, cart: [], orders: [legacy] }))
      .orders[0]!.preparation,
    "new",
  );
  for (const invalid of [null, "cooking", "__proto__"])
    assert.throws(() =>
      parseMemory(
        JSON.stringify({
          version: 1,
          cart: [],
          orders: [{ ...legacy, preparation: invalid }],
        }),
      ),
    );
});

test("ADM-005/006 / ORD-016: demo transitions are limited, version-bound, and preserve the draft and snapshots", () => {
  const memory = saveDemoOrder(
    { cart, orders: [] },
    uuid,
    "2026-10-22T12:00:00.000Z",
  );
  const original = memory.orders[0]!;
  const withDraft = { ...memory, cart };
  const paid = changeDemoOrderStatus(
    withDraft,
    original.reference,
    demoOrderFingerprint(original),
    "paid",
  );
  assert.equal(paid.orders[0]!.status, "paid");
  assert.deepEqual(paid.cart, cart);
  assert.equal(paid.orders[0]!.cart, original.cart);
  assert.equal(paid.orders[0]!.pricesOre, original.pricesOre);
  assert.equal(paid.orders[0]!.totalOre, original.totalOre);
  assert.equal(original.status, "saved");
  assert.equal(canCancelDemoOrder(paid.orders[0]!), false);
  assert.throws(
    () => cancelDemoOrder(paid, original.reference),
    /Efter betalning/,
  );
  assert.throws(
    () =>
      changeDemoOrderStatus(
        paid,
        original.reference,
        demoOrderFingerprint(original),
        "cancelled",
      ),
    /har ändrats/,
  );
  const collected = changeDemoOrderStatus(
    paid,
    original.reference,
    demoOrderFingerprint(paid.orders[0]!),
    "collected",
  );
  assert.equal(collected.orders[0]!.status, "collected");
  assert.throws(
    () => cancelDemoOrder(collected, original.reference),
    /Efter betalning/,
  );
  for (const from of ["saved", "paid", "collected", "cancelled"] as const) {
    const input = { ...memory, orders: [{ ...original, status: from }] };
    assert.deepEqual(
      parseMemory(JSON.stringify({ version: 1, ...input })),
      input,
    );
    for (const to of ["saved", "paid", "collected", "cancelled"] as const) {
      const allowed =
        (from === "saved" && (to === "paid" || to === "cancelled")) ||
        (from === "paid" && to === "collected");
      assert.equal(canChangeDemoOrderStatus(from, to), allowed);
      if (!allowed)
        assert.throws(
          () =>
            changeDemoOrderStatus(
              input,
              original.reference,
              demoOrderFingerprint(input.orders[0]!),
              to,
            ),
          /inte tillåten/,
        );
    }
  }
  const changed = {
    ...memory,
    orders: [{ ...original, totalOre: original.totalOre - 100 }],
  };
  assert.throws(
    () =>
      changeDemoOrderStatus(
        changed,
        original.reference,
        demoOrderFingerprint(original),
        "paid",
      ),
    /har ändrats/,
  );
  assert.throws(
    () =>
      changeDemoOrderStatus(
        memory,
        "foreign",
        demoOrderFingerprint(original),
        "paid",
      ),
    /inte längre/,
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
