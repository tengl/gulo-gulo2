import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, renameSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { netlifyScope } from "./netlify.mjs";

const env = { CACHED_COMMIT_REF: "previous", COMMIT_REF: "current" };
const files = (...paths) => () => paths.join("\0") + "\0";

test("SYS-008: Netlify skips docs, instructions, tests, evals and SQL-only changes", () => {
  const scope = netlifyScope(env, files(
    "docs/project-context.txt", "README.md", "apps/web/src/modules/ordering/AGENTS.md",
    "rules/open-decisions.txt", "rules/system.txt", "rules/proposals/catalog.txt",
    "tooling/netlify.test.mjs", "tests/e2e/order.spec.ts", "evals/conversation.json",
    "supabase/migrations/order.sql",
  ));
  assert.equal(scope.web, false);
  assert.equal(scope.database, true);
});

test("SYS-008/012: runtime and Netlify configuration changes deploy independently", () => {
  for (const path of [
    "apps/web/src/app/page.tsx", "rules/runtime/ordering.txt", "package-lock.json",
    "netlify.toml", "tooling/netlify.mjs",
  ]) assert.equal(netlifyScope(env, files(path)).web, true, path);
});

test("first build and cleared-cache rebuild inspect the complete tree", () => {
  for (const cached of [undefined, "", "current"]) {
    let args;
    const scope = netlifyScope({ COMMIT_REF: "current", CACHED_COMMIT_REF: cached }, (...input) => {
      args = input;
      return "apps/web/src/app/page.tsx\0";
    });
    assert.equal(scope.web, true);
    assert.deepEqual(args, ["ls-tree", "-r", "--name-only", "-z", "current"]);
  }
});

test("all commits since the cached build are compared, including runtime deletions", () => {
  let args;
  const scope = netlifyScope(env, (...input) => {
    args = input;
    return "apps/web/src/app/page.tsx\0docs/removed-page.txt\0";
  });
  assert.equal(scope.web, true);
  assert.deepEqual(args, ["diff", "--name-only", "--no-renames", "-z", "previous", "current", "--"]);
});

test("SYS-012: missing metadata and invalid Git history are errors, never an empty diff", () => {
  assert.throws(() => netlifyScope({}), /Missing COMMIT_REF/);
  assert.throws(() => netlifyScope(env, () => { throw new Error("bad revision"); }), /bad revision/);
});

test("invalid history continues past ignore but fails verification before publishing", () => {
  for (const mode of ["ignore", "verify"]) {
    const result = spawnSync(process.execPath, ["tooling/netlify.mjs", mode], {
      encoding: "utf8", env: { ...process.env, COMMIT_REF: "HEAD", CACHED_COMMIT_REF: "missing-netlify-commit" },
    });
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stderr, /Netlify scope error/);
  }
});

test("Netlify CLI exits allow an initial build, skip docs and rebuild after runtime deletion", () => {
  const cwd = mkdtempSync(join(tmpdir(), "gulo-netlify-"));
  const git = (...args) => execFileSync("git", args, { cwd }).toString().trim();
  const script = fileURLToPath(new URL("./netlify.mjs", import.meta.url));
  const run = (mode, cached, head) => spawnSync(process.execPath, [script, mode], {
    cwd, encoding: "utf8", env: { ...process.env, CACHED_COMMIT_REF: cached, COMMIT_REF: head },
  });
  git("init", "--quiet");
  git("config", "user.email", "test@example.invalid");
  git("config", "user.name", "Test");
  writeFileSync(join(cwd, "package.json"), "{}");
  git("add", ".");
  git("commit", "--quiet", "-m", "app");
  const app = git("rev-parse", "HEAD");
  assert.equal(run("ignore", "", app).status, 1);
  assert.equal(run("verify", "", app).status, 0);
  assert.equal(run("ignore", app, app).status, 1);
  writeFileSync(join(cwd, "README.md"), "docs");
  git("add", ".");
  git("commit", "--quiet", "-m", "docs");
  const docs = git("rev-parse", "HEAD");
  assert.equal(run("ignore", app, docs).status, 0);
  assert.equal(run("verify", app, docs).status, 0);
  renameSync(join(cwd, "package.json"), join(cwd, "archived-package.txt"));
  git("add", "-A");
  git("commit", "--quiet", "-m", "remove runtime");
  const removed = git("rev-parse", "HEAD");
  assert.equal(run("ignore", docs, removed).status, 1);
  assert.equal(run("verify", docs, removed).status, 0);
});
