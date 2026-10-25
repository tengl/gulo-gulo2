import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, renameSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { changedFiles, classifyEvent, classifyFiles, comparisonForEvent } from "./changes.mjs";

test("docs, legacy rules, open decisions and agent instructions do not deploy", () => {
  assert.deepEqual(classifyFiles([
    "README.md", "docs/rules.txt", "docs/deployment.md", "AGENTS.md",
    "apps/web/src/modules/AGENTS.md", "apps/web/src/modules/catalog/README.md",
    "apps/web/content/AGENTS.md", "apps/web/content/README.md",
    "supabase/AGENTS.md", "rules/index.txt", "rules/system.txt", "rules/open-decisions.txt",
    "rules/proposals/catalog.txt", "rules/proposals/business-hours.txt",
  ]), { web: false, database: false, checks: false, databaseChecks: false });
});

test("each runtime input independently requires a web deployment", () => {
  for (const path of [
    "apps/web/public/game/wolverine-dive.webp", "apps/web/public/game/halsingland-slope.webp",
    "apps/web/public/game/blue-danube.ogg", "apps/web/public/game/blue-danube.mp3",
    "apps/web/src/modules/game/domain/score.ts",
    "apps/web/src/app/(site)/spel/page.tsx", "apps/web/src/modules/game/ui/music.ts",
    "apps/web/src/modules/game/ui/game.module.css", "rules/runtime/game.txt",
    "apps/web/src/app/page.tsx", "apps/web/src/server/claude/prompts/order.txt",
    "apps/web/src/modules/ordering/domain/order.ts", "apps/web/public/menu.png",
    "apps/web/src/modules/conversation/ui/scroll-chat.ts",
    "apps/web/src/modules/storefront/ui/useOrderingView.ts",
    "apps/web/src/app/admin/page.tsx", "apps/web/src/app/admin/admin.css",
    "apps/web/src/app/admin/bestallningar/page.tsx", "apps/web/src/modules/staff/ui/OrdersAdmin.tsx",
    "apps/web/src/app/api/admin/session/route.ts", "apps/web/src/server/access/session.ts",
    "rules/runtime/administration.txt",
    "rules/runtime/business-hours.txt", "rules/runtime/access.txt", "package-lock.json", "package.json", ".node-version",
    "apps/web/next.config.ts", "apps/web/vercel.json", ".github/workflows/pipeline.yml",
    "tooling/deploy-web.sh", "netlify.toml", "tooling/netlify.mjs",
    // WEBB-006: a text edited by a person on GitHub must reach the site.
    "apps/web/content/sidor/event.md", "apps/web/content/produkter/brewurst.md",
    "apps/web/content/webbplats.md",
  ]) assert.equal(classifyFiles([path]).web, true, path);
});

test("tests and evals run checks without deploying", () => {
  for (const path of [
    "apps/web/src/modules/ordering/domain/order.test.ts", "apps/web/src/app/page.spec.tsx",
    "apps/web/src/modules/catalog/__fixtures__/menu.json", "tests/e2e/order.spec.ts",
    "evals/order.json", "tooling/changes.mjs", "apps/web/eslint.config.mjs", "playwright.config.ts", "apps/web/tsconfig.e2e.json",
    "tests/security/admin-session.test.mjs", "tests/e2e/admin.spec.ts",
  ]) {
    const result = classifyFiles([path]);
    assert.equal(result.web, false, path);
    assert.equal(result.checks, true, path);
  }
});

test("database migrations deploy independently; seed, config and tests are local checks", () => {
  assert.deepEqual(classifyFiles(["supabase/migrations/20261018000000_orders.sql"]), {
    web: false, database: true, checks: false, databaseChecks: true,
  });
  for (const path of ["supabase/seed.sql", "supabase/config.toml", "supabase/tests/order.sql"]) {
    assert.deepEqual(classifyFiles([path]), { web: false, database: false, checks: false, databaseChecks: true });
  }
});

test("mixed changes trigger both deployment targets", () => {
  const result = classifyFiles(["apps/web/src/app/page.tsx", "supabase/migrations/new.sql", "README.md"]);
  assert.equal(result.web, true);
  assert.equal(result.database, true);
});

test("PR updates compare only the new push, initial PRs use the merge base", () => {
  const event = { action: "synchronize", before: "old-head", pull_request: { base: { sha: "main" }, head: { sha: "new-head" } } };
  assert.deepEqual(comparisonForEvent("pull_request", event), { base: "old-head", head: "new-head", mergeBase: false });
  event.action = "opened";
  assert.deepEqual(comparisonForEvent("pull_request", event), { base: "main", head: "new-head", mergeBase: true });
  assert.deepEqual(comparisonForEvent("push", { before: "before-push" }, "after-push"), { base: "before-push", head: "after-push", mergeBase: false });
});

test("a docs-only follow-up validates existing PR code and SQL without redeploying", () => {
  const event = { action: "synchronize", before: "old-head", pull_request: { base: { sha: "main" }, head: { sha: "new-head" } } };
  const git = (...args) => args.includes("main...new-head")
    ? "apps/web/src/app/page.tsx\0supabase/migrations/order.sql\0README.md\0"
    : "README.md\0";
  assert.deepEqual(classifyEvent("pull_request", event, undefined, git), {
    web: false, database: false, checks: true, databaseChecks: true,
  });
});

test("Git integration: initial push, multi-commit push, deletion and rename out of runtime", () => {
  const cwd = mkdtempSync(join(tmpdir(), "gulo-changes-"));
  const git = (...args) => execFileSync("git", args, { cwd }).toString();
  git("init", "--quiet");
  git("config", "user.email", "test@example.invalid");
  git("config", "user.name", "Test");
  writeFileSync(join(cwd, "runtime.txt"), "a");
  git("add", "."); git("commit", "--quiet", "-m", "initial");
  const initial = git("rev-parse", "HEAD").trim();
  assert.deepEqual(changedFiles({ base: "00000000", head: initial }, git), ["runtime.txt"]);
  renameSync(join(cwd, "runtime.txt"), join(cwd, "docs.txt"));
  git("add", "-A"); git("commit", "--quiet", "-m", "move");
  writeFileSync(join(cwd, "README.md"), "docs");
  git("add", "."); git("commit", "--quiet", "-m", "docs");
  assert.deepEqual(changedFiles({ base: initial, head: "HEAD" }, git).sort(), ["README.md", "docs.txt", "runtime.txt"]);
});

test("missing commits and invalid history fail instead of silently skipping deployment", () => {
  assert.throws(() => changedFiles({ head: undefined }), /Missing head/);
  assert.throws(() => changedFiles({ base: "a", head: "b" }, () => { throw new Error("bad revision"); }), /bad revision/);
});
