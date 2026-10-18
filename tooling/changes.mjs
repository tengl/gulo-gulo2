import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const webConfig = new Set([
  "package.json", "package-lock.json", ".npmrc", ".node-version",
  "apps/web/package.json", "apps/web/next.config.ts",
  "apps/web/tsconfig.json", "apps/web/next-env.d.ts", "apps/web/vercel.json",
  ".github/workflows/pipeline.yml", "tooling/deploy-web.sh",
]);

function isTest(path) {
  return /(?:^|\/)(?:__tests__|__fixtures__)\//.test(path)
    || /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(path);
}

function isInstructions(path) {
  return /(?:^|\/)(?:AGENTS\.md|README\.md|\.gitkeep)$/.test(path);
}

export function classifyFiles(files) {
  const result = { web: false, database: false, checks: false, databaseChecks: false };
  for (const path of files) {
    const runtime = !isTest(path) && !isInstructions(path) && (
      path.startsWith("apps/web/src/") || path.startsWith("apps/web/public/")
      || (path.startsWith("rules/runtime/") && path.endsWith(".txt"))
    );
    if (runtime || webConfig.has(path)) result.web = true;
    if (/^supabase\/migrations\/.+\.sql$/.test(path)) result.database = true;
    if (!isInstructions(path) && path.startsWith("supabase/")) result.databaseChecks = true;
    if (!isInstructions(path) && (
      path.startsWith("apps/web/") || path.startsWith("tooling/")
      || path.startsWith("tests/") || path.startsWith("evals/")
      || path.startsWith(".github/workflows/")
    )) result.checks = true;
  }
  result.checks ||= result.web;
  result.databaseChecks ||= result.database;
  return result;
}

export function comparisonForEvent(eventName, event, sha) {
  if (eventName === "push") return { base: event.before, head: sha, mergeBase: false };
  if (eventName === "pull_request") {
    return {
      // A docs-only follow-up to an existing PR must not redeploy its earlier code changes.
      base: event.action === "synchronize" ? event.before : event.pull_request.base.sha,
      head: event.pull_request.head.sha,
      mergeBase: event.action !== "synchronize",
    };
  }
  throw new Error(`Unsupported event: ${eventName}`);
}

export function changedFiles({ base, head, mergeBase }, git = (...args) => execFileSync("git", args, { maxBuffer: 16 * 1024 * 1024 }).toString()) {
  if (!head) throw new Error("Missing head commit; refusing to guess deployment scope.");
  if (!base || /^0+$/.test(base)) {
    return git("ls-tree", "-r", "--name-only", "-z", head).split("\0").filter(Boolean);
  }
  // --no-renames reports both paths: moving runtime code out of the app is also a change.
  return git("diff", "--name-only", "--no-renames", "-z", mergeBase ? `${base}...${head}` : base, ...(mergeBase ? [] : [head]), "--")
    .split("\0").filter(Boolean);
}

export function classifyEvent(eventName, event, sha, git) {
  const result = classifyFiles(changedFiles(comparisonForEvent(eventName, event, sha), git));
  if (eventName === "pull_request") {
    // Keep validating the whole PR even when only its latest push is documentation.
    const full = classifyFiles(changedFiles(comparisonForEvent("pull_request", { ...event, action: "opened" }), git));
    result.checks ||= full.checks;
    result.databaseChecks ||= full.databaseChecks;
  }
  return result;
}

function main() {
  let result;
  if (process.env.GITHUB_EVENT_PATH) {
    const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
    result = classifyEvent(process.env.GITHUB_EVENT_NAME, event, process.env.GITHUB_SHA);
  } else {
    const [base, head = "HEAD"] = process.argv.slice(2);
    if (!base) throw new Error("Usage: npm run changes -- <base-sha> [head-sha]");
    result = classifyFiles(changedFiles({ base, head, mergeBase: false }));
  }
  console.log(JSON.stringify(result, null, 2));
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(result).map(([key, value]) => `${key}=${value}\n`).join(""));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
