import assert from "node:assert/strict";
import test from "node:test";
import { parseDemoRequest } from "./index.ts";

test("UX-008: Swedish amounts, variants, aliases, product numbers and omissions become a proposal", () => {
  assert.deepEqual(
    parseDemoRequest("Jag vill ha två dubbla Ghostdog utan senap och en Loka."),
    {
      kind: "suggestion",
      items: [
        {
          productId: "ghostdog",
          quantity: 2,
          variant: "double",
          omissions: ["senap"],
        },
        { productId: "loka", quantity: 1, variant: undefined, omissions: [] },
      ],
    },
  );
  const numbered = parseDemoRequest("en sexa och två åttor");
  // Inflected product names outside the supported grammar must not be partially applied.
  assert.equal(numbered.kind, "clarify");
  const result = parseDemoRequest("två cheezy top");
  assert.equal(result.kind, "suggestion");
  if (result.kind === "suggestion")
    assert.equal(result.items[0]!.variant, undefined);
});

test("UX-008: ambiguous quantities, corrections and partially understood messages are never applied", () => {
  for (const input of [
    "en ghostdog och en pizza",
    "inte en ghostdog",
    "0 ghostdog",
    "-2 ghostdog",
    "2.5 ghostdog",
    "en loka utan senap",
    "en dubbel loka",
    "en ghostdog utan nötter",
    "en ghostdog tack",
    "två ghostdog kl 13",
    "",
    "a".repeat(601),
  ]) {
    assert.equal(parseDemoRequest(input).kind, "clarify", input);
  }
  assert.deepEqual(parseDemoRequest("visa min beställning"), { kind: "cart" });
  assert.deepEqual(parseDemoRequest("meny"), { kind: "menu" });
});
