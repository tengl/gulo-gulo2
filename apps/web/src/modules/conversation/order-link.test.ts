import assert from "node:assert/strict";
import test from "node:test";
import { parseOrderLink, orderLinkReply } from "./domain/order-link.ts";

test("WEBB-012: a link becomes a proposal with variants, quantities and rejected rows", () => {
  const link = parseOrderLink("ghostdog-dubbel:2, loka, gin-lizzy:1,pizza:1,brol:0,loka-enkel:1");
  assert.deepEqual(link.items, [
    { productId: "ghostdog", quantity: 2, variant: "double", omissions: [] },
    { productId: "loka", quantity: 1, variant: undefined, omissions: [] },
    { productId: "gin-lizzy", quantity: 1, variant: undefined, omissions: [] },
  ]);
  assert.deepEqual(link.rejected, [
    "pizza (okänd vara)",
    "brol (antalet måste vara 1–99)",
    "loka-enkel (dryck har ingen variant)",
  ]);
  const reply = orderLinkReply(link);
  assert.equal(reply.action?.kind, "add");
  assert.match(reply.text, /Inget är tillagt ännu/);
  assert.match(reply.text, /pizza \(okänd vara\)/);
});

test("WEBB-012: a link without known items proposes nothing and caps its length", () => {
  const reply = orderLinkReply(parseOrderLink("x:1"));
  assert.equal(reply.action, undefined);
  const long = parseOrderLink(Array.from({ length: 25 }, () => "loka:1").join(","));
  assert.equal(long.items.length, 20);
  assert.equal(long.rejected.length, 5);
});
