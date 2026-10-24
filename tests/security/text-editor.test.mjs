import assert from "node:assert/strict";
import test from "node:test";
import { openEditor, sealEditor } from "../../apps/web/src/server/github/session.ts";
import { account, saveFile } from "../../apps/web/src/server/github/content.ts";

const secret = "synthetic-github-app-secret";
const editor = { token: "ghu_synthetic", login: "redaktor", name: "Rut" };
const config = {
  clientId: "id",
  clientSecret: secret,
  repo: "gulo/test",
  branch: "main",
  webUrl: "https://github.com",
  apiUrl: "https://api.github.com",
};

test("WEBB-018: the GitHub token is sealed, tamper-proof and expires with the session", () => {
  const now = Date.UTC(2026, 9, 24, 8);
  const sealed = sealEditor(editor, secret, now);
  assert.ok(!sealed.includes("ghu_"), "the token is not readable in the cookie");
  assert.deepEqual(openEditor(sealed, secret, now + 1000), editor);
  assert.equal(openEditor(sealed, "another-app-secret-value", now), null);
  const [iv, tag, body] = sealed.split(".");
  const flipped = Buffer.from(body, "base64url");
  flipped[0] ^= 1;
  assert.equal(openEditor([iv, tag, flipped.toString("base64url")].join("."), secret, now), null);
  assert.equal(openEditor(sealed, secret, now + 8 * 60 * 60 * 1000), null);
  assert.equal(openEditor("x.y", secret, now), null);
  assert.equal(openEditor(undefined, secret, now), null);
});

test("WEBB-018: write access is read from the repository permissions of the signed-in person", async () => {
  const reply = (push) => async (url) =>
    String(url).endsWith("/user")
      ? Response.json({ login: "redaktor", name: null })
      : Response.json({ permissions: { push } });
  assert.deepEqual(await account(config, "t", reply(true)), { login: "redaktor", name: "redaktor", canWrite: true });
  assert.equal((await account(config, "t", reply(false))).canWrite, false);
  const missing = async (url) =>
    String(url).endsWith("/user") ? Response.json({ login: "x" }) : new Response(null, { status: 404 });
  assert.equal((await account(config, "t", missing)).canWrite, false);
});

test("WEBB-017: a save sends the opened version and reports a changed file as a conflict", async () => {
  let sent;
  const ok = await saveFile(config, "t", "sidor/om.md", "å\n", "a".repeat(40), "msg", async (url, init) => {
    sent = { url: String(url), init };
    return Response.json({ content: { sha: "b".repeat(40) }, commit: { html_url: "https://github.com/c" } });
  });
  assert.deepEqual(ok, { kind: "saved", sha: "b".repeat(40), url: "https://github.com/c" });
  assert.equal(sent.url, "https://api.github.com/repos/gulo/test/contents/apps/web/content/sidor/om.md");
  assert.equal(sent.init.headers.authorization, "Bearer t");
  const body = JSON.parse(sent.init.body);
  assert.equal(body.sha, "a".repeat(40));
  assert.equal(body.branch, "main");
  assert.equal(Buffer.from(body.content, "base64").toString("utf8"), "å\n");
  const conflict = await saveFile(config, "t", "sidor/om.md", "x", "a".repeat(40), "m", async () => new Response(null, { status: 409 }));
  assert.deepEqual(conflict, { kind: "conflict" });
});
