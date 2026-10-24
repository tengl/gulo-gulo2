import assert from "node:assert/strict";
import test from "node:test";
import {
  addSelections,
  cartTotalOre,
  removeLine,
  setQuantity,
} from "./index.ts";
import type { Selection } from "./index.ts";

const wrap: Selection = {
  productId: "ghostdog",
  quantity: 2,
  variant: "double",
  omissions: [],
};

test("UX-003/006/009: UI and text selections share quantities and deterministic totals", () => {
  const cart = addSelections(
    [],
    [wrap, { productId: "loka", quantity: 1, omissions: [] }],
  );
  assert.equal(cartTotalOre(cart), 38500);
  assert.equal(cartTotalOre(setQuantity(cart, cart[0]!.key, 1)), 20500);
  assert.equal(cartTotalOre(removeLine(cart, cart[0]!.key)), 2500);
  assert.equal(cart[0]!.quantity, 2);
});

test("UX-007: merge identical choices while keeping variant and omissions distinct", () => {
  let cart = addSelections([], [wrap, wrap, { ...wrap, variant: "single" }]);
  assert.equal(cart.length, 2);
  assert.equal(cart[0]!.quantity, 4);
  cart = addSelections(cart, [
    { ...wrap, omissions: ["senap", "gurka"] },
    { ...wrap, omissions: ["gurka", "senap", "senap"] },
  ]);
  assert.equal(cart.length, 3);
  assert.equal(cart[2]!.quantity, 4);
  assert.equal(cartTotalOre(cart), 171000);
});

test("UX-007/008: reject decimals, negative quantities, unknown products and overflowing merges atomically", () => {
  const original = addSelections([], [wrap]);
  for (const quantity of [0, -1, 1.5, NaN, Infinity, 100]) {
    assert.throws(() => addSelections(original, [{ ...wrap, quantity }]));
    assert.throws(() => setQuantity(original, original[0]!.key, quantity));
  }
  assert.throws(() =>
    addSelections(original, [
      { productId: "loka", quantity: 1, omissions: [] },
      { ...wrap, productId: "unknown" },
    ]),
  );
  assert.throws(() => addSelections(original, [{ ...wrap, quantity: 98 }]), {
    message: /högst 99 av samma val/,
  });
  assert.equal(original[0]!.quantity, 2);
  assert.equal(original.length, 1);
});
