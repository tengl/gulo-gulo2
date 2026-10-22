import assert from "node:assert/strict";
import test from "node:test";
import { demoMenu, unitPriceOre } from "./index.ts";

test("UX-004: all nine legacy wraps keep their numbers and demonstration prices", () => {
  const wraps = demoMenu.filter((product) => product.category === "wrap");
  assert.deepEqual(
    wraps.map((product) => [product.number, product.priceOre]),
    [
      [1, 11500],
      [2, 12000],
      [3, 12000],
      [4, 13000],
      [5, 13000],
      [6, 13500],
      [7, 13500],
      [8, 13500],
      [9, 14500],
    ],
  );
  assert.equal(
    new Set(demoMenu.map((product) => product.id)).size,
    demoMenu.length,
  );
});

test("UX-006/007: double price applies to every wrap including grillost; invalid variants fail", () => {
  for (const product of demoMenu.filter((item) => item.category === "wrap")) {
    assert.equal(unitPriceOre(product.id, "double"), product.priceOre + 4500);
    assert.throws(() => unitPriceOre(product.id));
  }
  assert.throws(() => unitPriceOre("unknown", "single"));
  assert.throws(() => unitPriceOre("loka", "double"));
});
