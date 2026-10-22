import assert from "node:assert/strict";
import test from "node:test";
import {
  configuredCode,
  matchesCode,
  issueSession,
  validSession,
  sessionSeconds,
} from "../../apps/web/src/server/access/session.ts";

const code = "synthetic-unit-test-code-only";
const now = Date.parse("2026-10-22T12:00:00Z");

test("BEH-005: signed sessions expire, reject tampering/future issue times, and rotate with code", () => {
  const token = issueSession(code, now);
  assert.equal(validSession(token, code, now), true);
  assert.equal(token.includes(code), false);
  assert.notEqual(token, issueSession(code, now));
  assert.equal(
    validSession(token, code, now + sessionSeconds * 1000 - 1),
    true,
  );
  assert.equal(validSession(token, code, now + sessionSeconds * 1000), false);
  assert.equal(validSession(token, code, now - 1000), false);
  assert.equal(validSession(token, `${code}-rotated`, now), false);
  assert.equal(validSession(token, undefined, now), false);
  for (const invalid of [
    undefined,
    "",
    "admin",
    `${token}.extra`,
    `${token.slice(0, -1)}!`,
    `0000000000.${token.split(".").slice(1).join(".")}`,
    "a".repeat(1000),
  ])
    assert.equal(validSession(invalid, code, now), false);
});

test("BEH-005: missing/short configuration stays locked; matching codes are exact", () => {
  const prior = process.env.ADMIN_ACCESS_CODE;
  try {
    for (const value of ["", "too-short", "                "]) {
      process.env.ADMIN_ACCESS_CODE = value;
      assert.equal(configuredCode(), undefined);
    }
    delete process.env.ADMIN_ACCESS_CODE;
    assert.equal(configuredCode(), undefined);
    process.env.ADMIN_ACCESS_CODE = code;
    assert.equal(configuredCode(), code);
    assert.equal(matchesCode(code, code), true);
    assert.equal(matchesCode("wrong", code), false);
    assert.equal(matchesCode(`${code} `, code), false);
  } finally {
    if (prior === undefined) delete process.env.ADMIN_ACCESS_CODE;
    else process.env.ADMIN_ACCESS_CODE = prior;
  }
});
