import assert from "node:assert/strict";
import test from "node:test";
import { readSignup } from "./domain/signup.ts";

test("WEBB-013: a signup needs consent and a whole address; bots are ignored", () => {
  assert.deepEqual(readSignup({ email: " Niklas@Exempel.SE ", consent: true }), {
    kind: "valid",
    email: "niklas@exempel.se",
  });
  assert.equal(readSignup({ email: "a@b.se", consent: false }).kind, "invalid");
  assert.equal(readSignup({ email: "a@b", consent: true }).kind, "invalid");
  assert.equal(readSignup({ email: "a b@c.se", consent: true }).kind, "invalid");
  assert.equal(readSignup(null).kind, "invalid");
  assert.deepEqual(
    readSignup({ email: "bot@spam.se", consent: true, website: "http://x" }),
    { kind: "ignored" },
  );
});
